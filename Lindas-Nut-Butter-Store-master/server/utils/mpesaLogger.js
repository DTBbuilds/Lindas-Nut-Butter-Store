/**
 * Enhanced logging utility for M-Pesa transactions using Winston
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, json, colorize, errors } = winston.format;

// Custom format for console logging
const consoleFormat = printf(({ level, message, timestamp, stack, action, ...metadata }) => {
  let logMessage = `${timestamp} [${level}]`;
  if (action) logMessage += ` [${action}]`;
  logMessage += `: ${message}`;
  
  // Include metadata if any, excluding known top-level fields already handled
  const meta = { ...metadata };
  delete meta.level;
  delete meta.message;
  delete meta.timestamp;
  delete meta.action;
  delete meta.stack; // stack is handled separately

  if (Object.keys(meta).length) {
    logMessage += ` \n${JSON.stringify(meta, null, 2)}`;
  }
  if (stack) {
    logMessage += `\nStack: ${stack}`;
  }
  return logMessage;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info', can be overridden by env var
  format: combine(
    errors({ stack: true }), // Log the stack trace
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    json() // Default format for files if not overridden by transport
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'mpesa-error.log'),
      level: 'error',
      format: combine(timestamp(), json({ space: 2 })) // Pretty print JSON in error file
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'mpesa.log'),
      format: combine(timestamp(), json({ space: 2 })) // Pretty print JSON in general log file
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ]
});

// If not in production, add a console transport with pretty printing
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      consoleFormat
    ),
    level: 'debug', // Show debug logs in console during development
  }));
}

/**
 * Log M-Pesa transaction information
 * @param {string} action - The action being performed (e.g., 'STK Push', 'Callback')
 * @param {any} data - The data to log (can be an object or primitive)
 */
const logMpesaTransaction = (action, data) => {
  logger.info(data?.message || action, { action, details: data });
};

/**
 * Log M-Pesa error
 * @param {string} action - The action that failed
 * @param {Error | object} error - The error object or an object with error details
 * @param {any} requestData - Optional request data that caused the error
 */
const logMpesaError = (action, error, requestData = null) => {
  const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'M-Pesa Operation Error');
  const stack = error instanceof Error ? error.stack : undefined;
  const responseData = error instanceof Error ? error.response?.data : (error?.responseData || null);
  
  // If error is not an Error instance, but an object, merge its properties
  const additionalErrorDetails = !(error instanceof Error) && typeof error === 'object' ? error : {}; 

  logger.error(message, {
    action,
    stack,
    responseData,
    requestData,
    ...additionalErrorDetails // Spread additional details if error was an object
  });
};

/**
 * Clear log files (Note: Winston has log rotation which is generally preferred)
 */
const clearLogs = () => {
  try {
    fs.writeFileSync(path.join(logsDir, 'mpesa.log'), '');
    fs.writeFileSync(path.join(logsDir, 'mpesa-error.log'), '');
    fs.writeFileSync(path.join(logsDir, 'exceptions.log'), '');
    fs.writeFileSync(path.join(logsDir, 'rejections.log'), '');
    logger.info('M-Pesa log files cleared manually.', { action: 'ClearLogs' });
  } catch (err) {
    logger.error('Failed to clear log files.', { action: 'ClearLogs', error: err.message, stack: err.stack });
  }
};

module.exports = {
  logMpesaTransaction,
  logMpesaError,
  clearLogs,
  logger // Exporting logger instance if direct use is needed elsewhere
};
