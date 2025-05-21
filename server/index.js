// Suppress Node.js deprecation warnings in development
if (process.env.NODE_ENV !== 'production') {
  require('../suppress-warnings');
}

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');
const path = require('path');
const { Order, Transaction, Product, InventoryLog, User } = require('./models');
const inventoryManager = require('./utils/inventoryManager');
const orderManager = require('./utils/orderManager');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
// Configure CORS with explicit options
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://lindas-nut-butter-store-store-store.com', 'https://www.lindas-nut-butter-store-store-store.com']
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'cache-control', 
    'pragma', 
    'expires',
    'if-modified-since',
    'if-none-match',
    'last-modified',
    'etag',
    'content-length',
    'X-Requested-With', 
    'X-CSRF-Token'
  ],
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'ETag']
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rate limiting
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
app.use(apiLimiter); // Apply to all routes

// Apply more aggressive rate limiting to auth routes
app.use('/api/auth', authLimiter);

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// Trust first proxy (if behind a reverse proxy like nginx)
app.set('trust proxy', 1);

// Mount routes
app.use('/api/auth', authRoutes);

// Serve static files from the public directory with proper options
app.use(express.static('public', {
  // Handle spaces in filenames and special characters
  dotfiles: 'ignore',
  etag: true,
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now());
  }
}));

// Also serve from the root directory to maintain compatibility with existing references
app.use('/images', express.static(require('path').join(__dirname, '../public/images')));
app.use('/videos', express.static(require('path').join(__dirname, '../public/videos')));

// Add error handler for static files
app.use((err, req, res, next) => {
  if (req.path.startsWith('/images/') || req.path.startsWith('/videos/')) {
    console.error(`Static file error: ${req.path}`, err);
    return res.status(404).send('File not found');
  }
  next(err);
});

// Import routes
const routes = require('./routes');
const emailRoutes = require('./routes/emailRoutes');
const customerRoutes = require('./routes/customerRoutes');
// Note: authRoutes already mounted earlier

// Use routes
app.use('/api', routes);
app.use('/api/email', emailRoutes);
app.use('/api/customers', customerRoutes);
// authRoutes already mounted at line 54

// Set up order and inventory management routes
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const productRoutes = require('./routes/productRoutes');
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/products', productRoutes);

// Initialize all product inventory statuses
const { updateAllInventoryStatuses } = require('./utils/inventoryManager');
setTimeout(async () => {
  try {
    const result = await updateAllInventoryStatuses();
    console.log('Initialized all product inventory statuses:', result);
  } catch (error) {
    console.error('Error initializing product inventory statuses:', error);
  }
}, 2000); // Delay by 2 seconds to ensure database connection is established

// Import utilities
const { updateCallbackUrls } = require('./utils/mpesaHelpers');
const { renameAllMediaFiles } = require('./utils/fileRenamer');
const ngrokHelper = require('./utils/ngrokHelper');

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    // Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
};

// Get OAuth Token from Safaricom
const getOAuthToken = async () => {
  try {
    const { consumerKey, consumerSecret, baseUrl } = config.mpesa;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await axios.get(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting OAuth token:', error);
    throw error;
  }
};

// Note: M-Pesa routes are now handled by the dedicated controller in routes.js
// See server/controllers/mpesaController.js for implementation details

// C2B Validation endpoint
app.post('/api/mpesa/validation', (req, res) => {
  console.log('Validation request received:', req.body);
  
  // Check if account number is valid
  if (req.body.BillRefNumber === config.mpesa.accountNumber) {
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Validation successful'
    });
  } else {
    return res.status(200).json({
      ResultCode: 1,
      ResultDesc: 'Invalid account number'
    });
  }
});

// C2B Confirmation endpoint
app.post('/api/mpesa/confirmation', async (req, res) => {
  try {
    console.log('Confirmation request received:', req.body);
    const {
      TransID,
      TransAmount,
      BillRefNumber,
      MSISDN,
      TransactionType,
      TransTime
    } = req.body;
    
    // Find order by BillRefNumber
    const order = await Order.findOne({ referenceNumber: BillRefNumber });
    
    if (!order) {
      console.error(`Order with reference ${BillRefNumber} not found`);
      // Still acknowledge Safaricom to prevent retries
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Confirmation received'
      });
    }
    
    // Update order status
    order.paymentStatus = 'PAID';
    order.transactionId = TransID;
    order.paymentDate = new Date();
    await order.save();
    
    // Create transaction record
    await Transaction.create({
      orderId: order._id,
      transactionId: TransID,
      phoneNumber: MSISDN,
      amount: TransAmount,
      type: TransactionType,
      status: 'COMPLETED',
      timestamp: new Date(TransTime)
    });
    
    // Process order (update inventory, etc.)
    await processOrder(order._id);
    
    // Send confirmation to customer
    await sendPaymentConfirmation(order);
    
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Confirmation received successfully'
    });
  } catch (error) {
    console.error('Error processing confirmation:', error);
    // Still acknowledge Safaricom to prevent retries
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Confirmation received'
    });
  }
});

