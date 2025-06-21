/**
 * Migration Script for Linda's Nut Butter Store
 * 
 * This script migrates missing products from the old database (lindas-nut-butter)
 * to the new database (lindas-nut-butter-store) with the updated schema.
 * 
 * Run with: node migrate-missing-products.js
 */

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const readline = require('readline');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Database connection strings
const OLD_DB_URI = 'mongodb://localhost:27017/lindas-nut-butter';
const NEW_DB_URI = 'mongodb://localhost:27017/lindas-nut-butter-store';

// Connect to both databases
async function connectToDatabases() {
  try {
    console.log('🔄 Connecting to databases...');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    
    const oldDb = client.db('lindas-nut-butter');
    const newDb = client.db('lindas-nut-butter-store');
    
    console.log('✅ Connected to both databases');
    return { client, oldDb, newDb };
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Generate a SKU based on product category and a sequential number
function generateSku(category, index) {
  const prefix = category.substring(0, 3).toUpperCase();
  const number = String(index).padStart(3, '0');
  return `${prefix}${number}`;
}

// Convert old product schema to new product schema
function convertProductSchema(oldProduct, existingProducts) {
  // Find the highest index for this category to generate a unique SKU
  const categoryProducts = existingProducts.filter(p => p.category === oldProduct.category);
  const categoryIndex = categoryProducts.length + 1;
  
  // Map old product to new schema
  return {
    name: oldProduct.name,
    description: oldProduct.description,
    price: oldProduct.variants && oldProduct.variants.length > 0 ? 
           oldProduct.variants[oldProduct.variants.length - 1].price : 
           oldProduct.price,
    images: [oldProduct.image],
    category: oldProduct.category,
    stockQuantity: oldProduct.variants && oldProduct.variants.length > 0 ? 
                  oldProduct.variants.reduce((total, variant) => total + variant.stock, 0) : 
                  20, // Default stock if no variants
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    notifyOnLowStock: true,
    sku: generateSku(oldProduct.category, categoryIndex),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Migrate products from old DB to new DB
async function migrateProducts() {
  let client;
  
  try {
    // Connect to databases
    const connections = await connectToDatabases();
    client = connections.client;
    const oldDb = connections.oldDb;
    const newDb = connections.newDb;
    
    // Get all products from both databases
    const oldProducts = await oldDb.collection('products').find({}).toArray();
    const newProducts = await newDb.collection('products').find({}).toArray();
    
    // Find products that exist in old DB but not in new DB (by name)
    const newProductNames = newProducts.map(p => p.name);
    const missingProducts = oldProducts.filter(p => !newProductNames.includes(p.name));
    
    if (missingProducts.length === 0) {
      console.log('✅ No missing products to migrate');
      return;
    }
    
    console.log(`\n🔍 Found ${missingProducts.length} products to migrate:`);
    missingProducts.forEach(p => console.log(` - ${p.name}`));
    
    // Convert old products to new schema
    const productsToInsert = missingProducts.map(p => convertProductSchema(p, newProducts));
    
    console.log('\n📋 Products to be inserted with new schema:');
    productsToInsert.forEach(p => {
      console.log(`\n - ${p.name} (${p.sku}):`);
      console.log(`   Price: ${p.price}, Category: ${p.category}, Stock: ${p.stockQuantity}`);
    });
    
    // Ask for confirmation before proceeding
    rl.question('\n⚠️ Do you want to proceed with the migration? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Insert the converted products into the new database
        const result = await newDb.collection('products').insertMany(productsToInsert);
        
        console.log(`\n✅ Successfully migrated ${result.insertedCount} products to the new database`);
        
        // Create inventory logs for the new products
        const inventoryLogs = productsToInsert.map(p => ({
          productId: p._id,
          productName: p.name,
          sku: p.sku,
          quantityChange: p.stockQuantity,
          previousQuantity: 0,
          newQuantity: p.stockQuantity,
          reason: 'INITIAL_IMPORT',
          notes: 'Migrated from old database',
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await newDb.collection('inventorylogs').insertMany(inventoryLogs);
        console.log(`✅ Created ${inventoryLogs.length} inventory logs for the migrated products`);
        
        rl.close();
        await client.close();
      } else {
        console.log('❌ Migration cancelled');
        rl.close();
        await client.close();
      }
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    if (client) await client.close();
    rl.close();
    process.exit(1);
  }
}

// Start the migration process
migrateProducts();
