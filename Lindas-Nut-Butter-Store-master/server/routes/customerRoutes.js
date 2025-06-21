const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authMiddleware = require('../authMiddleware');
const emailService = require('../utils/emailService');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const { logToFile } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const ms = require('ms');

const customerTokenVerifyLogPath = path.join(__dirname, 'customer_token_verify.log');

// Helper function to log to our dedicated file
const logToCustomerVerifyFile = (message) => {
  try {
    fs.appendFileSync(customerTokenVerifyLogPath, `${new Date().toISOString()} - ${message}\n`);
  } catch (err) {
    // Fallback to console if file logging fails, though this might also be suppressed
    console.error('CRITICAL: Failed to write to customer_token_verify.log:', err);
    console.error('Original log message:', message);
  }
};

// Middleware to verify customer token
const verifyCustomerToken = async (req, res, next) => {
  logToCustomerVerifyFile('[ENTRY] verifyCustomerToken middleware entered.');
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logToCustomerVerifyFile('[FAIL] No token provided.');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const customerJwtSecret = config.jwt.customerSecret;

    logToCustomerVerifyFile(`[ATTEMPT] Token: ${token}`);
    logToCustomerVerifyFile(`[ATTEMPT] Secret: ${customerJwtSecret}`);

    if (!customerJwtSecret) {
      logToCustomerVerifyFile('[FAIL] CRITICAL: JWT_SECRET is not set for verification.');
      return res.status(500).json({ success: false, message: 'Server configuration error for customer token verification.' });
    }
    const decoded = jwt.verify(token, customerJwtSecret);
    logToCustomerVerifyFile(`[SUCCESS] Token decoded: ${JSON.stringify(decoded)}`);

    // Invalidate token if it was issued before the server last started
    if (decoded.iat * 1000 < config.server.serverStartTime) {
      logToCustomerVerifyFile(`[FAIL] Stale token rejected. Issued at: ${new Date(decoded.iat * 1000).toISOString()}, Server started at: ${new Date(config.server.serverStartTime).toISOString()}`);
      return res.status(401).json({
        success: false,
        message: 'Session expired due to server restart. Please log in again.'
      });
    }

    logToCustomerVerifyFile(`[ATTEMPT] Decoded customer ID: ${decoded.id}`);
    
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    const customer = await Customer.findById(decoded.id).select('-password');
    logToCustomerVerifyFile(`[ATTEMPT] Customer lookup for ID: ${decoded.id}`);
    if (!customer) {
      logToCustomerVerifyFile(`[FAIL] Customer not found for decoded ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    req.customer = customer;
    logToCustomerVerifyFile(`[SUCCESS] Customer ${customer._id} (Email: ${customer.email}) attached to request.`);
    next();
  } catch (error) {
    logToCustomerVerifyFile(`[ERROR] Verification error: ${error.name} - ${error.message}`);
    if (error.stack) {
      logToCustomerVerifyFile(`[ERROR_STACK] ${error.stack}`);
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @route   POST /api/customers/register
// @desc    Register a new customer
// @access  Public
router.post('/register', [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, phoneNumber } = req.body;

    try {
        let customer = await Customer.findOne({ email });
        if (customer) {
            return res.status(400).json({ success: false, message: 'Customer already exists' });
        }

        customer = new Customer({
            customerId: uuidv4(),
            name,
            email,
            password,
            phoneNumber
        });

        // Create JWT access token
        const accessToken = jwt.sign(
            { id: customer._id },
            config.jwt.customerSecret,
            { expiresIn: config.jwt.customerExpiresIn || '1d' }
        );

        // Create JWT refresh token
        const refreshToken = jwt.sign(
            { id: customer._id },
            config.jwt.refreshTokenSecret,
            { expiresIn: config.jwt.refreshTokenExpiresIn }
        );
        
        // Store refresh token in customer document before saving
        customer.refreshTokens = [refreshToken];
        
        // Save the new customer with the refresh token
        await customer.save();
        
        // Set refresh token in a secure HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ms(config.jwt.refreshTokenExpiresIn || '30d')
        });

        res.status(201).json({
            success: true,
            accessToken,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phoneNumber: customer.phoneNumber
            }
        });

    } catch (error) {
        console.error('Error during customer registration:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/customers/login
// @desc    Login a customer and return token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { email, password } = req.body;
  
  try {
    // Find customer by email and explicitly include password
    const customer = await Customer.findOne({ email }).select('+password');
    
    if (!customer) {
      console.log(`Login attempt: Customer with email ${email} not found`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log(`Customer found: ${customer.name}, checking password...`);
    
    // Check password using the method from the schema
    const isMatch = await customer.comparePassword(password);
    
    if (!isMatch) {
      console.log(`Login attempt: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log(`Login successful for ${email}`);

    const loginLogStream = fs.createWriteStream(path.join(__dirname, '..', 'customer_login_route.log'), { flags: 'a' });
    const logLoginRoute = (message) => {
        loginLogStream.write(`${new Date().toISOString()} - ${message}\n`);
    };
    logLoginRoute(`[LOGIN_ROUTE] Attempting token generation for customer: ${customer._id}`);
    
    // Create JWT access token using customer-specific configurations
    const customerAccessTokenSecret = config.jwt.customerSecret;
    const customerAccessTokenExpiresIn = config.jwt.customerExpiresIn;

    logLoginRoute(`[LOGIN_ROUTE_ACCESS_TOKEN] Secret path: config.jwt.customerSecret, Loaded: ${!!customerAccessTokenSecret}, Value: ${customerAccessTokenSecret}`);
    logLoginRoute(`[LOGIN_ROUTE_ACCESS_TOKEN] ExpiresIn path: config.jwt.customerExpiresIn, Loaded: ${!!customerAccessTokenExpiresIn}, Value: ${customerAccessTokenExpiresIn}`);
    if (!customerAccessTokenSecret) {
      console.error('CRITICAL: JWT_SECRET is not set in environment variables. Customer authentication will fail or be insecure.');
      return res.status(500).json({ success: false, message: 'Server configuration error for customer authentication.' });
    }
    // Create JWT access token
    const accessToken = jwt.sign(
      { id: customer._id },
      customerAccessTokenSecret, // Use customer-specific secret
      { expiresIn: customerAccessTokenExpiresIn || '1d' } // Use customer-specific expiresIn, fallback to '1d'
    );
    logLoginRoute(`[LOGIN_ROUTE_ACCESS_TOKEN] Generated access token: ${accessToken}`);

    // Create JWT refresh token
    const refreshToken = jwt.sign(
      { id: customer._id }, // Payload for refresh token
      config.jwt.refreshTokenSecret,
      { expiresIn: config.jwt.refreshTokenExpiresIn }
    );
    logLoginRoute(`[LOGIN_ROUTE_REFRESH_TOKEN] Secret path: config.jwt.refreshTokenSecret, Loaded: ${!!config.jwt.refreshTokenSecret}, Value: ${config.jwt.refreshTokenSecret}`);
    logLoginRoute(`[LOGIN_ROUTE_REFRESH_TOKEN] Generated refresh token: ${refreshToken}`);

    // Store refresh token in customer document
    customer.refreshTokens = customer.refreshTokens || [];
    customer.refreshTokens.push(refreshToken);
    await customer.save();
    
    // Set refresh token in a secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ms(config.jwt.refreshTokenExpiresIn || '30d') // Use ms to parse time string, fallback to '30d'
    });

    // Return success with access token and customer info
    if (loginLogStream) loginLogStream.end();
    res.json({
      success: true,
      accessToken, // Use accessToken here
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (loginLogStream) loginLogStream.end();
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});



// @route   GET /api/customers/profile
// @desc    Get customer profile
// @access  Private
router.get('/profile', verifyCustomerToken, async (req, res) => {
  try {
    // Return the customer profile data
    res.json({
      success: true,
      customer: req.customer
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when fetching profile'
    });
  }
});

// @route   GET /api/customers/me
// @desc    Get current customer profile
// @access  Private
router.get('/me', verifyCustomerToken, async (req, res) => {
  try {
    // Customer is already available in req.customer from middleware
    res.status(200).json(req.customer);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/customers/profile
// @desc    Update customer profile
// @access  Private
router.put('/profile', verifyCustomerToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phoneNumber')
    .optional()
    .custom(value => {
      if (!value) return true;
      return /^(?:\+?254|0)[17]\d{8}$/.test(value);
    })
    .withMessage('Please provide a valid phone number')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { name, phoneNumber } = req.body;
  
  try {
    // Build update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    
    // Update customer
    const customer = await Customer.findByIdAndUpdate(
      req.customer._id,
      { $set: updateFields },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/customers/password
// @desc    Change customer password
// @access  Private
router.put('/password', verifyCustomerToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Get customer with password
    const customer = await Customer.findById(req.customer._id).select('+password');
    
    // Check current password
    const isMatch = await customer.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    customer.password = newPassword;
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customers/address
// @desc    Add a new address
// @access  Private
router.post('/address', verifyCustomerToken, [
  body('name').notEmpty().withMessage('Name is required'),
  body('street').notEmpty().withMessage('Street is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('postalCode').notEmpty().withMessage('Postal code is required'),
  body('country').notEmpty().withMessage('Country is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { name, street, city, state, postalCode, country, isDefault } = req.body;
  
  try {
    const customer = await Customer.findById(req.customer._id);
    
    // If this is the default address, unset any existing default
    if (isDefault) {
      customer.addresses.forEach(address => {
        address.isDefault = false;
      });
    }
    
    // Add new address
    customer.addresses.push({
      name,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: isDefault || customer.addresses.length === 0 // Make default if it's the first address
    });
    
    await customer.save();
    
    res.status(201).json({
      success: true,
      addresses: customer.addresses
    });
  } catch (error) {
    console.error('Address add error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customers/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  const { email } = req.body;
  
  try {
    // Find customer by email
    const customer = await Customer.findOne({ email });
    
    // Don't reveal if customer exists or not for security
    if (!customer) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link shortly'
      });
    }
    
    // Generate reset token
    const resetToken = customer.generatePasswordResetToken();
    await customer.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host') || config.clientUrl || 'localhost:3000'}/reset-password/${resetToken}`;
    
    // Send email
    await emailService.sendPasswordResetEmail(customer.email, resetToken, resetUrl);
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link shortly'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    
    // If there's an error, reset the token fields
    if (error.customer) {
      error.customer.passwordResetToken = undefined;
      error.customer.passwordResetExpires = undefined;
      await error.customer.save({ validateBeforeSave: false });
    }
    
    res.status(500).json({
      success: false,
      message: 'Could not send password reset email. Please try again later.'
    });
  }
});

// @route   POST /api/customers/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Find customer with valid reset token
    const customer = await Customer.findOne({
      passwordResetToken: crypto
        .createHash('sha256')
        .update(token)
        .digest('hex'),
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');
    
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    // Update password and clear reset token fields
    customer.password = password;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await customer.save();
    
    // Generate new login token
    const loginToken = customer.generateToken();
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      token: loginToken
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not reset password. Please try again later.'
    });
  }
});

// @route   POST /api/customers/refresh-token
// @desc    Refresh customer access token
// @access  Private (requires valid refresh token cookie)
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found.' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshTokenSecret);

    // Find customer and check if refresh token is valid
    const customer = await Customer.findOne({ _id: decoded.id, refreshTokens: refreshToken });
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token: Customer not found.' });
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: customer._id },
      config.jwt.customerSecret, // Use the customer-specific secret
      { expiresIn: config.jwt.customerExpiresIn } // Use the customer-specific expiration
    );

    res.json({
      success: true,
      accessToken,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber
      }
    });

  } catch (err) {
    console.error('Customer refresh token error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ success: false, message: 'Refresh token expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ success: false, message: 'Invalid refresh token. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during token refresh.' });
  }
});

// @route   POST /api/customers/logout
// @desc    Logout customer and invalidate refresh token
// @access  Private (requires valid refresh token cookie to identify session to invalidate)
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.status(200).json({ success: true, message: 'Customer logged out (no active session token found).' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshTokenSecret);
    } catch (err) {
      console.warn('Logout attempt with invalid/expired customer refresh token:', err.message);
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(200).json({ success: true, message: 'Customer logged out. Session token was invalid or expired.' });
    }

    const customer = await Customer.findById(decoded.customerId);

    if (customer && customer.refreshTokens && customer.refreshTokens.includes(refreshToken)) {
      customer.refreshTokens = customer.refreshTokens.filter(rt => rt !== refreshToken);
      await customer.save();
    } else if (customer) {
      console.log(`Logout: Refresh token not found in customer ${customer.email}'s active tokens.`);
    } else {
      console.log('Logout: Customer not found for the provided refresh token.');
    }

  } catch (err) {
    console.error('Error during customer logout:', err.message);
  } finally {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({ success: true, message: 'Customer logged out successfully.' });
  }
});



module.exports = router;
