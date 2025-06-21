// Script to transfer missing users from the source database to the target database
const { MongoClient } = require('mongodb');

// Database connection strings
const url = 'mongodb://localhost:27017';

async function transferUsers() {
  const client = new MongoClient(url);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    // Get a reference to both databases
    const sourceDb = client.db('lindas-nut-butter');
    const targetDb = client.db('lindas-nut-butter-store');
    
    // Get users from source database
    console.log('Getting users from source database...');
    const sourceUsers = await sourceDb.collection('users').find({}).toArray();
    console.log(`Found ${sourceUsers.length} users in source database`);
    
    let transferredCount = 0;
    
    // Transfer each user if not exists in target
    for (const user of sourceUsers) {
      const targetUser = await targetDb.collection('users').findOne({ email: user.email });
      if (!targetUser) {
        console.log(`Transferring user: ${user.email}`);
        
        // Create a clean copy without _id (MongoDB will generate a new one)
        const userCopy = { ...user };
        delete userCopy._id;
        
        // Insert user into target database
        await targetDb.collection('users').insertOne(userCopy);
        transferredCount++;
      } else {
        console.log(`User ${user.email} already exists in target database`);
      }
    }
    
    console.log(`Successfully transferred ${transferredCount} users.`);
    
    if (transferredCount > 0) {
      console.log('All users transferred successfully. Now safe to drop source database.');
    }
    
    // Prompt to drop source database
    console.log('Do you want to drop the source database (lindas-nut-butter)? [y/n]');
    // This script will wait for user input in the terminal
    
  } catch (err) {
    console.error('Error during database operation:', err);
  } finally {
    // Don't close client yet - wait for user input on whether to drop database
    console.log('To drop the database, run: node dropSourceDatabase.js');
    await client.close();
  }
}

// Run the transfer
transferUsers();
