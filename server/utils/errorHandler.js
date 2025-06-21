/**
 * Error Handler Utility
 * 
 * Provides standardized error handling functions for API controllers
 */

// Standard API error response
const sendErrorResponse = (res, status, message, error = null) => {
  const response = {
    success: false,
    message
  };

  // Add error details in development but not in production
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = typeof error === 'object' ? error.message : error;
    
    // Include stack trace in development for debugging
    if (error.stack) {
      response.stack = error.stack;
    }
  }

  return res.status(status).json(response);
};

// Custom error types
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.originalError = originalError;
  }
}

// Catch-all async handler to avoid try-catch blocks in controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`API Error: ${error.message}`, error);
    
    // Handle known error types with appropriate status codes
    if (error instanceof ValidationError || 
        error instanceof NotFoundError || 
        error instanceof AuthorizationError ||
        error instanceof DatabaseError) {
      return sendErrorResponse(res, error.statusCode, error.message, error);
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return sendErrorResponse(res, 400, 'Validation Error', error);
    }
    
    // Handle Mongoose cast errors (like invalid ObjectId)
    if (error.name === 'CastError') {
      return sendErrorResponse(res, 400, 'Invalid ID format', error);
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return sendErrorResponse(res, 400, 'Duplicate key error', error);
    }
    
    // Generic server error
    return sendErrorResponse(res, 500, 'Server error', error);
  });
};

// Validate MongoDB ObjectId
const validateObjectId = (id) => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid ID format');
  }
  return true;
};

// Handle aggregation safely
const safeAggregation = async (model, pipeline, errorMessage = 'Aggregation error') => {
  try {
    return await model.aggregate(pipeline);
  } catch (error) {
    console.error(`Aggregation Error: ${errorMessage}`, error);
    // Return empty array instead of throwing to prevent API failure
    return [];
  }
};

module.exports = {
  sendErrorResponse,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
  asyncHandler,
  validateObjectId,
  safeAggregation
};
