import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Use the correct API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    // Try both common development server ports
    window.location.hostname === 'localhost' && window.location.port === '3000' ? 
      'http://localhost:5000' : 
      `http://${window.location.hostname}:5000` 
    : 
    ''
  );

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token validity by making a request to the server
      axios.get(`${API_URL}/api/admin/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        if (response.data && response.data.role === 'admin') {
          // Token is valid and user is admin, redirect to admin dashboard
          const from = location.state?.from?.pathname || '/admin';
          navigate(from);
        }
      })
      .catch(() => {
        // Token is invalid, clear it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
      });
    }
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Try both server and backend auth endpoints
      const tryLogin = async (endpoint) => {
        try {
          console.log(`Trying login at: ${endpoint}`);
          const res = await axios({
            method: 'post',
            url: endpoint,
            data: { email, password },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            // Important for cookies to work
            withCredentials: true
          });
          return { success: true, data: res.data };
        } catch (err) {
          return { 
            success: false, 
            error: err,
            status: err.response?.status,
            message: err.response?.data?.message || 'Login failed'
          };
        }
      };
      
      // Try the direct admin login endpoint
      let result = await tryLogin(`${API_URL}/api/admin/login`);
      
      // If that fails, retry with a slight delay (could be a network issue)
      if (!result.success) {
        console.log('Admin auth failed, retrying...');
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await tryLogin(`${API_URL}/api/admin/login`);
      }
      
      if (result.success && result.data.token) {
        // Store token and user info
        localStorage.setItem('adminToken', result.data.token);
        localStorage.setItem('adminEmail', result.data.user.email);
        
        // Show success message
        toast.success('Login successful!', { containerId: 'main-toast-container' });
        
        // Redirect to admin dashboard or previous location
        const from = location.state?.from?.pathname || '/admin';
        navigate(from);
      } else {
        // Handle login failure
        console.error('Login failed:', result.message);
        setError(result.message || 'Invalid credentials');
        toast.error(result.message || 'Login failed', { containerId: 'main-toast-container' });
      }
    } catch (err) {
      console.error('Login process failed:', err);
      setError('Login system error. Please try again later.');
      toast.error('Login system error. Please try again later.', { containerId: 'main-toast-container' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-beige">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-golden-brown mb-6 text-center">Admin Login</h2>
        {error && <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1 font-semibold">Email</label>
            <input type="email" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-1 font-semibold">Password</label>
            <input type="password" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 px-4 bg-rich-brown text-white font-semibold rounded-md hover:bg-soft-green transition-colors text-lg shadow-md"
            disabled={loading}
            style={{ cursor: 'pointer', position: 'relative', zIndex: 10 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
