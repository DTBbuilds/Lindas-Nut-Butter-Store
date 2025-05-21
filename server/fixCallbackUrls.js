/**
 * Fix script for M-Pesa callback URLs
 * 
 * This script detects the ngrok URL and updates all M-Pesa callbacks to use it
 * instead of localhost, which Safaricom cannot reach.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');

// Start with clean logs
clearLogs();

console.log('\n🔄 FIXING M-PESA CALLBACK URLS');
console.log('==================================================');

/**
 * Get the active ngrok tunnel URL
 * @returns {Promise<string|null>} The ngrok URL or null if not found
 */
async function getNgrokUrl() {
  try {
    console.log('Checking for active ngrok tunnels...');
    const response = await axios.get('http://localhost:4040/api/tunnels');
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      const secureUrl = response.data.tunnels.find(t => t.proto === 'https')?.public_url;
      if (secureUrl) {
        console.log(`Found active ngrok tunnel: ${secureUrl}`);
        return secureUrl;
      }
    }
    
    console.log('No active ngrok tunnels found');
    return null;
  } catch (error) {
    console.error('Error getting ngrok URL:', error.message);
    return null;
  }
}

/**
 * Update the M-Pesa configuration to use the ngrok URL
 * @param {string} ngrokUrl - The ngrok URL to use for callbacks
 * @returns {Object} Updated callback URLs
 */
function updateMpesaConfig(ngrokUrl) {
  try {
    console.log(`Updating M-Pesa configuration with ngrok URL: ${ngrokUrl}`);
    
    // Use the mpesaHelpers utility to update the URLs
    const urls = updateCallbackUrls(ngrokUrl);
    
    // Log the results
    logMpesaTransaction('Updated Callback URLs', urls);
    
    return urls;
  } catch (error) {
    console.error('Error updating M-Pesa configuration:', error);
    logMpesaError('Config Update', error);
    return null;
  }
}

/**
 * Update the environment variables in the .env file
 * @param {Object} urls - The updated callback URLs
 */
function updateEnvFile(urls) {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Remove any existing callback URL settings
      envContent = envContent
        .replace(/^CALLBACK_URL=.*$/m, '')
        .replace(/^VALIDATION_URL=.*$/m, '')
        .replace(/^CONFIRMATION_URL=.*$/m, '')
        .replace(/\n\n+/g, '\n'); // Clean up multiple blank lines
    }
    
    // Add the new callback URL settings
    const newEnvVars = `
# M-Pesa Callback URLs - Updated at ${new Date().toISOString()}
CALLBACK_URL=${urls.callbackUrl}
VALIDATION_URL=${urls.validationUrl}
CONFIRMATION_URL=${urls.confirmationUrl}
`;
    
    // Write the updated .env file
    fs.writeFileSync(envPath, envContent + newEnvVars);
    console.log('Updated .env file with new callback URLs');
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

/**
 * Create an updated test script for M-Pesa integration
 * @param {Object} urls - The updated callback URLs
 */
function createTestScript(urls) {
  try {
    const testPath = path.join(__dirname, 'testMpesaWithNgrok.js');
    const scriptContent = `/**
 * Test script for M-Pesa integration with ngrok callbacks
 * 
 * This script tests the M-Pesa STK Push functionality using the ngrok URL for callbacks
 * Generated at: ${new Date().toISOString()}
 */
const mpesaClient = require('./utils/darajaApi');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');

// Clear logs before testing
clearLogs();

console.log('🔍 TESTING M-PESA INTEGRATION WITH NGROK CALLBACKS');
console.log('==================================================');
console.log('Using callback URL:', '${urls.callbackUrl}');

async function testMpesaWithNgrok() {
  try {
    // 1. Test OAuth token generation
    console.log('\\n1️⃣ Testing OAuth token generation...');
    const token = await mpesaClient.getAccessToken();
    console.log('✅ OAuth token generated successfully');
    
    // 2. Test STK Push with ngrok callback URL
    console.log('\\n2️⃣ Testing STK Push with ngrok callback...');
    const testPhone = '254708374149'; // Safaricom test number
    const testAmount = 1; // Minimal amount
    const testOrderId = 'TEST' + Date.now();
    
    try {
      const stkResponse = await mpesaClient.initiateSTK(
        testPhone,
        testAmount,
        testOrderId,
        'Ngrok callback test',
        '${urls.callbackUrl}' // Using ngrok callback URL
      );
      
      console.log('✅ STK Push successful!');
      console.log('CheckoutRequestID:', stkResponse.CheckoutRequestID);
      console.log('MerchantRequestID:', stkResponse.MerchantRequestID);
      
      console.log('\\n🔍 The STK push request has been sent to the phone number.');
      console.log('🔍 Check your server logs for callback responses from Safaricom.');
      console.log('🔍 The ngrok terminal should show incoming requests when callbacks are received.');
      
      return { success: true };
    } catch (error) {
      console.error('❌ STK Push failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      return { success: false, error };
    }
  } catch (error) {
    console.error('Error running test:', error);
    return { success: false, error };
  }
}

// Run the test
testMpesaWithNgrok()
  .then(result => {
    console.log('\\n==================================================');
    console.log(result.success ? '✅ TEST PASSED!' : '❌ TEST FAILED!');
    console.log('==================================================');
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });
`;
    
    fs.writeFileSync(testPath, scriptContent);
    console.log('Created test script with ngrok callbacks at:', testPath);
    console.log('You can run this with: node server/testMpesaWithNgrok.js');
  } catch (error) {
    console.error('Error creating test script:', error);
  }
}

// Main function to run the fix
async function main() {
  try {
    // Step 1: Get the ngrok URL
    const ngrokUrl = await getNgrokUrl();
    if (!ngrokUrl) {
      console.error('\n❌ ERROR: No active ngrok tunnel found!');
      console.error('Please start ngrok first with: npm run tunnel');
      return;
    }
    
    // Step 2: Update the M-Pesa configuration
    const urls = updateMpesaConfig(ngrokUrl);
    if (!urls) {
      console.error('\n❌ ERROR: Failed to update M-Pesa configuration!');
      return;
    }
    
    // Step 3: Update the .env file
    updateEnvFile(urls);
    
    // Step 4: Create a test script for the updated configuration
    createTestScript(urls);
    
    console.log('\n✅ CALLBACK URL FIX COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Your M-Pesa integration has been updated to use:');
    console.log(`Callback URL: ${urls.callbackUrl}`);
    console.log(`Validation URL: ${urls.validationUrl}`);
    console.log(`Confirmation URL: ${urls.confirmationUrl}`);
    console.log('\nTo test the fix, run:');
    console.log('node server/testMpesaWithNgrok.js');
  } catch (error) {
    console.error('Error fixing callback URLs:', error);
    console.error('\n❌ FIX FAILED!');
  }
}

// Run the fix
main();
