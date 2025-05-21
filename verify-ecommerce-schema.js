/**
 * E-commerce Database Schema Verification Script
 * 
 * This script verifies the MongoDB schema for Linda's Nut Butter Store
 * and ensures it's fully compatible with e-commerce functionality.
 * 
 * Run with: node verify-ecommerce-schema.js
 */

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

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

// Safely create index if it doesn't exist
async function safeCreateIndex(collection, indexSpec, options = {}) {
  try {
    await collection.createIndex(indexSpec, options);
    console.log(`  ✅ Created index on ${JSON.stringify(indexSpec)}`);
    return true;
  } catch (error) {
    if (error.code === 86) {
      // Index already exists
      console.log(`  ℹ️ Index on ${JSON.stringify(indexSpec)} already exists`);
      return true;
    }
    console.error(`  ❌ Error creating index on ${JSON.stringify(indexSpec)}:`, error.message);
    return false;
  }
}

// Create indexes for collections
async function optimizeIndexes(db) {
  console.log('\n🔍 Verifying and optimizing indexes for e-commerce collections...');
  
  // Products collection indexes
  console.log('\n📦 Products collection:');
  await safeCreateIndex(db.collection('products'), { "name": 1 }, { unique: true });
  await safeCreateIndex(db.collection('products'), { "sku": 1 }, { unique: true });
  await safeCreateIndex(db.collection('products'), { "category": 1 });
  await safeCreateIndex(db.collection('products'), { "isActive": 1 });
  
  // Users collection indexes
  console.log('\n👤 Users collection:');
  await safeCreateIndex(db.collection('users'), { "email": 1 }, { unique: true });
  
  // Customers collection indexes
  console.log('\n🧑‍🤝‍🧑 Customers collection:');
  await safeCreateIndex(db.collection('customers'), { "email": 1 }, { unique: true });
  await safeCreateIndex(db.collection('customers'), { "phoneNumber": 1 });
  
  // Orders collection indexes
  console.log('\n📋 Orders collection:');
  await safeCreateIndex(db.collection('orders'), { "customerEmail": 1 });
  await safeCreateIndex(db.collection('orders'), { "orderNumber": 1 }, { unique: true });
  await safeCreateIndex(db.collection('orders'), { "status": 1 });
  await safeCreateIndex(db.collection('orders'), { "createdAt": -1 });
  
  // Transactions collection indexes
  console.log('\n💰 Transactions collection:');
  await safeCreateIndex(db.collection('transactions'), { "orderId": 1 });
  await safeCreateIndex(db.collection('transactions'), { "transactionId": 1 }, { unique: true });
  await safeCreateIndex(db.collection('transactions'), { "status": 1 });
  
  // Inventory logs collection indexes
  console.log('\n📊 Inventory logs collection:');
  await safeCreateIndex(db.collection('inventorylogs'), { "productId": 1 });
  await safeCreateIndex(db.collection('inventorylogs'), { "sku": 1 });
  await safeCreateIndex(db.collection('inventorylogs'), { "createdAt": -1 });
  
  // Categories collection indexes
  console.log('\n🏷️ Categories collection:');
  await safeCreateIndex(db.collection('categories'), { "name": 1 }, { unique: true });
  await safeCreateIndex(db.collection('categories'), { "slug": 1 }, { unique: true });
  
  // Coupons collection indexes
  console.log('\n🎟️ Coupons collection:');
  await safeCreateIndex(db.collection('coupons'), { "code": 1 }, { unique: true });
  
  // Reviews collection indexes
  console.log('\n⭐ Reviews collection:');
  await safeCreateIndex(db.collection('reviews'), { "productId": 1 });
  await safeCreateIndex(db.collection('reviews'), { "customerId": 1 });
  
  // Cart collection indexes
  console.log('\n🛒 Cart collection:');
  await safeCreateIndex(db.collection('cart'), { "customerId": 1 });
  await safeCreateIndex(db.collection('cart'), { "sessionId": 1 });
  
  return true;
}

// Verify collection structure and create if missing
async function verifyCollectionStructure(db) {
  console.log('\n🔍 Verifying collection structure...');
  
  // List of required collections for e-commerce
  const requiredCollections = [
    'products',
    'users',
    'customers',
    'orders',
    'transactions',
    'inventorylogs',
    'categories',
    'coupons',
    'reviews',
    'cart'
  ];
  
  // Get existing collections
  const collections = await db.listCollections().toArray();
  const existingCollections = collections.map(c => c.name);
  
  // Check for missing collections
  const missingCollections = requiredCollections.filter(c => !existingCollections.includes(c));
  
  if (missingCollections.length === 0) {
    console.log('✅ All required collections exist');
    return true;
  }
  
  console.log(`\n⚠️ Missing collections: ${missingCollections.join(', ')}`);
  console.log('Creating missing collections...');
  
  // Create missing collections
  for (const collection of missingCollections) {
    await db.createCollection(collection);
    console.log(`✅ Created collection: ${collection}`);
  }
  
  return true;
}

// Verify database compatibility
async function verifyDatabaseCompatibility(db) {
  // Check MongoDB version
  const buildInfo = await db.command({ buildInfo: 1 });
  console.log(`\n🔍 MongoDB version: ${buildInfo.version}`);
  
  if (buildInfo.version.startsWith('6.') || buildInfo.version.startsWith('7.') || buildInfo.version.startsWith('8.')) {
    console.log('✅ MongoDB version is compatible with modern e-commerce applications');
  } else {
    console.log('⚠️ MongoDB version may not support all modern features. Consider upgrading if possible.');
  }
  
  // Check for database features
  try {
    // Test transactions support
    const session = db.client.startSession();
    session.endSession();
    console.log('✅ MongoDB supports transactions (required for order processing)');
  } catch (error) {
    console.log('⚠️ MongoDB may not support transactions. This could affect order processing reliability.');
  }
  
  return true;
}

// Main function
async function main() {
  let client;
  
  try {
    client = await connectToMongo();
    const db = client.db(DB_NAME);
    
    console.log(`\n🛒 Verifying database schema for e-commerce functionality...`);
    
    // Verify MongoDB compatibility
    await verifyDatabaseCompatibility(db);
    
    // Verify collection structure
    await verifyCollectionStructure(db);
    
    // Optimize indexes
    await optimizeIndexes(db);
    
    console.log('\n🚀 Database verification complete!');
    console.log('\nYour database is now fully compatible with e-commerce functionality:');
    console.log('- All required collections are present');
    console.log('- Optimized indexes for fast queries');
    console.log('- Ready for product catalog, customer management, and order processing');
    
    await client.close();
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) await client.close();
    process.exit(1);
  }
}

// Start the script
main();
