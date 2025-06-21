// backend/scripts/updateProductStatus.js
// Ensure .env variables are loaded. The database.js file also does this,
// but it's good practice for scripts to manage their .env dependency if needed directly or ensure it's loaded by prerequisites.
// Assuming .env is at the project root. If the script is run from the project root, this path is fine.
// If run from backend/scripts, it might need to be '../../.env'
// However, since connectWithRetry from database.js is used, and it loads dotenv, this might be redundant or could conflict.
// Let's rely on database.js to handle dotenv.
// require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });


const mongoose = require('mongoose');
const Product = require('../models/Product'); // Adjust path if Product.js is elsewhere
const { connectWithRetry, MONGODB_URI } = require('../config/database'); // Adjust path for database.js

const productNameToUpdate = "Peanut Butter - Chocolate Mint";
const newAvailableOnOrderStatus = true;

async function updateExistingProductStatus() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined. Please ensure your .env file is set up correctly at the project root, or check backend/config/database.js.');
    process.exit(1);
  }

  console.log(`Attempting to connect to MongoDB using URI from configuration...`);
  // connectWithRetry will log the URI it uses
  await connectWithRetry();

  try {
    console.log(`Searching for product: "${productNameToUpdate}" in the database.`);
    const product = await Product.findOne({ name: productNameToUpdate });

    if (product) {
      console.log(`Found product: ${product.name} (ID: ${product.id}, MongoDB _id: ${product._id})`);
      console.log(`Current 'isAvailableOnOrder' status: ${product.isAvailableOnOrder}`);
      console.log(`Current 'inStock' status: ${product.inStock}`);

      if (product.isAvailableOnOrder === newAvailableOnOrderStatus) {
        console.log(`Product "${product.name}" is already set to 'isAvailableOnOrder: ${newAvailableOnOrderStatus}'. No database update performed.`);
      } else {
        product.isAvailableOnOrder = newAvailableOnOrderStatus;
        // Note: We are not changing 'inStock' here, only 'isAvailableOnOrder'.
        // The default product list already has 'inStock: false' for this item.
        await product.save();
        console.log(`Successfully updated "${product.name}". New 'isAvailableOnOrder' status: ${product.isAvailableOnOrder}`);
      }
    } else {
      console.warn(`Product "${productNameToUpdate}" not found in the database. No update was performed.`);
      console.warn(`Please ensure the product name is exact or that the product exists.`);
    }
  } catch (error) {
    console.error('An error occurred while trying to update the product:', error);
  } finally {
    console.log('Attempting to disconnect from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

updateExistingProductStatus();
