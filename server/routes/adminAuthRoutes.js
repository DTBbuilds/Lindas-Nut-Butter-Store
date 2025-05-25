const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// Use model helper to avoid circular dependency issues
const { getAdmin } = require('../utils/modelHelper');
const router = express.Router();

// For debug
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Import config for JWT secret
const config = require('../config');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret;

/**
 * @route POST /api/auth/admin/login
 * @desc Login admin user and get token
 * @access Public
 */
router.post('/admin/login', async (req, res) => {
  console.log('=== ADMIN LOGIN ATTEMPT DEBUG ===');
  console.log('Request headers:', req.headers);
  console.log('Request email:', req.body?.email);
  console.log('Request has password:', !!req.body?.password);
  
  try {
    // Validate request body exists
    if (!req.body) {
      console.error('No request body received');
      return res.status(400).json({ message: 'Invalid request format' });
    }
    
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find admin by email using model helper
    console.log('Searching for admin with email:', email);
    const Admin = getAdmin();
    
    // Verify Admin model is available
    if (!Admin) {
      console.error('Admin model not available. Critical error.');
      return res.status(500).json({ 
        message: 'Server configuration error', 
        details: 'Authentication service unavailable'
      });
    }
    
    try {
      // Attempt to find admin by email
      const admin = await Admin.findOne({ email });
      console.log('Admin found in database:', !!admin);
      
      if (!admin) {
        console.log('Admin not found:', email);
        
        // Create default admin if this is the expected default admin email
        if (email === 'dtbadmin@lindas.com') {
          console.log('Attempting to create default admin account on-the-fly');
          try {
            await Admin.createDefaultAdmin();
            // Try to find admin again after creation
            const newAdmin = await Admin.findOne({ email });
            if (newAdmin) {
              console.log('Default admin created successfully');
              // Continue with the newly created admin
              return handleAdminAuthentication(newAdmin, password, res);
            }
          } catch (createError) {
            console.error('Failed to create default admin:', createError);
          }
        }
        
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Continue with authentication process
      return handleAdminAuthentication(admin, password, res);
    } catch (findError) {
      console.error('Error finding admin:', findError);
      return res.status(500).json({ 
        message: 'Error during authentication', 
        details: findError.message 
      });
    }
// Create a separate function to handle admin authentication logic
async function handleAdminAuthentication(admin, password, res) {
  try {
    console.log('Admin details:', JSON.stringify({
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      active: admin.active,
      passwordLength: admin.password ? admin.password.length : 0
    }));

    // Check if admin is active
    if (!admin.active) {
      console.log('Admin account inactive:', admin.email);
      return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
    }

    // Check password directly using bcrypt
    console.log('Comparing password...');
    console.log('Input password length:', password.length);
    console.log('Stored password hash:', admin.password);
    
    // Handle potential null/undefined password hash
    if (!admin.password) {
      console.error('Admin password hash is missing or invalid');
      return res.status(500).json({ message: 'Account setup incomplete. Please contact support.' });
    }
    
    try {
      const isMatch = await bcrypt.compare(password, admin.password);
      console.log('Password match result:', isMatch);
      if (!isMatch) {
        console.log('Invalid password for admin:', admin.email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (bcryptError) {
      console.error('bcrypt error during password comparison:', bcryptError);
      return res.status(500).json({ message: 'Error validating credentials', error: bcryptError.message });
    }
    
    console.log('Admin login successful:', admin.email);

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
    return res.json({
      success: true,
      token: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        active: admin.active
      }
    });
  } catch (authError) {
    console.error('Error in admin authentication process:', authError);
    return res.status(500).json({ message: 'Authentication error', error: authError.message });
  }
}
  } catch (err) {
    console.error('CRITICAL - Admin login error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    // Detailed error response with safe information
    return res.status(500).json({ 
      message: 'Server error during login', 
      error: err.message,
      time: new Date().toISOString(),
      path: '/api/auth/admin/login'
    });
  }
});

/**
 * @route GET /api/auth/admin/me
 * @desc Get current admin user info
 * @access Private
 */
router.get('/admin/me', async (req, res) => {
  // Set a timeout for this request to ensure it doesn't hang
  const requestTimeout = setTimeout(() => {
    console.log('Admin verification request timed out after 10 seconds');
    if (!res.headersSent) {
      res.status(503).json({ message: 'Request timed out' });
    }
  }, 10000);

  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      clearTimeout(requestTimeout);
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Quick validation check before verifying
    if (token.split('.').length !== 3) {
      clearTimeout(requestTimeout);
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Fast path - if we can verify the token but don't need admin details, return minimal data
      if (req.query.minimal === 'true') {
        clearTimeout(requestTimeout);
        return res.json({
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          verified: true
        });
      }
      
      // Find admin by id using model helper with lean query for performance
      const Admin = getAdmin();
      const admin = await Admin.findById(decoded.id)
        .select('-password')
        .lean();
      
      if (!admin) {
        clearTimeout(requestTimeout);
        return res.status(404).json({ message: 'Admin not found' });
      }

      // Check if admin is active
      if (!admin.active) {
        clearTimeout(requestTimeout);
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Return admin data
      clearTimeout(requestTimeout);
      res.json(admin);
    } catch (tokenError) {
      clearTimeout(requestTimeout);
      console.error('Token verification error:', tokenError.name);
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      
      return res.status(401).json({ message: 'Token verification failed' });
    }
  } catch (err) {
    clearTimeout(requestTimeout);
    console.error('Admin verification error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
