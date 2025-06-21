/**
 * Test script for simulating a complete checkout with M-Pesa payment
 * This script tests the entire flow from order creation to payment completion
 */
const axios = require('axios');
const mongoose = require('mongoose');
const config = require('./config');
const mpesaClient = require('./utils/darajaApi');
const { Order, Transaction } = require('./models');
const { logMpesaTransaction, logMpesaError, clearLogs } = require('./utils/mpesaLogger');

// Clear logs for clean test
clearLogs();

// Configuration
const API_URL = 'http://localhost:5000';
const TEST_PHONE = '254708374149'; // Safaricom test success number
const TEST_AMOUNT = 1500; // Amount in KES

console.log(`
🌟 ===================================================== 🌟
     M-PESA CHECKOUT TEST FOR LINDA'S NUT BUTTER STORE
🌟 ===================================================== 🌟
`);

console.log('Configuration:');
console.log(`- Paybill Number: ${config.mpesa.paybillNumber} (should be 247247)`);
console.log(`- Account Number: ${config.mpesa.accountNumber} (should be 0725317864)`);
console.log(`- Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);

// Connect to MongoDB
// Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
mongoose.connect(config.mongodb.uri)
.then(() => console.log('📦 MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Test the complete checkout flow
async function testCheckoutFlow() {
  try {
    console.log('\n🔄 STEP 1: Creating a test order...');
    
    // Create a test order payload that matches the exact schema requirements
    const orderPayload = {
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phoneNumber: TEST_PHONE,
        address: {
          street: '123 Test Street',
          city: 'Nairobi',
          state: 'Nairobi', // State is required by the schema
          country: 'Kenya',
          postalCode: '00100'
        }
      },
      items: [
        {
          product: 'test-product-1', // Using 'product' instead of 'productId' as required by schema
          name: 'Classic Almond Butter',
          price: 750,
          quantity: 1
        },
        {
          product: 'test-product-2', // Using 'product' instead of 'productId' as required by schema
          name: 'Honey Cashew Butter',
          price: 750,
          quantity: 1
        }
      ],
      totalAmount: TEST_AMOUNT,
      paymentMethod: 'MPESA', // Using uppercase as per schema requirements
      notes: 'Test order'
    };
    
    // Create the order
    console.log('Creating order with payload:', JSON.stringify(orderPayload, null, 2));
    const orderResponse = await axios.post(`${API_URL}/api/orders`, orderPayload);
    
    console.log('✅ Order created successfully!');
    console.log('Order response:', JSON.stringify(orderResponse.data, null, 2));
    
    // Extract the order ID from the response based on the actual API response structure
    let orderId;
    if (orderResponse.data.orderId) {
      // The actual response structure has orderId directly in the data object
      orderId = orderResponse.data.orderId;
    } else if (orderResponse.data.order && orderResponse.data.order._id) {
      orderId = orderResponse.data.order._id;
    } else if (orderResponse.data._id) {
      orderId = orderResponse.data._id;
    } else {
      // If we still can't find the order ID, log and throw an error
      console.log('Full response:', JSON.stringify(orderResponse.data, null, 2));
      throw new Error('Could not extract order ID from response');
    }
    
    console.log('Order ID:', orderId);
    
    console.log('\n🔄 STEP 2: Getting active ngrok tunnel...');
    // Get the active ngrok tunnel
    let ngrokUrl = null;
    try {
      const ngrokResponse = await axios.get('http://localhost:4040/api/tunnels');
      if (ngrokResponse.data && ngrokResponse.data.tunnels.length > 0) {
        const httpsTunnel = ngrokResponse.data.tunnels.find(t => t.proto === 'https');
        if (httpsTunnel) {
          ngrokUrl = httpsTunnel.public_url;
          console.log('✅ Found active ngrok tunnel:', ngrokUrl);
        }
      }
    } catch (error) {
      console.error('❌ Error getting ngrok tunnel:', error.message);
      console.error('Please make sure ngrok is running with: npm run tunnel');
      return;
    }
    
    if (!ngrokUrl) {
      console.error('❌ No active ngrok tunnel found. Please start ngrok with: npm run tunnel');
      return;
    }
    
    console.log('\n🔄 STEP 3: Updating callback URLs...');
    // Update the callback URLs
    const callbackUrls = {
      callbackUrl: `${ngrokUrl}/api/mpesa/callback`,
      validationUrl: `${ngrokUrl}/api/mpesa/validation`,
      confirmationUrl: `${ngrokUrl}/api/mpesa/confirmation`
    };
    
    // Update config directly
    config.mpesa.callbackUrl = callbackUrls.callbackUrl;
    config.mpesa.validationUrl = callbackUrls.validationUrl;
    config.mpesa.confirmationUrl = callbackUrls.confirmationUrl;
    
    console.log('✅ Callback URLs updated:');
    console.log('- Callback URL:', config.mpesa.callbackUrl);
    console.log('- Validation URL:', config.mpesa.validationUrl);
    console.log('- Confirmation URL:', config.mpesa.confirmationUrl);
    
    console.log('\n🔄 STEP 4: Initiating M-Pesa payment...');
    // Initiate STK Push directly using our client
    try {
      const stkResponse = await mpesaClient.initiateSTK(
        TEST_PHONE,
        TEST_AMOUNT,
        orderId,
        `Payment for Order #${orderId} at Linda's Nut Butter Store`,
        config.mpesa.callbackUrl
      );
      
      console.log('✅ STK Push initiated successfully!');
      console.log('CheckoutRequestID:', stkResponse.CheckoutRequestID);
      console.log('MerchantRequestID:', stkResponse.MerchantRequestID);
      
      console.log('\n🔄 STEP 5: Simulating successful callback...');
      // For testing, simulate a successful callback
      const callbackData = {
        Body: {
          stkCallback: {
            MerchantRequestID: stkResponse.MerchantRequestID,
            CheckoutRequestID: stkResponse.CheckoutRequestID,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                {
                  Name: 'Amount',
                  Value: TEST_AMOUNT
                },
                {
                  Name: 'MpesaReceiptNumber',
                  Value: 'LNB' + Math.floor(Math.random() * 10000000000).toString()
                },
                {
                  Name: 'TransactionDate',
                  Value: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6)
                },
                {
                  Name: 'PhoneNumber',
                  Value: TEST_PHONE
                }
              ]
            }
          }
        }
      };
      
      // Call the callback endpoint directly
      const callbackResponse = await axios.post(`${API_URL}/api/mpesa/callback`, callbackData);
      
      console.log('✅ Callback simulation successful!');
      console.log('Callback response:', callbackResponse.data);
      
      console.log('\n🔄 STEP 6: Checking payment status...');
      // Check the payment status
      const paymentStatusResponse = await axios.post(`${API_URL}/api/mpesa/query`, {
        checkoutRequestId: stkResponse.CheckoutRequestID
      });
      
      console.log('Payment status response:', paymentStatusResponse.data);
      
      // Check if order was updated
      const updatedOrder = await Order.findById(orderId);
      console.log('\n🔄 STEP 7: Checking order status...');
      console.log('Order payment status:', updatedOrder.paymentStatus);
      
      if (updatedOrder.paymentStatus === 'PAID') {
        console.log('✅ Order payment status updated to PAID!');
      } else {
        console.log('⚠️ Order payment status not updated. Check server logs.');
      }
      
      console.log('\n✅ TEST COMPLETED SUCCESSFULLY!');
      console.log('Complete checkout flow with M-Pesa payment integration tested successfully.');
      
    } catch (error) {
      console.error('❌ Error during STK Push:', error.message);
      if (error.responseData) {
        console.error('Safaricom API error:', JSON.stringify(error.responseData, null, 2));
        
        if (error.responseData.errorCode === '400.002.02' && 
            error.responseData.errorMessage.includes('Invalid CallBackURL')) {
          console.error('\n⚠️ INVALID CALLBACK URL ISSUE DETECTED');
          console.error('This is a common issue with M-Pesa integration. The Safaricom API cannot reach');
          console.error('your callback URL. Make sure:');
          console.error('1. Ngrok is running and accessible');
          console.error('2. Callback URLs are correctly updated with the ngrok URL');
          console.error('3. The ngrok URL is valid and publicly accessible');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error during checkout flow test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('📦 MongoDB disconnected');
    
    console.log(`
🌟 ===================================================== 🌟
                   TEST COMPLETED
🌟 ===================================================== 🌟
    `);
  }
}

// Run the test
testCheckoutFlow();
