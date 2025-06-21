// Simple script to drop the unused database after checking its contents
const { MongoClient } = require('mongodb');

// Database connection strings
const url = 'mongodb://localhost:27017';

async function dropDatabase() {
  const client = new MongoClient(url);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    // Get a reference to both databases
    const sourceDb = client.db('lindas-nut-butter');
    const targetDb = client.db('lindas-nut-butter-store');
    
    // Check users in source database
    console.log('Checking users in source database...');
    const sourceUsers = await sourceDb.collection('users').find({}).toArray();
    console.log(`Found ${sourceUsers.length} users in source database`);
    
    // Check products in source database
    console.log('Checking products in source database...');
    const sourceProducts = await sourceDb.collection('products').find({}).toArray();
    console.log(`Found ${sourceProducts.length} products in source database`);
    
    // Check if any important data in source
    if (sourceUsers.length > 0 || sourceProducts.length > 0) {
      console.log('WARNING: Source database contains users or products.');
      console.log('Checking if they exist in target database...');
      
      // Check if users already exist in target
      let allExist = true;
      for (const user of sourceUsers) {
        const targetUser = await targetDb.collection('users').findOne({ email: user.email });
        if (!targetUser) {
          console.log(`User ${user.email} not found in target database`);
          allExist = false;
        }
      }
      
      if (!allExist) {
        console.log('Not all users exist in target database. Please transfer data manually before dropping.');
        return;
      }
    }
    
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
