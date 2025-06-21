const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function showAllProductImages() {
  try {
    console.log('Fetching all products...');
    const response = await axios.get(`${API_URL}/api/products?limit=1000`);
    const products = response.data.data.products;
    console.log(`Found ${products.length} products\n`);

    console.log('=== Products and their image paths ===');
    products.forEach(product => {
      console.log(`Product: ${product.name} (ID: ${product._id})`);
      console.log(`Category: ${product.category}`);
      console.log(`Images: ${JSON.stringify(product.images || [])}`);
      console.log('-'.repeat(50));
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

showAllProductImages();
