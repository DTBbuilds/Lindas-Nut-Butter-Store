import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSpinner, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { API_URL } from '../config';

const AccountLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Attempt to login
      const response = await axios.post(`${API_URL}/api/customers/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data && response.data.token) {
        // Store token and user info
        localStorage.setItem('customerToken', response.data.token);
        localStorage.setItem('customerEmail', email);
        localStorage.setItem('customerName', response.data.name || '');
        
        // Show success message
        toast.success('Login successful!', { containerId: 'main-toast-container' });
        
        // Redirect to account page or previous location
        const from = location.state?.from?.pathname || '/account';
        navigate(from);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
      toast.error(err.response?.data?.message || 'Login failed', { containerId: 'main-toast-container' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Customer Login</h1>
      
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
