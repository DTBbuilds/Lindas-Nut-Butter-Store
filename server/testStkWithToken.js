/**
 * Test script for STK Push using a valid access token
 * This script tests the STK Push functionality with a known working token
 */
const axios = require('axios');
const https = require('https');
const config = require('./config');

console.log(`
🌟 ===================================================== 🌟
     M-PESA STK PUSH TEST WITH VALID TOKEN
🌟 ===================================================== 🌟
`);

// The valid access token provided by the user
const validToken = 'QGjRCnsrZt4MIDs4It8ANgBZRC4I';

console.log('Configuration:');
console.log(`- API Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`- Paybill Number: ${config.mpesa.paybillNumber}`);
console.log(`- Account Number: ${config.mpesa.accountNumber}`);
console.log(`- Using provided token: ${validToken}`);

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
 * Test STK Push with the valid token
 */
async function testStkPush() {
  console.log('\n🔄 Testing STK Push with valid token...');
  
  try {
    // Generate timestamp in the format YYYYMMDDHHmmss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    console.log('Generated timestamp:', timestamp);
    
    // Generate password (format: paybill + passkey + timestamp)
    const password = Buffer.from(
      `${config.mpesa.paybillNumber}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');
    
    // Get active ngrok URL for callback
    let callbackUrl = config.mpesa.callbackUrl;
    try {
      const ngrokResponse = await axios.get('http://localhost:4040/api/tunnels');
      if (ngrokResponse.data && ngrokResponse.data.tunnels.length > 0) {
        const httpsTunnel = ngrokResponse.data.tunnels.find(t => t.proto === 'https');
        if (httpsTunnel) {
          callbackUrl = `${httpsTunnel.public_url}/api/mpesa/callback`;
          console.log('Using ngrok callback URL:', callbackUrl);
        }
      }
    } catch (error) {
      console.log('Could not detect ngrok, using default callback URL:', callbackUrl);
    }
    
    // Phone number for testing (Safaricom test number)
    const phoneNumber = '254708374149';
    
    // Prepare STK Push payload
    const stkPayload = {
      BusinessShortCode: config.mpesa.paybillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1, // Minimum amount for testing
      PartyA: phoneNumber,
      PartyB: config.mpesa.paybillNumber,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: 'TestAccount',
      TransactionDesc: 'Test STK Push'
    };
    
    console.log('STK Push payload:');
    console.log('-----------------------------------------');
    console.log(`BusinessShortCode: ${stkPayload.BusinessShortCode}`);
    console.log(`Password: [HIDDEN]`);
    console.log(`Timestamp: ${stkPayload.Timestamp}`);
    console.log(`Amount: ${stkPayload.Amount}`);
    console.log(`PhoneNumber: ${stkPayload.PhoneNumber}`);
    console.log(`CallBackURL: ${stkPayload.CallBackURL}`);
    console.log(`AccountReference: ${stkPayload.AccountReference}`);
    console.log('-----------------------------------------');
    
    // Make the STK Push request
    const response = await mpesaAxios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      stkPayload,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      }
    );
    
    console.log('✅ STK Push SUCCESS!');
    console.log('STK Push Response:');
    console.log('-----------------------------------------');
    console.log(`MerchantRequestID: ${response.data.MerchantRequestID || 'N/A'}`);
    console.log(`CheckoutRequestID: ${response.data.CheckoutRequestID || 'N/A'}`);
    console.log(`ResponseCode: ${response.data.ResponseCode || 'N/A'}`);
    console.log(`ResponseDescription: ${response.data.ResponseDescription || 'N/A'}`);
    console.log('-----------------------------------------');
    
    // If successful, try to query the status
    if (response.data && response.data.CheckoutRequestID) {
      await queryTransactionStatus(response.data.CheckoutRequestID, validToken);
    }
    
    return true;
  } catch (error) {
    console.error('❌ STK Push FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Query transaction status
 */
async function queryTransactionStatus(checkoutRequestId, token) {
  console.log('\n🔄 Querying transaction status...');
  
  try {
    // Generate timestamp in the format YYYYMMDDHHmmss
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    // Generate password
    const password = Buffer.from(
      `${config.mpesa.paybillNumber}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');
    
    // Prepare query payload
    const queryPayload = {
      BusinessShortCode: config.mpesa.paybillNumber,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };
    
    console.log('Query payload:');
    console.log('-----------------------------------------');
    console.log(`BusinessShortCode: ${queryPayload.BusinessShortCode}`);
    console.log(`Password: [HIDDEN]`);
    console.log(`Timestamp: ${queryPayload.Timestamp}`);
    console.log(`CheckoutRequestID: ${queryPayload.CheckoutRequestID}`);
    console.log('-----------------------------------------');
    
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
    
    console.log('✅ Query SUCCESS!');
    console.log('Query Response:');
    console.log('-----------------------------------------');
    console.log(`ResultCode: ${response.data.ResultCode || 'N/A'}`);
    console.log(`ResultDesc: ${response.data.ResultDesc || 'N/A'}`);
    if (response.data.ResultCode === '0') {
      console.log('Transaction successful!');
    } else {
      console.log(`Transaction status: ${response.data.ResultDesc || 'Unknown'}`);
    }
    console.log('-----------------------------------------');
    return true;
  } catch (error) {
    console.error('❌ Query FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run the test
testStkPush();
