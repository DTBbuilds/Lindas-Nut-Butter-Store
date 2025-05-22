/**
 * M-Pesa Production Payment Test
 * This script tests small payments in the production environment
 * 
 * IMPORTANT: Only run this after deploying to production and configuring your environment
 */
require('dotenv').config();
const readline = require('readline');
const DarajaApi = require('./utils/darajaApi');
const { logMpesaTransaction } = require('./utils/mpesaLogger');
const mongoose = require('mongoose');
const config = require('./config');

// Set NODE_ENV to production for this test
process.env.NODE_ENV = 'production';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 * @param {string} question 
 * @returns {Promise<string>}
 */
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    console.log('📊 Connecting to MongoDB database...');
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB database:', error.message);
    return false;
  }
}

/**
 * Test M-Pesa payment
 * @param {string} phoneNumber 
 * @param {number} amount 
 */
async function testPayment(phoneNumber, amount) {
  try {
    console.log('\n🔄 Initiating test payment...');
    console.log(`Phone Number: ${phoneNumber}`);
    console.log(`Amount: KES ${amount}`);
    console.log(`Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
    
    // Generate test order ID
    const orderId = `TEST-${Date.now()}`;
    
    // Prepare the callback URL
    const callbackUrl = config.mpesa.callbackUrl;
    console.log(`Callback URL: ${callbackUrl}`);
    
    // Log the transaction attempt
    logMpesaTransaction('Test Payment Request', {
      phoneNumber,
      amount,
      orderId,
      callbackUrl,
      environment: config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'
    });
    
    // Initiate STK push
    const mpesaClient = new DarajaApi();
    const response = await mpesaClient.initiateSTK(
      phoneNumber,
      amount,
      orderId,
      `Test Payment #${orderId} at Linda's Nut Butter Store`,
      callbackUrl,
      'paybill' // Use 'paybill' or 'till' based on your configuration
    );
    
    console.log('\n✅ Payment request initiated successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    console.log('\n⏳ Waiting for payment completion...');
    console.log('Note: Check your phone for the payment prompt');
    console.log('The callback will be received at:', callbackUrl);
    
    // In a real scenario, you would now monitor the database for the callback
    console.log('\n🔍 In a production system, you would:');
    console.log('1. Monitor the database for the transaction completion');
    console.log('2. Check the server logs for callback received');
    console.log('3. Verify the transaction status with query API');
    
    return response;
  } catch (error) {
    console.error('❌ Payment test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

/**
 * Main function to run the test
 */
async function runTest() {
  console.log('🔍 M-Pesa Production Payment Test');
  console.log('================================');
  
  // Check environment
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    console.log('⚠️ This script is meant to be run in production environment');
    console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
    
    const proceed = await prompt('\nDo you want to proceed anyway? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('❌ Test aborted');
      rl.close();
      return;
    }
  }
  
  console.log('\n🔐 M-Pesa Configuration:');
  console.log(`Base URL: ${config.mpesa.baseUrl}`);
  console.log(`Consumer Key: ${config.mpesa.consumerKey ? config.mpesa.consumerKey.substring(0, 5) + '...' : 'Not set'}`);
  console.log(`Consumer Secret: ${config.mpesa.consumerSecret ? '********' : 'Not set'}`);
  console.log(`Paybill Number: ${config.mpesa.paybillNumber || 'Not set'}`);
  console.log(`Callback URL: ${config.mpesa.callbackUrl || 'Not set'}`);
  
  // Verify configuration
  if (!config.mpesa.consumerKey || !config.mpesa.consumerSecret || !config.mpesa.paybillNumber) {
    console.log('\n❌ M-Pesa configuration is incomplete. Please check your environment variables.');
    rl.close();
    return;
  }
  
  // Connect to database (optional)
  const dbConnected = await connectToDatabase();
  
  // Get phone number
  const phoneNumber = await prompt('\nEnter the phone number to test (e.g., 254722123456): ');
  
  // Get amount
  const amountInput = await prompt('Enter the amount to charge (KES, recommend 1 for testing): ');
  const amount = parseInt(amountInput) || 1;
  
  // Confirm before proceeding
  console.log(`\n⚠️ You are about to send a REAL payment request of KES ${amount} to ${phoneNumber}`);
  const confirm = await prompt('Are you sure you want to proceed? (y/n): ');
  
  if (confirm.toLowerCase() === 'y') {
    await testPayment(phoneNumber, amount);
    
    console.log('\n📝 Next steps:');
    console.log('1. Check the payment status through the M-Pesa app or SMS');
    console.log('2. Verify the callback was received on your server');
    console.log('3. Check the transaction record in your database');
    console.log('4. If successful, your system is ready for production!');
  } else {
    console.log('❌ Test aborted');
  }
  
  rl.close();
}

// Run the test
runTest();
