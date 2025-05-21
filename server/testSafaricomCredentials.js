/**
 * Test script for Safaricom Daraja API using official test credentials
 * This script uses the official Safaricom test credentials from their documentation
 */
const axios = require('axios');
const https = require('https');

console.log(`
🌟 ===================================================== 🌟
     SAFARICOM DARAJA API OFFICIAL TEST CREDENTIALS
🌟 ===================================================== 🌟
`);

// Create an axios instance with extended timeout and SSL configuration
const mpesaAxios = axios.create({
  timeout: 30000, // 30 seconds
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
  }),
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Test OAuth token generation with official Safaricom test credentials
 */
async function testOfficialCredentials() {
  console.log('Testing with official Safaricom test credentials...');
  
  // Official Safaricom test credentials from documentation
  const officialCredentials = [
    {
      name: "Official Test Credentials Set 1",
      consumerKey: "GvzjNnYgNJtwgwfLBkZh65VPwfuKvs0V",
      consumerSecret: "oUs2ibY9pzL1A0Az"
    },
    {
      name: "Official Test Credentials Set 2",
      consumerKey: "2nRyAQAMWYdGlCTH3MCLnAR1rAI4ZiLG",
      consumerSecret: "AJAhlLGMGEp2CBqw"
    },
    {
      name: "Common Sandbox Credentials",
      consumerKey: "Gu99BOheeCfpwJnS1DF9A8HABMTAbNCK",
      consumerSecret: "6DP7XdYXXmOhvO6F"
    }
  ];
  
  for (const cred of officialCredentials) {
    console.log(`\nTrying ${cred.name}...`);
    console.log(`Consumer Key: ${cred.consumerKey}`);
    console.log(`Consumer Secret: ${cred.consumerSecret}`);
    
    const auth = `${cred.consumerKey}:${cred.consumerSecret}`;
    const encodedAuth = Buffer.from(auth).toString('base64');
    
    try {
      const response = await mpesaAxios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${encodedAuth}`
          }
        }
      );
      
      console.log('✅ SUCCESS!');
      console.log('Response:', response.data);
      console.log('Access Token:', response.data.access_token);
      
      // Try STK Push with this token
      await testStkPush(response.data.access_token, cred.name);
      
      return true;
    } catch (error) {
      console.error('❌ FAILED:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
  
  console.error('\n❌ ALL OFFICIAL CREDENTIALS FAILED');
  console.error('This suggests there may be an issue with the Safaricom Daraja API sandbox or network connectivity.');
  return false;
}

/**
 * Test STK Push with the token
 */
async function testStkPush(token, credentialName) {
  console.log(`\nTesting STK Push with ${credentialName}...`);
  
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
    
    // Official Safaricom test values
    const businessShortCode = '174379'; // Standard test shortcode
    const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Standard test passkey
    
    // Generate password (format: shortcode + passkey + timestamp)
    const password = Buffer.from(
      `${businessShortCode}${passkey}${timestamp}`
    ).toString('base64');
    
    console.log('Generated timestamp:', timestamp);
    
    // Get active ngrok URL for callback
    let callbackUrl = 'https://mydomain.com/path'; // Default fallback
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
    
    // Prepare STK Push payload with official test values
    const stkPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1, // Minimum amount for testing
      PartyA: '254708374149', // Safaricom test number
      PartyB: businessShortCode,
      PhoneNumber: '254708374149', // Safaricom test number
      CallBackURL: callbackUrl,
      AccountReference: 'TestAccount',
      TransactionDesc: 'Test STK Push'
    };
    
    console.log('STK Push payload:', JSON.stringify(stkPayload, null, 2));
    
    // Make the STK Push request
    const response = await mpesaAxios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ STK Push SUCCESS!');
    console.log('Response:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ STK Push FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testOfficialCredentials();
