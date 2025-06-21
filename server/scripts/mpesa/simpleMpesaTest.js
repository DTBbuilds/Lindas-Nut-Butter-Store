/**
 * Simple M-Pesa OAuth token test
 * This script attempts to get an OAuth token using different credential sets
 */
const axios = require('axios');

console.log('🔍 Starting Simple M-Pesa OAuth Token Test');
console.log('==========================================');

// Credential sets to test
const credentialSets = [
  {
    name: 'Common Format #1',
    consumerKey: 'GvzjNnYgNJtwgwfLBkZh65VPwfuKvs0V',
    consumerSecret: 'oUs2ibY9pzL1A0Az',
  },
  {
    name: 'Common Format #2',
    consumerKey: 'Wv9n49j0wzFtsZCm8gkcHGrKgWSbUDGl',
    consumerSecret: 'WlZKf8AwPrD8RW0n',
  },
  {
    name: 'Test Format',
    consumerKey: 'nk16Y9Gx64oVGYNzoPYYhuiqCEYoEr3k',
    consumerSecret: 'BfA6RpwI4GQE43m0',
  }
];

// Test a single credential set
async function testCredentials(credentials) {
  console.log(`\n🔑 Testing credentials: ${credentials.name}`);
  console.log(`Key: ${credentials.consumerKey.substring(0, 5)}...`);
  console.log(`Secret: ${credentials.consumerSecret.substring(0, 5)}...`);
  
  try {
    // Create base64 auth string
    const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
    console.log(`Auth header: Basic ${auth.substring(0, 10)}...`);
    
    // Make OAuth token request
    const response = await axios({
      method: 'get',
      url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 && response.data.access_token) {
      console.log(`✅ SUCCESS! These credentials work!`);
      console.log(`Token (first 10 chars): ${response.data.access_token.substring(0, 10)}...`);
      
      // Save credentials to config suggestions
      const suggestions = {
        credentials: credentials,
        token: {
          preview: response.data.access_token.substring(0, 10) + '...',
          expiresIn: response.data.expires_in
        },
        testedAt: new Date().toISOString()
      };
      
      console.log(`\n📝 CONFIG SUGGESTION:
module.exports = {
  mpesa: {
    consumerKey: '${credentials.consumerKey}',
    consumerSecret: '${credentials.consumerSecret}'
  }
};`);
      
      return true; // Return true if successful
    } else {
      console.log(`❌ These credentials failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Test all credential sets
async function runTests() {
  let anySuccess = false;
  
  for (const credentials of credentialSets) {
    const success = await testCredentials(credentials);
    if (success) {
      anySuccess = true;
      console.log('\n🎉 Found working credentials! You can use these in your config.js file.');
      break; // Stop after finding a working set
    }
  }
  
  if (!anySuccess) {
    console.log('\n❌ None of the tested credential sets worked.');
    console.log('💡 SUGGESTION: Register for your own Safaricom developer credentials at https://developer.safaricom.co.ke');
  }
  
  console.log('\n🏁 Test completed.');
}

// Run the tests
runTests();
