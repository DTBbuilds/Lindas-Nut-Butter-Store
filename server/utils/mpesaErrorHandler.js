/**
 * Mpesa Error Handler
 * 
 * Provides functions for parsing, categorizing, and handling Safaricom Mpesa API errors
 * with detailed diagnostics and suggestions for fixing common issues.
 */
const { logMpesaError } = require('./mpesaLogger');

/**
 * Error codes from Safaricom Mpesa API
 * Maps error codes to human-readable messages and suggestions
 */
const MPESA_ERROR_CODES = {
  // Authentication Errors
  '401.002.01': {
    type: 'AUTH_FAILED',
    message: 'Authentication with Safaricom API failed',
    suggestion: 'Check your consumer key and consumer secret in the config file'
  },
  '401.002.03': {
    type: 'TOKEN_EXPIRED',
    message: 'OAuth token has expired',
    suggestion: 'Your token expired. The system will automatically get a new token.'
  },
  
  // Validation Errors
  '400.002.02': {
    type: 'VALIDATION_ERROR',
    message: 'Invalid request parameters',
    suggestion: 'Check the format of your request parameters (phone number, amount, etc.)'
  },
  '500.001.1001': {
    type: 'INTERNAL_ERROR',
    message: 'Internal server error at Safaricom',
    suggestion: 'This is an issue on Safaricom\'s end. Try again later.'
  },
  
  // Common STK Push specific errors
  '403.002.01': {
    type: 'ACCESS_DENIED',
    message: 'Access to initiating STK push denied',
    suggestion: 'Ensure your API credentials have STK push permissions'
  },
  
  // Transaction-related errors
  '400.004.03': {
    type: 'AMOUNT_LIMIT_ERROR',
    message: 'Transaction amount limit exceeded',
    suggestion: 'The transaction amount is outside allowed limits (min 1, max 150,000)'
  },
  '400.003.04': {
    type: 'INVALID_NUMBER',
    message: 'Invalid phone number format',
    suggestion: 'Phone number must be a valid Kenyan mobile number in format 254XXXXXXXXX'
  },
  '1037': {
    type: 'TIMEOUT',
    message: 'Transaction timeout',
    suggestion: 'Customer did not respond to the STK push prompt in time'
  },
  '1032': {
    type: 'REJECTED',
    message: 'Transaction rejected by user',
    suggestion: 'Customer actively rejected the payment request'
  }
};

/**
 * Check for specific error messages in the error text to help identify issues
 * @param {string} errorMessage - The error message text
 * @returns {Object|null} Error details if found, null otherwise
 */
const detectErrorFromMessage = (errorMessage) => {
  const errorText = errorMessage.toLowerCase();
  
  if (errorText.includes('invalid callbackurl')) {
    return {
      type: 'INVALID_CALLBACK_URL',
      message: 'The callback URL is not accessible or invalid',
      suggestion: 'Make sure ngrok is running and your callback URLs are properly configured'
    };
  }
  
  if (errorText.includes('invalid timestamp')) {
    return {
      type: 'INVALID_TIMESTAMP',
      message: 'Invalid timestamp format in request',
      suggestion: 'Check that your server time is correctly synchronized'
    };
  }
  
  if (errorText.includes('invalid phonenumber')) {
    return {
      type: 'INVALID_PHONE',
      message: 'The phone number format is incorrect',
      suggestion: 'Must be a valid Kenyan phone number in format 254XXXXXXXXX'
    };
  }
  
  if (errorText.includes('invalid amount')) {
    return {
      type: 'INVALID_AMOUNT',
      message: 'The payment amount is invalid',
      suggestion: 'Amount must be a positive number with valid format'
    };
  }
  
  // Network-related messages
  if (errorText.includes('network') || errorText.includes('econnreset') || 
      errorText.includes('timeout') || errorText.includes('etimedout')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection error when contacting Safaricom API',
      suggestion: 'Check your internet connection and try again'
    };
  }
  
  return null;
};

