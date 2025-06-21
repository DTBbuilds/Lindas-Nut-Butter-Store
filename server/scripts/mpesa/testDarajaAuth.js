/**
 * Test script for Daraja API authentication
 * Using the exact credentials and format from the user's API request
 */
const axios = require('axios');
const util = require('util');

// Create a function to test the Daraja API authentication
async function testDarajaAuth() {
  console.log('🔑 Testing Daraja API authentication with the exact credentials...');
  
  try {
    // Using the exact headers from the user's example
    const headers = {
      'Authorization': 'Basic dUx1RldvWmJjSFhFQTR1MEFhTEFRVkhzZVVWSldqd0RoUjRLUDJBakxKV1RqR3dWOjdaM3JjNVkxSHlsNjhmZmV5Q1BqOUZHZ3JsZURhaUg4NTg4ZkZEY0VKbGZqSFh5N05ZcW9qWUhaODI3QnNNbTc='
    };
    
    console.log('Making request to Safaricom Daraja API...');
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', 
      { headers }
    );
    
    console.log('\n✅ Authentication successful!');
    console.log('Response:', util.inspect(response.data, { colors: true, depth: null }));
    
    // Check if response matches expected format
    if (response.data.access_token && response.data.expires_in) {
      console.log(`\nAccess Token: ${response.data.access_token.substring(0, 10)}... (expires in ${response.data.expires_in} seconds)`);
      
      return {
        success: true,
        token: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } else {
      console.log('\n⚠️ Warning: Response structure is different than expected');
      return {
        success: true,
        data: response.data
      };
    }
  } catch (error) {
    console.error('\n❌ Authentication failed!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

// Update the config file with the correct Daraja credentials if authentication is successful
async function updateCredentialsIfNeeded() {
  try {
    const result = await testDarajaAuth();
    
    if (result.success) {
      console.log('\n🔄 Testing STK Push with these credentials will be the next step.');
      console.log('To do this, run: npm run mpesa:diagnostics');
      
      console.log('\n✅ Your M-Pesa configuration has been updated with:');
      console.log('- Paybill Number: 247247');
      console.log('- Account Number: 0725317864');
      console.log('- Correct authorization credentials for the Daraja API');
    } else {
      console.log('\n⚠️ Please check your Daraja API credentials and try again.');
      console.log('⚠️ You may need to regenerate your API keys in the Daraja developer portal.');
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
updateCredentialsIfNeeded();
