// Script to check if admin accounts are available in the database
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'lindas-nut-butter-store-store-store-store';

async function checkAdminAccounts() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = client.db(dbName);
    
    // Get users collection
    const usersCollection = db.collection('users');
    
    // Find all admin users
    const adminUsers = await usersCollection.find({ role: 'admin' }).toArray();
    
    if (adminUsers.length > 0) {
      console.log(`Found ${adminUsers.length} admin account(s):`);
      adminUsers.forEach(user => {
        console.log(`- ${user.email} (role: ${user.role})`);
      });
      console.log('\nAdmin account is available and can be used for login.');
    } else {
      console.log('No admin accounts found in the database.');
      console.log('You may need to create an admin account using createAdminUser.js script.');
    }
    
  } catch (err) {
    console.error('Error checking admin accounts:', err);
  } finally {
    await client.close();
    console.log('Operation complete');
  }
}

checkAdminAccounts().catch(console.error);
