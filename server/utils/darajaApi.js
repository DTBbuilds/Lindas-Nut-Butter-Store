/**
 * Complete Safaricom Daraja API implementation for M-Pesa integration
 * This provides all necessary functions for working with the M-Pesa API
 */
const axios = require('axios');
const https = require('https');
const config = require('../config');
const { logMpesaTransaction, logMpesaError } = require('./mpesaLogger');
const { handleMpesaError } = require('./mpesaErrorHandler');

// Create an axios instance with extended timeout and SSL configuration
const mpesaAxios = axios.create({
  timeout: 30000, // 30 seconds
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Allows self-signed certificates in development
    keepAlive: true
  }),
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get OAuth token from Safaricom
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  try {
    // Prepare the authentication credentials
    const consumerKey = config.mpesa.consumerKey;
    const consumerSecret = config.mpesa.consumerSecret;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // Log the request details for debugging
    logMpesaTransaction('Requesting OAuth Token', {
      url: `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      environment: config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION',
      consumerKey: consumerKey.substring(0, 5) + '...',
      paybillNumber: config.mpesa.paybillNumber
    });
    
    // Make the request with proper authentication
    const response = await mpesaAxios.get(
      `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    logMpesaTransaction('OAuth Token Response', response.data);
    console.log('Access token response:', response.data);
    // Expecting response format: { "access_token": "xTKygG823eFg9dzsGnbaYYWTLcV9", "expires_in": "3599" }
    return response.data.access_token;
  } catch (error) {
    logMpesaError('OAuth Token Request', error, {
      url: `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`
    });
    console.error('OAuth token error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Generate password for STK push
 * @param {string} businessShortCode - The business short code to use (paybill or till number)
 * @returns {Object} Password and timestamp
 */
const generateStkPassword = (businessShortCode) => {
  // Default to paybill if businessShortCode is not provided
  const shortCode = businessShortCode || config.mpesa.paybillNumber;
  
  // Format date as YYYYMMDDHHmmss (14 characters) as required by Safaricom
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Combine to create the timestamp in the format YYYYMMDDHHmmss
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  const password = Buffer.from(
    `${shortCode}${config.mpesa.passkey}${timestamp}`
  ).toString('base64');
  
  logMpesaTransaction('Generated STK Password', {
    timestamp,
    businessShortCode: shortCode,
    passkey: '********' // Masked for security
  });
  
  return { password, timestamp };
};

/**
 * Format phone number for M-Pesa
 * Ensures the phone number is in the format required by Safaricom API (254XXXXXXXXX)
 * @param {string} phoneNumber - Phone number to format (can be in various formats)
 * @returns {string} Formatted phone number in 254XXXXXXXXX format
 * @throws {Error} If the phone number is invalid
 */
const formatPhoneNumber = (phoneNumber) => {
  // Handle null or undefined input
  if (!phoneNumber) {
    throw new Error('Phone number is required for M-Pesa payment');
  }
  
  // Convert to string if it's not already
  let formattedPhone = String(phoneNumber).trim();
  
  // Remove any spaces, dashes, parentheses, or other special characters
  formattedPhone = formattedPhone.replace(/\s+|-|\(|\)|\+/g, '');
  
  // Handle different Kenyan phone number formats
  if (formattedPhone.startsWith('0')) {
    // Convert format 07XXXXXXXX to 2547XXXXXXXX
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('254')) {
    // Already in correct format, just ensure there are no extra characters
    formattedPhone = '254' + formattedPhone.substring(3);
  } else if (formattedPhone.match(/^7\d{8}$/)) {
    // Format 7XXXXXXXX to 2547XXXXXXXX
    formattedPhone = '254' + formattedPhone;
  } else if (formattedPhone.match(/^1\d{8}$/)) {
    // Format 1XXXXXXXX to 2541XXXXXXXX
    formattedPhone = '254' + formattedPhone;
  }
  
  // Validate the final format (254 followed by 9 digits)
  if (!/^254\d{9}$/.test(formattedPhone)) {
    console.error('Invalid phone format detected:', { 
      original: phoneNumber, 
      formatted: formattedPhone,
      length: formattedPhone.length
    });
    throw new Error(`Invalid phone number format: ${phoneNumber}. Expected format: 254XXXXXXXXX`);
  }
  
  console.log(`Phone number formatted: ${phoneNumber} → ${formattedPhone}`);
  return formattedPhone;
};

/**
 * Initiate STK Push request
 * @param {string} phoneNumber - Customer phone number
 * @param {number} amount - Amount to charge
 * @param {string} accountReference - Account reference (e.g. order ID)
 * @param {string} transactionDesc - Transaction description
 * @param {string} callbackUrl - Callback URL for the transaction result
 * @param {string} paymentType - Type of payment ('paybill' or 'till')
 * @param {number} retryCount - Number of retries
 * @returns {Promise<Object>} STK Push response
 */
const initiateSTK = async (
  phoneNumber,
  amount,
  accountReference,
  transactionDesc = 'Payment',
  callbackUrl = config.mpesa.callbackUrl,
  paymentType = 'paybill',
  retryCount = 0
) => {
  // Determine transaction type and business code based on payment type - moved outside try block
  const transactionType = paymentType === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';
  const businessShortCode = paymentType === 'till' ? config.mpesa.tillNumber : config.mpesa.paybillNumber;
  
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Generate password and timestamp with the correct businessShortCode
    const { password, timestamp } = generateStkPassword(businessShortCode);
    
    // Prepare STK request payload
    const stkPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: Math.round(amount), // Ensure amount is an integer
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: paymentType === 'till' ? 'Linda\'s Nut Butter' : accountReference,
      TransactionDesc: transactionDesc
    };
    
    // Log the request details with additional context
    logMpesaTransaction('STK Push Request', {
      ...stkPayload,
      Password: '********', // Mask password in logs
      paymentType: paymentType,
      paybillNumber: config.mpesa.paybillNumber,
      tillNumber: config.mpesa.tillNumber,
      accountNumber: config.mpesa.accountNumber,
      environment: config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION',
      retryAttempt: retryCount
    });
    
    // Make the STK Push request
    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // Log successful response
    logMpesaTransaction('STK Push Response', {
      ...response.data,
      paymentType: paymentType,
      businessShortCode: businessShortCode,
      paybillNumber: config.mpesa.paybillNumber,
      tillNumber: config.mpesa.tillNumber,
      accountNumber: config.mpesa.accountNumber,
      timestamp: timestamp
    });
    
    return response.data;
  } catch (error) {
    // Enhanced error logging with more detailed information
    console.error(`M-Pesa STK Push failed: ${error.message}`);
    
    // Log error with additional context
    logMpesaError('STK Push Request', error, {
      phoneNumber,
      amount,
      accountReference,
      transactionDesc,
      callbackUrl,
      paymentType,
      businessShortCode,
      paybill: config.mpesa.paybillNumber,
      till: config.mpesa.tillNumber,
      accountNumber: config.mpesa.accountNumber,
      retryAttempt: retryCount
    });
    
    // Implement retry logic for specific error cases
    const MAX_RETRIES = 2;
    
    // Check if we should retry based on error type or message
    if (retryCount < MAX_RETRIES) {
      // Determine if this error is retriable
      const isRetriable = error.response?.status === 401 || // Unauthorized (token issue)
          error.message.includes('timeout') || // Timeout
          error.message.includes('network') || // Network error
          error.message.includes('ETIMEDOUT') || // Connection timeout
          error.code === 'ECONNRESET' || // Connection reset
          (error.response?.data?.errorCode === '500.001.1001'); // Safaricom internal error
      
      if (isRetriable) {
        console.log(`Retrying STK Push (Attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry with incremented retry count
        return initiateSTK(
          phoneNumber,
          amount,
          accountReference,
          transactionDesc,
          callbackUrl,
          paymentType,
          retryCount + 1
        );
      }
    }
    
    // Process the error through our error handler to add detailed diagnostics
    const enhancedError = handleMpesaError(error);
    
    // Add additional context specific to this STK push attempt
    // Make sure we're not trying to use formattedPhone if it wasn't initialized
    // (in case the error happened before phone formatting)
    enhancedError.context = {
      phoneNumber: phoneNumber, // Use the original phoneNumber to avoid the undefined variable
      amount,
      accountReference,
      callbackUrl,
      paymentType,
      businessShortCode,
      retryCount
    };
    
    throw enhancedError;
  }
};

/**
 * Query the status of an STK Push transaction
 * @param {string} checkoutRequestId - The CheckoutRequestID from the STK Push response
 * @returns {Promise<Object>} Transaction status
 */
const queryStkStatus = async (checkoutRequestId) => {
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Generate password and timestamp
    const { password, timestamp } = generateStkPassword();
    
    // Prepare query request payload
    const queryPayload = {
      BusinessShortCode: config.mpesa.paybillNumber,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };
    
    logMpesaTransaction('STK Query Request', {
      ...queryPayload,
      Password: '********' // Mask password in logs
    });
    
    // Make the query request
    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpushquery/v1/query`,
      queryPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    logMpesaTransaction('STK Query Response', response.data);
    return response.data;
  } catch (error) {
    logMpesaError('STK Query Request', error, { checkoutRequestId });
    throw error;
  }
};

/**
 * Register C2B URLs for validation and confirmation
 * @param {string} validationUrl - URL for validation callback
 * @param {string} confirmationUrl - URL for confirmation callback
 * @returns {Promise<Object>} Registration response
 */
const registerC2BUrls = async (
  validationUrl = config.mpesa.validationUrl,
  confirmationUrl = config.mpesa.confirmationUrl
) => {
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Prepare URL registration payload
    const urlPayload = {
      ShortCode: config.mpesa.paybillNumber,
      ResponseType: 'Completed', // Completed or Cancelled
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl
    };
    
    logMpesaTransaction('C2B URL Registration Request', urlPayload);
    
    // Make the registration request
    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/c2b/v1/registerurl`,
      urlPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    logMpesaTransaction('C2B URL Registration Response', response.data);
    return response.data;
  } catch (error) {
    logMpesaError('C2B URL Registration Request', error, {
      validationUrl,
      confirmationUrl
    });
    throw error;
  }
};

/**
 * Test the C2B functionality
 * @param {string} phoneNumber - Phone number to simulate payment from
 * @param {number} amount - Amount to pay
 * @param {string} billRefNumber - Reference number for the bill
 * @returns {Promise<Object>} Simulation response
 */
const simulateC2B = async (
  phoneNumber,
  amount,
  billRefNumber = 'TEST123'
) => {
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Prepare C2B simulation payload
    const simulationPayload = {
      ShortCode: config.mpesa.paybillNumber,
      CommandID: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      Msisdn: formattedPhone,
      BillRefNumber: billRefNumber
    };
    
    logMpesaTransaction('C2B Simulation Request', simulationPayload);
    
    // Make the simulation request
    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/c2b/v1/simulate`,
      simulationPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    logMpesaTransaction('C2B Simulation Response', response.data);
    return response.data;
  } catch (error) {
    logMpesaError('C2B Simulation Request', error, {
      phoneNumber,
      amount,
      billRefNumber
    });
    throw error;
  }
};

module.exports = {
  getAccessToken,
  generateStkPassword,
  formatPhoneNumber,
  initiateSTK,
  queryStkStatus,
  registerC2BUrls,
  simulateC2B
};
