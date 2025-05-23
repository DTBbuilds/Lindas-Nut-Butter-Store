// Simple migration script for MongoDB Atlas
const mongoose = require('mongoose');
const fs = require('fs');

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store-store';
const ATLAS_URI = 'mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0';

// Configure mongoose
mongoose.set('strictQuery', false);

// Log file
const logFile = 'simple-migration-log.txt';
fs.writeFileSync(logFile, `Simple Migration Log - ${new Date().toISOString()}\n\n`);

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

// Define a simple schema that accepts any document structure
const flexibleSchema = new mongoose.Schema({}, { 
  strict: false,
  versionKey: false, // Don't include __v field
  _id: true // Preserve original _id
});

// Collections to migrate
const collections = [
  'customers',
  'orders',
  'transactions',
  'feedback',
  'users',
  'admins',
  'products',
  'inventorylogs'
];

async function migrateCollection(collectionName, localDb, atlasDb) {
  log(`\nMigrating collection: ${collectionName}`);
  
  try {
    // Count documents in local collection
    const count = await localDb.collection(collectionName).countDocuments();
    log(`Found ${count} documents in local ${collectionName} collection`);
    
    if (count === 0) {
      log(`No documents to migrate for ${collectionName}`);
      return { success: true, migrated: 0, total: 0 };
    }
    
    // Get all documents from local collection
    const documents = await localDb.collection(collectionName).find({}).toArray();
    log(`Retrieved ${documents.length} documents from local ${collectionName} collection`);
    
    // Check if documents already exist in Atlas
    const atlasCount = await atlasDb.collection(collectionName).countDocuments();
    if (atlasCount > 0) {
      log(`⚠️ Found ${atlasCount} existing documents in Atlas ${collectionName} collection`);
    }
    
    // Insert documents into Atlas collection
    if (documents.length > 0) {
      try {
        const result = await atlasDb.collection(collectionName).insertMany(documents, { ordered: false });
        log(`✅ Successfully migrated ${result.insertedCount} documents to Atlas ${collectionName} collection`);
        return { success: true, migrated: result.insertedCount, total: documents.length };
      } catch (error) {
        // Check if this is a duplicate key error
        if (error.code === 11000) {
          const insertedCount = error.result?.result?.nInserted || 0;
          log(`⚠️ Partial migration: ${insertedCount} documents inserted, some duplicates skipped`);
          return { success: true, migrated: insertedCount, total: documents.length };
        } else {
          throw error;
        }
      }
    }
    
    return { success: true, migrated: 0, total: documents.length };
  } catch (error) {
    log(`❌ Error migrating ${collectionName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function migrateData() {
  let localClient, atlasClient;
  const results = {};
  
  try {
    log('Starting simple migration from local MongoDB to MongoDB Atlas...');
    
    // Connect to local MongoDB
    log('Connecting to local MongoDB...');
    localClient = await mongoose.connect(LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('✅ Connected to local MongoDB');
    
    // Get reference to local database
    const localDb = localClient.connection.db;
    
    // Get list of all collections in local database
    const localCollections = await localDb.listCollections().toArray();
    log(`Found ${localCollections.length} collections in local database:`);
    localCollections.forEach(coll => log(`- ${coll.name}`));
    
    // Disconnect from local and connect to Atlas
    await mongoose.disconnect();
    log('Disconnected from local MongoDB');
    
    // Connect to MongoDB Atlas
    log('Connecting to MongoDB Atlas...');
    atlasClient = await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('✅ Connected to MongoDB Atlas');
    
    // Get reference to Atlas database
    const atlasDb = atlasClient.connection.db;
    
    // Reconnect to local MongoDB for migration
    log('Reconnecting to local MongoDB for migration...');
    localClient = await mongoose.createConnection(LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('✅ Reconnected to local MongoDB');
    
    // Get reference to local database again
    const localDbForMigration = localClient.connection.db;
    
    // Migrate each collection
    for (const collectionName of localCollections.map(c => c.name)) {
      results[collectionName] = await migrateCollection(collectionName, localDbForMigration, atlasDb);
    }
    
    // Print migration summary
    log('\n=== Migration Summary ===');
    for (const [collection, result] of Object.entries(results)) {
      if (result.success) {
        log(`${collection}: ✅ Migrated ${result.migrated}/${result.total} documents`);
      } else {
        log(`${collection}: ❌ Failed - ${result.error}`);
      }
    }
    
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`);
    log(error.stack);
  } finally {
    // Close connections
    if (localClient) {
      try {
        await localClient.close();
        log('Local MongoDB connection closed');
      } catch (err) {
        log(`Error closing local connection: ${err.message}`);
      }
    }
    
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
        log('MongoDB Atlas connection closed');
      } catch (err) {
        log(`Error closing Atlas connection: ${err.message}`);
      }
    }
    
    log('\nMigration process completed');
  }
}

// Run the migration
migrateData()
  .then(() => {
    log('Migration script execution completed');
  })
  .catch(error => {
    log(`Unhandled error in migration script: ${error.message}`);
    log(error.stack);
  });
