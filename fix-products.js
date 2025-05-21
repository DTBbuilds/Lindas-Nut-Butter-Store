const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000';

// Read token from file
let token;
try {
  token = fs.readFileSync('admin-token.txt', 'utf8').trim();
  console.log('Using admin token from file');
} catch (err) {
  console.error('Error reading token file:', err.message);
  process.exit(1);
}

// Define image path mappings
const imagePathMappings = {
  '/images/crunchy%20Peanut%20butter.jpg': '/images/crunchy-peanut-butter.jpg',
  '/images/Pure%20Honey.jpg': '/images/pure-honey.jpg',
  '/images/Plain%20Almond.jpg': '/images/almond-butter.jpg',
  '/images/plain%20cashew.jpg': '/images/cashew-butter.jpg'
};

async function fixProducts() {
  try {
    // Get all products
    console.log('Fetching all products...');
    const response = await axios.get(`${API_URL}/api/products?limit=1000`);
    const products = response.data.data.products;
    console.log(`Found ${products.length} products`);

    // Find products with the problematic image paths
    const productsToFix = products.filter(product => {
      if (!product.images) return false;
      return product.images.some(image => {
        return Object.keys(imagePathMappings).includes(image);
      });
    });

    console.log(`Found ${productsToFix.length} products with image path issues`);

    // Fix each product
    for (const product of productsToFix) {
      console.log(`\nFixing product: ${product.name} (ID: ${product._id})`);
      console.log(`Current images: ${JSON.stringify(product.images)}`);
      
      // Fix image paths
      const updatedImages = product.images.map(image => {
        return imagePathMappings[image] || image;
      });
      
      console.log(`Updated images: ${JSON.stringify(updatedImages)}`);
      
      // Update the product
      try {
        await axios.put(
          `${API_URL}/api/products/${product._id}`,
          { images: updatedImages },
          { headers: { Authorization: `Bearer ${token}` }}
        );
        console.log(`✅ Product "${product.name}" updated successfully`);
      } catch (error) {
        console.error(`❌ Failed to update product "${product.name}":`, error.message);
        if (error.response) {
          console.error('Response data:', JSON.stringify(error.response.data));
        }
      }
    }
    
    console.log('\nProduct image path fix completed.');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

fixProducts();