// STK Push Callback
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    console.log('STK Callback received:', req.body);
    const { Body } = req.body;
    
    // Safaricom sometimes sends differently structured responses
    const stkCallback = Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
    
    // Find the transaction
    const transaction = await Transaction.findOne({ 
      requestId: CheckoutRequestID,
      merchantRequestId: MerchantRequestID 
    });
    
    if (!transaction) {
      console.error(`Transaction with request ID ${CheckoutRequestID} not found`);
      return res.status(200).json({ success: true });
    }
    
    // Update transaction status
    transaction.status = ResultCode === 0 ? 'COMPLETED' : 'FAILED';
    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;
    
    if (ResultCode === 0 && stkCallback.CallbackMetadata) {
      // Extract transaction details
      const callbackItems = stkCallback.CallbackMetadata.Item;
      const mpesaTransactionId = callbackItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const amount = callbackItems.find(item => item.Name === 'Amount')?.Value;
      const transactionDate = callbackItems.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackItems.find(item => item.Name === 'PhoneNumber')?.Value;
      
      transaction.transactionId = mpesaTransactionId;
      transaction.confirmedAmount = amount;
      transaction.transactionDate = transactionDate;
      transaction.confirmedPhoneNumber = phoneNumber;
      
      // Update order status
      const order = await Order.findById(transaction.orderId);
      if (order) {
        order.paymentStatus = 'PAID';
        order.transactionId = mpesaTransactionId;
        order.paymentDate = new Date();
        await order.save();
        
        // Process order
        await processOrder(order._id);
        
        // Send confirmation to customer
        await sendPaymentConfirmation(order);
      }
    }
    
    await transaction.save();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing STK callback:', error);
    return res.status(200).json({ success: true });
  }
});

