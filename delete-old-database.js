/**
 * Database Cleanup Script for Linda's Nut Butter Store
 * 
 * This script safely deletes the old database (lindas-nut-butter) after confirming
 * that all necessary data has been migrated to the new database (lindas-nut-butter-store).
 * 
 * Run with: node delete-old-database.js
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Database connection string
const MONGO_URI = 'mongodb://localhost:27017';

// Database names
const OLD_DB_NAME = 'lindas-nut-butter';
const NEW_DB_NAME = 'lindas-nut-butter-store';

// Connect to MongoDB
async function connectToMongo() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Verify that all products have been migrated
async function verifyMigration(client) {
  try {
    const oldDb = client.db(OLD_DB_NAME);
    const newDb = client.db(NEW_DB_NAME);
    
    // Get all products from both databases
    const oldProducts = await oldDb.collection('products').find({}).toArray();
    const newProducts = await newDb.collection('products').find({}).toArray();
    
    // Check if all product names from old DB exist in new DB
    const newProductNames = newProducts.map(p => p.name);
    const missingProducts = oldProducts.filter(p => !newProductNames.includes(p.name));
    
    if (missingProducts.length > 0) {
      console.log('⚠️ Warning: Some products have not been migrated:');
      missingProducts.forEach(p => console.log(` - ${p.name}`));
      return false;
    }
    
    console.log('✅ All products have been successfully migrated');
    return true;
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
    return false;
  }
}

// Delete the old database
async function deleteOldDatabase(client) {
  try {
    console.log(`🗑️ Dropping database: ${OLD_DB_NAME}...`);
    await client.db(OLD_DB_NAME).dropDatabase();
    console.log(`✅ Successfully deleted database: ${OLD_DB_NAME}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting database:', error);
    return false;
  }
}

// Main function
async function main() {
  let client;
  
  try {
    client = await connectToMongo();
    
    console.log('\n🔍 Verifying that all data has been migrated...');
    const migrationComplete = await verifyMigration(client);
    
    if (!migrationComplete) {
      console.log('\n⚠️ Migration is incomplete. Please run the migration script first.');
      rl.question('\n⚠️ Do you want to force delete the database anyway? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await deleteOldDatabase(client);
        } else {
          console.log('❌ Database deletion cancelled.');
        }
        await client.close();
        rl.close();
      });
    } else {
      rl.question('\n⚠️ Are you sure you want to delete the old database? This action cannot be undone. (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await deleteOldDatabase(client);
        } else {
          console.log('❌ Database deletion cancelled.');
        }
        await client.close();
        rl.close();
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) await client.close();
    rl.close();
    process.exit(1);
  }
}

// Start the script
main();
