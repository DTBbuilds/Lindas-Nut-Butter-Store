require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./backend/models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lindas-nut-butter-store';

// List of expected products and their prices
const expectedProducts = [
  { id: 1, name: 'Almond Butter - Creamy', price: 1200 },
  { id: 2, name: 'Almond Butter - Crunchy', price: 1200 },
  { id: 3, name: 'Almond Butter - Chocolate', price: 1400 },
  { id: 4, name: 'Almond Butter - Chocolate Orange', price: 1400 },
  { id: 5, name: 'Cashew Butter - Plain', price: 900 },
  { id: 6, name: 'Cashew Butter - Spicy Chili', price: 1050 },
  { id: 7, name: 'Cashew Butter - Chocolate', price: 1050 },
  { id: 8, name: 'Cashew Butter - Chocolate Orange', price: 1200 },
  { id: 9, name: 'Cashew Butter - Coconut', price: 1050 },
  { id: 10, name: 'Hazelnut Butter - Chocolate', price: 2600 },
  { id: 11, name: 'Macadamia Butter - Plain', price: 1050 },
  { id: 12, name: 'Macadamia Butter - Chocolate', price: 1200 },
  { id: 13, name: 'Peanut Butter - Creamy', price: 500 },
  { id: 14, name: 'Peanut Butter - Crunchy', price: 500 },
  { id: 15, name: 'Peanut Butter - Chocolate', price: 800 },
  { id: 16, name: 'Peanut Butter - Chocolate Mint', price: 600 },
  { id: 17, name: 'Seed Butter - Pumpkin Seed', price: 1000 },
  { id: 18, name: 'Pure Natural Honey', price: 600 }
];

async function verifyProducts() {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all products
    const products = await Product.find().sort({ id: 1 });
    console.log(`Found ${products.length} products in database`);

    // Verify each expected product
    console.log('\nVerifying products:');
    console.log('====================');
    
    let allCorrect = true;
    
    for (const expected of expectedProducts) {
      const found = products.find(p => p.id === expected.id);
      
      if (!found) {
        console.log(`❌ MISSING: Product ID ${expected.id} (${expected.name}) is missing`);
        allCorrect = false;
        continue;
      }
      
      const priceCorrect = found.price === expected.price;
      const nameCorrect = found.name === expected.name;
      
      if (priceCorrect && nameCorrect) {
        console.log(`✓ CORRECT: ${found.id}. ${found.name} - ${found.price} KES`);
      } else {
        console.log(`❌ INCORRECT: ${found.id}. ${found.name} (${expected.name}) - ${found.price} KES (should be ${expected.price} KES)`);
        allCorrect = false;
      }
    }
    
    console.log('\nSummary:');
    console.log('========');
    console.log(`Total expected products: ${expectedProducts.length}`);
    console.log(`Total products in database: ${products.length}`);
    
    if (allCorrect && products.length === expectedProducts.length) {
      console.log('✓ All products are correctly set up!');
    } else {
      console.log('❌ Products need to be fixed. Use the reset-products.js script and restart the server.');
    }

    // Exit properly
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error verifying products:', error);
    process.exit(1);
  }
}

verifyProducts();
