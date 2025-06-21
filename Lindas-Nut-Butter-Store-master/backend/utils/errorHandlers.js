/**
 * Custom error classes for Linda's Nut Butter Store
 * Provides structured error handling for the application
 */

// Base application error class
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'LINDA_INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Cart specific error class
class CartError extends AppError {
  constructor(message, statusCode = 400, code = 'LINDA_CART_ERROR', details = null) {
    super(message, statusCode, code, details);
    this.name = 'CartError';
  }
}

// Helper function to create consistent error responses
const createErrorResponse = (message, statusCode = 500, code = 'LINDA_INTERNAL_ERROR', details = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      details
    },
    statusCode
  };
};

// Async error handler middleware
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => {
      console.error('Caught async error:', err);
      
      // If it's our custom error, use its properties
      if (err instanceof AppError) {
        return res.status(err.statusCode).json(createErrorResponse(
          err.message,
          err.statusCode,
          err.code,
          err.details
        ));
      }
      
      // Default error response for unexpected errors
      res.status(500).json(createErrorResponse(
        err.message || 'An unexpected error occurred',
        500,
        'LINDA_INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? err.stack : null
      ));
    });
  };
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER 💥', err);

  // Default error values
  err.statusCode = err.statusCode || 500;
  err.code = err.code || 'LINDA_INTERNAL_ERROR';
  
  // If it's our custom error, use its properties
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(createErrorResponse(
      err.message,
      err.statusCode,
      err.code,
      err.details
    ));
  }
  
  // Default error response for unexpected errors
  res.status(err.statusCode).json(createErrorResponse(
    err.message || 'An unexpected server error occurred.',
    err.statusCode,
    err.code,
    process.env.NODE_ENV === 'development' ? err.stack : null
  ));
};

module.exports = {
  AppError,
  CartError,
  createErrorResponse,
  catchAsync,
  globalErrorHandler
};
