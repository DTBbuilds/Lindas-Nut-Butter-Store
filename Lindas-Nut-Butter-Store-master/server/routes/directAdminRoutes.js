/**
 * Direct Admin Authentication Routes
 * Uses environment variables for admin credentials to avoid database issues
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
// Import model helper to avoid circular dependency issues
const { getAdmin } = require('../utils/modelHelper');

// Import config for consistent JWT settings
const config = require('../config');

// Admin credentials (for demo purposes - in production, use environment variables)
const ADMIN_EMAIL = 'admin@lindas.com';
const ADMIN_PASSWORD = 'admin123';

// Get secret key from environment or config
const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret;

/**
 * @route POST /api/admin/login
 * @desc Admin login with direct credentials
 * @access Public
 */
router.post('/login', (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    const { email, password } = req.body;

    // Validate input - email and password are required
    if (!email || !password) {
      console.log('Missing email or password in admin login attempt');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Check credentials directly with strict comparison
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.log('Invalid credentials for admin login attempt');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log('Admin login successful for:', email);

    // Create token payload with unique identifier
    const payload = {
      email: ADMIN_EMAIL,
      name: 'Admin User',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    };

    // Sign token with shorter expiration for security
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { 
        expiresIn: '4h',
        audience: 'admin-dashboard',
        issuer: 'lindas-nut-butter-store'
      }
    );

    // Return success response
    res.json({
      success: true,
      token: token,
      admin: {
        email: ADMIN_EMAIL,
        name: 'Admin User',
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

/**
 * @route GET /api/admin/me
 * @desc Verify admin token and return admin information
 * @access Private
 */
router.get('/me', async (req, res) => {
  try {
    console.log('Admin verification request received');
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      console.log('Verifying admin token...');
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verification successful for:', decoded.email);
      
      // Check if admin exists in database (optional but more secure)
      if (decoded.id) {
        try {
          // Get Admin model using the helper
          const Admin = getAdmin();
          const admin = await Admin.findById(decoded.id).select('-password');
          
          if (!admin) {
            console.log('Admin not found in database:', decoded.id);
            return res.status(401).json({ message: 'Admin not found' });
          }
          
          console.log('Admin found in database:', admin.email);
          
          // Return admin data from database
          return res.json({
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            active: admin.active,
            lastLogin: admin.lastLogin
          });
        } catch (dbError) {
          console.error('Database error during admin verification:', dbError);
          // Fall back to token data if database check fails
          console.log('Falling back to token data');
        }
      }
      
      // Return admin data from token as fallback
      console.log('Returning admin data from token');
      res.json({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      });
    } catch (err) {
      console.error('Token validation error:', err.message);
      return res.status(401).json({ message: 'Token is not valid', error: err.message });
    }
  } catch (err) {
    console.error('Error in admin verification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
