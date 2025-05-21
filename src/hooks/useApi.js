import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Custom hook for making API calls with loading and error states
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @param {boolean} immediate - Whether to make the request immediately
 * @returns {Object} - The API state and request function
 */
const useApi = (endpoint, options = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [status, setStatus] = useState(null);

  /**
   * Execute the API request
   * @param {Object} requestOptions - Additional request options
   * @returns {Promise<Object>} - The response data
   */
  const execute = useCallback(async (requestOptions = {}) => {
    setLoading(true);
    setError(null);
    setStatus('loading');
    
    try {
      const response = await apiRequest(endpoint, { ...options, ...requestOptions });
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      console.error(`API request to ${endpoint} failed:`, err);
      setError({
        message: err.message || 'An error occurred',
        status: err.status,
        data: err.data
      });
      setStatus('error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  // Automatically execute the request if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    error,
    loading,
    status,
    execute,
    setData, // Allow manual updates to data
  };
};

export default useApi;

// Helper function to handle API requests with the same interface as the direct api object
const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', params, body, ...restOptions } = options;
  
  switch (method.toUpperCase()) {
    case 'GET':
      return api.get(endpoint, params, restOptions);
    case 'POST':
      return api.post(endpoint, body, restOptions);
    case 'PUT':
      return api.put(endpoint, body, restOptions);
    case 'PATCH':
      return api.patch(endpoint, body, restOptions);
    case 'DELETE':
      return api.delete(endpoint, restOptions);
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
};
