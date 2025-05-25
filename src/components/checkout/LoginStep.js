import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEnvelope, faPhone, faSpinner, faArrowLeft, faUserPlus, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
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

// Ensure the API URL is properly formatted
const getFullApiUrl = (endpoint) => {
  // If the endpoint already starts with http, return it as is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // If the endpoint starts with a slash, remove it
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Return the full URL
  return `${API_URL}/api/${cleanEndpoint}`;
};

/**
 * LoginStep - An enhanced component for the checkout process that embeds login and registration forms
 * 
 * @param {Object} props Component props
 * @param {Function} props.onBack Function to go back to previous step
 * @param {Function} props.onLoginSuccess Function to call when login is successful
 */
const LoginStep = ({ onBack, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  
  // Handle login form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle registration form input changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Attempt to login
      const response = await axios.post(getFullApiUrl('customers/login'), {
        email: loginForm.email,
        password: loginForm.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data && response.data.token) {
        // Store token and user info
        localStorage.setItem('customerToken', response.data.token);
        localStorage.setItem('customerEmail', loginForm.email);
        localStorage.setItem('customerName', response.data.name || '');
        
        // Store user data for checkout process
        const userData = response.data.user || {};
        
        // Prepare the data structure for checkout
        const checkoutData = {
          name: userData.name || response.data.name || '',
          email: loginForm.email,
          phoneNumber: userData.phoneNumber || '',
          address: userData.address || '',
          apartment: userData.apartment || '',
          city: userData.city || 'Nairobi'
        };
        
        // Save to sessionStorage for the current checkout process
        sessionStorage.setItem('checkoutCustomerInfo', JSON.stringify(checkoutData));
        
        // Show success message
        toast.success('Login successful!', { containerId: 'main-toast-container' });
        
        // Call login function from AuthContext
        login(userData, response.data.token);
        
        // Call onLoginSuccess callback to proceed with checkout
        // Pass the user data to ensure it's available for the next step
        if (onLoginSuccess) {
          onLoginSuccess(checkoutData);
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
      toast.error(err.response?.data?.message || 'Login failed', { containerId: 'main-toast-container' });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle registration form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match', { containerId: 'main-toast-container' });
      return;
    }
    
    // Validate password length
    if (registerForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      toast.error('Password must be at least 8 characters', { containerId: 'main-toast-container' });
      return;
    }
    
    // Validate Kenyan phone number format
    const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(registerForm.phoneNumber)) {
      setError('Please enter a valid Kenyan phone number');
      toast.error('Please enter a valid Kenyan phone number', { containerId: 'main-toast-container' });
      return;
    }
    
    setLoading(true);
    
    try {
      // Attempt to register
      const response = await axios.post(getFullApiUrl('customers/register'), {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phoneNumber: registerForm.phoneNumber
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.token) {
        // Store token and user info
        localStorage.setItem('customerToken', response.data.token);
        localStorage.setItem('customerEmail', registerForm.email);
        localStorage.setItem('customerName', registerForm.name);
        localStorage.setItem('customerPhone', registerForm.phoneNumber);
        
        // Store additional registration data for checkout process
        // This will be used to auto-fill the customer info form
        const checkoutData = {
          name: registerForm.name,
          email: registerForm.email,
          phoneNumber: registerForm.phoneNumber,
          // Initialize other fields that will be needed in CustomerInfoForm
          address: '',
          apartment: '',
          city: 'Nairobi'
        };
        
        // Save to sessionStorage for the current checkout process
        sessionStorage.setItem('checkoutCustomerInfo', JSON.stringify(checkoutData));
        
        // Show success message
        toast.success('Registration successful! Welcome to Linda\'s Nut Butter Store.', { containerId: 'main-toast-container' });
        
        // Call login function from AuthContext
        login(response.data.user, response.data.token);
        
        // Call onLoginSuccess callback to proceed with checkout
        // Pass the user data to ensure it's available for the next step
        if (onLoginSuccess) {
          onLoginSuccess(checkoutData);
        }
      } else {
        throw new Error('Registration failed');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      
      // Handle common errors
      if (err.response?.status === 409) {
        setError('Email already in use. Please login instead.');
        // Switch to login tab
        setActiveTab('login');
        // Pre-fill login form with the email
        setLoginForm(prev => ({
          ...prev,
          email: registerForm.email
        }));
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
      
      toast.error(err.response?.data?.message || 'Registration failed', { containerId: 'main-toast-container' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-8 max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Account Required</h2>
        <p className="text-gray-600 mt-2">Please log in or create an account to continue with your purchase</p>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <FontAwesomeIcon icon={faUser} className="text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Creating an account allows us to:
            </p>
            <ul className="list-disc ml-5 mt-1 text-xs text-blue-700">
              <li>Send order confirmations to your email</li>
              <li>Save your delivery information for faster checkout</li>
              <li>Track your order history and status</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`flex-1 py-3 font-medium text-center ${activeTab === 'login' ? 'text-soft-green border-b-2 border-soft-green' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('login')}
        >
          <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
          Login
        </button>
        <button
          className={`flex-1 py-3 font-medium text-center ${activeTab === 'register' ? 'text-soft-green border-b-2 border-soft-green' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('register')}
        >
          <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
          Register
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Login Form */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit}>
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
                value={loginForm.email}
                onChange={handleLoginChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mb-6">
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
                value={loginForm.password}
                onChange={handleLoginChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-soft-green hover:bg-rich-brown text-white font-bold py-2 px-4 rounded-md transition duration-300 flex justify-center items-center"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      )}
      
      {/* Registration Form */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterSubmit}>
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
                value={registerForm.name}
                onChange={handleRegisterChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                type="email"
                id="register-email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FontAwesomeIcon icon={faPhone} />
              </span>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={registerForm.phoneNumber}
                onChange={handleRegisterChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="+254 7XX XXX XXX"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type="password"
                id="register-password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength="8"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
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
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-soft-green hover:bg-rich-brown text-white font-bold py-2 px-4 rounded-md transition duration-300 flex justify-center items-center"
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
      )}
      
      <div className="text-center mt-6 border-t border-gray-200 pt-6">
        <button 
          onClick={onBack}
          className="flex items-center justify-center mx-auto text-amber-600 hover:text-amber-700 transition-colors"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Return to Cart
        </button>
      </div>
    </div>
  );
};

export default LoginStep;
