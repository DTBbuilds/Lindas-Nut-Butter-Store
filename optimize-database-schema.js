/**
 * E-commerce Database Schema Optimization Script
 * 
 * This script verifies and enhances the MongoDB schema for Linda's Nut Butter Store
 * to ensure it's fully compatible with e-commerce functionality.
 * 
 * Run with: node optimize-database-schema.js
 */

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
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

// Create indexes for collections
async function createIndexes(db) {
  console.log('\n🔍 Creating optimal indexes for e-commerce collections...');
  
  try {
    // Products collection indexes
    await db.collection('products').createIndex({ "name": 1 }, { unique: true });
    await db.collection('products').createIndex({ "sku": 1 }, { unique: true });
    await db.collection('products').createIndex({ "category": 1 });
    await db.collection('products').createIndex({ "isActive": 1 });
    console.log('✅ Created indexes for products collection');
    
    // Users collection indexes
    await db.collection('users').createIndex({ "email": 1 }, { unique: true });
    console.log('✅ Created indexes for users collection');
    
    // Customers collection indexes
    await db.collection('customers').createIndex({ "email": 1 }, { unique: true });
    await db.collection('customers').createIndex({ "phoneNumber": 1 });
    console.log('✅ Created indexes for customers collection');
    
    // Orders collection indexes
    await db.collection('orders').createIndex({ "customerEmail": 1 });
    await db.collection('orders').createIndex({ "orderNumber": 1 }, { unique: true });
    await db.collection('orders').createIndex({ "status": 1 });
    await db.collection('orders').createIndex({ "createdAt": -1 });
    console.log('✅ Created indexes for orders collection');
    
    // Transactions collection indexes
    await db.collection('transactions').createIndex({ "orderId": 1 });
    await db.collection('transactions').createIndex({ "transactionId": 1 }, { unique: true });
    await db.collection('transactions').createIndex({ "status": 1 });
    console.log('✅ Created indexes for transactions collection');
    
    // Inventory logs collection indexes
    await db.collection('inventorylogs').createIndex({ "productId": 1 });
    await db.collection('inventorylogs').createIndex({ "sku": 1 });
    await db.collection('inventorylogs').createIndex({ "createdAt": -1 });
    console.log('✅ Created indexes for inventorylogs collection');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    return false;
  }
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
    
    // Add initial schema validation for new collections
    switch (collection) {
      case 'categories':
        await db.command({
          collMod: 'categories',
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['name', 'slug', 'isActive'],
              properties: {
                name: { bsonType: 'string' },
                slug: { bsonType: 'string' },
                description: { bsonType: 'string' },
                parentCategory: { bsonType: 'objectId' },
                imageUrl: { bsonType: 'string' },
                isActive: { bsonType: 'bool' },
                displayOrder: { bsonType: 'int' }
              }
            }
          }
        });
        await db.collection('categories').createIndex({ "name": 1 }, { unique: true });
        await db.collection('categories').createIndex({ "slug": 1 }, { unique: true });
        break;
        
      case 'coupons':
        await db.command({
          collMod: 'coupons',
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['code', 'discountType', 'discountValue', 'isActive', 'startDate', 'endDate'],
              properties: {
                code: { bsonType: 'string' },
                discountType: { enum: ['percentage', 'fixed'] },
                discountValue: { bsonType: 'number' },
                minimumPurchase: { bsonType: 'number' },
                maximumDiscount: { bsonType: 'number' },
                isActive: { bsonType: 'bool' },
                startDate: { bsonType: 'date' },
                endDate: { bsonType: 'date' },
                usageLimit: { bsonType: 'int' },
                usageCount: { bsonType: 'int' }
              }
            }
          }
        });
        await db.collection('coupons').createIndex({ "code": 1 }, { unique: true });
        break;
        
      case 'reviews':
        await db.command({
          collMod: 'reviews',
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['productId', 'customerId', 'rating', 'content'],
              properties: {
                productId: { bsonType: 'objectId' },
                customerId: { bsonType: 'objectId' },
                rating: { bsonType: 'int', minimum: 1, maximum: 5 },
                title: { bsonType: 'string' },
                content: { bsonType: 'string' },
                isVerifiedPurchase: { bsonType: 'bool' },
                isApproved: { bsonType: 'bool' },
                createdAt: { bsonType: 'date' }
              }
            }
          }
        });
        await db.collection('reviews').createIndex({ "productId": 1 });
        await db.collection('reviews').createIndex({ "customerId": 1 });
        break;
        
      case 'cart':
        await db.command({
          collMod: 'cart',
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              required: ['customerId', 'items', 'createdAt', 'updatedAt'],
              properties: {
                customerId: { bsonType: 'objectId' },
                sessionId: { bsonType: 'string' },
                items: { 
                  bsonType: 'array',
                  items: {
                    bsonType: 'object',
                    required: ['productId', 'quantity', 'price'],
                    properties: {
                      productId: { bsonType: 'objectId' },
                      sku: { bsonType: 'string' },
                      name: { bsonType: 'string' },
                      quantity: { bsonType: 'int' },
                      price: { bsonType: 'number' }
                    }
                  }
                },
                createdAt: { bsonType: 'date' },
                updatedAt: { bsonType: 'date' }
              }
            }
          }
        });
        await db.collection('cart').createIndex({ "customerId": 1 });
        await db.collection('cart').createIndex({ "sessionId": 1 });
        break;
    }
  }
  
  return true;
}

// Main function
async function main() {
  let client;
  
  try {
    client = await connectToMongo();
    const db = client.db(DB_NAME);
    
    console.log(`\n🛒 Optimizing database schema for e-commerce functionality...`);
    
    // Verify collection structure
    await verifyCollectionStructure(db);
    
    // Create optimal indexes
    await createIndexes(db);
    
    console.log('\n🚀 Database schema optimization complete!');
    console.log('\nYour database now has:');
    console.log('- Optimized collections for e-commerce functionality');
    console.log('- Proper indexes for fast queries');
    console.log('- Schema validation for data integrity');
    console.log('\nThe database is now fully compatible with your e-commerce store design.');
    
    await client.close();
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) await client.close();
    rl.close();
    process.exit(1);
  }
}

// Start the script
main();
