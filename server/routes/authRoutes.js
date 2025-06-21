const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authValidation } = require('../middleware/validators');
const config = require('../config');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin user & get token
 * @access  Public
 */
router.post('/login', authValidation.login, async (req, res, next) => {
  console.log('Login request received:', JSON.stringify(req.body, null, 2));
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Only allow admin login for admin dashboard
    if (user.role !== 'admin') {
      console.log('User is not admin:', email, 'Role:', user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Create JWT token using admin secret from config
    const adminJwtSecret = config.jwt.adminSecret;
    if (!adminJwtSecret) {
      console.error('CRITICAL: ADMIN_JWT_SECRET is not set in environment variables. Admin authentication will fail or be insecure.');
      return res.status(500).json({ success: false, message: 'Server configuration error for admin authentication.' });
    }

    // Create JWT access token
    const accessToken = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email
      }, 
      adminJwtSecret, 
      { 
        expiresIn: config.jwt.adminExpiresIn || '12h', // Use configured expiration, fallback if somehow undefined
        issuer: 'lindas-nut-butter-store-store-store-store',
        audience: 'lindas-nut-butter-store-store-store-store-web'
      }
    );

    // Create JWT refresh token
    const refreshToken = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        // Add a type or scope to differentiate from access token if needed, e.g., type: 'refresh'
      }, 
      config.jwt.adminRefreshTokenSecret, 
      { 
        expiresIn: config.jwt.adminRefreshTokenExpiresIn
      }
    );

    // Store refresh token in user document
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    console.log('Login successful for:', email);

    // Set access token in response body (or a secure cookie if preferred for SPA)
    // For this example, access token in body, refresh token in cookie

    // Set refresh token in a secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    // Send response
    res.json({ 
      success: true, 
      accessToken,
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
    const adminJwtSecretForVerify = config.jwt.adminSecret;
    if (!adminJwtSecretForVerify) {
      console.error('CRITICAL: ADMIN_JWT_SECRET is not set. Cannot verify admin token.');
      return res.status(500).json({ success: false, message: 'Server configuration error for admin token verification.' });
    }
    const decoded = jwt.verify(token, adminJwtSecretForVerify);
    
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
      message: 'User details retrieved successfully.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
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

// @route   POST /api/auth/refresh-token
// @desc    Refresh admin access token
// @access  Private (requires valid refresh token cookie)
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found.' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.adminRefreshTokenSecret);

    // Find user by ID from decoded token and ensure password field is not selected by default
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token: User not found.' });
    }

    // Check if the refresh token is in the user's list of valid refresh tokens
    if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      // Optionally, if a refresh token is used that's not in the list, 
      // it might be a sign of a compromised token. 
      // You could clear all refresh tokens for this user as a security measure.
      // For now, just deny access.
      return res.status(403).json({ success: false, message: 'Invalid refresh token: Token not recognized.' });
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.adminSecret,
      {
        expiresIn: config.jwt.adminExpiresIn,
        issuer: config.jwt.issuer || 'lindas-nut-butter-store-store-store-store',
        audience: config.jwt.audience || 'lindas-nut-butter-store-store-store-store-web'
      }
    );

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Refresh token error:', err.message);
    // Handle specific JWT errors like TokenExpiredError, JsonWebTokenError
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: 'Refresh token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, message: 'Invalid refresh token. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout admin and invalidate refresh token
// @access  Private (requires valid refresh token cookie to identify session to invalidate)
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // Always clear the refresh token cookie as a first step
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  if (!refreshToken) {
    // If no refresh token was present, we've cleared any potential stray cookie.
    return res.status(200).json({ success: true, message: 'Admin logged out (no active session token found).' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.adminRefreshTokenSecret);
    } catch (err) {
      // If token is invalid or expired, cookie is already cleared. Log and respond.
      console.warn('Logout attempt with invalid/expired refresh token:', err.message);
      return res.status(200).json({ success: true, message: 'Admin logged out. Session token was invalid or expired.' });
    }

    const user = await User.findById(decoded.id);

    if (user && user.refreshTokens && user.refreshTokens.includes(refreshToken)) {
      // Remove the refresh token from the user's list
      user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
      await user.save();
      return res.status(200).json({ success: true, message: 'Admin logged out successfully.' });
    } else if (user) {
      console.log(`Logout: Refresh token not found in user ${user.email}'s active tokens or already removed.`);
      return res.status(200).json({ success: true, message: 'Admin logged out. Token was not active or already removed.' });
    } else {
      // User for the token not found, but cookie is cleared.
      console.log('Logout: User not found for the provided refresh token.');
      return res.status(200).json({ success: true, message: 'Admin logged out. User for token not found.' });
    }

  } catch (err) {
    // Catch any other errors during DB operation or unexpected issues
    console.error('Error during admin logout:', err.message, err.stack);
    // Cookie is already cleared. Send a server error response.
    return res.status(500).json({ success: false, message: 'Server error during admin logout.' });
  }
});

module.exports = router;
