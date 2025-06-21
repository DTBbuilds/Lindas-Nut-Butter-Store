const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('../../server/models/Customer');

// Register new user
router.post('/register', async (req, res) => {
  console.log('[REGISTER] Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { name, email, password, phoneNumber } = req.body; // Added phoneNumber

    // Check if user already exists
    let customer = await Customer.findOne({ email });
    if (customer) {
      console.log('[REGISTER] User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    console.log('[REGISTER] Creating new user with data:', JSON.stringify({ name, email, password: '***', phoneNumber }, null, 2));
    customer = new Customer({
      name,
      email,
      password,
      phoneNumber // Added phoneNumber
    });

    await customer.save();
    console.log('[REGISTER] User saved successfully. User ID:', customer._id);

    // Create JWT token
    const token = jwt.sign(
      { userId: customer._id, role: customer.role }, // Added role to JWT payload
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role, // Added role to response
        phoneNumber: customer.phoneNumber // Added phoneNumber to response
      }
    });
  } catch (error) {
    console.error('[REGISTER] Error in /register route:', error.message);
    console.error('[REGISTER] Stacktrace:', error.stack);
    console.error('[REGISTER] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  console.log('[LOGIN] Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { email, password } = req.body;

    // Check if user exists
    const customer = await Customer.findOne({ email });
    console.log('[LOGIN] User found by email:', customer ? { id: customer._id, email: customer.email, name: customer.name, role: customer.role, passwordHash: customer.password ? 'Exists' : 'DOES NOT EXIST' } : 'No user found');
    if (!customer) {
      console.log('[LOGIN] Authentication failed: User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('[LOGIN] Comparing password from request (length:', password ? password.length : 'undefined', ') with stored hash for user:', customer.email);
    const isMatch = await customer.comparePassword(password);
    console.log('[LOGIN] Password match result:', isMatch);
    if (!isMatch) {
      console.log('[LOGIN] Authentication failed: Password mismatch for user:', customer.email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('[LOGIN] Login successful for user:', email);
    // Create JWT token
    const token = jwt.sign(
      { userId: customer._id, role: customer.role }, // Added role to JWT payload
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role, // Added role to response
        phoneNumber: customer.phoneNumber // Added phoneNumber to response
      }
    });
  } catch (error) {
    console.error('[LOGIN] Error in /login route:', error.message);
    console.error('[LOGIN] Stacktrace:', error.stack);
    console.error('[LOGIN] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const customer = await Customer.findById(decoded.userId).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Update current user profile
router.put('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const customer = await Customer.findById(decoded.userId);

    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fields to update
    const { name, phoneNumber } = req.body;
    if (name) customer.name = name;
    if (phoneNumber) customer.phoneNumber = phoneNumber;
    // Add other updatable fields as needed, e.g., address, preferences

    await customer.save();
    // Return updated user, excluding password
    const customerResponse = customer.toObject();
    delete customerResponse.password;

    res.json(customerResponse);
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token is not valid or has expired' });
    }
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

module.exports = router;
