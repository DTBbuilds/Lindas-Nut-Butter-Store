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
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store-store'
  },
  
  // M-Pesa API configuration
  mpesa: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke',
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'GvzjNnYgNJtwgwfLBkZh65VPwfuKvs0V',  // User's Safaricom sandbox credentials
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'oUs2ibY9pzL1A0Az',  // User's Safaricom sandbox credentials
    paybillNumber: process.env.MPESA_PAYBILL_NUMBER || '174379',  // Linda's Paybill Number  // Linda's Paybill Number  // Linda's Paybill Number
    tillNumber: process.env.MPESA_TILL_NUMBER || '321798', // Linda's Till Number
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
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Using Gmail SMTP server
    port: process.env.EMAIL_PORT || 465, // Use 465 for secure connection
    secure: process.env.EMAIL_SECURE === 'false' ? false : true, // Default to secure
    user: process.env.EMAIL_USER || 'lmunyendo@gmail.com',
    password: process.env.EMAIL_PASSWORD || 'tbjh vyjc ipgv gqxr', // Example app password format (not a real password)
    from: process.env.EMAIL_FROM || '"Linda\'s Nut Butter" <lmunyendo@gmail.com>',
    // OAuth2 configuration (recommended for Gmail)
    useOAuth2: process.env.USE_OAUTH2 === 'true' || false,
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    // Settings for Gmail auto-compose
    autoCompose: true,
    gmailSmartCompose: true,
  },

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
