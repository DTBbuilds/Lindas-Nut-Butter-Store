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
    
    // Ensure credentials are properly set
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa consumer key or secret is missing or invalid');
    }
    
    // Generate the base64 auth string correctly
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // Log the request details for debugging (mask sensitive data)
    console.log('🔑 Using M-Pesa credentials:', {
      consumerKey: `${consumerKey.substring(0, 5)}...${consumerKey.substring(consumerKey.length - 3)}`,
      environment: config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION',
      paybillNumber: config.mpesa.paybillNumber
    });
    
    console.log('🔄 Requesting OAuth token from:', `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`);
    
    // Make the request with proper authentication - use a more explicit approach
    const authHeader = 'Basic ' + auth;
    console.log('🔐 Authorization header (first 10 chars):', authHeader.substring(0, 15) + '...');
    
    const response = await mpesaAxios({
      method: 'get',
      url: `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: status => status < 500 // Don't throw on 4xx errors so we can log them
    });
    
    // Check if the response was successful
    if (response.status !== 200) {
      console.error(`❌ OAuth token request failed with status ${response.status}:`, response.data);
      throw new Error(`OAuth token request failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }
    
    // Log success
    console.log('✅ OAuth token obtained successfully!');
    logMpesaTransaction('OAuth Token Response', {
      status: response.status,
      success: true,
      tokenPreview: response.data.access_token ? `${response.data.access_token.substring(0, 5)}...` : 'none',
      expires_in: response.data.expires_in
    });
    
    // Expecting response format: { "access_token": "xTKygG823eFg9dzsGnbaYYWTLcV9", "expires_in": "3599" }
    return response.data.access_token;
  } catch (error) {
    console.error('❌ OAuth token error details:', {
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
    });
    
    logMpesaError('OAuth Token Request', error, {
      url: `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      errorDetails: error.response?.data || error.message
    });
    
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
  // IMPORTANT: Use Safaricom's required format - exactly 14 digits, no timezone conversion
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Combine to create the timestamp in the format YYYYMMDDHHmmss
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // Ensure the timestamp is exactly 14 characters
  if (timestamp.length !== 14) {
    console.error(`Invalid timestamp length: ${timestamp.length}, expected 14 characters`);
    console.error(`Timestamp value: ${timestamp}`);
  }
  
  // Generate the password exactly as required by Safaricom
  const password = Buffer.from(
    `${shortCode}${config.mpesa.passkey}${timestamp}`
  ).toString('base64');
  
  logMpesaTransaction('Generated STK Password', {
    timestamp,
    businessShortCode: shortCode,
    passkey: '********', // Masked for security
    passwordLength: password.length,
    timestampLength: timestamp.length
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
  if (!phoneNumber) {
    throw new Error('Phone number is required for M-Pesa payment');
  }
  
  // Convert to string if it's not already
  let formattedPhone = phoneNumber.toString().trim();
  
  // Log the original input for debugging
  console.log(`Formatting phone number: original input = "${phoneNumber}"`);
  
  // Remove any non-digit characters
  formattedPhone = formattedPhone.replace(/\D/g, '');
  console.log(`After removing non-digits: "${formattedPhone}"`);
  
  // Check if the number has sufficient digits
  if (formattedPhone.length < 9) {
    throw new Error(`Phone number ${phoneNumber} is too short (minimum 9 digits required)`);
  }
  
  // Handle different formats
  if (formattedPhone.startsWith('254')) {
    // Already in international format
    console.log(`Phone already in international format: ${formattedPhone}`);
  } else if (formattedPhone.startsWith('0')) {
    // Convert from 07xx to 2547xx format
    formattedPhone = `254${formattedPhone.substring(1)}`;
    console.log(`Converted from 0xx format: ${formattedPhone}`);
  } else if (formattedPhone.length === 9 && (formattedPhone.startsWith('7') || formattedPhone.startsWith('1'))) {
    // Convert from 7xx or 1xx to 254xxx format (Kenyan local numbers)
    formattedPhone = `254${formattedPhone}`;
    console.log(`Converted from 9-digit local format: ${formattedPhone}`);
  } else if (formattedPhone.startsWith('254') && formattedPhone.length > 12) {
    // Truncate if too long but starts with 254
    formattedPhone = formattedPhone.substring(0, 12);
    console.log(`Truncated long number to: ${formattedPhone}`);
  } else {
    // For Safaricom sandbox testing numbers, ensure they're in the proper format
    // The sandbox test numbers should be exactly 12 digits starting with 254
    if (formattedPhone.length === 12 && !formattedPhone.startsWith('254')) {
      console.warn(`Potentially invalid phone number format: ${formattedPhone}`);
      // Since this might be a test number, we'll proceed but with a warning
    } else if (formattedPhone.length === 10 && !formattedPhone.startsWith('254')) {
      // Likely a full local number without country code (e.g., 0722XXXXXX)
      formattedPhone = `254${formattedPhone.substring(1)}`;
      console.log(`Converted 10-digit local number: ${formattedPhone}`);
    } else {
      // Last resort - assume it's a local number and prefix with 254
      console.warn(`Using phone number as-is with 254 prefix: ${formattedPhone}`);
      // For sandbox testing, accept numbers like 708374149 (the standard test numbers)
      formattedPhone = `254${formattedPhone}`;
    }
  }
  
  // Final validation - must be exactly 12 digits for Kenya numbers starting with 254
  if (!/^254\d{9}$/.test(formattedPhone)) {
    console.warn(`⚠️ Final phone number ${formattedPhone} may not be in the correct format for M-Pesa. Expected: 254XXXXXXXXX`);
    
    // For sandbox testing, we'll allow the standard test numbers
    // If it's not a valid format but looks like a Safaricom test number, fix it
    if (formattedPhone.includes('708374149') || 
        formattedPhone.includes('708374150') || 
        formattedPhone.includes('708374151') || 
        formattedPhone.includes('708374152')) {
      
      // Extract the test number and reformat it correctly
      const testNumberMatch = formattedPhone.match(/(708374\d{3})/);
      if (testNumberMatch) {
        formattedPhone = `254${testNumberMatch[1]}`;
        console.log(`✅ Detected Safaricom test number, reformatted to: ${formattedPhone}`);
      }
    }
  }
  
  console.log(`Final formatted phone number: ${formattedPhone}`);
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
    
    console.error('==== MPESA STK PUSH ERROR DETAILS ====');
    
    // Common Safaricom error codes and their meanings
    const errorCodeGuide = {
      '400.002.02': 'Invalid Request - Check timestamp format, callback URL, or phone number',
      '401.002.01': 'Invalid Access Token',
      '403.001.01': 'Access Denied - API Key doesn\'t match allowed applications',
      '404.001.01': 'API resource endpoint not found',
      '405.001.01': 'Method not allowed',
      '409.001.01': 'Conflict - Transaction already in process',
      '500.001.01': 'Internal Server Error',
      '500.002.01': 'Service unavailable - Try again later',
      '503.001.01': 'Service unavailable - Try again later'
    };
    
    if (error.response) {
      // Server responded with an error
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      // Show error guidance if available
      if (error.response.data && error.response.data.errorCode) {
        const errorCode = error.response.data.errorCode;
        const errorGuide = errorCodeGuide[errorCode] || 'Unknown error';
        console.error(`Error code ${errorCode}: ${errorGuide}`);
        console.error('Error message:', error.response.data.errorMessage);
      }
    } else {
      // Network error or request setup error
      console.error('Error message:', error.message);
    }
    console.error('==== END ERROR DETAILS ====');
    
    // Implement retry logic for specific error cases
    const MAX_RETRIES = 2;
    
    // Check if we should retry based on error type or message
    if (retryCount < MAX_RETRIES) {
      // Handle specific error scenarios and attempt to recover
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Handle invalid access token - retry with fresh token
        if (errorData.errorCode === '401.002.01') {
          console.log('Access token rejected, retrying with fresh token...');
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
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
        
        // Handle timestamp errors (very common with Daraja API)
        if (errorData.errorCode === '400.002.02' && 
            errorData.errorMessage && 
            errorData.errorMessage.includes('Invalid Timestamp')) {
          console.log('Invalid timestamp detected, retrying with fresh timestamp...');
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
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
      
      // Determine if this error is retriable
      const isRetriable = 
          error.message.includes('timeout') || // Timeout
          error.message.includes('network') || // Network error
          error.message.includes('ETIMEDOUT') || // Connection timeout
          error.code === 'ECONNRESET' || // Connection reset
          (error.response?.status >= 500); // Server errors
      
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
    
    // Throw a more descriptive error for client-side handling
    const errorMessage = error.response?.data?.errorMessage || error.message || 'Unknown M-Pesa error';
    const enhancedError = new Error(`M-Pesa STK Push failed: ${errorMessage}`);
    enhancedError.originalError = error;
    enhancedError.errorData = error.response?.data;
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
