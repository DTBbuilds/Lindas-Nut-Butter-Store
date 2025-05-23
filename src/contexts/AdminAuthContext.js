import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Use the correct API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    window.location.hostname === 'localhost' && window.location.port === '3000' ? 
      'http://localhost:5000' : 
      `http://${window.location.hostname}:5000` 
    : 
    ''
  );

// Create context
const AdminAuthContext = createContext(null);

// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [activityTimer, setActivityTimer] = useState(null);
  const navigate = useNavigate();

  // Check if admin is authenticated
  const checkAdminAuth = async () => {
    const token = localStorage.getItem('adminToken');
    const expiry = localStorage.getItem('adminSessionExpiry');
    
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return false;
    }
    
    // Check if session has expired
    if (expiry && new Date().getTime() > parseInt(expiry)) {
      console.log('Admin session expired');
      await logoutAdmin();
      return false;
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/admin/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.role === 'admin') {
        setAdmin(response.data);
        // Reset session expiry
        resetSessionTimer();
        setLoading(false);
        return true;
      } else {
        await logoutAdmin();
        return false;
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      await logoutAdmin();
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
  const loginAdmin = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_URL}/api/admin/login`, { email, password });
      
      if (response.data && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminEmail', email);
        
        // Set session expiry
        resetSessionTimer();
        
        // Set admin data
        setAdmin(response.data.admin);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Admin login failed:', error);
      setError(error.response?.data?.message || 'Login failed');
      return false;
    }
  };
  
  // Logout admin
  const logoutAdmin = async () => {
    // Prevent multiple logout calls
    if (!admin) return;
    
    // Clear timer
    if (activityTimer) {
      clearTimeout(activityTimer);
      setActivityTimer(null);
    }
    
    // Clear local storage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminSessionExpiry');
    
    // Clear state
    setAdmin(null);
    setSessionExpiry(null);
    
    // Redirect to login - use replace instead of push to avoid navigation history issues
    navigate('/admin/login', { replace: true });
  };
  
  // Set up event listeners for user activity
  useEffect(() => {
    // Check authentication on mount
    checkAdminAuth();
    
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
      
      // Set up page visibility change listener
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // When page becomes visible again, check auth
          checkAdminAuth();
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
  
  // Context value
  const value = {
    admin,
    loading,
    error,
    sessionExpiry,
    loginAdmin,
    logoutAdmin,
    checkAdminAuth,
    resetSessionTimer
  };
  
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
