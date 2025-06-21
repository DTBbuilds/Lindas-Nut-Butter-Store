/**
 * Comprehensive test script for Linda's Nut Butter Store M-Pesa integration
 * Tests the complete checkout flow with M-Pesa payment using paybill 247247
 */
const axios = require('axios');
const mongoose = require('mongoose');
const readline = require('readline');
const config = require('./config');
const { Order } = require('./models');
const mpesaClient = require('./utils/darajaApi');
const { updateCallbackUrls } = require('./utils/darajaApi');
const { logMpesaTransaction, clearLogs } = require('./utils/mpesaLogger');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Clear logs for clean test
clearLogs();

// Configuration
const API_URL = 'http://localhost:5000';
const DEFAULT_AMOUNT = 1; // Minimum amount for testing

console.log(`
🌟 ===================================================== 🌟
     LINDA'S NUT BUTTER STORE M-PESA INTEGRATION TEST
🌟 ===================================================== 🌟
`);

console.log('Configuration:');
console.log(`- API Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`- Paybill Number: ${config.mpesa.paybillNumber} (should be 247247)`);
console.log(`- Account Number: ${config.mpesa.accountNumber} (should be 0725317864)`);

/**
 * Get user input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  try {
    console.log('\n🔄 Connecting to MongoDB...');
    // Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ MongoDB connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

/**
 * Get active ngrok URL
 */
async function getActiveNgrokUrl() {
  try {
    console.log('\n🔄 Getting active ngrok tunnel...');
    const ngrokResponse = await axios.get('http://localhost:4040/api/tunnels');
    
    if (ngrokResponse.data && ngrokResponse.data.tunnels.length > 0) {
      const httpsTunnel = ngrokResponse.data.tunnels.find(t => t.proto === 'https');
      if (httpsTunnel) {
        const ngrokUrl = httpsTunnel.public_url;
        console.log('✅ Found active ngrok tunnel:', ngrokUrl);
        return ngrokUrl;
      }
    }
    
    console.error('❌ No active ngrok tunnel found');
    console.error('Please start ngrok with: npm run tunnel');
    return null;
  } catch (error) {
    console.error('❌ Error getting ngrok tunnel:', error.message);
    console.error('Please make sure ngrok is running with: npm run tunnel');
    return null;
  }
}

/**
 * Update callback URLs
 */
async function setupCallbackUrls(ngrokUrl) {
  console.log('\n🔄 Updating callback URLs...');
  
  if (!ngrokUrl) {
    console.error('❌ Cannot update callback URLs without ngrok URL');
    return false;
  }
  
  try {
    const updatedUrls = updateCallbackUrls(ngrokUrl);
    
    console.log('✅ Callback URLs updated:');
    console.log('- Callback URL:', updatedUrls.callbackUrl);
    console.log('- Validation URL:', updatedUrls.validationUrl);
    console.log('- Confirmation URL:', updatedUrls.confirmationUrl);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating callback URLs:', error.message);
    return false;
  }
}

/**
 * Create a test order
 */
async function createTestOrder(phoneNumber) {
  console.log('\n🔄 Creating a test order...');
  
  try {
    // Create a test order payload
    const orderPayload = {
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phoneNumber: phoneNumber,
        address: {
          street: '123 Test Street',
          city: 'Nairobi',
          state: 'Nairobi',
          country: 'Kenya',
          postalCode: '00100'
        }
      },
      items: [
        {
          product: 'test-product-1',
          name: 'Classic Almond Butter',
          price: DEFAULT_AMOUNT,
          quantity: 1
        }
      ],
      totalAmount: DEFAULT_AMOUNT,
      paymentMethod: 'MPESA',
      notes: 'Test order from comprehensive test script'
    };
    
    console.log('Creating order with payload:', JSON.stringify(orderPayload, null, 2));
    
    // Create the order
    const orderResponse = await axios.post(`${API_URL}/api/orders`, orderPayload);
    
    console.log('✅ Order created successfully!');
    
    // Extract order ID based on the response structure
    let orderId;
    if (orderResponse.data.order && orderResponse.data.order._id) {
      orderId = orderResponse.data.order._id;
    } else if (orderResponse.data.orderId) {
      orderId = orderResponse.data.orderId;
    } else if (orderResponse.data._id) {
      orderId = orderResponse.data._id;
    } else {
      console.error('❌ Could not extract order ID from response');
      console.log('Full response:', JSON.stringify(orderResponse.data, null, 2));
      return null;
    }
    
    console.log('Order ID:', orderId);
    return orderId;
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * Initiate STK Push
 */
async function initiatePayment(phoneNumber, amount, orderId) {
  console.log('\n🔄 Initiating M-Pesa payment...');
  
  try {
    // Get the callback URL
    const callbackUrl = config.mpesa.callbackUrl;
    console.log('Using callback URL:', callbackUrl);
    
    // Initiate STK Push
    const response = await mpesaClient.initiateSTK(
      phoneNumber,
      amount,
      orderId,
      `Payment for Order #${orderId} at Linda's Nut Butter Store`,
      callbackUrl
    );
    
    console.log('✅ STK Push initiated successfully!');
    console.log('CheckoutRequestID:', response.CheckoutRequestID);
    console.log('MerchantRequestID:', response.MerchantRequestID);
    
    return {
      checkoutRequestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID
    };
  } catch (error) {
    console.error('❌ Error initiating payment:', error.message);
    if (error.responseData) {
      console.error('Safaricom API error:', error.responseData);
    }
    return null;
  }
}

