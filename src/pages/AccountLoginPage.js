import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSpinner, faUserShield, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import apiService from '../services/apiService';
import { saveAuthToken, saveUser } from '../utils/authUtils'; // Though apiService.auth.login already does this, explicit for clarity if needed elsewhere, but primary reliance is on apiService.



const AccountLoginPage = () => {
  // Pre-fill email if user just registered
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('registeredEmail') || '';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: contextLogin, user, initialCheckComplete } = useAuth(); // Get login, user, and initialCheckComplete from AuthContext
  const toastShownRef = useRef(false);
  
  // Check if user just registered and set up the auto-fill
  useEffect(() => {
    const justReg = localStorage.getItem('justRegistered') === 'true';
    if (justReg) {
      setJustRegistered(true);
      // Remove the flag after a short delay to prevent it persisting on refresh
      setTimeout(() => {
        localStorage.removeItem('justRegistered');
      }, 5000);
    }
  }, []);

  // Effect to redirect if user is already logged in
  useEffect(() => {
    // If the user is already logged in AND they are on the login page, redirect them.
    if (user && initialCheckComplete && location.pathname === '/account/login' && !toastShownRef.current) {
      // User is already logged in, redirect from login page
      toast.info('You are already logged in.', { containerId: 'main-toast-container' });
      toastShownRef.current = true; // Prevent toast from showing again
      if (user.role === 'customer') {
        navigate('/customer/dashboard');
      } else {
        // Fallback for other roles, or a more generic authenticated user page
        navigate('/account'); 
      }
    }
  }, [user, initialCheckComplete, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the login function from AuthContext, which now handles the entire login flow.
      const result = await contextLogin(email, password);

      if (result.success) {
        toast.success('Login successful!', { containerId: 'main-toast-container' });

        // Redirect to the intended page after successful login.
        // The user object is now in result.user from the context's response.
        let from = location.state?.from?.pathname;
        if (!from) {
          from = result.user?.role === 'customer' ? '/customer/dashboard' : '/account';
        }
        // Ensure we don't redirect back to login/register pages
        if (['/account/login', '/login', '/account/register'].includes(from)) {
          from = result.user?.role === 'customer' ? '/customer/dashboard' : '/account';
        }
        navigate(from);
      } else {
        // The AuthContext login function returns an error message on failure.
        const errorMessage = result.error || 'Invalid email or password.';
        setError(errorMessage);
        toast.error(errorMessage, { containerId: 'main-toast-container' });
      }
    } catch (err) {
      // This is a fallback for unexpected errors not caught by the context's login function.
      console.error('An unexpected error occurred during login:', err);
      const errorMessage = err.message || 'An unexpected server error occurred.';
      setError(errorMessage);
      toast.error(errorMessage, { containerId: 'main-toast-container' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Customer Login</h1>
      
      {justRegistered && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Your account has been created successfully! Please login with your credentials.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <FontAwesomeIcon icon={faUser} />
            </span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              placeholder="your@email.com"
              required
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Logging in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <Link to="/account/forgot-password" className="text-soft-green hover:underline text-sm">
          Forgot your password?
        </Link>
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/account/register" className="text-soft-green hover:underline font-medium">
            Create Account
          </Link>
        </p>
      </div>
      
      {/* Admin Access Section */}
      {/* Back to Shop Button */}
      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <Link 
          to="/" 
          className="inline-flex items-center px-4 py-2 bg-soft-green hover:bg-soft-green-dark text-white rounded-md transition duration-300"
        >
          <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
          Back to Shop
        </Link>
      </div>
      
      {/* Admin Access Section */}
      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <p className="text-gray-600 mb-3">Store Administrator?</p>
        <Link 
          to="/admin/login" 
          className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition duration-300"
        >
          <FontAwesomeIcon icon={faUserShield} className="mr-2" />
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export default AccountLoginPage;
