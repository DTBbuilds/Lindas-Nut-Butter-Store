/**
 * Centralized error handling middleware
 * Provides consistent error responses across the API
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path for errors
const errorLogFile = path.join(logsDir, 'error.log');

/**
 * Log error to file
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 */
const logErrorToFile = (err, req) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    errorMessage: err.message,
    errorStack: err.stack,
    userId: req.user ? req.user._id : 'unknown',
    requestBody: req.method !== 'GET' ? JSON.stringify(req.body) : null
  };
  
  fs.appendFileSync(errorLogFile, JSON.stringify(logEntry) + '\n');
};

/**
 * Not Found Error handler
 * Handles 404 errors for routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

/**
 * Global error handler middleware
 * Logs errors and returns appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error details
  logErrorToFile(err, req);
  console.error(`Error: ${err.message}`);

  // Set appropriate status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Distinguish between development and production error responses
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    // Only include error stack in development mode
    ...(isDevelopment && { stack: err.stack }),
    // Include error code if available
    ...(err.code && { code: err.code })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
