const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authValidation } = require('../middleware/validators');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin user & get token
 * @access  Public
 */
router.post('/login', authValidation.login, async (req, res, next) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Only allow admin login for admin dashboard
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Create JWT token with consistent secret
    const JWT_SECRET = process.env.JWT_SECRET || 'lindas-nut-butter-store-store-store-default-secret';
    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production.');
    }
    
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '12h',
        issuer: 'lindas-nut-butter-store-store-store-store',
        audience: 'lindas-nut-butter-store-store-store-store-web'
      }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    // Send response
    res.json({ 
      success: true, 
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err); // Pass to error handler
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear token cookie)
 * @access  Private
 */
router.post('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.json({ success: true, message: 'Successfully logged out' });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('x-auth-token') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      } 
    });
  } catch (err) {
    console.error('Auth error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    next(err);
  }
});

module.exports = router;
