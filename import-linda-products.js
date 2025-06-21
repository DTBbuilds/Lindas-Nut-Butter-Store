/**
 * Custom product import script for Linda's Nut Butter Store
 * This script reads product data from products_latest.json and seeds the database.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Product } = require('./server/models');
// const config = require('./server/config'); // No longer needed, using process.env

const importProducts = async () => {
  console.log('--- Starting Product Import Script ---');
  try {
    // Read product data from the JSON file
    const jsonPath = path.join(__dirname, 'products_latest.json');
    console.log(`Reading product data from: ${jsonPath}`);
    let data = fs.readFileSync(jsonPath, 'utf-8');
    // Remove BOM if present
    if (data.charCodeAt(0) === 0xFEFF) {
      data = data.slice(1);
    }
    let { products } = JSON.parse(data);

    if (!products || products.length === 0) {
      console.log('No products found in the JSON file. Exiting.');
      return;
    }

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lindas_nut_butter_store'; // Fallback to the correct DB name
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully.');

    // Drop the problematic index if it exists
    const db = mongoose.connection;
    const productCollection = db.collection('products');
    try {
      console.log('Attempting to drop "id_1" index...');
      await productCollection.dropIndex("id_1");
      console.log('"id_1" index dropped successfully.');
    } catch (indexDropError) {
      if (indexDropError.codeName === 'IndexNotFound') {
        console.log('"id_1" index not found, which is fine.');
      } else {
        console.warn('Warning/Error trying to drop "id_1" index (will proceed):', indexDropError.message);
      }
    }

    // Clear existing products
    console.log('Clearing existing products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`${deleteResult.deletedCount} products deleted.`);

    // Ensure all products are marked as active so they appear in the store
    products = products.map(p => ({ ...p, isActive: true }));

    // Import new products
    console.log(`Attempting to import ${products.length} products...`);
    const insertedProducts = await Product.insertMany(products);
    console.log(`${insertedProducts.length} products imported successfully!`);

    // Provide a summary of imported products
    console.log('\n--- Linda\'s Nut Butter Products Imported ---');
    insertedProducts.forEach(product => {
      console.log(`- ${product.name} (${product.category}) - ${product.price} KES`);
    });

    // Set special status for Chocolate Mint Peanut Butter
    console.log('\nSetting Chocolate Mint Peanut Butter as available only on order...');
    const mintProduct = await Product.findOne({ sku: 'PNT004' });
    if (mintProduct) {
      mintProduct.inventoryStatus = 'AVAILABLE_ON_ORDER';
      await mintProduct.save();
      console.log('Status for Chocolate Mint Peanut Butter updated successfully.');
    } else {
      console.log('Chocolate Mint Peanut Butter not found with SKU PNT004.');
    }

  } catch (error) {
    console.error('Error during product import:', error);
  } finally {
    // Close the MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Closing MongoDB connection.');
    }
    console.log('--- Product Import Script Finished ---');
  }
};

// Run the import script
importProducts();
