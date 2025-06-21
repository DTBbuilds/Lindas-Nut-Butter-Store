import axios from 'axios';
import { getAuthToken, isTokenExpired } from './authUtils';

// Create a custom axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { token } = response.data;
        
        if (token) {
          // Store the new token
          localStorage.setItem('token', token);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Makes an API request with retry logic
 * @param {Object} config - Axios request config
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise} - Axios response
 */
const requestWithRetry = async (config, maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await api({
        ...config,
        headers: {
          ...config.headers,
          'X-Retry-Attempt': attempt,
        },
      });
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry for these status codes
      const nonRetryableStatuses = [400, 401, 403, 404, 422];
      if (error.response && nonRetryableStatuses.includes(error.response.status)) {
        break;
      }
      
      // Don't retry if we've reached max retries
      if (attempt === maxRetries) break;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  throw lastError;
};

/**
 * Creates a cache key from request config
 * @param {Object} config - Axios request config
 * @returns {string} - Cache key
 */
const createCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params)}`;
};

// Simple in-memory cache
const cache = new Map();

/**
 * Makes a cached API request
 * @param {Object} config - Axios request config
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Promise} - Cached or fresh response
 */
const cachedRequest = async (config, ttl = 5 * 60 * 1000) => {
  // Only cache GET requests
  if (config.method?.toLowerCase() !== 'get') {
    return requestWithRetry(config);
  }
  
  const cacheKey = createCacheKey(config);
  const cached = cache.get(cacheKey);
  
  // Return cached response if it exists and hasn't expired
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.response;
  }
  
  // Make the request and cache the response
  const response = await requestWithRetry(config);
  
  cache.set(cacheKey, {
    response,
    timestamp: Date.now(),
  });
  
  return response;
};

/**
 * Clears the API cache
 */
const clearCache = () => {
  cache.clear();
};

/**
 * Uploads a file with progress tracking
 * @param {string} url - Upload endpoint
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback
 * @param {Object} options.additionalData - Additional form data
 * @returns {Promise} - Upload response
 */
const uploadFile = async (url, file, { onProgress, additionalData = {} } = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Append additional data to form data
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  const response = await api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
  
  return response;
};

// Export the API instance and utility functions
export {
  api as default,
  requestWithRetry,
  cachedRequest,
  clearCache,
  uploadFile,
};
