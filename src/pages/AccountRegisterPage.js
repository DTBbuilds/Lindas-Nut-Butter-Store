import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEnvelope, faPhone, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';



const AccountRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  // Check for redirect parameter in URL query
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');
  
  // If user is already authenticated, redirect appropriately
  useEffect(() => {
    if (isAuthenticated) {
      if (redirectTo === 'checkout') {
        navigate('/checkout');
      } else if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/account');
      }
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match', { containerId: 'main-toast-container' });
      return;
    }
    
    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      toast.error('Password must be at least 8 characters long', { containerId: 'main-toast-container' });
      return;
    }
    
    setLoading(true);
    
    try {
      // Register the user
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber
      };
      const responseData = await apiService.auth.register(userData);
      
      // apiService.auth.register will throw an error for non-2xx responses handled by its interceptor.
      // If we reach here, the request was successful at the HTTP level.
      // We still check the business logic success from the response body.
      if (responseData && responseData.success) {
        // Store registration data temporarily to display in the login form
        localStorage.setItem('registeredEmail', formData.email);
        localStorage.setItem('justRegistered', 'true');
        
        // Save user registration data for profile completion
        localStorage.setItem('userRegistrationData', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          registrationTime: new Date().toISOString()
        }));
        
        // Always show success message
        toast.success('Registration successful! Please log in with your new account.', { 
          containerId: 'main-toast-container',
          autoClose: 4000 // Give users time to read the message
        });
        
        // Always redirect to login page with appropriate redirect parameter
        // This creates a more consistent user experience
        const loginRedirect = redirectTo ? `/account/login?redirect=${redirectTo}` : '/account/login';
        
        // Use a short timeout to allow the toast to be visible before redirecting
        setTimeout(() => {
          navigate(loginRedirect);
        }, 800);
      }
    } catch (err) {
      // Enhanced error logging to provide better error information
      const errorDetails = {
        message: err.message, // apiService errors usually have a message property
        originalError: err.originalError // if apiService wraps the original error
      };
      console.error('Registration failed:', errorDetails);
      
      // Set more specific error messages
      let errorMessage = 'Registration failed';
      // The apiService error handling might provide a more direct message.
      // For specific business logic errors like 'Customer already exists', the backend should return a clear message.
      if (err.message && err.message.toLowerCase().includes('customer already exists')) {
        errorMessage = 'An account with this email already exists. Please log in or use a different email.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage, { containerId: 'main-toast-container' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <FontAwesomeIcon icon={faEnvelope} />
            </span>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <FontAwesomeIcon icon={faPhone} />
            </span>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              placeholder="+254 7XX XXX XXX"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters long
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <FontAwesomeIcon icon={faLock} />
            </span>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300 flex justify-center items-center"
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link to="/account/login" className="text-soft-green hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AccountRegisterPage;
