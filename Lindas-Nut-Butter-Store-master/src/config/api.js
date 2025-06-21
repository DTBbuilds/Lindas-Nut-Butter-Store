/**
 * API Configuration
 * 
 * This file contains API-related configuration settings
 * for Linda's Nut Butter Store application.
 */

// Base URL for API requests
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Base URL for the server, used for constructing image paths, etc.
export const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');

// API Configuration
export const API_CONFIG = {
  // Default timeout for requests (30 seconds)
  TIMEOUT: 30000,
  
  // Maximum number of retries for failed requests
  MAX_RETRIES: 2,
  
  // Retry delay in milliseconds
  RETRY_DELAY: 1000,
  
  // List of HTTP methods that are idempotent (safe to retry)
  IDEMPOTENT_METHODS: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
  
  // Status codes that should trigger a retry
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  
  // Content type for requests
  CONTENT_TYPE: 'application/json',
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    // Cache headers removed to prevent CORS preflight issues
    // 'Cache-Control': 'no-cache, no-store, must-revalidate',
    // 'Pragma': 'no-cache',
    // 'Expires': '0'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  // Product endpoints
  PRODUCTS: '/products',
  PRODUCT: (id) => `/products/${id}`,
  
  // Order endpoints
  ORDERS: '/orders',
  ORDER: (id) => `/orders/${id}`,
  CUSTOMER_ORDERS: (customerId) => `/orders/customer/${customerId}`,
  
  // Cart endpoints
  CART: '/cart',
  CART_ITEM: (id) => `/cart/items/${id}`,
  
  // User endpoints
  USERS: '/users',
  USER: (id) => `/users/${id}`,
  USER_PROFILE: '/auth/me',
  
  // Authentication endpoints
  AUTH: '/auth',
  LOGIN: '/customers/login', // Corrected to customer login endpoint
  REGISTER: '/customers/register',    // Customer registration endpoint
  // REFRESH_TOKEN: '/auth/refresh-token', // Endpoint not implemented in backend
  FORGOT_PASSWORD: '/customers/forgot-password',
  RESET_PASSWORD: '/customers/reset-password',
  
  // Health check
  // HEALTH: '/health', // Endpoint not implemented in backend
};

/**
 * Creates a full API URL from a path
 * @param {string} path - The API endpoint path
 * @returns {string} Full API URL
 */
export const getApiUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Creates a query string from an object
 * @param {Object} params - Query parameters
 * @returns {string} Query string
 */
export const createQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => queryParams.append(key, item));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Creates a configuration object for fetch/axios
 * @param {Object} options - Request options
 * @returns {Object} Configuration object
 */
export const createRequestConfig = (options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    params,
    ...rest
  } = options;
  
  const config = {
    method,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...headers
    },
    ...rest
  };
  
  // Add body for non-GET/HEAD requests
  if (method !== 'GET' && method !== 'HEAD' && body) {
    config.body = JSON.stringify(body);
  }
  
  return config;
};

// Default API request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
