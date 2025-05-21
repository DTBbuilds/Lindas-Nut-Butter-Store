const jwt = require('jsonwebtoken');
const { User } = require('./models');

const authMiddleware = async (req, res, next) => {
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
  const JWT_SECRET = process.env.JWT_SECRET || 'lindas-nut-butter-store-store-store-default-secret';
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production.');
  }

  try {
    // Verify token with consistent secret
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is blacklisted
    // We'll implement token blacklist in a later improvement
    
    // Get user from database - handle both id and userId fields for compatibility
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      console.error('Token does not contain user ID');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Please try again later or contact support.'
      });
    }

    // Attach user to request object
    req.user = user;
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
