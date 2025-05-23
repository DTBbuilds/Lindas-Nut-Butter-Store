// Test script for MongoDB Atlas connection
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas connection string
const uri = "mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0";

// IMPORTANT: In a real production environment, always use environment variables for sensitive credentials
// This is just for testing purposes

async function testConnection() {
  console.log('Starting MongoDB Atlas connection test...');
  console.log(`Using connection string: ${uri.replace(/mongodb\+srv:\/\/[^:]+:([^@]+)@/, 'mongodb+srv://[USERNAME]:[HIDDEN_PASSWORD]@')}`);
  
  const client = new MongoClient(uri);
  
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Connection established successfully!');
    
    // Make a simple query to verify connection
    const db = client.db('lindas-nut-butter');
    console.log('Database selected: lindas-nut-butter');
    
    console.log('Listing collections...');
    const collections = await db.listCollections().toArray();
    
    console.log('MongoDB Atlas connection successful!');
    console.log('Available collections:');
    
    if (collections.length === 0) {
      console.log('No collections found. This is normal for a new database.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    console.log('\nYour MongoDB Atlas connection is working correctly!');
    return true;
    
  } catch (err) {
    console.error('MongoDB Atlas connection error:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    return false;
  } finally {
    // Close the connection
    console.log('Closing connection...');
    await client.close();
    console.log('Connection closed.');
  }
}

testConnection().catch(console.error);
