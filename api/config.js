// Configuration for Vercel API routes
const mongoose = require('mongoose');

// Database configuration
const dbConfig = {
  uri: process.env.MONGO_URI || "mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000
  }
};

// M-Pesa configuration
const mpesaConfig = {
  baseUrl: 'https://api.safaricom.co.ke',
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  paybillNumber: process.env.MPESA_PAYBILL_NUMBER || '174379',
  passkey: process.env.MPESA_PASSKEY || '',
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://lindas-nut-butter-kpwt92rlr-dtbbuilds-projects.vercel.app/api/mpesa/callback',
  validationUrl: process.env.MPESA_VALIDATION_URL || 'https://lindas-nut-butter-kpwt92rlr-dtbbuilds-projects.vercel.app/api/mpesa/validation',
  confirmationUrl: process.env.MPESA_CONFIRMATION_URL || 'https://lindas-nut-butter-kpwt92rlr-dtbbuilds-projects.vercel.app/api/mpesa/confirmation'
};

// Server configuration
const serverConfig = {
  port: process.env.PORT || 5000,
  baseUrl: process.env.PRODUCTION_BASE_URL || 'https://lindas-nut-butter-kpwt92rlr-dtbbuilds-projects.vercel.app/api',
  frontendUrl: process.env.PRODUCTION_FRONTEND_URL || 'https://lindas-nut-butter-kpwt92rlr-dtbbuilds-projects.vercel.app'
};

// Database connection management
let connection = null;

const connectToDatabase = async () => {
  if (connection && mongoose.connection.readyState === 1) {
    return connection;
  }
  
  try {
    connection = await mongoose.connect(dbConfig.uri, dbConfig.options);
    console.log('MongoDB connected successfully!');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// CORS headers for all API responses
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

module.exports = {
  db: dbConfig,
  mpesa: mpesaConfig,
  server: serverConfig,
  connectToDatabase,
  corsHeaders
};
