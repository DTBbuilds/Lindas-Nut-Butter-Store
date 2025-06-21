/**
 * Test script for verifying the M-Pesa timestamp fix
 * This will attempt to make an STK push request with the fixed timestamp format
 */
const axios = require('axios');
const mpesaClient = require('./utils/darajaApi');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');
const config = require('./config');

// Clear existing logs for clean test
clearLogs();

console.log('🔍 TESTING M-PESA INTEGRATION WITH FIXED TIMESTAMP');
console.log('==================================================');

async function testMpesaIntegration() {
  try {
    // 1. Test OAuth token generation
    console.log('\n1️⃣ Testing OAuth token generation...');
    const token = await mpesaClient.getAccessToken();
    console.log('✅ OAuth token generated successfully:', token.substring(0, 10) + '...');
    
    // 2. Test timestamp generation
    console.log('\n2️⃣ Testing timestamp generation...');
    const { timestamp, password } = mpesaClient.generateStkPassword();
    console.log('Generated timestamp:', timestamp);
    console.log('Timestamp length:', timestamp.length);
    if (timestamp.length === 14) {
      console.log('✅ Timestamp format is correct (14 characters)');
    } else {
      console.log('❌ Timestamp format is incorrect! Expected 14 characters, got', timestamp.length);
    }
    
    // 3. Test STK Push with test phone number and minimal amount
    console.log('\n3️⃣ Testing STK Push with fixed timestamp...');
    const testPhone = '254708374149'; // Safaricom test number
    const testAmount = 1; // Minimal amount
    const testOrderId = 'TEST' + Date.now();
    
    try {
      const stkResponse = await mpesaClient.initiateSTK(
        testPhone,
        testAmount,
        testOrderId,
        'Timestamp fix test',
        config.mpesa.callbackUrl
      );
      
      console.log('✅ STK Push successful!');
      console.log('Response:', JSON.stringify(stkResponse, null, 2));
      return {
        success: true,
        message: 'The timestamp fix was successful! M-Pesa integration is working correctly.',
        response: stkResponse
      };
    } catch (error) {
      console.error('❌ STK Push failed:', error.message);
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        
        // Check if it's still a timestamp error
        if (error.response.data.errorMessage && error.response.data.errorMessage.includes('Invalid Timestamp')) {
          console.error('\n❌ TIMESTAMP FIX FAILED! Still getting Invalid Timestamp error.');
          console.error('Current timestamp format:', timestamp);
        }
      }
      
      return {
        success: false,
        message: 'STK Push failed with the fixed timestamp.',
        error: error.message,
        responseData: error.response?.data
      };
    }
  } catch (error) {
    console.error('Error running test:', error);
    return {
      success: false,
      message: 'Test failed with an unexpected error.',
      error: error.message
    };
  }
}

// Run the test
testMpesaIntegration()
  .then(result => {
    console.log('\n==================================================');
    console.log(result.success ? '✅ TEST PASSED!' : '❌ TEST FAILED!');
    console.log(result.message);
    
    if (!result.success && result.responseData?.errorMessage?.includes('Invalid Timestamp')) {
      console.log('\n🔧 RECOMMENDED FIX:');
      console.log('1. Double-check the timestamp formatting in darajaApi.js');
      console.log('2. Ensure the timestamp is exactly 14 characters in the format YYYYMMDDHHmmss');
      console.log('3. Test that the current timestamp being generated is appropriate for your time zone');
    }
    
    console.log('\nCheck the logs at server/logs/mpesa.log and server/logs/mpesa-error.log for more details.');
  })
  .catch(error => {
    console.error('Test execution failed:', error);
  });
