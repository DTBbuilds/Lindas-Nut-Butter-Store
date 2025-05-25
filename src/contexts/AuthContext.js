import React, { createContext, useState, useContext, useEffect } from 'react';
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
        const response = await fetch('http://localhost:5000/api/auth/me', {
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
      // Direct API call to the backend registration endpoint
      const response = await fetch('http://localhost:5000/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // For our implementation, we're just returning success and not logging in automatically
      return { success: true, message: data.message || 'Registration successful' };
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
      const token = localStorage.getItem('token');
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
