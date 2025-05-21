/**
 * Test script for M-Pesa STK Push with any phone number
 * 
 * This script allows testing the STK Push functionality with a real phone number
 * in the Safaricom Daraja API sandbox environment.
 */
const readline = require('readline');
const mpesaClient = require('./utils/darajaApi');
const config = require('./config');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');
const axios = require('axios');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Get the active ngrok URL
 * @returns {Promise<string|null>} The ngrok URL or null if not found
 */
async function getNgrokUrl() {
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels');
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      const secureUrl = response.data.tunnels.find(t => t.proto === 'https')?.public_url;
      if (secureUrl) {
        return secureUrl;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting ngrok URL:', error.message);
    return null;
  }
}

/**
 * Test STK Push with a given phone number
 * @param {string} phoneNumber - Phone number to test
 * @param {number} amount - Amount to charge
 * @returns {Promise<Object>} Test result
 */
async function testStkPush(phoneNumber, amount = 1) {
  try {
    // Clear logs for clean test
    clearLogs();
    
    console.log('\n🔍 TESTING M-PESA STK PUSH WITH PHONE NUMBER:', phoneNumber);
    console.log('==================================================');
    
    // Get ngrok URL for callbacks
    const ngrokUrl = await getNgrokUrl();
    if (!ngrokUrl) {
      console.error('❌ ERROR: No active ngrok tunnel found! Please start ngrok with: npm run tunnel');
      return { success: false, error: 'No active ngrok tunnel' };
    }
    
    console.log('Using ngrok URL for callbacks:', ngrokUrl);
    const callbackUrl = `${ngrokUrl}/api/mpesa/callback`;
    console.log('Callback URL:', callbackUrl);
    
    // 1. Test OAuth token generation
    console.log('\n1️⃣ Testing OAuth token generation...');
    const token = await mpesaClient.getAccessToken();
    console.log('✅ OAuth token generated successfully:', token.substring(0, 10) + '...');
    
    // 2. Format phone number
    console.log('\n2️⃣ Formatting phone number...');
    const formattedPhone = mpesaClient.formatPhoneNumber(phoneNumber);
    console.log('Formatted phone number:', formattedPhone);
    
    // 3. Generate transaction reference
    const transactionReference = 'TEST' + Date.now();
    console.log('Transaction reference:', transactionReference);
    
    // 4. Initiate STK Push
    console.log('\n3️⃣ Initiating STK Push...');
    console.log('Amount:', amount, 'KES');
    console.log('Paybill number:', config.mpesa.paybillNumber);
    console.log('Account number:', config.mpesa.accountNumber);
    
    const stkResponse = await mpesaClient.initiateSTK(
      formattedPhone,
      amount,
      transactionReference,
      'STK Push Test',
      callbackUrl
    );
    
    console.log('\n✅ STK Push initiated successfully!');
    console.log('CheckoutRequestID:', stkResponse.CheckoutRequestID);
    console.log('MerchantRequestID:', stkResponse.MerchantRequestID);
    console.log('ResponseCode:', stkResponse.ResponseCode);
    console.log('ResponseDescription:', stkResponse.ResponseDescription);
    console.log('CustomerMessage:', stkResponse.CustomerMessage);
    
    // 5. Check the user's phone
    console.log('\n🔔 CHECK YOUR PHONE NOW 🔔');
    console.log('A payment prompt should appear on the phone number:', phoneNumber);
    console.log('You can either:');
    console.log('  - Accept the payment to test a successful transaction');
    console.log('  - Cancel the payment to test a failed transaction');
    console.log('  - Wait for it to timeout to test a timeout scenario');
    
    // 6. Wait for user to indicate they've completed the test
    return new Promise((resolve) => {
      setTimeout(() => {
        rl.question('\nDid you receive the payment prompt on your phone? (yes/no): ', (answer) => {
          const received = answer.toLowerCase() === 'yes';
          
          if (received) {
            console.log('\n✅ Test completed successfully!');
            console.log('The STK push was sent to your phone. Check the server logs for callback responses.');
            resolve({ 
              success: true, 
              stkResponse,
              phoneNumber: formattedPhone,
              callbackUrl
            });
          } else {
            console.log('\n❌ Test failed - No payment prompt received.');
            console.log('This could be due to:');
            console.log('1. Phone number not registered for M-Pesa');
            console.log('2. Using a non-Safaricom number');
            console.log('3. Network issues');
            console.log('4. Incorrect API credentials');
            console.log('\nCheck the logs at server/logs/mpesa-error.log for details.');
            
            resolve({ 
              success: false, 
              error: 'No payment prompt received',
              stkResponse,
              phoneNumber: formattedPhone,
              callbackUrl
            });
          }
        });
      }, 5000); // Give a few seconds for the prompt to appear
    });
  } catch (error) {
    console.error('\n❌ Error initiating STK Push:', error.message);
    
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Provide helpful guidance based on error codes
      if (error.response.data.errorCode === '400.002.02') {
        if (error.response.data.errorMessage.includes('Invalid CallBackURL')) {
          console.error('\n❗ The callback URL is invalid. Make sure ngrok is running and fix the callback URLs.');
          console.error('Run: node server/fixCallbackUrls.js');
        } else if (error.response.data.errorMessage.includes('Invalid Timestamp')) {
          console.error('\n❗ The timestamp format is incorrect. Check the timestamp generation in darajaApi.js.');
        }
      } else if (error.response.data.errorCode === '401.002.01') {
        console.error('\n❗ Authentication failed. Check your Daraja API credentials.');
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      errorData: error.response?.data
    };
  }
}

/**
 * Main function to run the test
 */
async function main() {
  console.clear();
  console.log(`
🌟 ===================================================== 🌟
       M-PESA STK PUSH TEST IN SANDBOX ENVIRONMENT
🌟 ===================================================== 🌟
  `);
  
  rl.question('Enter the phone number to test (e.g., 0722123456): ', (phoneNumber) => {
    rl.question('Enter amount to charge (KES, default: 1): ', async (amountStr) => {
      const amount = amountStr ? parseInt(amountStr, 10) : 1;
      
      console.log(`\nTesting with phone number: ${phoneNumber}, amount: ${amount} KES`);
      
      try {
        const result = await testStkPush(phoneNumber, amount);
        
        // Additional information after test
        console.log('\n==================================================');
        console.log('IMPORTANT INFORMATION:');
        console.log('1. In sandbox environment, STK callbacks may not be received.');
        console.log('2. Check your server logs for any error messages.');
        console.log('3. Real payments will not be processed in the sandbox.');
        console.log('4. For testing with Safaricom test numbers:');
        console.log('   - Success: 254708374149');
        console.log('   - Insufficient funds: 254708374150');
        console.log('   - Failed transaction: 254708374151');
        
        rl.close();
      } catch (error) {
        console.error('\nError running the test:', error);
        rl.close();
      }
    });
  });
}

// Run the test
main();
