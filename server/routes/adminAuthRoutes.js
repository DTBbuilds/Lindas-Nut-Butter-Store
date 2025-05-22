const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Admin } = require('../models');
const router = express.Router();

// For debug
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @route POST /api/auth/admin/login
 * @desc Login admin user and get token
 * @access Public
 */
router.post('/admin/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if admin is active
    if (!admin.active) {
      console.log('Admin account inactive:', email);
      return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
    }

    // Check password directly using bcrypt since the model method might be failing
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('Invalid password for admin:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('Admin login successful:', email);

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // Create token payload
    const payload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    // Sign token
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return success with token and user info
    res.json({
      success: true,
      token: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

/**
 * @route GET /api/auth/admin/me
 * @desc Get current admin user info
 * @access Private
 */
router.get('/admin/me', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find admin by id
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if admin is active
    if (!admin.active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Return admin data
    res.json(admin);
  } catch (err) {
    console.error('Auth verification error:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
