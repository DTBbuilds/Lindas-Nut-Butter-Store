import { API_CONFIG, getApiUrl, createQueryString, createRequestConfig, API_ENDPOINTS } from '../config/api';
import { getAuthToken, clearAuth as clearAuthToken } from './authUtils';

/**
 * Request interceptor to add auth token and handle request transformations
 */
const requestInterceptor = (config) => {
  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // Ensure content type is set for requests with body
  if (config.body && !config.headers['Content-Type']) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json'
    };
  }
  
  return config;
};

/**
 * Response interceptor to handle common response transformations and errors
 */
const responseInterceptor = async (response, url, options) => {
  // For all responses, parse JSON if content-type is JSON
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }
  
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    clearAuthToken();
    // Redirect to login or refresh token if needed
    if (window.location.pathname !== '/account/login') {
      window.location.href = `/account/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error(data?.message || 'Session expired. Please log in again.');
  }
  
  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new Error(data?.message || 'You do not have permission to perform this action.');
  }
  
  // Handle 404 Not Found
  if (response.status === 404) {
    throw new Error(data?.message || 'The requested resource was not found.');
  }
  
  // Handle 429 Too Many Requests
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || 60;
    throw new Error(data?.message || `Too many requests. Please try again in ${retryAfter} seconds.`);
  }
  
  // Handle 500 Internal Server Error
  if (response.status >= 500) {
    throw new Error(data?.message || 'A server error occurred. Please try again later.');
  }
  
  // If the response wasn't successful but we reached this point, handle it
  if (!response.ok) {
    throw new Error(data?.message || 'An unexpected error occurred');
  }
  
  // For products API endpoint specifically, handle both old and new format
  if (url.includes('/api/products')) {
    // If data is in the new format (has 'data' property with array of products)
    if (data && data.data && Array.isArray(data.data)) {
      return data.data; // Return just the products array
    }
    // If data is already an array, it's the old format
    else if (Array.isArray(data)) {
      return data; // Return as is
    }
    // If data has success property but it's false, it's an error
    else if (data && data.success === false) {
      throw new Error(data.message || 'An error occurred');
    }
    // If it's a single product in the new format
    else if (data && data.data && !Array.isArray(data.data)) {
      return data.data; // Return just the product object
    }
    // Return whatever we have
    return data;
  }
  
  // For all other endpoints, return the full data object to ensure consistency.
  // The component layer will be responsible for unpacking the data it needs.
  if (data) {
    if (data.success === false) {
      throw new Error(data.message || 'An error occurred');
    }
    return data; // Always return the full data object
  }
  
  // If no JSON data, return the response
  return response;
};

/**
 * Wrapper for fetch with timeout, retry logic, and interceptors
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<*>} - The parsed response data
 */
const fetchWithRetry = async (url, options = {}, retries = API_CONFIG.MAX_RETRIES) => {
  const { 
    timeout = API_CONFIG.TIMEOUT, 
    skipInterceptors = false,
    ...fetchOptions 
  } = options;
  
  // Apply request interceptor
  const processedOptions = skipInterceptors ? fetchOptions : requestInterceptor(fetchOptions);
  
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...processedOptions,
      signal: controller.signal,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...(processedOptions.headers || {})
      },
      body: processedOptions.body && typeof processedOptions.body === 'object' && 
            !(processedOptions.body instanceof FormData) ?
        JSON.stringify(processedOptions.body) : processedOptions.body
    });
    
    clearTimeout(timeoutId);
    
    // Do not retry on 4xx client errors, as they are not recoverable by retrying.
    if (response.status >= 400 && response.status < 500) {
      // Let the interceptor handle the error formatting.
      return responseInterceptor(response, url, processedOptions);
    }

    // If the response is not ok and we should retry (e.g., 5xx server errors)
    if (!response.ok && 
        retries > 0 && 
        API_CONFIG.RETRY_STATUS_CODES.includes(response.status) &&
        (!processedOptions.method || API_CONFIG.IDEMPOTENT_METHODS.includes(processedOptions.method.toUpperCase()))) {
      
      const retryAfter = response.headers.get('Retry-After') || 
                       Math.min(API_CONFIG.RETRY_DELAY * (API_CONFIG.MAX_RETRIES - retries + 1), 30000);
      
      console.warn(`Request failed with status ${response.status}. Retrying in ${retryAfter}ms... (${retries} attempts left)`);
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      
      // Retry the request
      return fetchWithRetry(url, { ...options, retryCount: (options.retryCount || 0) + 1 }, retries - 1);
    }
    
    // Process the response through interceptor
    const data = await responseInterceptor(response, url, processedOptions);
    return data;
    
  } catch (error) {
    // Handle network errors or timeouts
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    
    // Only retry on network errors if we have retries left
    if (retries > 0) {
      console.warn(`Network error: ${error.message}. Retrying... (${retries} attempts left)`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      
      // Retry the request
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
};

/**
 * Makes an API request with error handling
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - The response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { params = {}, ...restOptions } = options;
  
  // Build the full URL with query parameters
  const queryString = createQueryString(params);
  const url = `${getApiUrl(endpoint)}${queryString}`;
  
  try {
    const response = await fetchWithRetry(url, {
      ...createRequestConfig(restOptions),
      ...restOptions
    });
    
    // Check if response is already a parsed data object (from responseInterceptor)
    if (!(response instanceof Response)) {
      return response; // Already processed by responseInterceptor
    }
    
    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return null;
    }
    
    // Response should be handled by the responseInterceptor
    // This code shouldn't normally execute, but is here as a fallback
    try {
      const data = await response.json();
      
      if (!response.ok) {
        // Handle our new error format
        if (data.code && data.message) {
          const error = new Error(data.message);
          error.status = response.status;
          error.code = data.code;
          error.data = data;
          throw error;
        } 
        // Handle old error format
        else {
          const error = new Error(data.message || 'An error occurred');
          error.status = response.status;
          error.data = data;
          throw error;
        }
      }
      
      // Handle the new response format that includes data in a property
      if (data && data.data !== undefined) {
        return data.data;
      }
      
      return data;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      const error = new Error('Invalid response format from server');
      error.status = response.status;
      error.originalError = parseError;
      throw error;
    }
    
  } catch (error) {
    console.error('API request failed:', error);
    
    // Special case handling for product fetch errors to make frontend work
    if (endpoint.includes('/products') && error.message === 'Invalid response format') {
      console.warn('Product fetch error with compatibility fallback');
      // Return an empty array instead of throwing to keep the UI working
      return [];
    }
    
    // Enhance the error with more context
    const enhancedError = new Error(
      error.message || 'Network request failed. Please check your connection.'
    );
    
    enhancedError.status = error.status || 0;
    enhancedError.code = error.code || 'ERR_NETWORK'; 
    enhancedError.data = error.data || null;
    enhancedError.isNetworkError = !error.status;
    
    throw enhancedError;
  }
};

/**
 * API methods for common CRUD operations
 */
export const api = {
  /**
   * Send a GET request
   * @param {string} endpoint - The API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  get: (endpoint, params = {}, options = {}) => 
    apiRequest(endpoint, { method: 'GET', params, ...options }),
  
  /**
   * Send a POST request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  post: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { method: 'POST', body: data, ...options }),
  
  /**
   * Send a PUT request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  put: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { method: 'PUT', body: data, ...options }),
  
  /**
   * Send a PATCH request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  patch: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { method: 'PATCH', body: data, ...options }),
  
  /**
   * Send a DELETE request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { method: 'DELETE', ...options })
};

/**
 * Checks if the API is reachable
 * @returns {Promise<boolean>} - True if the API is reachable
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetchWithRetry(getApiUrl(API_ENDPOINTS.HEALTH), {
      method: 'GET',
      timeout: 5000 // Shorter timeout for health check
    });
    
    const data = await response.json();
    return response.ok && data.status === 'UP';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default api;
