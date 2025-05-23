// MongoDB connection module for Vercel serverless functions
const mongoose = require('mongoose');

// Connection string - using environment variable with fallback
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0";

// Connection cache
let cachedConnection = null;

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
  maxPoolSize: 10, // Maintain up to 10 socket connections
};

// Connect to MongoDB
async function connectToDatabase() {
  // If we have a cached connection and it's connected, use it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return cachedConnection;
  }

  // If the connection is disconnected, reconnect
  if (mongoose.connection.readyState === 0) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      console.log(`Using connection string: ${MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:([^@]+)@/, 'mongodb+srv://[USERNAME]:[HIDDEN_PASSWORD]@')}`);
      
      // Connect to MongoDB
      cachedConnection = await mongoose.connect(MONGODB_URI, options);
      
      // Connection successful
      console.log('Successfully connected to MongoDB Atlas!');
      console.log(`Database: ${mongoose.connection.db.databaseName}`);
      
      return cachedConnection;
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      console.error(error.stack);
      
      // Throw a more user-friendly error
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }
}

module.exports = { connectToDatabase };
