/**
 * M-Pesa Configuration Verification
 * This script safely verifies what paybill number and account number would be used
 * without actually sending any payment requests
 */
require('dotenv').config();
const config = require('./config');
const DarajaApi = require('./utils/darajaApi');

// First check the current NODE_ENV
console.log('======================================================');
console.log('M-PESA CONFIGURATION VERIFICATION - NO PAYMENTS SENT');
console.log('======================================================');

console.log(`\nCurrent NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaults to development)'}`);

// Check what values would be used in different environments
console.log('\n1. CHECKING CONFIGURATION VALUES:');
console.log('--------------------------------');

// Development environment check
const devConfig = {
  mpesa: {
    ...config.mpesa
  }
};

// Production environment simulation
process.env.NODE_ENV = 'production';
// Require config again to get production values
delete require.cache[require.resolve('./config')];
const prodConfig = require('./config');

// Reset NODE_ENV to original value
process.env.NODE_ENV = 'development';
// Reload original config
delete require.cache[require.resolve('./config')];
require('./config');

console.log('\nDevelopment Environment Values:');
console.log(`Base URL: ${devConfig.mpesa.baseUrl}`);
console.log(`Paybill Number: ${devConfig.mpesa.paybillNumber}`);
console.log(`Account Number: ${devConfig.mpesa.accountNumber}`);
console.log(`Till Number: ${devConfig.mpesa.tillNumber}`);

console.log('\nProduction Environment Values:');
console.log(`Base URL: ${prodConfig.mpesa.baseUrl}`);
console.log(`Paybill Number: ${prodConfig.mpesa.paybillNumber}`);
console.log(`Account Number: ${prodConfig.mpesa.accountNumber}`);
console.log(`Till Number: ${prodConfig.mpesa.tillNumber}`);

// Check if production values match the expected values
console.log('\n2. VERIFICATION AGAINST EXPECTED VALUES:');
console.log('-------------------------------------');

const expectedPaybill = '247247'; // Equity paybill
const expectedAccount = '0725317864'; // Your account number

console.log(`Expected Paybill: ${expectedPaybill}`);
console.log(`Actual Production Paybill: ${prodConfig.mpesa.paybillNumber}`);
console.log(`Status: ${prodConfig.mpesa.paybillNumber === expectedPaybill ? '✅ MATCH' : '❌ MISMATCH'}`);

console.log(`\nExpected Account: ${expectedAccount}`);
console.log(`Actual Production Account: ${prodConfig.mpesa.accountNumber}`);
console.log(`Status: ${prodConfig.mpesa.accountNumber === expectedAccount ? '✅ MATCH' : '❌ MISMATCH'}`);

// Verify the STK Push request payload that would be created
console.log('\n3. SIMULATING STK PUSH PAYLOAD (NO REQUEST SENT):');
console.log('----------------------------------------------');

// Mock the STK Push function to display the payload that would be sent
const mockSTKPush = (phoneNumber, amount, accountReference, baseUrl, paybill, account) => {
  // This is a simulation of what happens in the actual initiateSTK function
  // but without making any API calls
  
  console.log('\nSTK Push Request Payload (Production):');
  console.log('--------------------------------');
  console.log(`Phone Number: ${phoneNumber}`);
  console.log(`Amount: ${amount}`);
  console.log(`Account Reference: ${accountReference}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Business Short Code (Paybill): ${paybill}`);
  console.log(`Account Number: ${account}`);
  
  // What the actual payload would look like
  const samplePayload = {
    BusinessShortCode: paybill,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: paybill,
    PhoneNumber: phoneNumber,
    CallBackURL: 'https://example.com/callback',
    AccountReference: accountReference,
    TransactionDesc: `Payment for ${accountReference}`
  };
  
  console.log('\nFull Sample Payload:');
  console.log(JSON.stringify(samplePayload, null, 2));
};

// Simulate with development config
console.log('\nDEVELOPMENT ENVIRONMENT SIMULATION:');
mockSTKPush('254722123456', 1, 'TEST-ORDER-123', devConfig.mpesa.baseUrl, devConfig.mpesa.paybillNumber, devConfig.mpesa.accountNumber);

// Simulate with production config
console.log('\nPRODUCTION ENVIRONMENT SIMULATION:');
mockSTKPush('254722123456', 1, 'TEST-ORDER-123', prodConfig.mpesa.baseUrl, prodConfig.mpesa.paybillNumber, prodConfig.mpesa.accountNumber);

// Final verification and safety check
console.log('\n======================================================');
console.log('FINAL VERIFICATION RESULTS:');
console.log('======================================================');

if (prodConfig.mpesa.paybillNumber === expectedPaybill && 
    prodConfig.mpesa.accountNumber === expectedAccount) {
  console.log('✅ CONFIGURATION LOOKS CORRECT');
  console.log(`Paybill Number: ${prodConfig.mpesa.paybillNumber} ✓`);
  console.log(`Account Number: ${prodConfig.mpesa.accountNumber} ✓`);
} else {
  console.log('❌ CONFIGURATION ISSUES DETECTED');
  
  if (prodConfig.mpesa.paybillNumber !== expectedPaybill) {
    console.log(`Paybill Number: Expected ${expectedPaybill}, but got ${prodConfig.mpesa.paybillNumber}`);
  }
  
  if (prodConfig.mpesa.accountNumber !== expectedAccount) {
    console.log(`Account Number: Expected ${expectedAccount}, but got ${prodConfig.mpesa.accountNumber}`);
  }
}

console.log('\nIMPORTANT: No actual payment requests were sent during this test.');
console.log('This was only a configuration verification.');

/**
 * HOW TO PERFORM A REAL TEST SAFELY:
 * 
 * 1. Set NODE_ENV=production in your .env file
 * 2. Run this script again to verify the values are correct
 * 3. Use the testProductionPayment.js script with a small amount (1 KES)
 * 4. Verify the transaction details in the M-Pesa prompt on your phone
 */
