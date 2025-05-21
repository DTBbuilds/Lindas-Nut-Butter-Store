import { API_CONFIG, API_ENDPOINTS, getApiUrl, createQueryString } from '../config/api';
import { getAuthToken, saveAuthToken, saveUser, clearAuth, isTokenExpired } from '../utils/authUtils';
import { api } from '../utils/api';

// Global request interceptor to add auth token to all requests
const enhanceRequest = async (config) => {
  // Add auth headers if token exists
  const token = getAuthToken();
  
  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.warn('Auth token has expired');
    clearAuth();
    
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?sessionExpired=true';
      throw new Error('Session expired. Please log in again.');
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
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?sessionExpired=true';
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
  /**
   * Send a GET request
   * @param {string} endpoint - The API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  get: async (endpoint, params = {}, options = {}) => {
    const enhancedConfig = await enhanceRequest({
      method: 'GET',
      params,
      ...options
    });
    
    const response = await api.get(endpoint, params, {
      ...enhancedConfig,
      params: undefined // Remove params as they're already in the URL
    });
    
    return handleResponse(response);
  },
  
  /**
   * Send a POST request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  post: async (endpoint, data, options = {}) => {
    const enhancedConfig = await enhanceRequest({
      method: 'POST',
      body: data,
      ...options
    });
    
    const response = await api.post(endpoint, enhancedConfig.body, enhancedConfig);
    return handleResponse(response);
  },
  
  /**
   * Send a PUT request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  put: async (endpoint, data, options = {}) => {
    const enhancedConfig = await enhanceRequest({
      method: 'PUT',
      body: data,
      ...options
    });
    
    const response = await api.put(endpoint, enhancedConfig.body, enhancedConfig);
    return handleResponse(response);
  },
  
  /**
   * Send a PATCH request
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The request body
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  patch: async (endpoint, data, options = {}) => {
    const enhancedConfig = await enhanceRequest({
      method: 'PATCH',
      body: data,
      ...options
    });
    
    const response = await api.patch(endpoint, enhancedConfig.body, enhancedConfig);
    return handleResponse(response);
  },
  
  /**
   * Send a DELETE request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - The response data
   */
  delete: async (endpoint, options = {}) => {
    const enhancedConfig = await enhanceRequest({
      method: 'DELETE',
      ...options
    });
    
    const response = await api.delete(endpoint, enhancedConfig);
    return handleResponse(response);
  },
  
  /**
   * Upload a file
   * @param {string} endpoint - The API endpoint
   * @param {File} file - The file to upload
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - The response data
   */
  upload: async (endpoint, file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const enhancedConfig = await enhanceRequest({
      method: 'POST',
      body: formData,
      headers: {
        // Let the browser set the Content-Type with the boundary
        ...(options.headers || {})
      },
      ...options
    });
    
    const response = await api.post(endpoint, enhancedConfig.body, enhancedConfig);
    return handleResponse(response);
  }
};

// Authentication API methods
apiService.auth = {
  /**
   * Login with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - The response data
   */
  login: async (email, password) => {
    const response = await apiService.post(API_ENDPOINTS.LOGIN, { email, password });
    
    if (response.token) {
      saveAuthToken(response.token);
      
      if (response.user) {
        saveUser(response.user);
      }
    }
    
    return response;
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - The response data
   */
  register: async (userData) => {
    return apiService.post(API_ENDPOINTS.REGISTER, userData);
  },
  
  /**
   * Logout the current user
   */
  logout: () => {
    clearAuth();
  },
  
  /**
   * Get the current user's profile
   * @returns {Promise<Object>} - The user data
   */
  getProfile: async () => {
    return apiService.get(API_ENDPOINTS.USER_PROFILE);
  },
  
  /**
   * Update the current user's profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - The updated user data
   */
  updateProfile: async (userData) => {
    return apiService.put(API_ENDPOINTS.USER_PROFILE, userData);
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
