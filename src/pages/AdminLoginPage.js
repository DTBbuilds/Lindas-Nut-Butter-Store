import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faArrowLeft, faStore, faUserFriends } from '@fortawesome/free-solid-svg-icons';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, loading: authLoading, error: authError, loginAdmin } = useAdminAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (admin) {
      console.log('Admin is already logged in, redirecting to dashboard...');
      const from = location.state?.from?.pathname || '/admin';
      // Use navigate for proper React Router navigation
      navigate(from);
    }
  }, [admin, location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLocalLoading(true);
    
    console.log('=== ADMIN LOGIN ATTEMPT (CLIENT) ===');
    console.log('Email:', email);
    console.log('Password length:', password?.length || 0);
    
    try {
      // Validate input fields
      if (!email.trim() || !password.trim()) {
        console.log('Validation failed: Missing email or password');
        setLocalError('Please enter both email and password');
        setLocalLoading(false);
        return;
      }
      
      // Get API URL for login
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      console.log('Using API URL:', API_URL);
      
      // Try using the context login method
      console.log('Attempting login with AdminAuthContext');
      const success = await loginAdmin(email, password);
      
      if (success) {
        // console.log('Login successful via context!');
        // Show success message
        toast.success('Login successful! Redirecting to dashboard...', {
          position: 'top-right',
          autoClose: 2000
        });
        
        // Use navigate for navigation after short delay to ensure state updates
        setTimeout(() => {
          console.log('Redirecting to admin dashboard using navigate...');
          navigate('/admin');
        }, 1500);
      } else {
        console.error('Login failed');
        const determinedErrorMessage = (authError && authError.message) 
                                   ? authError.message 
                                   : (typeof authError === 'string' 
                                     ? authError 
                                     : 'Login failed. Please check your credentials.');
        setLocalError(determinedErrorMessage);
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      setLocalError('An unexpected error occurred. Please try again.');
    } finally {
      setLocalLoading(false);
    }    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Back to Store button in top-left corner */}
      <div className="absolute top-4 left-4">
        <a 
          href="/" 
          className="flex items-center text-green-600 hover:text-green-700 transition-colors duration-300"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          <span>Back to Store</span>
        </a>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faLock} className="text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
          <p className="text-gray-600 text-sm mt-1">Enter your credentials to access the admin dashboard</p>
        </div>
        
        {(localError || authError) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>
              {localError || 
               (authError && typeof authError === 'object' && authError.message) || 
               (typeof authError === 'string' ? authError : '')}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
              </div>
              <input 
                type="email" 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                placeholder="admin@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-gray-400" />
              </div>
              <input 
                type="password" 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300"
            disabled={localLoading || authLoading}
          >
            {localLoading || authLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>This area is restricted to authorized administrators only.</p>
          </div>
          
          {/* Link options at the bottom */}
          <div className="mt-6 text-center flex flex-col space-y-3">
            <a 
              href="/account/login" 
              className="inline-flex items-center justify-center text-white bg-soft-green hover:bg-soft-green-dark py-2 px-4 rounded-md transition-colors duration-300"
            >
              <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
              <span>Go to Customer Login</span>
            </a>
            
            <a 
              href="/" 
              className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors duration-300"
            >
              <FontAwesomeIcon icon={faStore} className="mr-2" />
              <span>Return to Linda's Nut Butter Store</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
