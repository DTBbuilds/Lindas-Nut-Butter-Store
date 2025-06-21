require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('./server/models/Order');
const Transaction = require('./server/models/Transaction');
const Product = require('./server/models/Product');
const Customer = require('./server/models/Customer');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI;
const MPESA_CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET;
const TEST_USER_EMAIL = 'test-user@example.com';
const TEST_USER_PASSWORD = 'password123';

async function runTest() {
  let checkoutRequestId;
  let orderNumber;
  let testProductId;
  let authToken;

  try {
    console.log('--- Starting Payment Pipeline Test ---');

    // 1. Connect to DB and setup test user/product
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('--- Step 1: Setting up test user ---');
    // Ensure a clean slate by deleting any previous test user
    await Customer.deleteOne({ email: TEST_USER_EMAIL });

    // Create a new user instance and save it to trigger the pre-save hook for password hashing
    const testUser = new Customer({
      name: 'Test User',
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      isVerified: true,
      customerId: require('crypto').randomUUID(),
    });
    await testUser.save();
    console.log(`✅ Test user created and password hashed: ${testUser.email}`);

    const testProduct = await Product.findOne();
    if (!testProduct) {
      throw new Error('No products found in the database. Please seed the database first.');
    }
    testProductId = testProduct._id;
    console.log(`✅ Using test product: ${testProduct.name} (ID: ${testProductId})`);

    // 2. Log in as test user to get auth token
    console.log('\n--- Step 2: Authenticating as test user ---');
    const loginResponse = await axios.post(`${API_URL}/api/customers/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    authToken = loginResponse.data.accessToken;
    if (!authToken) {
      throw new Error('Authentication failed, no token received.');
    }
    console.log('✅ Authentication successful.');

    // 3. Initiate Payment (Authenticated)
    console.log('\n--- Step 3: Initiating Payment (Authenticated) ---');
    const orderPayload = {
      customerId: testUser._id,
      items: [{ productId: testProductId, quantity: 1 }],
      totalAmount: testProduct.price,
      subtotal: testProduct.price,
      shippingFee: 0,
      customerEmail: testUser.email,
      customerInfo: {
        name: testUser.name,
        phone: '254712345678',
        address: '123 Test Street',
      },
      paymentMethod: 'MPESA',
    };

    const initiateResponse = await axios.post(`${API_URL}/api/orders`, orderPayload, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    checkoutRequestId = initiateResponse.data.mpesa.CheckoutRequestID;
    orderNumber = initiateResponse.data.order.orderNumber;
    console.log(`✅ Payment initiated successfully. Order Number: ${orderNumber}, CheckoutRequestID: ${checkoutRequestId}`);

    // 4. Simulate M-Pesa Callback
    console.log('\n--- Step 4: Simulating Successful M-Pesa Callback ---');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'test_merchant_id',
          CheckoutRequestID: checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: testProduct.price },
              { Name: 'MpesaReceiptNumber', Value: 'TEST12345' },
              { Name: 'TransactionDate', Value: '20250620223346' },
              { Name: 'PhoneNumber', Value: '254712345678' },
            ],
          },
        },
      },
    };

    await axios.post(`${API_URL}/api/mpesa/callback/${MPESA_CALLBACK_SECRET}`, callbackPayload);
    console.log('✅ Simulated callback sent successfully.');

    // 5. Verify Database State
    console.log('\n--- Step 5: Verifying Database State ---');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalOrder = await Order.findOne({ orderNumber });
    const finalTransaction = await Transaction.findOne({ checkoutRequestId });

    if (!finalOrder || !finalTransaction) {
        throw new Error('Verification failed! Order or transaction not found in the database.');
    }

    console.log(`🔍 Checking Order: ${finalOrder.orderNumber}`);
    console.log(`   - Payment Status: ${finalOrder.paymentStatus}`);
    console.log(`   - Fulfillment Status: ${finalOrder.status}`);
    console.log(`🔍 Checking Transaction: ${finalTransaction.checkoutRequestId}`);
    console.log(`   - Status: ${finalTransaction.status}`);

    if (finalOrder.paymentStatus !== 'COMPLETED' || finalOrder.status !== 'processing' || finalTransaction.status !== 'COMPLETED') {
      throw new Error('Verification failed! The database was not updated correctly.');
    }

    console.log('\n✅✅✅ TEST PASSED! The payment pipeline is working correctly. ✅✅✅');

  } catch (error) {
    console.error('\n❌❌❌ TEST FAILED! ❌❌❌');
    if (error.response) {
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
    console.log('--- Test Finished ---');
  }
}

runTest();
