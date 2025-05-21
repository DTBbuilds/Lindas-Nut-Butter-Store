/**
 * Test Script for M-Pesa Integration
 * 
 * This script allows testing various M-Pesa API functionality without needing a frontend
 * It uses the same controllers that the API routes use
 */
const axios = require('axios');
const readline = require('readline');
const config = require('./config');
const mpesaController = require('./controllers/mpesaController');
const { formatPhoneNumber } = require('./utils/mpesaHelpers');
const mongoose = require('mongoose');
const { Order, Transaction } = require('./models');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
// Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
mongoose.connect(config.mongodb.uri)
.then(() => console.log('MongoDB connected for testing'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Mock Express request and response objects
const createMockReq = (body = {}) => ({ body });
const createMockRes = () => {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.data = data;
      console.log('\nResponse:');
      console.log(JSON.stringify(data, null, 2));
      return res;
    },
    statusCode: 200,
    data: null
  };
  return res;
};

// Test API connection
const testApiConnection = async () => {
  console.log('\n🔄 Testing M-Pesa API connection...');
  
  const req = createMockReq();
  const res = createMockRes();
  
  await mpesaController.testConnection(req, res);
  
  if (res.statusCode === 200 && res.data.success) {
    console.log('✅ M-Pesa API connection successful!');
  } else {
    console.log('❌ M-Pesa API connection failed!');
  }
  
  return res.data;
};

// Initiate STK Push test
const testStkPush = async (phoneNumber, amount, orderId) => {
  console.log(`\n🔄 Initiating STK Push to ${phoneNumber} for KES ${amount}...`);
  
  const req = createMockReq({ 
    phoneNumber,
    amount,
    orderId 
  });
  const res = createMockRes();
  
  await mpesaController.initiateSTKPush(req, res);
  
  if (res.statusCode === 200 && res.data.success) {
    console.log('✅ STK Push initiated successfully!');
    console.log('📱 Check your phone for the STK Push prompt');
    
    // Return checkout request ID for subsequent query
    return {
      checkoutRequestId: res.data.data.CheckoutRequestID,
      merchantRequestId: res.data.data.MerchantRequestID
    };
  } else {
    console.log('❌ STK Push failed!');
    return null;
  }
};

// Query transaction status
const queryTransactionStatus = async (checkoutRequestId) => {
  console.log(`\n🔄 Querying transaction status for ${checkoutRequestId}...`);
  
  const req = createMockReq({ checkoutRequestId });
  const res = createMockRes();
  
  await mpesaController.queryTransactionStatus(req, res);
  
  if (res.statusCode === 200 && res.data.success) {
    console.log('✅ Transaction query successful!');
    
    // Check for test mode vs real response
    if (res.data.testMode) {
      console.log('🧪 Running in test mode - transaction result is simulated');
    }
    
    const resultCode = res.data.data.ResultCode;
    if (resultCode === '0') {
      console.log('💰 Payment successful!');
    } else {
      console.log(`❌ Payment failed with result code ${resultCode}: ${res.data.data.ResultDesc}`);
    }
  } else {
    console.log('❌ Transaction query failed!');
  }
  
  return res.data;
};

