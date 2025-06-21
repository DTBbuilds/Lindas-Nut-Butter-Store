// Script to remove the admin user with email admin@example.com
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'lindas-nut-butter-store-store-store-store';

async function removeAdminUser() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = client.db(dbName);
    
    // Get users collection
    const usersCollection = db.collection('users');
    
    // Find user before deletion to confirm it exists
    const userToDelete = await usersCollection.findOne({ email: 'admin@example.com' });
    
    if (userToDelete) {
      console.log('Found user to delete:', userToDelete.email, `(${userToDelete.role})`);
      
      // Delete the user
      const result = await usersCollection.deleteOne({ email: 'admin@example.com' });
      
      if (result.deletedCount === 1) {
        console.log('User admin@example.com successfully deleted');
      } else {
        console.log('Failed to delete user');
      }
    } else {
      console.log('User admin@example.com not found in database');
    }
    
    // Verify remaining users
    const remainingUsers = await usersCollection.find({}).toArray();
    console.log('\nRemaining users in database:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
  } catch (err) {
    console.error('Error removing admin user:', err);
  } finally {
    await client.close();
    console.log('Operation complete');
  }
}

removeAdminUser().catch(console.error);
