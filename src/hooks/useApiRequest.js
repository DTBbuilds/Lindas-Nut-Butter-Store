import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { isTokenExpired, clearAuth } from '../utils/authUtils';

/**
 * Custom hook to handle API requests with loading, error, and success states
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback function called on successful request
 * @param {Function} options.onError - Callback function called on request error
 * @param {boolean} options.autoHandleErrors - Whether to automatically handle errors (default: true)
 * @param {boolean} options.redirectOnUnauthorized - Whether to redirect to login on 401 (default: true)
 * @returns {Object} - Request state and methods
 */
const useApiRequest = ({
  onSuccess,
  onError,
  autoHandleErrors = true,
  redirectOnUnauthorized = true,
} = {}) => {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: false,
    status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  });
  
  const navigate = useNavigate();
  const isMounted = useRef(true);
  
  // Set isMounted to false when the component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  /**
   * Reset the request state
   */
  const reset = useCallback(() => {
    if (isMounted.current) {
      setState({
        data: null,
        error: null,
        loading: false,
        status: 'idle',
      });
    }
  }, []);
  
  /**
   * Execute an API request
   * @param {Function} requestFn - The API request function to execute
   * @param {Array} args - Arguments to pass to the request function
   * @returns {Promise} - The API response
   */
  const executeRequest = useCallback(async (requestFn, ...args) => {
    if (!isMounted.current) return;
    
    // Check if the request function is valid
    if (typeof requestFn !== 'function') {
      const error = new Error('Request function must be a function');
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
          status: 'error',
        }));
      }
      
      if (onError) onError(error);
      throw error;
    }
    
    // Set loading state
    setState(prev => ({
      ...prev,
      loading: true,
      status: 'loading',
      error: null,
    }));
    
    try {
      // Execute the request
      const response = await requestFn(...args);
      
      if (isMounted.current) {
        setState({
          data: response,
          error: null,
          loading: false,
          status: 'success',
        });
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle unauthorized errors
      if (error.status === 401 && redirectOnUnauthorized) {
        // Clear auth data
        clearAuth();
        
        // Redirect to account login with return URL
        const returnUrl = window.location.pathname + window.location.search;
        navigate(`/account/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        
        // Don't show the error message for unauthorized errors
        if (isMounted.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            status: 'idle',
          }));
        }
        
        return null;
      }
      
      // Handle token expiration
      if (error.message?.includes('token') && error.message?.includes('expired')) {
        clearAuth();
        navigate('/account/login?session=expired');
        return null;
      }
      
      // Update error state
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          error: {
            message: error.message || 'An error occurred',
            status: error.status,
            data: error.data || error.response?.data,
          },
          loading: false,
          status: 'error',
        }));
      }
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      } else if (autoHandleErrors) {
        // Show error toast or notification
        console.error('API Error:', error.message);
      }
      
      throw error;
    }
  }, [autoHandleErrors, navigate, onError, onSuccess, redirectOnUnauthorized]);
  
  /**
   * Create a memoized request function
   * @param {Function} requestFn - The API request function
   * @returns {Function} - Memoized request function
   */
  const createRequest = useCallback((requestFn) => {
    return (...args) => executeRequest(requestFn, ...args);
  }, [executeRequest]);
  
  return {
    // State
    data: state.data,
    error: state.error,
    loading: state.loading,
    status: state.status,
    
    // Methods
    executeRequest,
    createRequest,
    reset,
    
    // Helper properties
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  };
};

export default useApiRequest;