/**
 * Query payment status
 */
async function queryPaymentStatus(checkoutRequestId) {
  console.log('\n🔄 Querying payment status...');
  
  try {
    // Wait a bit for the payment to be processed
    console.log('Waiting 5 seconds for payment processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Query the payment status
    const response = await axios.post(`${API_URL}/api/mpesa/query`, {
      checkoutRequestId: checkoutRequestId
    });
    
    console.log('✅ Payment status query successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error querying payment status:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * Check order status
 */
async function checkOrderStatus(orderId) {
  console.log('\n🔄 Checking order status...');
  
  try {
    // Get the order from the database
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('❌ Order not found');
      return null;
    }
    
    console.log('Order payment status:', order.paymentStatus);
    console.log('Order status:', order.status);
    
    return order;
  } catch (error) {
    console.error('❌ Error checking order status:', error.message);
    return null;
  }
}

/**
 * Run the complete test
 */
async function runTest() {
  try {
    // Connect to MongoDB
    const dbConnected = await connectToMongoDB();
    if (!dbConnected) return;
    
    // Get phone number from user
    const phoneNumber = await askQuestion('\nEnter your phone number (format: 254XXXXXXXXX): ');
    
    // Get active ngrok URL
    const ngrokUrl = await getActiveNgrokUrl();
    if (!ngrokUrl) return;
    
    // Update callback URLs
    const callbacksUpdated = await setupCallbackUrls(ngrokUrl);
    if (!callbacksUpdated) return;
    
    // Create a test order
    const orderId = await createTestOrder(phoneNumber);
    if (!orderId) return;
    
    // Ask if user wants to proceed with payment
    const proceedWithPayment = await askQuestion('\nDo you want to proceed with the M-Pesa payment? (y/n): ');
    
    if (proceedWithPayment.toLowerCase() !== 'y') {
      console.log('Test aborted by user');
      return;
    }
    
    // Initiate payment
    const paymentInfo = await initiatePayment(phoneNumber, DEFAULT_AMOUNT, orderId);
    if (!paymentInfo) return;
    
    // Ask user to check their phone
    console.log('\n📱 Please check your phone for the STK push notification');
    console.log('Complete the payment on your phone');
    
    // Ask user if they completed the payment
    const paymentCompleted = await askQuestion('\nDid you complete the payment on your phone? (y/n): ');
    
    if (paymentCompleted.toLowerCase() === 'y') {
      // Query payment status
      await queryPaymentStatus(paymentInfo.checkoutRequestId);
      
      // Check order status
      await checkOrderStatus(orderId);
    } else {
      console.log('Payment not completed by user');
    }
    
    console.log(`
🌟 ===================================================== 🌟
                   TEST COMPLETED
🌟 ===================================================== 🌟
    `);
  } catch (error) {
    console.error('❌ Unexpected error during test:', error.message);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('📦 MongoDB disconnected');
    
    // Close readline interface
    rl.close();
  }
}

// Run the test
runTest();
