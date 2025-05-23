import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
    setInitialCheckComplete(true);
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    navigate('/login');
  };

  // Request password reset email
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/customers/forgot-password`, {
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
      const response = await apiService.auth.register(userData);
      
      if (response.token) {
        saveAuthToken(response.token);
        setUserData(response.user || { email: userData.email });
        
        // Redirect to home after successful registration
        navigate('/', { replace: true });
        
        return { success: true };
      } else {
        throw new Error('No token received after registration');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
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
      await apiService.auth.forgotPassword(email);
      return { success: true };
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
      // Try using apiService if available, otherwise make direct API call
      if (apiService && apiService.auth && apiService.auth.resetPassword) {
        await apiService.auth.resetPassword(token, newPassword);
      } else {
        // Direct API call as fallback
        const response = await fetch(`${API_URL}/api/customers/reset-password/${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: newPassword })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to reset password');
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      setError(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await apiService.auth.updateProfile(userData);
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

  const isAuthenticated = () => {
    return user !== null;
  };

  const saveAuthToken = (token) => {
    localStorage.setItem('token', token);
  };

  const setUserData = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated: isAuthenticated(),
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
