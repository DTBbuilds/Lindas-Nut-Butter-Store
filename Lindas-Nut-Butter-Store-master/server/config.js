// Configuration file for M-Pesa integration
// This is a development configuration for testing purposes

const config = {
  // Server configuration
  server: {
    port: process.env.SERVER_PORT || 5000,
    baseUrl: process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_BASE_URL 
      : 'http://localhost:5000',
    // Public URL for callbacks (using ngrok in development)
    get publicUrl() { return process.env.PUBLIC_URL || 'https://2e15-41-90-64-164.ngrok-free.app'; },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    // Admin Notification Email
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com', // IMPORTANT: Set this in your environment
    // Timestamp of server startup to invalidate old JWTs on restart
    serverStartTime: Date.now(),
  },
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/lindas-nut-butter-store'
  },
  
  // M-Pesa API configuration
  mpesa: {
    // Set API base URLs based on environment
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke',
    
    // SECURITY CRITICAL: Only use environment variables for sensitive credentials in production
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    
    // Business configuration
    paybillNumber: process.env.MPESA_PAYBILL_NUMBER,
    tillNumber: process.env.MPESA_TILL_NUMBER,
    accountNumber: process.env.MPESA_ACCOUNT_NUMBER,
    passkey: process.env.MPESA_PASSKEY,
    
    // Callback URLs - using ngrok for development to make them publicly accessible
    callbackUrl: `${process.env.PUBLIC_URL}/api/mpesa/callback`,
    validationUrl: `${process.env.PUBLIC_URL}/api/mpesa/validation`,
    confirmationUrl: `${process.env.PUBLIC_URL}/api/mpesa/confirmation`,

    // Security for callback verification
    callbackSecretKey: process.env.MPESA_CALLBACK_SECRET_KEY || (
      process.env.NODE_ENV === 'production'
        ? '' // CRITICAL: MUST be set via environment variable in production to a strong, unique secret.
        : 'yourSuperSecretCallbackKeyForDev123ChangeMeImmediately' // DEVELOPMENT ONLY: Change this to a unique secret for your dev environment.
    ),
    safaricomIpWhitelist: [
      '196.201.214.200',
      '196.201.214.206',
      '196.201.213.114',
      '196.201.214.207',
      '196.201.214.208',
      '196.201.213.44',
      '196.201.212.127',
      '196.201.212.138',
      '196.201.212.129',
      '196.201.212.136',
      '196.201.212.74',
      '196.201.212.69'
    ],
    
    // For initiator credentials (used for B2C, B2B and reversal)
    initiatorName: process.env.MPESA_INITIATOR_NAME || (
      process.env.NODE_ENV === 'production' ? '' : 'testapi'
    ),
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL || (
      process.env.NODE_ENV === 'production' ? '' : 'Safaricom999!*!'
    )
  },
  
  // Authentication configuration
  jwt: {
    // CRITICAL SECURITY: JWT secrets MUST be set via environment variables in ALL environments.
    // They should be strong, unique, and kept confidential.
    // The application may fail to start or operate insecurely if these are not set.
    get secret() { return process.env.JWT_SECRET; },
    get adminSecret() { return process.env.ADMIN_JWT_SECRET; },
    get customerSecret() { return process.env.CUSTOMER_JWT_SECRET; }, // Dedicated secret for customers
    get expiresIn() { return process.env.JWT_EXPIRES_IN || '7d'; },
    get adminExpiresIn() { return process.env.ADMIN_JWT_EXPIRES_IN || '1d'; },
    get customerExpiresIn() { return process.env.CUSTOMER_JWT_EXPIRES_IN || '1d'; }, // Dedicated expiry for customers
    get refreshTokenSecret() { return process.env.REFRESH_TOKEN_SECRET; },
    get adminRefreshTokenSecret() { return process.env.ADMIN_REFRESH_TOKEN_SECRET; },
    get refreshTokenExpiresIn() { return process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'; },
    get adminRefreshTokenExpiresIn() { return process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '7d'; } 
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Using Gmail SMTP server
    port: process.env.EMAIL_PORT || 465, // Use 465 for secure connection
    secure: process.env.EMAIL_SECURE === 'false' ? false : true, // Default to secure
    user: process.env.EMAIL_USER || 'lmunyendo@gmail.com',
    password: process.env.EMAIL_PASSWORD, // CRITICAL: MUST be set via environment variable for production. The example 'tbjh vyjc ipgv gqxr' is NOT a real password and should NOT be used.
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
