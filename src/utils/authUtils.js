/**
 * authUtils.js
 * 
 * A collection of utility functions for managing authentication state,
 * including JWT tokens and user data in localStorage.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

let inMemoryToken = null;

/**
 * Saves the authentication token to localStorage.
 * @param {string} token - The JWT token to save.
 */
export const saveAuthToken = (token) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log('[authUtils] Saving token:', token);
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    inMemoryToken = token;
  }
};

/**
 * Retrieves the authentication token from localStorage.
 * @returns {string|null} The token, or null if not found.
 */
export const getAuthToken = () => {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  const token = localStorage.getItem(TOKEN_KEY);

  inMemoryToken = token;
  return token;
};

/**
 * Removes the authentication token from localStorage.
 */
export const removeAuthToken = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[authUtils] Removing token');
  }
  localStorage.removeItem(TOKEN_KEY);
  inMemoryToken = null;
};

/**
 * Saves user data to localStorage.
 * @param {object} user - The user object to save.
 */
export const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Retrieves user data from localStorage.
 * @returns {object|null} The user object, or null if not found.
 */
export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Removes user data from localStorage.
 */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Clears all authentication data (token and user) from localStorage.
 * This is the main function to call when logging out.
 */
export const clearAuth = () => {
  removeAuthToken();
  removeUser();
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

/**
 * Gets the authentication headers for API requests
 * @param {Object} [additionalHeaders] - Additional headers to include
 * @returns {Object} Headers object with authorization
 */
export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = getAuthToken();
  return {
    ...additionalHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Parses JWT token to get payload
 * @param {string} token - The JWT token
 * @returns {Object|null} The decoded token payload or null if invalid
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Checks if the token is expired
 * @param {string} token - The JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // Convert exp time to milliseconds and compare with current time
  return decoded.exp * 1000 < Date.now();
};
