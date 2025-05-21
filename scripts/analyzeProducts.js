const mongoose = require('mongoose');
const path = require('path');

// Load Product model (adjust path if needed)
const Product = require(path.join(__dirname, '../backend/models/Product'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store';

async function analyzeProducts() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    const products = await Product.find();
    console.log(`Total products: ${products.length}`);
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error analyzing products:', err);
    process.exit(1);
  }
}

analyzeProducts();
