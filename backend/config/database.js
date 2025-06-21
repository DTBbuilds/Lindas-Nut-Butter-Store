const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection URI with proper fallbacks for different environments
// Support Docker, local development, and production environments
let MONGODB_URI;

if (process.env.MONGODB_URI) {
  // Use environment variable if provided
  MONGODB_URI = process.env.MONGODB_URI;
} else if (process.env.NODE_ENV === 'production') {
  // Production fallback
  MONGODB_URI = 'mongodb://mongodb:27017/lindas-nut-butter-store';
} else if (process.env.DOCKER_ENV === 'true') {
  // Docker environment
  MONGODB_URI = 'mongodb://host.docker.internal:27017/lindas-nut-butter-store';
} else {
  // Local development
  MONGODB_URI = 'mongodb://localhost:27017/lindas-nut-butter-store';
}

// MongoDB connection options with safe defaults
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority',
  // Prevent duplicate index errors
  autoIndex: process.env.NODE_ENV !== 'production' // Only create indexes in development
};

/**
 * Connect to MongoDB with improved retry mechanism and proper error handling
 * @returns {Promise} Mongoose connection promise
 */
const connectWithRetry = async () => {
  try {
    // Disconnect if already connected (prevents duplicate connection attempts)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect with robust error handling
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    
    // Log success with database name and host
    console.log(`MongoDB connected successfully to ${mongoose.connection.db.databaseName} at ${MONGODB_URI}`);
    
    // Initialize product indexes if needed
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Ensure no duplicate product indexes
        console.log('Ensuring product collection indexes...');
        const Product = require('../models/Product');
        await Product.init(); // Ensures indexes are built
      } catch (indexError) {
        console.warn('Note: Product model indexes initialization skipped:', indexError.message);
      }
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Retrying connection in 5 seconds...');
    // Wait for 5 seconds before retrying
    await new Promise(res => setTimeout(res, 5000));
    // Recursively call connectWithRetry and return its promise
    // This ensures the calling function (in server.js) awaits the actual connection success
    return connectWithRetry();
  }
};

// Enhanced connection event handlers
mongoose.connection.on('error', err => { // This is a general error listener, distinct from connection attempt errors
  console.error('!!!!!!!!!!!!!!!! MongoDB Connection ERROR Event !!!!!!!!!!!!!!!!');
  console.error(`Error details: ${err.name} - ${err.message}`);
  console.error(err);
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('!!!!!!!!!!!!!!!! MongoDB DISCONNECTED Event !!!!!!!!!!!!!!!!');
  console.log(`Current readyState: ${mongoose.connection.readyState}`);
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('!!!!!!!!!!!!!!!! MongoDB CONNECTED Event !!!!!!!!!!!!!!!!');
  console.log(`Current readyState: ${mongoose.connection.readyState}`);
  console.log('MongoDB connected');
});

mongoose.connection.on('reconnected', () => {
  console.log('!!!!!!!!!!!!!!!! MongoDB RECONNECTED Event !!!!!!!!!!!!!!!!');
  console.log(`Current readyState: ${mongoose.connection.readyState}`);
  console.log('MongoDB reconnected');
});

// This duplicate 'error' listener might be redundant if the one above catches all. Let's comment it out for now to avoid log noise, or make it more specific if needed.
// mongoose.connection.on('error', (err) => {
  // console.error('Mongoose connection error:', err);
  //   if (err.name === 'MongoNetworkError') {
//     // Auto-reconnect on network errors
//     console.error('MongoNetworkError detected by second error listener, attempting reconnect...');
//     setTimeout(() => connectWithRetry(), 5000);
//   }
// });

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

module.exports = {
  connectWithRetry,
  mongooseOptions,
  MONGODB_URI
};