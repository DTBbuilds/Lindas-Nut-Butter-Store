/**
 * Direct Admin Authentication Routes
 * Uses environment variables for admin credentials to avoid database issues
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Admin credentials (for demo purposes - in production, use environment variables)
const ADMIN_EMAIL = 'admin@lindas.com';
const ADMIN_PASSWORD = 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @route POST /api/admin/login
 * @desc Admin login with direct credentials
 * @access Public
 */
router.post('/login', (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check credentials directly
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.log('Invalid credentials for admin login');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Admin login successful');

    // Create token payload
    const payload = {
      email: ADMIN_EMAIL,
      name: 'Admin User',
      role: 'admin'
    };

    // Sign token
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return success response
    res.json({
      success: true,
      token: token,
      user: {
        email: ADMIN_EMAIL,
        name: 'Admin User',
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route GET /api/admin/me
 * @desc Verify admin token
 * @access Private
 */
router.get('/me', (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Return admin data
      res.json({
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      });
    } catch (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Error in admin verification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