/**
 * Parse and handle Mpesa API errors for better diagnostics
 * @param {Error} error - The error object received from axios
 * @returns {Error} - Enhanced error with additional properties
 */
const handleMpesaError = (error) => {
  // Create a new error to return with enhanced properties
  const enhancedError = new Error(error.message);
  enhancedError.stack = error.stack;
  enhancedError.originalError = error;
  
  // Check if this is an API response error (from Safaricom)
  if (error.response?.data) {
    const responseData = error.response.data;
    
    // Add the response data to our error object
    enhancedError.responseData = responseData;
    enhancedError.statusCode = error.response.status;
    
    // Parse and identify Mpesa API error codes
    if (responseData.errorCode) {
      const errorInfo = MPESA_ERROR_CODES[responseData.errorCode] || {
        type: 'UNKNOWN_API_ERROR',
        message: `Unknown API error code: ${responseData.errorCode}`,
        suggestion: 'Check Safaricom documentation for this error code'
      };
      
      enhancedError.errorType = errorInfo.type;
      enhancedError.errorCode = responseData.errorCode;
      enhancedError.errorMessage = responseData.errorMessage;
      enhancedError.humanReadableMessage = errorInfo.message;
      enhancedError.suggestion = errorInfo.suggestion;
    } 
    // Try to detect error from error message text
    else if (responseData.errorMessage) {
      const errorInfo = detectErrorFromMessage(responseData.errorMessage);
      if (errorInfo) {
        enhancedError.errorType = errorInfo.type;
        enhancedError.humanReadableMessage = errorInfo.message;
        enhancedError.suggestion = errorInfo.suggestion;
      }
    }
  } 
  // Handle network errors
  else if (error.request) {
    const errorInfo = detectErrorFromMessage(error.message);
    if (errorInfo) {
      enhancedError.errorType = errorInfo.type;
      enhancedError.humanReadableMessage = errorInfo.message;
      enhancedError.suggestion = errorInfo.suggestion;
    } else {
      enhancedError.errorType = 'NETWORK_ERROR';
      enhancedError.humanReadableMessage = 'Could not connect to the Safaricom API';
      enhancedError.suggestion = 'Check your internet connection and try again';
    }
  }
  
  // Log the enhanced error
  logMpesaError('Enhanced Error', enhancedError, {
    type: enhancedError.errorType,
    code: enhancedError.errorCode,
    message: enhancedError.humanReadableMessage,
    suggestion: enhancedError.suggestion
  });
  
  return enhancedError;
};

/**
 * Get a user-friendly error message based on the error details
 * @param {Error} error - The error object (ideally an enhanced error from handleMpesaError)
 * @returns {string} A user-friendly error message
 */
const getUserFriendlyMessage = (error) => {
  // If this is an enhanced error with user-friendly information
  if (error.humanReadableMessage && error.suggestion) {
    return `${error.humanReadableMessage}. ${error.suggestion}`;
  }
  
  // Handle specific known error types
  if (error.errorType === 'AUTH_FAILED') {
    return 'We couldn\'t authenticate with M-Pesa. Please try again later or contact support.';
  }
  
  if (error.errorType === 'INVALID_PHONE') {
    return 'Please provide a valid Kenyan phone number (e.g., 07XXXXXXXX or 254XXXXXXXXX).';
  }
  
  if (error.errorType === 'AMOUNT_LIMIT_ERROR') {
    return 'The payment amount is outside the allowed limits. Please enter an amount between 1 and 150,000 KES.';
  }
  
  if (error.errorType === 'NETWORK_ERROR') {
    return 'We couldn\'t connect to M-Pesa. Please check your internet connection and try again.';
  }
  
  // For errors related to callback URLs (often during development/testing)
  if (error.errorType === 'INVALID_CALLBACK_URL') {
    return 'The payment service is not properly configured. Please contact the administrator.';
  }
  
  // Fallback for unknown errors
  return 'An error occurred while processing your payment. Please try again later or use a different payment method.';
};

module.exports = {
  handleMpesaError,
  getUserFriendlyMessage,
  MPESA_ERROR_CODES
};
