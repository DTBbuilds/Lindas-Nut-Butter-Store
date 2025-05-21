/**
 * Authentication and token management utilities
 */

const TOKEN_KEY = 'lindas_nut_butter_auth_token';
const USER_KEY = 'lndas_nut_butter_user';

/**
 * Saves the authentication token to localStorage
 * @param {string} token - The JWT token
 */
export const saveAuthToken = (token) => {
  try {
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Retrieves the authentication token from localStorage
 * @returns {string|null} The JWT token or null if not found
 */
export const getAuthToken = () => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Removes the authentication token from localStorage
 */
export const removeAuthToken = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Saves user data to localStorage
 * @param {Object} user - The user object
 */
export const saveUser = (user) => {
  try {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Retrieves user data from localStorage
 * @returns {Object|null} The user object or null if not found
 */
export const getUser = () => {
  try {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Removes user data from localStorage
 */
export const removeUser = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

/**
 * Clears all authentication data (token and user)
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
  // You might want to add token expiration check here
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
