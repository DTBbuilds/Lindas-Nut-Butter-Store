/**
 * Database Cleanup Script
 * Removes unused duplicate databases while preserving the primary database
 */

const mongoose = require('mongoose');
const config = require('../config');

// Primary database name that should be preserved
const PRIMARY_DB = 'lindas-nut-butter-store-store-store-store-store';

// List of databases to be cleaned up
const DATABASE_CLEANUP_LIST = [
  'linda_nut_butter',
  'lindas-nut-butter-store'
];

async function cleanupDatabases() {
  try {
    console.log('Starting database cleanup process...');
    
    // Connect to MongoDB server without specifying a database
    await mongoose.connect('mongodb://localhost:27017', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB server');
    
    // Get list of all databases
    const dbs = await mongoose.connection.db.admin().listDatabases();
    console.log('Existing databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check if primary database exists
    const primaryDbExists = dbs.databases.some(db => db.name === PRIMARY_DB);
    if (!primaryDbExists) {
      console.error(`ERROR: Primary database '${PRIMARY_DB}' not found. Aborting cleanup to prevent data loss.`);
      return;
    }
    
    // Perform cleanup
    for (const dbName of DATABASE_CLEANUP_LIST) {
      if (dbs.databases.some(db => db.name === dbName)) {
        console.log(`Dropping database: ${dbName}`);
        try {
          // Connect directly to the target database and then drop it
          const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`);
          await conn.dropDatabase();
          await conn.close();
          console.log(`Successfully dropped database: ${dbName}`);
        } catch (error) {
          console.error(`Error dropping database ${dbName}:`, error);
        }
      } else {
        console.log(`Database not found, skipping: ${dbName}`);
      }
    }
    
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup
cleanupDatabases()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
