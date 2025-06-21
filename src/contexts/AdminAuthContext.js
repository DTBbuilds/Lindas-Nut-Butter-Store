import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS, getApiUrl } from '../config/api';

// Use the correct API URL based on environment
// Always use the fixed localhost URL for development to avoid API connection issues
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';



// Create context
const AdminAuthContext = createContext(null);

// Session timeout in milliseconds (10 minutes - increased for better UX)
const SESSION_TIMEOUT = 10 * 60 * 1000;

// Max retry attempts for authentication
const MAX_AUTH_RETRIES = 3;

// Retry delay in milliseconds (increases with each retry)
const RETRY_DELAY_BASE = 1000;

// Authentication check cooldown in milliseconds (2 minutes)
// This prevents excessive API calls when multiple components request auth checks
const AUTH_CHECK_COOLDOWN = 2 * 60 * 1000;

// Keep track of last successful auth check timestamp
let lastAuthCheckTime = 0;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [activityTimer, setActivityTimer] = useState(null);
  const navigate = useNavigate();

  // Check if admin is authenticated with retry mechanism and cooldown
  const checkAdminAuth = async (retryCount = 0, forceFresh = false) => {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('adminSessionExpiry');
    const adminEmail = localStorage.getItem('adminEmail');
    const now = Date.now();
    
    // Skip unnecessary auth checks if one was performed recently
    // unless forceFresh is true or admin state is null
    if (!forceFresh && admin && (now - lastAuthCheckTime < AUTH_CHECK_COOLDOWN)) {
      // Silent return - don't log anything to reduce console noise
      return true;
    }
    

    
    // Update the last check time for cooldown tracking
    lastAuthCheckTime = now;
    
    if (!token) {
      setAdmin(null);
      setLoading(false);
      setError(null); // Clear any previous errors
      return false;
    }
    

    
    // Check if session has expired
    if (expiry && new Date().getTime() > parseInt(expiry)) {
      // Don't call full logoutAdmin to avoid redirect loop, just clear the state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminSessionExpiry');
      setAdmin(null);
      setSessionExpiry(null);
      setLoading(false);
      setError({
        message: 'Your session has expired. Please log in again.'
      });
      return false;
    }
    
    try {

      // Use minimal=true for faster verification without database lookup
      const response = await axios.get(`${API_URL}/api/auth/me?minimal=true`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        timeout: 15000 // Increased to 15 seconds to prevent timeout issues
      });
      

      
      if (response.data) {
        // Check if the user has an admin role
        const userRole = response.data.role;
        if (userRole === 'admin' || userRole === 'superadmin') {
          setAdmin(response.data);
          // Reset session expiry
          resetSessionTimer();
          setLoading(false);
          setError(null); // Clear any previous errors
          return true;
        } else {
          console.log('User does not have admin privileges, role:', userRole);
          // Don't call full logoutAdmin to avoid redirect loop
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminSessionExpiry');
          setAdmin(null);
          setSessionExpiry(null);
          setLoading(false);
          setError({
            message: 'Access denied. You do not have admin privileges.'
          });
          return false;
        }
      } else {
        console.log('No admin data in response');
        // Don't call full logoutAdmin to avoid redirect loop
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminSessionExpiry');
        setAdmin(null);
        setSessionExpiry(null);
        setLoading(false);
        setError({
          message: 'Authentication failed. Please log in again.'
        });
        return false;
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      
      // Network error - could be temporary, try to retry
      if (error.code === 'ECONNABORTED' || !error.response) {
        if (retryCount < MAX_AUTH_RETRIES) {
          console.log(`Network error, retrying in ${RETRY_DELAY_BASE * (retryCount + 1)}ms...`);
          // Exponential backoff for retries
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * (retryCount + 1)));
          return checkAdminAuth(retryCount + 1);
        }
        
        // All retries failed - try to use token data as fallback
        console.log('All retries failed, attempting to use token data as fallback');
        try {
          // Try to decode the token locally without verification
          // This is not secure but works as emergency fallback when server is down
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
              console.log('Using fallback token data:', payload);
              setAdmin({
                id: payload.id,
                email: payload.email,
                name: payload.name,
                role: payload.role,
                _fallback: true // Flag indicating this is from fallback
              });
              setLoading(false);
              setError({
                message: 'Using offline mode due to connection issues. Limited functionality available.',
                type: 'warning'
              });
              return true;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback authentication failed:', fallbackError);
        }
        
        setError({
          message: 'Network error. Please check your connection and try again.'
        });
      } else if (error.response && error.response.status === 401) {
        // If we get a 401, it means token is invalid/expired
        console.log('Token invalid/expired - clearing admin session');
        setError({
          message: 'Your session has expired. Please log in again.'
        });
      } else {
        // Other errors
        setError({
          message: error.response?.data?.message || 'Authentication error. Please try again.'
        });
      }
      
      // Don't call full logoutAdmin to avoid redirect loop
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminSessionExpiry');
      setAdmin(null);
      setSessionExpiry(null);
      setLoading(false);
      return false;
    }
  };
  
  // Reset session timer
  const resetSessionTimer = () => {
    // Clear any existing timer
    if (activityTimer) {
      clearTimeout(activityTimer);
    }
    
    // Set new expiry time
    const newExpiry = new Date().getTime() + SESSION_TIMEOUT;
    setSessionExpiry(newExpiry);
    localStorage.setItem('adminSessionExpiry', newExpiry.toString());
    
    // Set new timer
    const newTimer = setTimeout(() => {
      // Only log and logout if admin is still logged in
      if (admin) {
        console.log('Admin session timeout');
        logoutAdmin();
      }
    }, SESSION_TIMEOUT);
    
    setActivityTimer(newTimer);
  };
  
  // Handle admin activity
  const handleAdminActivity = () => {
    if (admin) {
      resetSessionTimer();
    }
  };
  
  // Login admin
  const loginAdmin = async (email, password, retryCount = 0) => {
    try {
      setError(null);
      console.log('AdminAuthContext: Attempting login with email:', email);
      
      // Add debugging information
      console.log('AdminAuthContext: API URL being used:', API_URL);
      console.log('AdminAuthContext: Request payload:', { email, password: password ? '******' : undefined });
      
      const response = await axios.post(getApiUrl(API_ENDPOINTS.LOGIN), { email, password }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Login response:', response.data);
      
      if (response.data && response.data.token) {
        // Store token in localStorage
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminEmail', email);
        
        // Set admin data
        setAdmin(response.data.user || response.data.admin);
        
        // Set session expiry
        resetSessionTimer();
        
        setLoading(false);
        return true;
      } else {
        console.error('AdminAuthContext: Response did not contain a token');
        setError('Server response missing authentication token');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('AdminAuthContext: Login failed with error:', error);
      console.error('AdminAuthContext: Error response:', error.response?.data);
      console.error('AdminAuthContext: Error status:', error.response?.status);
      
      // Network error - could be temporary, try to retry
      if ((error.code === 'ECONNABORTED' || !error.response) && retryCount < MAX_AUTH_RETRIES) {
        console.log(`Network error during login, retrying in ${RETRY_DELAY_BASE * (retryCount + 1)}ms...`);
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE * (retryCount + 1)));
        return loginAdmin(email, password, retryCount + 1);
      }
      
      if (error.response) {
        // Server returned an error response
        if (error.response.status === 401) {
          setError('Invalid email or password');
        } else if (error.response.status === 429) {
          setError('Too many login attempts. Please try again later.');
        } else {
          setError(error.response.data?.message || 'Login failed. Please try again.');
        }
      } else if (error.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection and try again.');
      } else {
        // Something else caused the error
        setError('Login failed: ' + error.message);
      }
      
      setLoading(false);
      return false;
    }
  };
  
  // Logout admin with smooth transition
  const logoutAdmin = async () => {
    // Prevent multiple logout calls
    if (!admin) return;
    
    // Set loading state to true to prevent UI flashing
    setLoading(true);
    
    // Clear timer
    if (activityTimer) {
      clearTimeout(activityTimer);
      setActivityTimer(null);
    }
    
    try {
      // Use a small delay to allow the loading state to take effect
      // This prevents the UI from flashing during state changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminSessionExpiry');
      
      // Clear state
      setAdmin(null);
      setSessionExpiry(null);
      
      // Redirect to login - use replace instead of push to avoid navigation history issues
      navigate('/admin/login', { replace: true });
    } finally {
      // Reset loading state after navigation
      setTimeout(() => setLoading(false), 300);
    }
  };
  
  // Set up event listeners for user activity
  useEffect(() => {
    // Check authentication on mount only once to avoid unnecessary loops
    const token = localStorage.getItem('adminToken');
    
    // Only check auth if there's a token stored
    if (token) {
      // Force fresh check on initial load
      checkAdminAuth(0, true);
    } else {
      setLoading(false);
    }
    
    // Only set up listeners if admin is logged in
    if (admin) {
      // Set up activity listeners
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      
      const handleActivity = () => {
        handleAdminActivity();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity);
      });
      
      // Set up page visibility change listener with smarter auth checking
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Only check auth when page becomes visible if there's still a valid session
          const expiry = localStorage.getItem('adminSessionExpiry');
          const now = new Date().getTime();
          
          if (expiry && now < parseInt(expiry)) {
            resetSessionTimer(); // Reset the timer to extend session
            
            // Check if it's been more than 5 minutes since last auth check
            if (now - lastAuthCheckTime > 5 * 60 * 1000) {
              // Only do a full auth check if it's been a while
              checkAdminAuth(0, true);
            }
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up
      return () => {
        // Remove event listeners
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
        
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        // Clear timer
        if (activityTimer) {
          clearTimeout(activityTimer);
        }
      };
    }
  }, [admin]); // Re-run when admin changes
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    admin,
    loading,
    error,
    sessionExpiry,
    loginAdmin,
    logoutAdmin,
    // Expose a method to force a fresh auth check when needed
    checkAdminAuth: (retryCount = 0) => checkAdminAuth(retryCount, true),
    resetSessionTimer
  }), [admin, loading, error, sessionExpiry]);
  
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook to use the admin auth context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  
  return context;
};

export default AdminAuthContext;