// Show latest transactions
const showLatestTransactions = async (limit = 5) => {
  console.log(`\n📊 Fetching latest ${limit} transactions...`);
  
  try {
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('orderId');
    
    if (transactions.length === 0) {
      console.log('No transactions found.');
      return;
    }
    
    console.log('Latest transactions:');
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.phoneNumber} - KES ${tx.amount} - Status: ${tx.status}`);
      console.log(`   Order: ${tx.orderId ? tx.orderId._id : 'N/A'}`);
      console.log(`   Timestamp: ${tx.timestamp}`);
      console.log(`   Result: ${tx.resultDesc || 'Pending'}`);
      console.log('-----------------------------------');
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
  }
};

// Simulate callback
const simulateCallback = async (checkoutRequestId, merchantRequestId, success = true) => {
  console.log(`\n🔄 Simulating callback for ${checkoutRequestId}...`);
  
  // Create callback data
  const callbackData = {
    Body: {
      stkCallback: {
        MerchantRequestID: merchantRequestId,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: success ? 0 : 1,
        ResultDesc: success ? 'The service request is processed successfully.' : 'Failed',
      }
    }
  };
  
  // Add metadata if successful
  if (success) {
    callbackData.Body.stkCallback.CallbackMetadata = {
      Item: [
        {
          Name: 'Amount',
          Value: 1
        },
        {
          Name: 'MpesaReceiptNumber',
          Value: 'SIM' + Math.floor(Math.random() * 10000000000).toString()
        },
        {
          Name: 'TransactionDate',
          Value: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6)
        },
        {
          Name: 'PhoneNumber',
          Value: config.test.phoneNumbers.success
        }
      ]
    };
  }
  
  const req = { body: callbackData };
  const res = createMockRes();
  
  await mpesaController.stkPushCallback(req, res);
  
  if (res.statusCode === 200) {
    console.log(`✅ Callback simulation ${success ? 'successful' : 'failed'}!`);
  } else {
    console.log('❌ Callback simulation error!');
  }
  
  return res.data;
};

// Main menu
const showMainMenu = () => {
  console.log('\n==============================================');
  console.log('🥜 Linda\'s Nut Butter Store - M-Pesa Test Menu 🥜');
  console.log('==============================================');
  console.log('1. Test M-Pesa API Connection');
  console.log('2. Initiate STK Push (Success Number)');
  console.log('3. Initiate STK Push (Insufficient Funds)');
  console.log('4. Initiate STK Push (Timeout)');
  console.log('5. Initiate STK Push (User Reject)');
  console.log('6. Query Transaction Status');
  console.log('7. View Latest Transactions');
  console.log('8. Simulate Callback (Success)');
  console.log('9. Simulate Callback (Failed)');
  console.log('0. Exit');
  console.log('==============================================');
  
  rl.question('Select an option: ', async (option) => {
    let checkoutData;
    
    switch (option) {
      case '1':
        await testApiConnection();
        break;
        
      case '2':
        checkoutData = await testStkPush(
          config.test.phoneNumbers.success,
          config.test.orders.sampleAmount,
          config.test.orders.sampleOrderId
        );
        // Save to global state for subsequent queries
        global.lastCheckout = checkoutData;
        break;
        
      case '3':
        await testStkPush(
          config.test.phoneNumbers.insufficient,
          config.test.orders.sampleAmount,
          config.test.orders.sampleOrderId
        );
        break;
        
      case '4':
        await testStkPush(
          config.test.phoneNumbers.timeout,
          config.test.orders.sampleAmount,
          config.test.orders.sampleOrderId
        );
        break;
        
      case '5':
        await testStkPush(
          config.test.phoneNumbers.reject,
          config.test.orders.sampleAmount,
          config.test.orders.sampleOrderId
        );
        break;
        
      case '6':
        if (global.lastCheckout && global.lastCheckout.checkoutRequestId) {
          await queryTransactionStatus(global.lastCheckout.checkoutRequestId);
        } else {
          rl.question('Enter Checkout Request ID: ', async (id) => {
            await queryTransactionStatus(id);
            showMainMenu();
          });
          return; // Don't call showMainMenu() yet
        }
        break;
        
      case '7':
        await showLatestTransactions();
        break;
        
      case '8':
        if (global.lastCheckout) {
          await simulateCallback(
            global.lastCheckout.checkoutRequestId,
            global.lastCheckout.merchantRequestId,
            true
          );
        } else {
          console.log('❌ No checkout data available. Please initiate an STK Push first.');
        }
        break;
        
      case '9':
        if (global.lastCheckout) {
          await simulateCallback(
            global.lastCheckout.checkoutRequestId,
            global.lastCheckout.merchantRequestId,
            false
          );
        } else {
          console.log('❌ No checkout data available. Please initiate an STK Push first.');
        }
        break;
        
      case '0':
        console.log('👋 Goodbye!');
        rl.close();
        setTimeout(() => process.exit(0), 500);
        return;
        
      default:
        console.log('Invalid option. Please try again.');
    }
    
    // Show menu again after operation completes
    setTimeout(() => showMainMenu(), 1000);
  });
};

// Start the test script
console.log('🚀 Starting M-Pesa Integration Test Script...');
showMainMenu();
