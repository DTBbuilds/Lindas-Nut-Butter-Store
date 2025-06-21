// server/utils/darajaApi.js

/**
 * Complete and robust Safaricom Daraja API utility for M-Pesa integration.
 * This file provides all necessary functions for handling M-Pesa transactions,
 * including token management, STK push, status queries, and phone number formatting.
 * It features improved error handling, logging, and token caching.
 */

const axios = require('axios');
const https = require('https');
const config = require('../config');
const { logMpesaTransaction, logMpesaError } = require('./mpesaLogger');

let cachedToken = null;
let tokenExpiryTime = 0;
const TOKEN_EXPIRY_BUFFER_SECONDS = 300; // 5-minute buffer to prevent using an expired token

// Create a dedicated axios instance for M-Pesa API calls.
// This enforces security best practices and sets a reasonable timeout.
const mpesaAxios = axios.create({
  timeout: 30000, // 30 seconds
  httpsAgent: new https.Agent({
    // In production, always validate SSL certificates.
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    keepAlive: true, // Reuse TCP connections for better performance
  }),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Retrieves a valid OAuth access token from Safaricom.
 * It uses a cached token if it's still valid, otherwise requests a new one.
 * @returns {Promise<string>} A valid M-Pesa access token.
 * @throws {Error} If M-Pesa credentials are not configured or the API call fails.
 */
const getAccessToken = async () => {
  const currentTimeSeconds = Math.floor(Date.now() / 1000);

  // Use cached token if it's still valid (with a buffer)
  if (cachedToken && tokenExpiryTime > (currentTimeSeconds + TOKEN_EXPIRY_BUFFER_SECONDS)) {
    console.log('✅ Using cached M-Pesa token.');
    return cachedToken;
  }

  console.log('🔄 M-Pesa token is expired or not cached. Requesting new token...');
  try {
    const { consumerKey, consumerSecret, baseUrl } = config.mpesa;
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa consumer key or secret is not configured in config.js.');
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await mpesaAxios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (response.status !== 200 || !response.data.access_token) {
      throw new Error(`OAuth token request failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    cachedToken = response.data.access_token;
    // Calculate expiry time based on the 'expires_in' value from the response
    tokenExpiryTime = currentTimeSeconds + parseInt(response.data.expires_in, 10);
    
    console.log('✅ New OAuth token obtained and cached successfully!');
    return cachedToken;

  } catch (error) {
    // Invalidate cache on failure
    cachedToken = null;
    tokenExpiryTime = 0;
    logMpesaError('Get Access Token Error', { message: error.message, stack: error.stack });
    // Re-throw a more specific error for the service layer to handle
    throw new Error(`Failed to retrieve M-Pesa access token: ${error.message}`);
  }
};

/**
 * Generates the Base64 encoded password required for STK push and other requests.
 * The password is a combination of ShortCode, Passkey, and a timestamp.
 * @param {string} businessShortCode - The business short code (Paybill or Till Number).
 * @returns {{password: string, timestamp: string}} The Base64 encoded password and the timestamp used.
 * @throws {Error} If the M-Pesa passkey is not configured.
 */
const generateStkPassword = (businessShortCode) => {
  const { paybillNumber, passkey } = config.mpesa;
  const shortCode = businessShortCode || paybillNumber;
  
  if (!passkey) {
    throw new Error('M-Pesa passkey is not configured. Cannot generate STK password.');
  }
  
  // Corrected: Use UTC time to generate the timestamp to avoid timezone inconsistencies.
  // The Daraja API expects the timestamp to be in GMT/UTC.
  const now = new Date();
  const timestamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0')
  ].join('');
  
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
  return { password, timestamp };
};

/**
 * Formats a phone number to the required Safaricom format (254XXXXXXXXX).
 * It handles various common Kenyan formats.
 * @param {string|number} phoneNumber - The phone number to format.
 * @returns {string} The formatted phone number.
 * @throws {Error} If the phone number is invalid or cannot be formatted.
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('Phone number is required.');
  }
  
  // Remove all non-digit characters
  const phoneStr = String(phoneNumber).trim().replace(/\D/g, '');
  
  if (phoneStr.startsWith('254') && phoneStr.length === 12) {
    return phoneStr;
  }
  if (phoneStr.startsWith('07') && phoneStr.length === 10) {
    return `254${phoneStr.substring(1)}`;
  }
  if (phoneStr.startsWith('7') && phoneStr.length === 9) {
    return `254${phoneStr}`;
  }
  
  throw new Error(`Invalid phone number format: ${phoneNumber}. Must be a valid Kenyan format (e.g., 07... or 254...).`);
};

/**
 * Initiates an M-Pesa STK Push request to a customer's phone.
 * @param {string} phoneNumber - The customer's phone number in a valid format.
 * @param {number} amount - The amount to be charged.
 * @param {string} accountReference - A reference for the transaction (e.g., Order ID).
 * @param {string} transactionDesc - A short description of the transaction.
 * @param {string} callbackURL - The URL that M-Pesa will post the transaction result to.
 * @returns {Promise<object>} The response from the Daraja API upon successful initiation.
 * @throws {Error} If the STK push initiation fails.
 */
const initiateSTK = async (phoneNumber, amount, accountReference, transactionDesc, callbackURL) => {
  try {
    const token = await getAccessToken();
    const { paybillNumber } = config.mpesa;
    const { password, timestamp } = generateStkPassword(paybillNumber);

    const payload = {
      BusinessShortCode: paybillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // Or 'CustomerBuyGoodsOnline' for Till Numbers
      Amount: Math.round(amount), // Amount must be an integer
      PartyA: formatPhoneNumber(phoneNumber), // Customer's phone number
      PartyB: paybillNumber, // Your Paybill number
      PhoneNumber: formatPhoneNumber(phoneNumber), // Customer's phone number again
      CallBackURL: callbackURL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    // Log the payload for debugging, but mask the password.
    logMpesaTransaction('STK Push Payload', { ...payload, Password: '***' });

    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    logMpesaTransaction('STK Push Response', response.data);
    return response.data;

  } catch (error) {
    let errorMessage = 'An unknown error occurred during STK push.';
    let errorDetails = {};

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorDetails = error.response.data;
      // Use the specific error message from Daraja if available, otherwise stringify the response
      errorMessage = errorDetails.errorMessage || JSON.stringify(errorDetails);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from M-Pesa API. Please check network connectivity and firewall settings.';
      errorDetails = { request: 'No response received' };
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
      errorDetails = { message: error.message };
    }

    logMpesaError('Initiate STK Error', { errorMessage, errorDetails });
    throw new Error(`Failed to initiate STK push: ${errorMessage}`);
  }
};

/**
 * Queries the status of a previously initiated M-Pesa STK Push transaction.
 * @param {string} checkoutRequestId - The CheckoutRequestID received from the initiateSTK call.
 * @returns {Promise<object>} The status response from the Daraja API.
 * @throws {Error} If the status query fails.
 */
const querySTKStatus = async (checkoutRequestId) => {
  try {
    const token = await getAccessToken();
    const { paybillNumber } = config.mpesa;
    const { password, timestamp } = generateStkPassword(paybillNumber);

    const payload = {
      BusinessShortCode: paybillNumber,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    logMpesaTransaction('STK Query Payload', { ...payload, Password: '***' });

    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpushquery/v1/query`,
      payload,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    logMpesaTransaction('STK Query Response', response.data);
    return response.data;

  } catch (error) {
    const errorData = error.response ? error.response.data : { message: error.message };
    logMpesaError('Query STK Status Error', errorData);

    // M-Pesa API returns an error response while the transaction is still processing.
    // This is not a fatal error, so we return null to indicate a PENDING status.
    if (errorData && errorData.errorMessage === 'The transaction is being processed') {
      return null;
    }

    // For all other errors, we throw an exception to be handled upstream.
    throw new Error(`Failed to query STK status: ${errorData.errorMessage || error.message}`);
  }
};

module.exports = {
  getAuthToken: getAccessToken, // Alias for backward compatibility
  getAccessToken,
  initiateSTK,
  querySTKStatus,
  formatPhoneNumber,
  generateStkPassword
};
