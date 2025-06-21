/**
 * MongoDB Connection Module
 * 
 * Establishes and manages the connection to MongoDB
 * Implements connection pooling, retry logic, and event handling
 */

const mongoose = require('mongoose');
const config = require('../config');

// Connection options for better performance and stability
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
  maxPoolSize: 10, // Maintain up to 10 connections
  family: 4 // Use IPv4, skip trying IPv6
};

// Event handlers for connection monitoring
mongoose.connection.on('connected', () => {
  console.log('MongoDB Connection Established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB Connection Disconnected');
});

// Gracefully close the connection on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB Connection Closed Due to App Termination');
  process.exit(0);
});

// Connect to MongoDB with retry logic
const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    console.log(`Connecting to MongoDB at ${config.mongodb.uri} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    await mongoose.connect(config.mongodb.uri, connectionOptions);
    
    // Database initialization logic (e.g., seeding) has been moved to server/index.js
    // to prevent circular dependencies during the connection phase.
    
    return mongoose.connection;
  } catch (err) {
    console.error(`MongoDB connection failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
    
    if (retryCount < maxRetries) {
      // Exponential backoff for retry
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.log(`Retrying in ${retryDelay}ms...`);
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(connectDB(retryCount + 1, maxRetries));
        }, retryDelay);
      });
    }
    
    console.error('Failed to connect to MongoDB after multiple attempts');
    throw err;
  }
};

// The initializeDatabase function has been removed. Its logic is now handled in server/index.js
// after the database connection is successfully established. This resolves a critical
// circular dependency that was causing silent server crashes.

module.exports = {
  connectDB,
  mongoose
};
