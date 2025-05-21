/**
 * M-Pesa Diagnostics Tool
 * 
 * This tool helps diagnose issues with Safaricom Daraja API integration
 * It checks all components of the M-Pesa integration and reports any issues
 */
const axios = require('axios');
const https = require('https');
const config = require('../config');
const { logMpesaTransaction, logMpesaError } = require('./mpesaLogger');

// Create axios instance with extended timeout
const mpesaAxios = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
  })
});

/**
 * Check OAuth token generation
 * @returns {Promise<Object>} Result of the check
 */
const checkOAuthToken = async () => {
  try {
    console.log('🔑 Testing OAuth token generation...');
    
    const auth = Buffer.from(
      `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`
    ).toString('base64');
    
    const response = await mpesaAxios.get(
      `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      console.log('✅ OAuth token generation successful!');
      return {
        success: true,
        message: 'OAuth token generated successfully',
        token: response.data.access_token.substring(0, 10) + '...' // Show partial token for security
      };
    } else {
      console.log('❌ OAuth token generation failed: Unexpected response format');
      return {
        success: false,
        message: 'Unexpected response format',
        data: response.data
      };
    }
  } catch (error) {
    console.error('❌ OAuth token generation failed:', error.message);
    return {
      success: false,
      message: 'OAuth token generation failed',
      error: error.response?.data || error.message
    };
  }
};

/**
 * Check STK Push password generation
 * @returns {Object} Result of the check
 */
const checkStkPassword = () => {
  try {
    console.log('🔒 Testing STK password generation...');
    
    // Check if passkey is defined
    if (!config.mpesa.passkey) {
      console.error('❌ STK password generation failed: Missing passkey');
      return {
        success: false,
        message: 'Missing passkey in configuration',
        recommendation: 'Add the correct passkey to your mpesa configuration'
      };
    }
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6);
    const password = Buffer.from(
      `${config.mpesa.paybillNumber}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');
    
    console.log('✅ STK password generation successful!');
    return {
      success: true,
      message: 'STK password generated successfully',
      timestamp,
      passwordLength: password.length,
      passwordFirstChars: password.substring(0, 10) + '...' // Show partial password for security
    };
  } catch (error) {
    console.error('❌ STK password generation failed:', error.message);
    return {
      success: false,
      message: 'STK password generation failed',
      error: error.message
    };
  }
};

/**
 * Check callback URLs
 * @returns {Object} Result of the check
 */
const checkCallbackUrls = () => {
  console.log('🔗 Checking callback URLs...');
  
  const { callbackUrl, validationUrl, confirmationUrl } = config.mpesa;
  const issues = [];
  
  // Check if URLs are defined
  if (!callbackUrl) issues.push('Missing callback URL');
  if (!validationUrl) issues.push('Missing validation URL');
  if (!confirmationUrl) issues.push('Missing confirmation URL');
  
  // Check if URLs are formatted correctly
  const urlPattern = /^https?:\/\/.+/;
  if (callbackUrl && !urlPattern.test(callbackUrl)) 
    issues.push('Callback URL format is invalid');
  if (validationUrl && !urlPattern.test(validationUrl)) 
    issues.push('Validation URL format is invalid');
  if (confirmationUrl && !urlPattern.test(confirmationUrl)) 
    issues.push('Confirmation URL format is invalid');
  
  // Check localhost issues for production environment
  if (process.env.NODE_ENV === 'production') {
    if (callbackUrl && callbackUrl.includes('localhost')) 
      issues.push('Callback URL contains localhost in production environment');
    if (validationUrl && validationUrl.includes('localhost')) 
      issues.push('Validation URL contains localhost in production environment');
    if (confirmationUrl && confirmationUrl.includes('localhost')) 
      issues.push('Confirmation URL contains localhost in production environment');
  }
  
  if (issues.length === 0) {
    console.log('✅ Callback URLs are valid!');
    return {
      success: true,
      message: 'All callback URLs are valid',
      callbackUrl,
      validationUrl,
      confirmationUrl
    };
  } else {
    console.error('❌ Callback URL issues found:', issues.join(', '));
    return {
      success: false,
      message: 'Issues found with callback URLs',
      issues,
      callbackUrl,
      validationUrl,
      confirmationUrl
    };
  }
};

/**
 * Test STK Push with minimal parameters
 * @param {string} phoneNumber - Customer phone number
 * @returns {Promise<Object>} Result of the test
 */
const testStkPush = async (phoneNumber) => {
  try {
    console.log(`📱 Testing STK Push to ${phoneNumber}...`);
    
    // 1. Get OAuth token
    const tokenResult = await checkOAuthToken();
    if (!tokenResult.success) {
      return {
        success: false,
        message: 'STK Push failed: Unable to get OAuth token',
        tokenError: tokenResult
      };
    }
    
    // 2. Format phone number
    let formattedPhone = phoneNumber.replace(/\s+|-|\(|\)/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(4);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    // 3. Generate password and timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6);
    const password = Buffer.from(
      `${config.mpesa.paybillNumber}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');
    
    // 4. Prepare STK Push payload
    const stkPayload = {
      BusinessShortCode: config.mpesa.paybillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1, // Minimal amount for testing
      PartyA: formattedPhone,
      PartyB: config.mpesa.paybillNumber,
      PhoneNumber: formattedPhone,
      CallBackURL: config.mpesa.callbackUrl,
      AccountReference: 'TEST' + Date.now().toString().substring(8, 13),
      TransactionDesc: 'Test STK Push'
    };
    
    console.log('STK Push payload:', {
      ...stkPayload,
      Password: '********' // Mask password in logs
    });
    
    // 5. Make STK Push request
    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      {
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.ResponseCode === '0') {
      console.log('✅ STK Push test successful!');
      return {
        success: true,
        message: 'STK Push initiated successfully',
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseDescription: response.data.ResponseDescription
      };
    } else {
      console.error('❌ STK Push test failed with unexpected response:', response.data);
      return {
        success: false,
        message: 'STK Push returned unexpected response',
        response: response.data
      };
    }
  } catch (error) {
    console.error('❌ STK Push test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    return {
      success: false,
      message: 'STK Push test failed',
      error: error.response?.data || error.message,
      statusCode: error.response?.status
    };
  }
};

/**
 * Test all M-Pesa integration components
 * @param {string} phoneNumber - Optional phone number for STK Push test
 * @returns {Promise<Object>} Comprehensive test results
 */
const runFullDiagnostics = async (phoneNumber = null) => {
  console.log('\n📊 STARTING M-PESA INTEGRATION DIAGNOSTICS 📊');
  console.log('==============================================\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: config.mpesa.baseUrl,
    tests: {}
  };
  
  // 1. Check Configuration
  console.log('🔍 Checking M-Pesa configuration...');
  results.configuration = {
    paybillNumber: config.mpesa.paybillNumber,
    accountNumber: config.mpesa.accountNumber,
    consumerKeyPresent: !!config.mpesa.consumerKey,
    consumerSecretPresent: !!config.mpesa.consumerSecret,
    passKeyPresent: !!config.mpesa.passkey,
    environment: config.mpesa.baseUrl.includes('sandbox') ? 'sandbox' : 'production'
  };
  
  // 2. Test OAuth Token
  results.tests.oauthToken = await checkOAuthToken();
  
  // 3. Test STK Password
  results.tests.stkPassword = checkStkPassword();
  
  // 4. Test Callback URLs
  results.tests.callbackUrls = checkCallbackUrls();
  
  // 5. Test STK Push if phone number provided
  if (phoneNumber) {
    results.tests.stkPush = await testStkPush(phoneNumber);
  }
  
  // Overall assessment
  const failedTests = Object.values(results.tests).filter(test => !test.success);
  
  if (failedTests.length === 0) {
    results.overallStatus = 'PASSED';
    results.recommendations = [
      'All tests passed. If you are still experiencing issues with payments, check your server logs for more details.'
    ];
  } else {
    results.overallStatus = 'FAILED';
    results.recommendations = [
      'Fix the failed tests before trying again.',
      ...failedTests.map(test => `Issue: ${test.message}`)
    ];
  }
  
  console.log('\n==============================================');
  console.log(`📊 DIAGNOSTICS COMPLETE: ${results.overallStatus} 📊`);
  console.log('==============================================\n');
  
  return results;
};

module.exports = {
  checkOAuthToken,
  checkStkPassword,
  checkCallbackUrls,
  testStkPush,
  runFullDiagnostics
};
