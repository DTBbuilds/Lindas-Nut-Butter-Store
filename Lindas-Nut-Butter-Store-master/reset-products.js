require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./backend/models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lindas-nut-butter-store';

async function resetProducts() {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing products
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('All products cleared');

    console.log('Database reset complete. You can now restart the server to reinitialize products.');

    // Exit properly
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting products:', error);
    process.exit(1);
  }
}

resetProducts();
