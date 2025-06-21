/**
 * Centralized error handling utilities for Linda's Nut Butter Store
 * Provides consistent error response format and logging across the application
 */

// Custom error class with status code support
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || this.generateErrorCode(statusCode);
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // We can anticipate and handle these errors
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  // Generate standard error codes based on status
  generateErrorCode(statusCode) {
    const prefix = 'LINDA';
    
    switch (statusCode) {
      case 400: return `${prefix}_BAD_REQUEST`;
      case 401: return `${prefix}_UNAUTHORIZED`;
      case 403: return `${prefix}_FORBIDDEN`;
      case 404: return `${prefix}_NOT_FOUND`;
      case 409: return `${prefix}_CONFLICT`;
      case 422: return `${prefix}_VALIDATION_ERROR`;
      case 429: return `${prefix}_TOO_MANY_REQUESTS`;
      case 500: return `${prefix}_SERVER_ERROR`;
      case 503: return `${prefix}_SERVICE_UNAVAILABLE`;
      default: return `${prefix}_ERROR`;
    }
  }
}

// Detailed cart-specific errors
class CartError extends AppError {
  constructor(message, statusCode = 400, errorCode = null, cartContext = null) {
    super(message, statusCode, errorCode || 'LINDA_CART_ERROR');
    this.cartContext = cartContext;
  }
}

// Format specific error types consistently
const handleValidationError = (err) => {
  // Format mongoose validation errors
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));
  
  return new AppError('Validation failed. Please check the input data.', 422, 'LINDA_VALIDATION_ERROR', errors);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  return new AppError(
    `Duplicate value: "${value}" for field "${field}". Please use another value.`, 
    409, 
    'LINDA_DUPLICATE_VALUE'
  );
};

const handleCastError = (err) => {
  return new AppError(
    `Invalid ${err.path}: ${err.value}`, 
    400,
    'LINDA_INVALID_DATA'
  );
};

const handleJWTError = () => {
  return new AppError(
    'Invalid authentication token. Please log in again.',
    401,
    'LINDA_INVALID_TOKEN'
  );
};

const handleJWTExpiredError = () => {
  return new AppError(
    'Your authentication token has expired. Please log in again.',
    401,
    'LINDA_EXPIRED_TOKEN'
  );
};

// Consolidated error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  // Set default values
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Log error for debugging (different formats for dev vs prod)
  if (process.env.NODE_ENV === 'production') {
    console.error(`[ERROR] ${new Date().toISOString()} - ${error.message}`);
  } else {
    console.error('[ERROR DETAILS]:', { 
      message: error.message,
      path: `${req.method} ${req.originalUrl}`,
      statusCode: error.statusCode || 500,
      body: req.body,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
  
  // Transform mongoose & other library errors to our consistent format
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Standard error response format
  const statusCode = error.statusCode || 500;
  const response = {
    status: error.status || 'error',
    code: error.errorCode || 'LINDA_SERVER_ERROR',
    message: error.message || 'Something went wrong on our end.',
    timestamp: new Date().toISOString()
  };
  
  // Add error details in development
  if (process.env.NODE_ENV !== 'production') {
    response.details = error.details || null;
    response.stack = error.stack;
    
    // Include original error details for better debugging
    if (err.errors) {
      response.errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message,
        value: err.errors[key].value
      }));
    }
  }
  
  // Add cart context for cart-specific errors
  if (error.cartContext) {
    response.cartContext = error.cartContext;
  }
  
  res.status(statusCode).json(response);
};

// Catch async errors in route handlers
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code 
 * @param {string} errorCode - Application error code
 * @param {Object} details - Additional error details
 */
const createErrorResponse = (message, statusCode = 400, errorCode = null, details = null) => {
  return {
    status: 'error',
    code: errorCode || `LINDA_${statusCode}`,
    message,
    timestamp: new Date().toISOString(),
    details: details
  };
};

// Export all error utilities
module.exports = {
  AppError,
  CartError,
  globalErrorHandler,
  catchAsync,
  createErrorResponse
};
