// Configuration file for M-Pesa integration
// This is a development configuration for testing purposes

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    baseUrl: process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_BASE_URL 
      : 'http://localhost:5000',
    frontendUrl: process.env.NODE_ENV === 'production'
      ? process.env.PRODUCTION_FRONTEND_URL
      : 'http://localhost:3000'
  },
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store'
  },
  
  // M-Pesa API configuration
  mpesa: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke',
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'IRD3shGh5DptxUjgnJn8A5pMFYihDmy5zf0XEKQcFHLWRb0J',  // User's Safaricom sandbox credentials
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'reVDaE3RyZ1vC2MtFqh9KA6dA9HyLBwKm3mBBazMkGYwIt6ZWtsKcWMYKcIp4bFE',  // User's Safaricom sandbox credentials
    paybillNumber: process.env.MPESA_PAYBILL_NUMBER || '247247',  // Linda's Paybill Number  // Linda's Paybill Number  // Linda's Paybill Number
    accountNumber: process.env.MPESA_ACCOUNT_NUMBER || '0725317864', // Linda's Account Number // Linda's Account Number // Linda's Account Number
    passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Default sandbox passkey
    callbackUrl: process.env.CALLBACK_URL || 'http://localhost:5000/api/mpesa/callback',
    validationUrl: process.env.VALIDATION_URL || 'http://localhost:5000/api/mpesa/validation',
    confirmationUrl: process.env.CONFIRMATION_URL || 'http://localhost:5000/api/mpesa/confirmation',
    
    // For initiator credentials (used for B2C, B2B and reversal)
    initiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || 'Safaricom999!*!'
  },
  
  // Test configuration for sandbox testing
  test: {
    // Test phone numbers for different scenarios
    // These are test numbers for sandbox environment
    phoneNumbers: {
      success: '254708374149',       // For successful transactions
      insufficient: '254708374150',  // For insufficient funds
      timeout: '254708374151',       // For transaction timeout
      reject: '254708374152'         // For user rejection
    },
    
    // Test sample data
    orders: {
      sampleAmount: 1,               // Amount in KES for test transactions
      sampleOrderId: 'TEST123456',   // Sample order ID for testing
      samplePhoneNumber: '254708374149' // Default test phone number
    }
  }
};

module.exports = config;
