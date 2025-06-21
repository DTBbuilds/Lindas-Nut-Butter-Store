// server/middleware/robustErrorHandler.js

/**
 * Custom Error Class for operational errors that are expected.
 * This helps distinguish between programmer errors and predictable issues.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as an operational error

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles requests to routes that do not exist.
 * Creates a 404 error and passes it to the global error handler.
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`The requested URL ${req.originalUrl} was not found on this server.`, 404);
  next(err);
};

/**
 * Global Error Handling Middleware.
 * This is the final destination for all errors. It ensures the server never crashes.
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error for debugging purposes
  console.error('--- GLOBAL ERROR HANDLER CAUGHT AN ERROR ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.error('Status:', err.statusCode, err.status);
  console.error('Message:', err.message);
  // Log the full stack for non-operational errors or in development
  if (process.env.NODE_ENV === 'development' || !err.isOperational) {
    console.error('Stack:', err.stack);
  }
  console.error('--- END OF ERROR ---');


  // In production, only send back details for operational errors.
  // For programming or other unknown errors, send a generic message.
  if (process.env.NODE_ENV === 'production') {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // For non-operational errors in production, don't leak error details
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // In development, send back all the details.
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
