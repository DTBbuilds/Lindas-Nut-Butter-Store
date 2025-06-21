const path = require('path');
// Load environment variables from the .env file in the project root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Order = require('../models/Order'); // Path relative to this script
const config = require('../config'); // Path relative to this script

const syncDatabaseIndexes = async () => {
  let connection;
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log(`Using MongoDB URI from config...`); // Don't log the actual URI

    // Use createConnection for short-lived script connections
    connection = await mongoose.createConnection(config.mongodb.uri).asPromise();
    console.log('✅ MongoDB connection established successfully.');

    const ordersCollection = connection.collection('orders');

    console.log('\n--- Step 1: Checking existing indexes ---');
    const currentIndexes = await ordersCollection.indexes();
    console.log('Current indexes found:', currentIndexes.map(idx => idx.name));

    const oldIndexName = 'referenceNumber_1';
    const oldIndexExists = currentIndexes.some(index => index.name === oldIndexName);

    if (oldIndexExists) {
      console.log(`\n--- Step 2: Dropping outdated index ---`);
      console.log(`Found outdated index "${oldIndexName}". Dropping now...`);
      await ordersCollection.dropIndex(oldIndexName);
      console.log(`✅ Successfully dropped index: ${oldIndexName}`);
    } else {
      console.log(`\n--- Step 2: Dropping outdated index ---`);
      console.log(`Outdated index "${oldIndexName}" not found. Skipping drop.`);
    }
    
    console.log('\n--- Step 3: Synchronizing schema indexes ---');
    console.log('Ensuring database indexes match the Mongoose Order model schema...');
    // We need to attach the model to the connection to use syncIndexes
    const OrderModel = connection.model('Order', Order.schema);
    await OrderModel.syncIndexes();
    console.log('✅ Indexes are now synchronized with the Order model schema.');
    
    console.log('\n--- Step 4: Verifying final indexes ---');
    const finalIndexes = await ordersCollection.indexes();
    console.log('Final indexes on collection:', finalIndexes.map(idx => idx.name));
    
    const newIndexName = 'orderNumber_1';
    const newIndexExists = finalIndexes.some(index => index.name === newIndexName);

    if (newIndexExists) {
        console.log(`\n✅ SUCCESS: The database is now correctly indexed on "${newIndexName}".`);
    } else {
        console.error(`\n❌ ERROR: Failed to create the new index "${newIndexName}".`);
        console.error('Please check your Order model definition in `server/models/Order.js` and ensure `orderNumber` has `unique: true`.');
    }

  } catch (error) {
    console.error('\n❌ An error occurred during index synchronization:');
    console.error(error);
    process.exit(1); // Exit with error code
  } finally {
    if (connection) {
      await connection.close();
      console.log('\nMongoDB connection closed.');
    }
    process.exit(0); // Exit successfully
  }
};

syncDatabaseIndexes();