// Query transaction status
app.post('/api/mpesa/query', async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    
    // Get OAuth token
    const token = await getOAuthToken();
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -6);
    
    // Generate password
    const { paybillNumber, passkey } = config.mpesa;
    const password = Buffer.from(`${paybillNumber}${passkey}${timestamp}`).toString('base64');
    
    // Query request
    const response = await axios.post(
      `${config.mpesa.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: config.mpesa.paybillNumber,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error querying transaction:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to query transaction',
      error: error.response?.data || error.message
    });
  }
});

// Process refund
app.post('/api/mpesa/refund', async (req, res) => {
  try {
    const { transactionId, amount, remarks } = req.body;
    
    // Get OAuth token
    const token = await getOAuthToken();
    
    // Find the original transaction
    const transaction = await Transaction.findOne({ transactionId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Original transaction not found'
      });
    }
    
    // Initiate reversal
    const response = await axios.post(
      `${config.mpesa.baseUrl}/mpesa/reversal/v1/request`,
      {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: 'TransactionReversal',
        TransactionID: transactionId,
        Amount: amount,
        ReceiverParty: config.mpesa.paybillNumber,
        RecieverIdentifierType: '11', // Organization identifier type for Paybill
        ResultURL: `${process.env.BASE_URL}/api/mpesa/reversal-result`,
        QueueTimeOutURL: `${process.env.BASE_URL}/api/mpesa/reversal-timeout`,
        Remarks: remarks || 'Refund for cancelled order',
        Occasion: ''
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Create refund transaction record
    await Transaction.create({
      relatedTransactionId: transactionId,
      orderId: transaction.orderId,
      amount,
      status: 'PENDING',
      type: 'REFUND',
      remarks,
      timestamp: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: response.data
    });
  } catch (error) {
    console.error('Error processing refund:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.response?.data || error.message
    });
  }
});

// Process order after payment confirmation (using new orderManager)
const processOrder = async (orderId) => {
  try {
    const result = await orderManager.processOrder(orderId);
    console.log(`Order ${orderId} processed successfully`);
    return true;
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    return false;
  }
};

// Helper function to send payment confirmation (using orderManager)
const sendPaymentConfirmation = async (order) => {
  try {
    await orderManager.sendOrderConfirmation(order);
    console.log(`Payment confirmation sent for order ${order._id}`);
    
    return true;
  } catch (error) {
    console.error(`Error sending payment confirmation for order ${order._id}:`, error);
    return false;
  }
};

// Get all transactions for admin
app.get('/api/admin/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(100);
    
    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Export transactions as CSV
app.get('/api/admin/transactions/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(query).sort({ timestamp: -1 });
    
    // Convert to CSV
    const fields = [
      'transactionId', 
      'orderId', 
      'amount', 
      'phoneNumber', 
      'status', 
      'type', 
      'timestamp'
    ];
    
    let csv = fields.join(',') + '\n';
    
    transactions.forEach(transaction => {
      const row = fields.map(field => {
        const value = transaction[field];
        if (field === 'timestamp') {
          return value ? new Date(value).toISOString() : '';
        }
        return value || '';
      });
      csv += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export transactions',
      error: error.message
    });
  }
});

// Add a root endpoint for testing the API
app.get('/', (req, res) => {
  res.json({
    message: "Linda's Nut Butter Store API is running",
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      { method: 'GET', path: '/api/mpesa/test', description: 'Test M-Pesa API connectivity' },
      { method: 'POST', path: '/api/mpesa/stkpush', description: 'Initiate M-Pesa payment' },
      { method: 'POST', path: '/api/mpesa/query', description: 'Query payment status' },
      { method: 'POST', path: '/api/orders', description: 'Create a new order' },
      { method: 'GET', path: '/api/orders/:id', description: 'Get order details' },
      { method: 'PUT', path: '/api/orders/:id/status', description: 'Update order status' },
      { method: 'GET', path: '/api/admin/transactions', description: 'Get all transactions (admin only)' },
      { method: 'GET', path: '/api/inventory/status', description: 'Get inventory status' },
      { method: 'GET', path: '/api/inventory/history/:productId', description: 'Get inventory history for a product' },
      { method: 'POST', path: '/api/inventory/update', description: 'Update product inventory' }
    ]
  });
});

// Import error handling middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// 404 handler (must be after all other routes)
app.use(notFoundHandler);

// Global error handler (must be after all other middleware and routes)
app.use(errorHandler);

// Test M-Pesa API credentials on startup
const testMpesaCredentials = async () => {
  try {
    console.log('Testing M-Pesa API credentials...');
    const token = await getOAuthToken();
    if (token) {
      console.log('✅ M-Pesa API credentials valid - Successfully obtained OAuth token');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ M-Pesa API credentials invalid:', error.response?.data || error.message);
    return false;
  }
};

// Start server and connect to MongoDB
const PORT = config.server.port;

// Connect to MongoDB before starting the server
connectMongoDB().then(async connected => {
  if (!connected) {
    console.error('Failed to connect to MongoDB. Server will start, but some features may not work correctly.');
  }

  // Test M-Pesa credentials before starting server
  const credentialsValid = await testMpesaCredentials();
  if (!credentialsValid) {
    console.warn('⚠️ Warning: M-Pesa API credentials may be invalid. Payments might not work correctly.');
    console.warn('Please check your consumer key, consumer secret, and other M-Pesa configuration in config.js');
  }

  const server = app.listen(PORT, async () => {
    const baseUrl = `http://localhost:${PORT}`;
    
    // First try to use ngrok if available
    const ngrokConfigured = await ngrokHelper.configureNgrokCallbacks();
    
    // If ngrok is not available, fall back to localhost (but this won't work for Mpesa callbacks)
    if (!ngrokConfigured) {
      console.warn('⚠️ Using localhost for callbacks (M-Pesa payments may not work correctly)');
      updateCallbackUrls(baseUrl);
      ngrokHelper.printCallbackHelp();
    }
  
  console.log('========================================================');
  console.log(`🚀 Server running at ${baseUrl}`);
  console.log(`👉 API Base URL: ${config.server.baseUrl}`);
  console.log(`🌐 Frontend URL: ${config.server.frontendUrl}`);
  console.log(`📱 M-Pesa API: ${config.mpesa.baseUrl} (${process.env.NODE_ENV === 'production' ? 'Production' : 'Sandbox'})`);
  console.log('========================================================');
  
  // Fix filenames with spaces to prevent 500 errors
  console.log('🛠️ Checking and fixing problematic filenames...');
  const renameResults = renameAllMediaFiles();
  if (renameResults.images.renamed > 0 || renameResults.videos.renamed > 0) {
    console.log(`✅ Fixed filenames: ${renameResults.images.renamed} images, ${renameResults.videos.renamed} videos`);
  } else {
    console.log('✅ No filenames needed fixing');
  }
  
  console.log('========================================================');
  console.log('📦 Available endpoints:');
  console.log(`GET  ${baseUrl}/api/mpesa/test - Test M-Pesa API connection`);
  console.log(`POST ${baseUrl}/api/mpesa/stkpush - Initiate payment`);
  console.log(`POST ${baseUrl}/api/mpesa/query - Query payment status`);
  console.log('========================================================');
  console.log('🧪 For testing, use these test phone numbers:');
  console.log(`✅ Success: ${config.test.phoneNumbers.success}`);
  console.log(`❌ Insufficient funds: ${config.test.phoneNumbers.insufficient}`);
  console.log(`⏱️ Timeout: ${config.test.phoneNumbers.timeout}`);
  console.log(`🚫 User rejects: ${config.test.phoneNumbers.reject}`);
  console.log('========================================================');
  console.log('🔍 Server is ready for M-Pesa integration testing!');
});

  // Process cleanup
  process.on('SIGINT', () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('Server closed.');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  });
});
