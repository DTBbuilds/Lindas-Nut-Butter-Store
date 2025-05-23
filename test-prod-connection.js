// Test script for production MongoDB Atlas connection
const mongoose = require('mongoose');
const fs = require('fs');

// Load configuration
const config = require('./server/config');

// Set environment to production
process.env.NODE_ENV = 'production';

// Log file
const logFile = 'prod-connection-test.log';
fs.writeFileSync(logFile, `Production Connection Test - ${new Date().toISOString()}\n\n`);

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

async function testConnection() {
  try {
    // Log the MongoDB URI being used (with password masked)
    const uri = config.mongodb.uri;
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    log(`Using MongoDB URI: ${maskedUri}`);
    log(`NODE_ENV: ${process.env.NODE_ENV}`);
    
    // Connect to MongoDB
    log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000 // 30 seconds timeout
    });
    
    log('✅ MongoDB connection successful!');
    
    // Get database information
    const db = mongoose.connection.db;
    log(`Connected to database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    log(`\nFound ${collections.length} collections:`);
    collections.forEach(coll => log(`- ${coll.name}`));
    
    // Count documents in each collection
    log('\nDocument counts:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      log(`${coll.name}: ${count} documents`);
    }
    
    log('\n✅ Connection test completed successfully!');
  } catch (error) {
    log(`\n❌ Connection error: ${error.message}`);
    log(`Error name: ${error.name}`);
    log(`Full error stack: ${error.stack}`);
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
        log('MongoDB connection closed');
      } catch (err) {
        log(`Error closing connection: ${err.message}`);
      }
    }
  }
}

// Run the test
testConnection()
  .then(() => {
    log('Test script completed');
  })
  .catch(error => {
    log(`Unhandled error: ${error.message}`);
    log(error.stack);
  });
