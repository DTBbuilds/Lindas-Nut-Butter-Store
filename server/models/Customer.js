const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config'); // Added for JWT config
const fs = require('fs');
const path = require('path');

const CustomerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: [true, 'Please provide a customer ID'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  addresses: [{
    name: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshTokens: [String]
});

// Hash password before saving
CustomerSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
CustomerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
CustomerSchema.methods.generateToken = function (type = 'access') {
  const tokenLogStream = fs.createWriteStream(path.join(__dirname, '..', 'customer_token_generate.log'), { flags: 'a' });
  const logEntry = (message) => {
    tokenLogStream.write(`${new Date().toISOString()} - ${message}\n`);
  };

  logEntry(`[ENTRY] generateToken called for customer ID: ${this._id}, type: ${type}`);
  let secret;
  let expiresIn;
  const payload = { customerId: this._id };

  if (type === 'access') {
      secret = config.jwt.customerSecret;
      expiresIn = config.jwt.customerExpiresIn;
      logEntry(`[ACCESS_TOKEN_DETAILS] Attempting to use customerSecret. Loaded: ${!!secret}`)
      logEntry(`[ACCESS_TOKEN_DETAILS] Attempting to use customerExpiresIn: ${expiresIn}`);
      logEntry(`[ACCESS_TOKEN_DETAILS] Payload: ${JSON.stringify(payload)}`);
  } else if (type === 'refresh') {
      secret = config.jwt.customerRefreshTokenSecret;
      expiresIn = config.jwt.customerRefreshTokenExpiresIn;
      logEntry(`[REFRESH_TOKEN_DETAILS] Attempting to use customerRefreshTokenSecret. Loaded: ${!!secret}`);
      logEntry(`[REFRESH_TOKEN_DETAILS] Attempting to use customerRefreshTokenExpiresIn: ${expiresIn}`);
      logEntry(`[REFRESH_TOKEN_DETAILS] Payload: ${JSON.stringify(payload)}`);
  } else {
      logEntry(`[ERROR] Invalid token type specified for generation: ${type}`);
      tokenLogStream.end();
      throw new Error('Invalid token type specified for generation.');
  }

  if (!secret || !expiresIn) {
      logEntry(`[ERROR] JWT secret or expiresIn is not configured properly for token type '${type}'. Secret loaded: ${!!secret}, ExpiresIn loaded: ${!!expiresIn}`);
      tokenLogStream.end();
      throw new Error(`JWT secret or expiresIn is not configured properly for token type '${type}'.`);
  }
  // Log the actual secret value before signing for verification.
  // Be cautious with logging full secrets in production environments.
  logEntry(`[SIGNING_INFO] Secret to be used for signing (${type}): ${secret}`);
  try {
    const token = jwt.sign(payload, secret, { expiresIn });
    logEntry(`[SUCCESS] Token generated successfully: ${token}`);
    tokenLogStream.end(); // Close stream after logging
    return token;
  } catch (error) {
    logEntry(`[ERROR] Error during token generation: ${error.message}`);
    logEntry(`[ERROR_STACK] ${error.stack}`);
    tokenLogStream.end(); // Close stream after logging
    throw error; // Re-throw the error after logging
  }
};

// Generate password reset token
CustomerSchema.methods.generatePasswordResetToken = function() {
  // Create a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and save to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expiration to 1 hour from now
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour
  
  return resetToken;
};

// Verify password reset token
CustomerSchema.methods.verifyPasswordResetToken = function(token) {
  // Hash the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Check if token matches and is not expired
  return (
    this.passwordResetToken === hashedToken && 
    this.passwordResetExpires > Date.now()
  );
};

module.exports = mongoose.model('Customer', CustomerSchema);
