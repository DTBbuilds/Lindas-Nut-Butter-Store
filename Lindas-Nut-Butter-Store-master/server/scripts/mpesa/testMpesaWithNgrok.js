/**
 * Test script for M-Pesa integration with ngrok callbacks
 * 
 * This script tests the M-Pesa STK Push functionality using the ngrok URL for callbacks
 * Generated at: 2025-05-11T14:33:15.051Z
 */
const mpesaClient = require('./utils/darajaApi');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');

// Clear logs before testing
clearLogs();

console.log('🔍 TESTING M-PESA INTEGRATION WITH NGROK CALLBACKS');
console.log('==================================================');
console.log('Using callback URL:', 'https://b58b-41-90-70-188.ngrok-free.app/api/mpesa/callback');

async function testMpesaWithNgrok() {
  try {
    // 1. Test OAuth token generation
    console.log('\n1️⃣ Testing OAuth token generation...');
    const token = await mpesaClient.getAccessToken();
    console.log('✅ OAuth token generated successfully');
    
    // 2. Test STK Push with ngrok callback URL
    console.log('\n2️⃣ Testing STK Push with ngrok callback...');
    const testPhone = '254708374149'; // Safaricom test number
    const testAmount = 1; // Minimal amount
    const testOrderId = 'TEST' + Date.now();
    
    try {
      const stkResponse = await mpesaClient.initiateSTK(
        testPhone,
        testAmount,
        testOrderId,
        'Ngrok callback test',
        'https://b58b-41-90-70-188.ngrok-free.app/api/mpesa/callback' // Using ngrok callback URL
      );
      
      console.log('✅ STK Push successful!');
      console.log('CheckoutRequestID:', stkResponse.CheckoutRequestID);
      console.log('MerchantRequestID:', stkResponse.MerchantRequestID);
      
      console.log('\n🔍 The STK push request has been sent to the phone number.');
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
    console.log('\n==================================================');
    console.log(result.success ? '✅ TEST PASSED!' : '❌ TEST FAILED!');
    console.log('==================================================');
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });
