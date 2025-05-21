// Script to drop the source database after data has been transferred
const { MongoClient } = require('mongodb');

// Database connection string
const url = 'mongodb://localhost:27017';

async function dropDatabase() {
  const client = new MongoClient(url);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    // Get a reference to the source database
    const sourceDb = client.db('lindas-nut-butter');
    
    // Drop the source database
    console.log('Dropping source database lindas-nut-butter...');
    await sourceDb.dropDatabase();
    console.log('Source database successfully dropped.');
    
    console.log('Operation completed successfully.');
  } catch (err) {
    console.error('Error during database operation:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

// Run the operation
dropDatabase();
