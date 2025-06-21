// server/diagnoseIndexes.js
const mongoose = require('mongoose');
const config = require('./config');

const diagnose = async () => {
  console.log('DIAGNOSE_INDEXES: Script started.');
  console.log('DIAGNOSE_INDEXES: Connecting to MongoDB URI from config:', config.mongodb.uri);

  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('DIAGNOSE_INDEXES: Successfully connected to MongoDB.');
    
    const db = mongoose.connection;
    console.log('DIAGNOSE_INDEXES: Connected to database name:', db.db.databaseName);

    if (!db.db) {
      console.error('DIAGNOSE_INDEXES: Mongoose connection db object not available. Exiting.');
      await mongoose.disconnect();
      process.exit(1);
    }

    const productCollection = db.collection('products');
    console.log('DIAGNOSE_INDEXES: Fetching current indexes on "products" collection...');
    let currentIndexes = await productCollection.listIndexes().toArray();
    console.log('DIAGNOSE_INDEXES: Current indexes (BEFORE drop attempt):', JSON.stringify(currentIndexes, null, 2));

    try {
      console.log('DIAGNOSE_INDEXES: Attempting to drop "id_1" index from "products" collection...');
      const dropResult = await productCollection.dropIndex("id_1");
      console.log('DIAGNOSE_INDEXES: "id_1" index drop attempt result:', dropResult);
      console.log('DIAGNOSE_INDEXES: "id_1" index dropped successfully or did not exist.');
    } catch (indexDropError) {
      if (indexDropError.codeName === 'IndexNotFound' || (indexDropError.message && indexDropError.message.includes('index not found'))) {
        console.log('DIAGNOSE_INDEXES: "id_1" index not found, which is good.');
      } else {
        console.error('DIAGNOSE_INDEXES: Error trying to drop "id_1" index:', indexDropError);
      }
    }

    console.log('DIAGNOSE_INDEXES: Fetching current indexes on "products" collection (AFTER drop attempt)...');
    let indexesAfterDropAttempt = await productCollection.listIndexes().toArray();
    console.log('DIAGNOSE_INDEXES: Current indexes (AFTER drop attempt):', JSON.stringify(indexesAfterDropAttempt, null, 2));

  } catch (error) {
    console.error('DIAGNOSE_INDEXES: A critical error occurred:', error);
  } finally {
    console.log('DIAGNOSE_INDEXES: Disconnecting from MongoDB.');
    await mongoose.disconnect();
    console.log('DIAGNOSE_INDEXES: Script finished.');
    process.exit(0); // Exit explicitly
  }
};

diagnose();
