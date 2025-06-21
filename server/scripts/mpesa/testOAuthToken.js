/**
 * Test script to diagnose M-Pesa OAuth token generation issues
 * This script attempts multiple credential combinations to diagnose authentication issues
 */
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Create log directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file for detailed diagnostics
const logFile = path.join(logDir, 'mpesa-oauth-test.log');
fs.writeFileSync(logFile, `M-Pesa OAuth Test Log - ${new Date().toISOString()}\n\n`);

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

// Create an axios instance with extended timeout and SSL configuration
const mpesaAxios = axios.create({
  timeout: 30000, // 30 seconds
  httpsAgent: new https.Agent({
    rejectUnauthorized: true, // For production, should be true
    keepAlive: true
  }),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Test credentials to try
const testCredentials = [
  // Set 1: Official Safaricom documentation credentials
  {
    name: "Official Safaricom docs",
    consumerKey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    consumerSecret: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
  },
  // Set 2: Shorter credentials format (more common)
  {
    name: "Common format credentials 1",
    consumerKey: "GvzjNnYgNJtwgwfLBkZh65VPwfuKvs0V",
    consumerSecret: "oUs2ibY9pzL1A0Az"
  },
  // Set 3: Alternative shorter credentials 
  {
    name: "Common format credentials 2",
    consumerKey: "Wv9n49j0wzFtsZCm8gkcHGrKgWSbUDGl",
    consumerSecret: "WlZKf8AwPrD8RW0n"
  }
];

// Different ways to encode the auth header
const authMethods = [
  {
    name: "Standard base64 encoding",
    encode: (key, secret) => Buffer.from(`${key}:${secret}`).toString('base64')
  },
  {
    name: "URL-safe base64 encoding",
    encode: (key, secret) => Buffer.from(`${key}:${secret}`).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
  },
  {
    name: "No colon separator",
    encode: (key, secret) => Buffer.from(`${key}${secret}`).toString('base64')
  }
];

// Base URLs to try
const baseUrls = [
  "https://sandbox.safaricom.co.ke",
  "https://api.safaricom.co.ke"
];

// Test paths
const oauthPaths = [
  "/oauth/v1/generate?grant_type=client_credentials",
  "/oauth/v1/generate",  // Try without query params
  "/mpesa/oauth/v1/generate?grant_type=client_credentials"  // Try with /mpesa prefix
];

// Run all test combinations
async function runTests() {
  log("🔍 Starting M-Pesa OAuth token diagnostic tests");
  log("================================================");
  
  // Test all combinations
  for (const baseUrl of baseUrls) {
    log(`\n🌐 Testing with base URL: ${baseUrl}`);
    
    for (const credentials of testCredentials) {
      log(`\n🔑 Testing credentials set: ${credentials.name}`);
      
      for (const authMethod of authMethods) {
        log(`\n🔐 Using auth method: ${authMethod.name}`);
        
        for (const path of oauthPaths) {
          const url = `${baseUrl}${path}`;
          log(`\n📡 Testing URL: ${url}`);
          
          try {
            const auth = authMethod.encode(credentials.consumerKey, credentials.consumerSecret);
            log(`Auth header (first 15 chars): Basic ${auth.substring(0, 15)}...`);
            
            // Make the request
            const response = await mpesaAxios({
              method: 'get',
              url: url,
              headers: {
                'Authorization': `Basic ${auth}`
              },
              validateStatus: () => true // Don't throw on any status
            });
            
            // Log the response
            log(`Response status: ${response.status}`);
            log(`Response data: ${JSON.stringify(response.data, null, 2)}`);
            
            if (response.status === 200 && response.data.access_token) {
              log(`✅ SUCCESS! This combination works!`);
              log(`Working config:\n- Base URL: ${baseUrl}\n- Path: ${path}\n- Credentials: ${credentials.name}\n- Auth method: ${authMethod.name}`);
              log(`Sample access token (first 10 chars): ${response.data.access_token.substring(0, 10)}...`);
              log(`Expires in: ${response.data.expires_in} seconds`);
              
              // Save the working configuration
              const workingConfig = {
                baseUrl,
                path,
                credentials: {
                  name: credentials.name,
                  consumerKey: credentials.consumerKey,
                  consumerSecret: credentials.consumerSecret
                },
                authMethod: authMethod.name,
                sampleToken: response.data.access_token.substring(0, 10) + '...',
                expiresIn: response.data.expires_in
              };
              
              fs.writeFileSync(
                path.join(logDir, 'working-mpesa-config.json'), 
                JSON.stringify(workingConfig, null, 2)
              );
              
              log(`💾 Working configuration saved to logs/working-mpesa-config.json`);
            } else {
              log(`❌ This combination failed`);
            }
          } catch (error) {
            log(`❌ Error: ${error.message}`);
            if (error.response) {
              log(`Response status: ${error.response.status}`);
              log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
            }
          }
          
          log("------------------------------------------------");
        }
      }
    }
  }
  
  log("\n🏁 All tests completed");
  log(`📋 Full test log available at: ${logFile}`);
}

// Run the tests
runTests()
  .then(() => {
    log("✅ OAuth token test completed");
  })
  .catch((error) => {
    log(`❌ Fatal error: ${error.message}`);
  });
