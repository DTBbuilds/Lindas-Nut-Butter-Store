const jwt = require('jsonwebtoken');
const Customer = require('./models/Customer');
const config = require('./config');

const authMiddleware = async (req, res, next) => {
  console.log('--- [authMiddleware] Processing Request ---');
  console.log('[authMiddleware] Request Path:', req.path);
  console.log('[authMiddleware] Authorization Header:', req.headers.authorization);
  // Get token from header or cookie
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // Use a consistent JWT secret with fallback
  const JWT_SECRET = config.jwt.customerSecret;
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not defined in the configuration.');
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  try {
    console.log('[authMiddleware] Token received for verification:', token);
    // Verify token with consistent secret
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('[authMiddleware] Token decoded successfully:', decoded);
    
    // Check if token is blacklisted
    // We'll implement token blacklist in a later improvement
    
    // Get user from database - use id from the token payload
    const userId = decoded.id;
    if (!userId) {
      console.error('Token does not contain user ID');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }
    
    const customer = await Customer.findById(userId).select('-password');
    
    if (!customer) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if account is locked
    if (customer.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Please try again later or contact support.'
      });
    }

    // Attach user to request object
    req.user = customer;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please log in again.' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

const adminMiddleware = async (req, res, next) => {
  // Ensure user is authenticated first
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  next();
};

module.exports = { 
  authMiddleware, 
  adminMiddleware 
};
