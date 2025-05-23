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

// Middleware to verify customer token
const verifyCustomerToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.customerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    const customer = await Customer.findById(decoded.customerId).select('-password');
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    req.customer = customer;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
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
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
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
  
  const { name, email, password, phoneNumber } = req.body;
  
  try {
    // Check if customer already exists
    let customer = await Customer.findOne({ email });
    
    if (customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists'
      });
    }
    
    // Create new customer
    customer = new Customer({
      name,
      email,
      password,
      phoneNumber
    });
    
    await customer.save();
    
    // Return success without sending token (require login)
    res.status(201).json({
      success: true,
      message: 'Customer registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customers/login
// @desc    Login customer
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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
    // Find customer by email and include password for comparison
    const customer = await Customer.findOne({ email }).select('+password');
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Compare passwords
    const isMatch = await customer.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = customer.generateToken();
    
    // Remove password from response
    const customerData = {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber
    };
    
    res.status(200).json({
      success: true,
      token,
      name: customer.name,
      email: customer.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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

module.exports = router;
