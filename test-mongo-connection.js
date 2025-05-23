// Simple MongoDB Atlas connection test
const mongoose = require('mongoose');

// MongoDB Atlas connection string
const uri = "mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0";

console.log('Starting MongoDB Atlas connection test with Mongoose...');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('Connected to database: lindas-nut-butter');
    
    // List all collections in the database
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('No collections found. This is normal for a new database.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    console.log('\nYour MongoDB Atlas connection is working correctly!');
    
    // Close the connection
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Connection closed.');
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
  });
