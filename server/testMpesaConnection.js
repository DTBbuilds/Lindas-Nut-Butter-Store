/**
 * Test script to verify Safaricom Daraja API connectivity
 * This script tests direct communication with the Safaricom API
 */
const axios = require('axios');
const https = require('https');
const config = require('./config');

console.log(`
🌟 ===================================================== 🌟
     SAFARICOM DARAJA API CONNECTION TEST
🌟 ===================================================== 🌟
`);

console.log('Configuration:');
console.log(`- API Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`- Paybill Number: ${config.mpesa.paybillNumber} (should be 247247)`);
console.log(`- Account Number: ${config.mpesa.accountNumber} (should be 0725317864)`);
console.log(`- Consumer Key: ${config.mpesa.consumerKey.substring(0, 10)}...`);
console.log(`- Consumer Secret: ${config.mpesa.consumerSecret.substring(0, 10)}...`);

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
 * Test OAuth token generation
 */
async function testOAuthToken() {
  console.log('\n🔄 STEP 1: Testing OAuth token generation...');
  
  try {
    // Try multiple authentication methods to see which one works
    
    // Method 1: Using config credentials directly
    console.log('\nMethod 1: Using config credentials directly');
    const auth1 = `${config.mpesa.consumerKey}:${config.mpesa.consumerSecret}`;
    const encodedAuth1 = Buffer.from(auth1).toString('base64');
    
    try {
      const response1 = await mpesaAxios.get(
        `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${encodedAuth1}`
          }
        }
      );
      
      console.log('✅ Method 1 SUCCESS!');
      console.log('Response:', response1.data);
      return { success: true, token: response1.data.access_token, method: 'config_credentials' };
    } catch (error) {
      console.error('❌ Method 1 FAILED:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Method 2: Using Safaricom sandbox test credentials
    console.log('\nMethod 2: Using Safaricom sandbox test credentials');
    // These are standard Safaricom test credentials
    const sandboxAuth = 'GUl98moVPYBKRXlQr5hzgYJLQBU8SAVu:7AnxCqRAJopi6ggX';
    const encodedSandboxAuth = Buffer.from(sandboxAuth).toString('base64');
    
    try {
      const response2 = await mpesaAxios.get(
        `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${encodedSandboxAuth}`
          }
        }
      );
      
      console.log('✅ Method 2 SUCCESS!');
      console.log('Response:', response2.data);
      return { success: true, token: response2.data.access_token, method: 'sandbox_credentials' };
    } catch (error) {
      console.error('❌ Method 2 FAILED:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Method 3: Using hardcoded Base64 string (sometimes provided by Safaricom)
    console.log('\nMethod 3: Using hardcoded Base64 string');
    const hardcodedAuth = 'SWtXYUJwbG9DSlUwSXhZZmZRNlZBMzNFbDhwUFRNWm06UHY0Z0tiMmt4cEEwdDVTQg==';
    
    try {
      const response3 = await mpesaAxios.get(
        `${config.mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${hardcodedAuth}`
          }
        }
      );
      
      console.log('✅ Method 3 SUCCESS!');
      console.log('Response:', response3.data);
      return { success: true, token: response3.data.access_token, method: 'hardcoded_base64' };
    } catch (error) {
      console.error('❌ Method 3 FAILED:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // If all methods fail
    console.error('\n❌ ALL AUTHENTICATION METHODS FAILED');
    console.error('Please check your Safaricom Daraja API credentials and network connectivity.');
    return { success: false };
    
  } catch (error) {
    console.error('❌ OAuth token test failed:', error.message);
    return { success: false };
  }
}

/**
 * Test STK Push with the token
 */
async function testStkPush(token) {
  console.log('\n🔄 STEP 2: Testing STK Push functionality...');
  
  if (!token) {
    console.error('❌ Cannot test STK Push without a valid token');
    return { success: false };
  }
  
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
    
    // Generate password (format: paybill + passkey + timestamp)
    const password = Buffer.from(
      `${config.mpesa.paybillNumber}${config.mpesa.passkey}${timestamp}`
    ).toString('base64');
    
    console.log('Generated timestamp:', timestamp);
    
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
    
    // Prepare STK Push payload
    const stkPayload = {
      BusinessShortCode: config.mpesa.paybillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1, // Minimum amount for testing
      PartyA: '254708374149', // Safaricom test number
      PartyB: config.mpesa.paybillNumber,
      PhoneNumber: '254708374149', // Safaricom test number
      CallBackURL: callbackUrl,
      AccountReference: 'TestAccount',
      TransactionDesc: 'Test STK Push'
    };
    
    console.log('STK Push payload:', JSON.stringify(stkPayload, null, 2));
    
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
    
    console.log('✅ STK Push SUCCESS!');
    console.log('Response:', response.data);
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ STK Push FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false };
  }
}

/**
 * Test callback URL accessibility
 */
async function testCallbackUrl() {
  console.log('\n🔄 STEP 3: Testing callback URL accessibility...');
  
  try {
    // Get active ngrok URL
    let ngrokUrl = null;
    try {
      const ngrokResponse = await axios.get('http://localhost:4040/api/tunnels');
      if (ngrokResponse.data && ngrokResponse.data.tunnels.length > 0) {
        const httpsTunnel = ngrokResponse.data.tunnels.find(t => t.proto === 'https');
        if (httpsTunnel) {
          ngrokUrl = httpsTunnel.public_url;
          console.log('Found active ngrok tunnel:', ngrokUrl);
        }
      }
    } catch (error) {
      console.error('❌ Could not detect ngrok:', error.message);
      console.error('Please make sure ngrok is running with: npm run tunnel');
      return { success: false };
    }
    
    if (!ngrokUrl) {
      console.error('❌ No active ngrok tunnel found');
      return { success: false };
    }
    
    // Test if the callback URL is accessible
    const callbackUrl = `${ngrokUrl}/api/mpesa/callback`;
    console.log('Testing accessibility of callback URL:', callbackUrl);
    
    try {
      // Send a simple GET request to see if the endpoint exists
      // Note: The actual callback will be a POST request, but we just want to check if the URL is accessible
      const response = await axios.get(callbackUrl);
      console.log('✅ Callback URL is accessible!');
      console.log('Status:', response.status);
      return { success: true };
    } catch (error) {
      if (error.response) {
        // Even a 404 or other error status means the URL is accessible
        console.log('✅ Callback URL is accessible (received response)!');
        console.log('Status:', error.response.status);
        return { success: true };
      } else {
        console.error('❌ Callback URL is NOT accessible:', error.message);
        return { success: false };
      }
    }
    
  } catch (error) {
    console.error('❌ Callback URL test failed:', error.message);
    return { success: false };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Test OAuth token generation
    const tokenResult = await testOAuthToken();
    
    // Test STK Push if token was generated successfully
    let stkResult = { success: false };
    if (tokenResult.success) {
      stkResult = await testStkPush(tokenResult.token);
    }
    
    // Test callback URL accessibility
    const callbackResult = await testCallbackUrl();
    
    // Print summary
    console.log(`
🌟 ===================================================== 🌟
                   TEST RESULTS SUMMARY
🌟 ===================================================== 🌟
    `);
    
    console.log(`OAuth Token Generation: ${tokenResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (tokenResult.success) {
      console.log(`- Method: ${tokenResult.method}`);
    }
    
    console.log(`STK Push: ${stkResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (stkResult.success) {
      console.log(`- CheckoutRequestID: ${stkResult.data.CheckoutRequestID}`);
    }
    
    console.log(`Callback URL Accessibility: ${callbackResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log(`
🌟 ===================================================== 🌟
                   RECOMMENDATIONS
🌟 ===================================================== 🌟
    `);
    
    if (!tokenResult.success) {
      console.log('1. Check your Safaricom Daraja API credentials');
      console.log('2. Ensure you have internet connectivity');
      console.log('3. Verify that the Safaricom Daraja API sandbox is operational');
    }
    
    if (tokenResult.success && !stkResult.success) {
      console.log('1. Verify your paybill number (should be 247247)');
      console.log('2. Check the passkey in your configuration');
      console.log('3. Ensure the timestamp format is correct (YYYYMMDDHHmmss)');
      console.log('4. Verify that the callback URL is properly formatted and accessible');
    }
    
    if (!callbackResult.success) {
      console.log('1. Make sure ngrok is running with: npm run tunnel');
      console.log('2. Verify that your server is running and listening for callbacks');
      console.log('3. Check if there are any firewall or network issues');
    }
    
    if (tokenResult.success && stkResult.success && callbackResult.success) {
      console.log('✅ All tests passed! Your M-Pesa integration appears to be working correctly.');
      console.log('You can now proceed with testing the complete checkout flow.');
    }
    
  } catch (error) {
    console.error('❌ Tests failed with an unexpected error:', error.message);
  }
}

// Run the tests
runTests();
