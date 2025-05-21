/**
 * Helper functions for Safaricom Daraja API integration
 */
const axios = require('axios');
const config = require('../config');

/**
 * Get OAuth token from Safaricom
 * @returns {Promise<string>} Access token
 */
const getOAuthToken = async () => {
  try {
    const auth = Buffer.from(
      `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
    ).toString('base64');
    
    const response = await axios.get(
      `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting OAuth token:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Generate password for STK push
 * @returns {Object} Password and timestamp
 */
const generateStkPushPassword = () => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6);
  const password = Buffer.from(
    `${config.mpesa.paybillNumber}${config.mpesa.passkey}${timestamp}`
  ).toString('base64');
  
  return { password, timestamp };
};

/**
 * Format phone number for M-Pesa
 * @param {string} phoneNumber 
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any spaces or special characters
  let formattedPhone = phoneNumber.replace(/\s+/g, '');
  
  // Remove leading 0 if present
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1);
  }
  
  // Remove +254 if present
  if (formattedPhone.startsWith('+254')) {
    formattedPhone = formattedPhone.substring(4);
  }
  
  // Add 254 prefix if needed
  if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }
  
  return formattedPhone;
};

/**
 * Simulate STK Push callback for testing
 * @param {string} checkoutRequestId 
 * @param {string} merchantRequestId 
 * @param {number} resultCode 
 * @returns {Object} Simulated callback data
 */
const simulateStkCallback = (checkoutRequestId, merchantRequestId, resultCode = 0) => {
  // Generate a random M-Pesa receipt number
  const mpesaReceiptNumber = 'LNB' + Math.floor(Math.random() * 10000000000).toString();
  
  // Create callback data structure
  const callbackData = {
    Body: {
      stkCallback: {
        MerchantRequestID: merchantRequestId,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc: resultCode === 0 ? 'The service request is processed successfully.' : 'Request cancelled by user',
      }
    }
  };
  
  // Add metadata if successful
  if (resultCode === 0) {
    callbackData.Body.stkCallback.CallbackMetadata = {
      Item: [
        {
          Name: 'Amount',
          Value: 1000
        },
        {
          Name: 'MpesaReceiptNumber',
          Value: mpesaReceiptNumber
        },
        {
          Name: 'TransactionDate',
          Value: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6)
        },
        {
          Name: 'PhoneNumber',
          Value: config.test.phoneNumbers.success
        }
      ]
    };
  }
  
  return callbackData;
};

/**
 * Update callback URLs based on server URL
 * @param {string} serverUrl 
 * @returns {Object} Updated URLs
 */
const updateCallbackUrls = (serverUrl) => {
  // Update the callback URLs with the current server URL
  config.mpesa.callbackUrl = `${serverUrl}/api/mpesa/callback`;
  config.mpesa.validationUrl = `${serverUrl}/api/mpesa/validation`;
  config.mpesa.confirmationUrl = `${serverUrl}/api/mpesa/confirmation`;
  
  console.log('Updated M-Pesa callback URLs:');
  console.log('- Callback URL:', config.mpesa.callbackUrl);
  console.log('- Validation URL:', config.mpesa.validationUrl);
  console.log('- Confirmation URL:', config.mpesa.confirmationUrl);
  
  return {
    callbackUrl: config.mpesa.callbackUrl,
    validationUrl: config.mpesa.validationUrl,
    confirmationUrl: config.mpesa.confirmationUrl
  };
};

module.exports = {
  getOAuthToken,
  generateStkPushPassword,
  formatPhoneNumber,
  simulateStkCallback,
  updateCallbackUrls
};
