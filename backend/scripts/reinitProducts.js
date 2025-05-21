const mongoose = require('mongoose');
const Product = require('../models/Product');
const productsRouter = require('../routes/products');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store';

// Get the initializeDefaultProducts function from the products router
const initializeDefaultProducts = require('../routes/products').initializeDefaultProducts;

async function reinitializeProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Dropping products collection...');
    await mongoose.connection.dropCollection('products');
    
    console.log('Reinitializing products...');
    await initializeDefaultProducts();
    
    console.log('✅ Products reinitialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error reinitializing products:', error);
    process.exit(1);
  }
}

reinitializeProducts();
