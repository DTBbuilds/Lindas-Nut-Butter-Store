/**
 * Enhanced logging utility for M-Pesa transactions
 * This helps identify and troubleshoot Daraja API issues
 */
const fs = require('fs');
const path = require('path');
const util = require('util');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const mpesaLogFile = path.join(logsDir, 'mpesa.log');
const mpesaErrorLogFile = path.join(logsDir, 'mpesa-error.log');

/**
 * Write log entry to file
 * @param {string} filePath - Path to log file
 * @param {any} data - Data to log
 */
const writeToLog = (filePath, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}\n\n`;
  
  fs.appendFileSync(filePath, logEntry);
};

/**
 * Log M-Pesa transaction information
 * @param {string} action - The action being performed (e.g., 'STK Push', 'Callback')
 * @param {any} data - The data to log
 */
const logMpesaTransaction = (action, data) => {
  const logData = {
    action,
    timestamp: new Date().toISOString(),
    data
  };
  
  console.log(`[MPESA] ${action}:`, util.inspect(data, { depth: null, colors: true }));
  writeToLog(mpesaLogFile, logData);
};

/**
 * Log M-Pesa error
 * @param {string} action - The action that failed
 * @param {Error} error - The error object
 * @param {any} requestData - Optional request data that caused the error
 */
const logMpesaError = (action, error, requestData = null) => {
  const errorData = {
    action,
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    responseData: error.response?.data || null,
    requestData
  };
  
  console.error(`[MPESA ERROR] ${action}:`, error.message);
  if (error.response?.data) {
    console.error('Response data:', error.response.data);
  }
  
  writeToLog(mpesaErrorLogFile, errorData);
};

/**
 * Clear log files
 */
const clearLogs = () => {
  fs.writeFileSync(mpesaLogFile, '');
  fs.writeFileSync(mpesaErrorLogFile, '');
  console.log('M-Pesa log files cleared');
};

module.exports = {
  logMpesaTransaction,
  logMpesaError,
  clearLogs
};
