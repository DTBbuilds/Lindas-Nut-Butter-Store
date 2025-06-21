import { API_BASE_URL, API_CONFIG, API_ENDPOINTS, getApiUrl, createQueryString } from '../config/api';
import axios from 'axios';
import { getAuthToken, removeAuthToken, saveAuthToken, saveUser, clearAuth, isTokenExpired } from '../utils/authUtils';
import { api } from '../utils/api';

// --- Axios Global Error Handling for Authentication ---
// Create a dedicated Axios instance to apply interceptors
const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // Set the base URL for all requests
  timeout: API_CONFIG.TIMEOUT, // Set a timeout for requests
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add a response interceptor to handle 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response, // Directly return successful responses
  (error) => {
    const originalRequest = error.config;
    // Check if the error is a 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      // Don't force reload on login/register pages, as 401 is an expected failure state.
      // Let the calling code handle the error (e.g., show a toast notification).
      if (originalRequest.url === API_ENDPOINTS.LOGIN || originalRequest.url === API_ENDPOINTS.REGISTER) {
        return Promise.reject(error);
      }

      console.error('API Error: 401 Unauthorized. Session expired or token is invalid.');
      // For any other 401, assume session expired and force a reload.
      removeAuthToken();
      window.location.reload();
    }
    // For all other errors, just pass them along
    return Promise.reject(error);
  }
);

// Global request interceptor to add auth token to all requests
const enhanceRequest = async (config) => {
  // Add auth headers if token exists
  const token = getAuthToken();
  console.log('[apiService] enhanceRequest: Token from getAuthToken():', token);
  
  // Check if token is expired
  if (token) { // Ensure token exists before checking expiration
    const expired = isTokenExpired(token);
    console.log('[apiService] enhanceRequest: isTokenExpired result:', expired);
    if (expired) { // MODIFIED to use the 'expired' variable
      console.warn('Auth token has expired');
      clearAuth();
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/account/login')) {
        window.location.href = '/account/login?sessionExpired=true';
        throw new Error('Session expired. Please log in again.');
      }
    }
  }
  
  const headers = {
    ...config.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  return {
    ...config,
    headers
  };
};

// Global response interceptor for handling common responses (401, 403, etc.)
const handleResponse = async (response) => {
  // Handle 401 Unauthorized (token expired or invalid)
  if (response.status === 401) {
    // Clear auth data and redirect to login
    clearAuth();
    
    // If we're not already on the login page, redirect there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/account/login')) {
      window.location.href = '/account/login?sessionExpired=true';
    }
    
    throw new Error('Your session has expired. Please log in again.');
  }
  
  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new Error('You do not have permission to perform this action.');
  }
  
  // Handle 429 Too Many Requests
  if (response.status === 429) {
    const retryAfter = response.headers?.get('Retry-After');
    const message = retryAfter 
      ? `Too many requests. Please try again in ${retryAfter} seconds.`
      : 'Too many requests. Please try again later.';
    
    throw new Error(message);
  }
  
  return response;
};

// Wrapper around the api utility with interceptors
const apiService = {
  get: async (endpoint, params = {}, options = {}) => {
    const config = await enhanceRequest({ method: 'GET', ...options });
    return axiosInstance.get(endpoint, { ...config, params }).then(response => response.data);
  },

  post: async (endpoint, data = {}, options = {}) => {
    const config = await enhanceRequest({ method: 'POST', ...options });
    return axiosInstance.post(endpoint, data, config).then(response => response.data);
  },

  put: async (endpoint, data = {}, options = {}) => {
    const config = await enhanceRequest({ method: 'PUT', ...options });
    return axiosInstance.put(endpoint, data, config).then(response => response.data);
  },

  patch: async (endpoint, data = {}, options = {}) => {
    const config = await enhanceRequest({ method: 'PATCH', ...options });
    return axiosInstance.patch(endpoint, data, config).then(response => response.data);
  },

  delete: async (endpoint, options = {}) => {
    const config = await enhanceRequest({ method: 'DELETE', ...options });
    return axiosInstance.delete(endpoint, config).then(response => response.data);
  },
};

// --- Authentication Methods ---

apiService.auth = {
  login: async (email, password) => {
    // Use the axiosInstance directly to avoid circular dependency
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, { email, password }).then(res => res.data);
    if (response && response.accessToken) {
      saveAuthToken(response.accessToken);
      if (response.customer) {
        saveUser(response.customer);
      }
    }
    return response;
  },

  logout: () => {
    clearAuth();
    window.location.href = '/login';
  },

  register: async (userData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, userData).then(res => res.data);
    if (response && response.accessToken) {
      saveAuthToken(response.accessToken);
      if (response.customer) {
        saveUser(response.customer);
      }
    }
    return response;
  },
  /**
   * Request a password reset
   * @param {string} email - User's email
   * @returns {Promise<Object>} - The response data
   */
  forgotPassword: async (email) => {
    return apiService.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  },
  
  /**
   * Reset password with a token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} - The response data
   */
  resetPassword: async (token, password) => {
    return apiService.post(API_ENDPOINTS.RESET_PASSWORD, { token, password });
  }
};

// Products API methods
apiService.products = {
  /**
   * Get all products
   * @param {Object} params - Query parameters (page, limit, category, etc.)
   * @returns {Promise<Object>} - The response data
   */
  getAll: async (params = {}) => {
    return apiService.get(API_ENDPOINTS.PRODUCTS, params);
  },
  
  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - The product data
   */
  getById: async (id) => {
    return apiService.get(API_ENDPOINTS.PRODUCT(id));
  },
  
  /**
   * Create a new product (admin only)
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} - The created product
   */
  create: async (productData) => {
    return apiService.post(API_ENDPOINTS.PRODUCTS, productData);
  },
  
  /**
   * Update a product (admin only)
   * @param {string} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} - The updated product
   */
  update: async (id, productData) => {
    return apiService.put(API_ENDPOINTS.PRODUCT(id), productData);
  },
  
  /**
   * Delete a product (admin only)
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - The response data
   */
  delete: async (id) => {
    return apiService.delete(API_ENDPOINTS.PRODUCT(id));
  },
  
  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} - The search results
   */
  search: async (query, params = {}) => {
    return apiService.get(API_ENDPOINTS.PRODUCTS, { ...params, q: query });
  },
  
  /**
   * Get products by category
   * @param {string} category - Category name or ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} - The products in the category
   */
  getByCategory: async (category, params = {}) => {
    return apiService.get(API_ENDPOINTS.PRODUCTS, { ...params, category });
  },
  
  /**
   * Upload a product image
   * @param {string} productId - Product ID
   * @param {File} file - Image file
   * @returns {Promise<Object>} - The uploaded image data
   */
  uploadImage: async (productId, file) => {
    return apiService.upload(`/products/${productId}/images`, file);
  }
};

export default apiService;
