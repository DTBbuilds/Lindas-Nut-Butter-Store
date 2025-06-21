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

// Define the specific products to fix with their IDs and correct image paths
const productsToFix = [
  {
    id: '68259615c8bead1af72111dc', // Creamy Cashew Butter
    name: 'Creamy Cashew Butter',
    updates: {
      images: ['/images/cashew-butter.jpg'],
      category: 'Cashew Butter' // Updating category to match new products
    }
  },
  {
    id: '68259615c8bead1af72111dd', // Pure Honey
    name: 'Pure Honey',
    updates: {
      images: ['/images/pure-honey.jpg'],
      category: 'Honey' // Category already matches
    }
  },
  {
    id: '68259615c8bead1af72111db', // Crunchy Peanut Butter
    name: 'Crunchy Peanut Butter',
    updates: {
      images: ['/images/crunchy-peanut-butter.jpg'],
      category: 'Peanut Butter' // Updating category to match new products
    }
  },
  {
    id: '68259615c8bead1af72111da', // Creamy Almond Butter
    name: 'Creamy Almond Butter',
    updates: {
      images: ['/images/almond-butter.jpg'],
      category: 'Almond Butter' // Updating category to match new products
    }
  }
];

async function fixOldProducts() {
  try {
    console.log('Fixing old products with incorrect image paths...\n');

    for (const product of productsToFix) {
      console.log(`Updating product: ${product.name} (ID: ${product.id})`);
      
      try {
        const response = await axios.put(
          `${API_URL}/api/products/${product.id}`,
          product.updates,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        if (response.status === 200) {
          console.log(`✅ Successfully updated ${product.name}`);
        } else {
          console.log(`⚠️ Unexpected response for ${product.name}:`, response.status);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${product.name}:`, error.message);
        if (error.response) {
          console.error('Response:', error.response.status, error.response.statusText);
          console.error('Data:', JSON.stringify(error.response.data));
        }
      }
      
      console.log('-'.repeat(50));
    }
    
    console.log('\nProduct fixes completed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixOldProducts();
