/**
 * MongoDB Connection Helper
 * Provides robust connection handling for MongoDB in production environments
 */

const mongoose = require('mongoose');
const config = require('./config');

// Connection options with proper retry and timeout settings
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  family: 4  // Use IPv4, avoid issues with IPv6
};

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Connect to MongoDB with retry logic
 */
async function connectToMongoDB() {
  // Don't attempt to reconnect if we're already connected
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }
  
  // Increment connection attempts
  connectionAttempts++;
  
  try {
    // Use the MongoDB URI from config or environment variables
    const uri = process.env.MONGO_URI || config.mongodb.uri;
    
    console.log(`Connecting to MongoDB (Attempt ${connectionAttempts})...`);
    console.log(`Using connection string: ${uri.substring(0, 20)}...`);
    
    // Connect to MongoDB
    await mongoose.connect(uri, MONGO_OPTIONS);
    
    // Log successful connection
    isConnected = true;
    connectionAttempts = 0;
    console.log('MongoDB connected successfully!');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    
    // Setup connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
      isConnected = false;
      setTimeout(() => connectToMongoDB(), 5000);  // Try to reconnect after 5 seconds
    });
    
    return mongoose.connection;
  } catch (error) {
    isConnected = false;
    console.error('MongoDB connection error:', error.message);
    
    // Retry logic with exponential backoff
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      const retryDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
      console.log(`Retrying connection in ${retryDelay/1000} seconds...`);
      setTimeout(() => connectToMongoDB(), retryDelay);
    } else {
      console.error('Max connection attempts reached. Giving up.');
      throw new Error('Failed to connect to MongoDB after multiple attempts');
    }
  }
}

module.exports = {
  connectToMongoDB,
  getConnectionStatus: () => ({
    isConnected,
    connectionAttempts,
    readyState: mongoose.connection ? mongoose.connection.readyState : 0
  })
};
