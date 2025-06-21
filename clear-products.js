/**
 * Clear Products Script for Linda's Nut Butter Store
 * 
 * This script removes all products from the database to allow for a clean setup.
 * Products can be added later with proper SKUs and consistent data.
 * 
 * Run with: node clear-products.js
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
const DB_NAME = 'lindas-nut-butter-store';

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

// Clear products collection
async function clearProducts(client) {
  try {
    const db = client.db(DB_NAME);
    
    // First, get a count of products
    const productCount = await db.collection('products').countDocuments();
    console.log(`\n📊 Current product count: ${productCount}`);
    
    if (productCount === 0) {
      console.log('ℹ️ No products found in the database. Nothing to clear.');
      return false;
    }
    
    // List all products before deletion
    console.log('\n📋 Current products in database:');
    const products = await db.collection('products').find({}).toArray();
    products.forEach(p => {
      console.log(` - ${p.name} (SKU: ${p.sku})`);
    });
    
    // Delete all products
    const result = await db.collection('products').deleteMany({});
    console.log(`\n✅ Successfully removed ${result.deletedCount} products from the database`);
    
    // Also clear related inventory logs
    const inventoryResult = await db.collection('inventorylogs').deleteMany({});
    console.log(`✅ Removed ${inventoryResult.deletedCount} inventory logs`);
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing products:', error);
    return false;
  }
}

// Main function
async function main() {
  let client;
  
  try {
    client = await connectToMongo();
    
    rl.question('\n⚠️ WARNING: This will remove ALL products from the database. Are you sure? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await clearProducts(client);
        console.log('\n🚀 Database is now ready for a fresh product setup.');
      } else {
        console.log('❌ Operation cancelled. No changes were made.');
      }
      
      await client.close();
      rl.close();
    });
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) await client.close();
    rl.close();
    process.exit(1);
  }
}

// Start the script
main();
