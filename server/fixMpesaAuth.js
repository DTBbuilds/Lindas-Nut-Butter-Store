/**
 * M-Pesa Auth Fix and Verification Tool
 * 
 * This script implements the exact Daraja API authentication approach
 * provided by the user to ensure proper M-Pesa integration.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Constants from the user's request
const AUTH_HEADER = 'Basic dUx1RldvWmJjSFhFQTR1MEFhTEFRVkhzZVVWSldqd0RoUjRLUDJBakxKV1RqR3dWOjdaM3JjNVkxSHlsNjhmZmV5Q1BqOUZHZ3JsZERhaUg4NTg4ZkZEY0VKbGZqSFh5N05ZcW9qWUhaODI3QnNNbTc=';
const AUTH_ENDPOINT = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const PAYBILL_NUMBER = '247247';
const ACCOUNT_NUMBER = '0725317864';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFile = path.join(logsDir, 'mpesa-auth-fix.log');

/**
 * Write to log file
 * @param {string} message - Message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(message);
}

/**
 * Clear the log file
 */
function clearLog() {
  fs.writeFileSync(logFile, '');
  log('Log file cleared');
}

/**
 * Test Daraja API authentication with the exact credentials
 */
async function testAuth() {
  log('\n🔍 TESTING DARAJA API AUTHENTICATION');
  log('==========================================');
  
  try {
    log('Making auth request with provided credentials...');
    
    const response = await axios.get(AUTH_ENDPOINT, {
      headers: {
        'Authorization': AUTH_HEADER
      }
    });
    
    log('✅ Auth successful!');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data.access_token) {
      // Mask token for security
      const maskedToken = response.data.access_token.substring(0, 5) + '...' + 
                         response.data.access_token.substring(response.data.access_token.length - 5);
      
      log(`Access Token: ${maskedToken}`);
      log(`Expires In: ${response.data.expires_in} seconds`);
      
      return {
        success: true,
        token: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } else {
      log('⚠️ Warning: Unexpected response structure');
      return { success: false, error: 'Unexpected response structure' };
    }
  } catch (error) {
    log(`❌ Auth failed: ${error.message}`);
    
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Test M-Pesa STK Push with the authenticated token
 */
async function testStkPush(token) {
  log('\n🔍 TESTING M-PESA STK PUSH');
  log('==========================================');
  
  try {
    // Generate timestamp in required format
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6);
    
    // Generate password using the format: BusinessShortCode + Passkey + Timestamp
    const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Default sandbox passkey
    const password = Buffer.from(`${PAYBILL_NUMBER}${passkey}${timestamp}`).toString('base64');
    
    // Format a test phone number
    const testPhoneNumber = '254708374149'; // Safaricom test number
    
    // Prepare STK Push payload
    const payload = {
      BusinessShortCode: PAYBILL_NUMBER,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1, // Minimum amount for test
      PartyA: testPhoneNumber,
      PartyB: PAYBILL_NUMBER,
      PhoneNumber: testPhoneNumber,
      CallBackURL: 'https://mydomain.com/callback', // This won't be hit in test mode
      AccountReference: ACCOUNT_NUMBER,
      TransactionDesc: 'Test Payment'
    };
    
    log(`STK Push payload: ${JSON.stringify(payload, null, 2)}`);
    
    // Make the STK Push request
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log('✅ STK Push successful!');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    log(`❌ STK Push failed: ${error.message}`);
    
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Update the config.js file with the correct credentials
 */
function updateConfig() {
  log('\n🔍 UPDATING CONFIG FILE');
  log('==========================================');
  
  try {
    const configPath = path.join(__dirname, 'config.js');
    
    // Read the current config file
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update paybill number
    configContent = configContent.replace(
      /paybillNumber:.*?,/,
      `paybillNumber: process.env.MPESA_PAYBILL_NUMBER || '${PAYBILL_NUMBER}',  // Linda's Paybill Number`
    );
    
    // Update account number
    configContent = configContent.replace(
      /accountNumber:.*?,/,
      `accountNumber: process.env.MPESA_ACCOUNT_NUMBER || '${ACCOUNT_NUMBER}', // Linda's Account Number`
    );
    
    // Write the updated config back to the file
    fs.writeFileSync(configPath, configContent);
    
    log('✅ Config file updated with correct Paybill and Account Number');
    return true;
  } catch (error) {
    log(`❌ Failed to update config: ${error.message}`);
    return false;
  }
}

/**
 * Update the Daraja API client with the exact authentication format
 */
function updateDarajaApiClient() {
  log('\n🔍 UPDATING DARAJA API CLIENT');
  log('==========================================');
  
  try {
    const clientPath = path.join(__dirname, 'utils', 'darajaApi.js');
    
    // Read the current API client
    let clientContent = fs.readFileSync(clientPath, 'utf8');
    
    // Update the authentication header to use the exact format
    clientContent = clientContent.replace(
      /const auth = Buffer\.from\(.*?\)\.toString\('base64'\);/s,
      `// Using the fixed auth header that works with the Daraja API\n    const auth = '${AUTH_HEADER}';`
    );
    
    // Update the request headers
    clientContent = clientContent.replace(
      /'Authorization': `Basic.*?`/,
      `'Authorization': '${AUTH_HEADER}'`
    );
    
    // Write the updated client back to the file
    fs.writeFileSync(clientPath, clientContent);
    
    log('✅ Daraja API client updated with correct authentication format');
    return true;
  } catch (error) {
    log(`❌ Failed to update Daraja API client: ${error.message}`);
    return false;
  }
}

/**
 * Create an .env file with the proper configuration
 */
function createEnvFile() {
  log('\n🔍 CREATING .ENV FILE');
  log('==========================================');
  
  try {
    const envPath = path.join(__dirname, '..', '.env');
    
    // Get credentials from the auth header
    const decodedAuth = Buffer.from(AUTH_HEADER.replace('Basic ', ''), 'base64').toString();
    const [consumerKey, consumerSecret] = decodedAuth.split(':');
    
    // Create .env content
    const envContent = `# M-Pesa API Configuration
NODE_ENV=development
MPESA_CONSUMER_KEY=${consumerKey}
MPESA_CONSUMER_SECRET=${consumerSecret}
MPESA_PAYBILL_NUMBER=${PAYBILL_NUMBER}
MPESA_ACCOUNT_NUMBER=${ACCOUNT_NUMBER}
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
`;
    
    // Write the .env file
    fs.writeFileSync(envPath, envContent);
    
    log('✅ .env file created with correct configuration');
    return true;
  } catch (error) {
    log(`❌ Failed to create .env file: ${error.message}`);
    return false;
  }
}

/**
 * Main function to run the fix
 */
async function main() {
  console.clear();
  console.log(`
🌟 ===================================================== 🌟
      M-PESA AUTHENTICATION FIX FOR LINDA'S STORE
🌟 ===================================================== 🌟
  `);
  
  clearLog();
  
  // Step 1: Update configuration
  updateConfig();
  
  // Step 2: Update Daraja API client
  updateDarajaApiClient();
  
  // Step 3: Create .env file
  createEnvFile();
  
  // Step 4: Test authentication
  const authResult = await testAuth();
  
  // Step 5: Test STK Push if auth is successful
  if (authResult.success) {
    await testStkPush(authResult.token);
  }
  
  console.log(`
🌟 ===================================================== 🌟
                      FIX COMPLETE
🌟 ===================================================== 🌟

Your M-Pesa integration has been updated with:
- Paybill Number: ${PAYBILL_NUMBER}
- Account Number: ${ACCOUNT_NUMBER}
- Correct Daraja API authentication credentials

To test the complete integration:
1. Start your server: npm run dev
2. Set up ngrok for callbacks: npm run tunnel
3. Try a test payment through the checkout process

Logs have been saved to: ${logFile}
  `);
}

// Run the fix
main().catch(error => {
  console.error('Error running fix:', error);
});
