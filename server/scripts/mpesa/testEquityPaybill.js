/**
 * Test M-Pesa Integration with Equity Paybill
 * This script performs a real test with the Equity paybill number
 */

// Load the production environment settings
require('../temp_prod_env');
const readline = require('readline');
const mpesaApi = require('./utils/darajaApi'); // Import as object, not constructor
const config = require('./config');

// Create readline interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

// Main test function
async function testEquityPayment() {
  console.log('=======================================================');
  console.log('    EQUITY PAYBILL M-PESA INTEGRATION TEST');
  console.log('=======================================================');
  
  // Verify production environment
  console.log(`\nEnvironment: ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`Base URL: ${config.mpesa.baseUrl}`);
  console.log(`Paybill Number: ${config.mpesa.paybillNumber}`);
  console.log(`Account Number: ${config.mpesa.accountNumber}`);
  
  // Confirm we're in production mode with Equity paybill
  if (process.env.NODE_ENV !== 'production' || config.mpesa.paybillNumber !== '247247') {
    console.error('❌ ERROR: Not running in production mode or paybill number is not Equity (247247)');
    console.error('Please run with NODE_ENV=production to use your actual Equity paybill');
    rl.close();
    return;
  }
  
  console.log('\n⚠️ WARNING: This will initiate a REAL M-Pesa payment request');
  console.log('⚠️ Your phone will receive an actual STK push prompt');
  console.log('⚠️ Test with a SMALL amount (1 KES) to minimize cost');
  
  const proceed = await prompt('\n🔍 Do you want to proceed with the test? (yes/no): ');
  
  if (proceed.toLowerCase() !== 'yes') {
    console.log('❌ Test cancelled');
    rl.close();
    return;
  }
  
  // Get phone number
  let phoneNumber = await prompt('\n📱 Enter your phone number (e.g., 0722123456): ');
  
  // Basic validation
  if (!phoneNumber) {
    console.error('❌ Phone number is required');
    rl.close();
    return;
  }
  
  // Get amount (with default of 1)
  const amountInput = await prompt('💰 Enter amount to pay (KES, recommended: 1): ');
  const amount = parseInt(amountInput) || 1;
  
  console.log(`\n🔄 Initiating payment request:`);
  console.log(`   - Phone: ${phoneNumber}`);
  console.log(`   - Amount: ${amount} KES`);
  console.log(`   - Paybill: ${config.mpesa.paybillNumber} (Equity)`);
  console.log(`   - Account: ${config.mpesa.accountNumber}`);
  
  // Final confirmation
  const finalConfirm = await prompt('\n⚠️ FINAL CONFIRMATION: Send payment request? (yes/no): ');
  
  if (finalConfirm.toLowerCase() !== 'yes') {
    console.log('❌ Test cancelled');
    rl.close();
    return;
  }
  
  try {
    console.log('\n🔄 Sending M-Pesa STK push request...');
    
    // Create test order ID
    const orderId = `TEST-${Date.now()}`;
    
    // Use the default callback URL from config
    const callbackUrl = config.mpesa.callbackUrl;
    console.log(`📡 Callback URL: ${callbackUrl}`);
    
    // Initiate STK push directly from the imported module
    const response = await mpesaApi.initiateSTK(
      phoneNumber,
      amount,
      orderId,
      `Test Payment for Linda's Nut Butter`,
      callbackUrl,
      'paybill' // Using paybill mode for Equity
    );
    
    console.log('\n✅ STK push request sent successfully!');
    console.log('📱 Check your phone for the payment prompt');
    console.log('\nResponse details:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n⚠️ IMPORTANT: Verify these details on your phone:');
    console.log(`1. The prompt should show "Equity Bank" or your business name`);
    console.log(`2. The paybill number should be ${config.mpesa.paybillNumber}`);
    console.log(`3. The account number should be ${config.mpesa.accountNumber}`);
    
    // Prompt for verification
    const verified = await prompt('\n✅ Did the payment prompt show the correct details? (yes/no): ');
    
    if (verified.toLowerCase() === 'yes') {
      console.log('\n🎉 SUCCESS! Your Equity paybill integration is working correctly');
      console.log('You can now use this configuration for production payments');
    } else {
      console.log('\n⚠️ Please check your configuration and try again');
      console.log('Ensure your Safaricom credentials and paybill details are correct');
    }
    
  } catch (error) {
    console.error('\n❌ Error initiating payment:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\n⚠️ Troubleshooting steps:');
    console.log('1. Verify your Safaricom API credentials');
    console.log('2. Check that your paybill is active');
    console.log('3. Ensure your callback URL is accessible');
    console.log('4. Verify your phone number format (try with country code 254)');
  }
  
  rl.close();
}

// Run the test
testEquityPayment();
