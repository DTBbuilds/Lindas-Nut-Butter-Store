import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { clearAuth, getAuthToken, getUser, removeAuthToken, saveAuthToken, saveUser } from '../utils/authUtils'; // Import clearAuth, getAuthToken, removeAuthToken, saveAuthToken

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken()); // Initialize synchronously
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    // Only run the full authentication check if a token exists.
    if (token) {
      checkAuth();
    } else {
      // Otherwise, we know the user is not authenticated. Finalize the initial check.
      setLoading(false);
      setInitialCheckComplete(true);
    }
  }, []);

  const checkAuth = async () => {
    if (isChecking) {
      console.log('[AuthContext] checkAuth already in progress, skipping.');
      return;
    }
    setIsChecking(true);
    try {
      const token = getAuthToken();
      console.log('[AuthContext] checkAuth called. Token from getAuthToken():', token);
      if (token) {
        try {
          // The token is automatically added by apiService's request interceptor.
          const userData = await apiService.get('/customers/me');
          setUser(userData);
          setIsAuthenticated(true); // Confirm authentication
        } catch (err) {
          console.error('Auth check failed:', err);
          clearAuth(); // Clears token and user data
          setUser(null);
          setIsAuthenticated(false); // Set to false on failure
        }
      } else {
        // No token found, ensure we are logged out
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
      setInitialCheckComplete(true);
    } finally {
      setIsChecking(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      // Use the centralized apiService.auth.login which handles token saving
      const response = await apiService.auth.login(email, password);

      if (response && response.accessToken && response.customer) {
        // apiService already saved the token and user, now update context state
        setUser(response.customer);
        setIsAuthenticated(true);
        // console.log('[AuthContext] Login successful. User and auth state updated.');
        return { success: true, user: response.customer };
      } else {
        const message = response?.message || 'Login failed: Unexpected server response.';
        setError(message);
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
        return { success: false, error: message };
      }
    } catch (err) {
      console.error('Login failed in AuthContext:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred during login.';
      setError(errorMessage);
      // Ensure auth state is cleared on failure
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false); // Set unauthenticated on logout
    clearAuth(); // Use the utility to clear both token and user data
    navigate('/account/login'); // Corrected to customer login page
  };

  // Request password reset email
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch('http://localhost:5000/api/customers/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset email');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  };

  // Reset password with token - implementation moved to the existing resetPassword function below

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const responseData = await apiService.auth.register(userData);
      if (responseData && responseData.success) {
        // Registration successful, now attempt to log in
        const { email, password } = userData;
        const loginResult = await login({ email, password });
        if (loginResult.success) {
          // Login after registration was successful
          return { success: true, message: 'Registration successful! You are now logged in.' };
        } else {
          // This is an edge case: registration worked but immediate login failed.
          // The user exists, so they should be prompted to log in manually.
          setError('Registration successful, but auto-login failed. Please log in manually.');
          return { success: false, error: 'Registration successful, but auto-login failed. Please log in manually.' };
        }
      } else {
        // The registration itself failed.
        const message = responseData?.message || 'Registration failed due to an unknown server issue.';
        setError(message);
        return { success: false, error: message };
      }
    } catch (error) {
      console.error('Registration failed in AuthContext:', error);
      const errorMessage = error.message || 'An unknown error occurred during registration.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      // Direct API call to forgot password endpoint
      const response = await fetch('http://localhost:5000/api/customers/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process forgot password request');
      }
      
      return { success: true, message: data.message || 'Password reset instructions sent to your email' };
    } catch (error) {
      console.error('Forgot password request failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process forgot password request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      // Direct API call to reset password
      const response = await fetch(`http://localhost:5000/api/customers/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      // If response includes a token, save it for automatic login
      if (data.token) {
        saveAuthToken(data.token);
      }
      
      return { success: true, message: data.message || 'Password reset successful' };
    } catch (error) {
      console.error('Password reset failed:', error);
      setError(error.message || 'Failed to reset password');
      return { success: false, error: error.message || 'Failed to reset password' };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the auth token
      const token = getAuthToken();
      if (!token) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Direct API call to update profile
      const response = await fetch('http://localhost:5000/api/customers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update the user state with the returned data
      const updatedUser = data.customer || data.user;
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };



  const saveAuthToken = (token) => {
    localStorage.setItem('token', token);
  };

  const setUserData = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated,
    initialCheckComplete,
    loading,
    error,
    initialCheckComplete,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateProfile,
    setError, // Allow components to set error messages
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} The auth context value
 * @throws {Error} If used outside of an AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
