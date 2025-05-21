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

// Updated price list according to specifications
const priceUpdates = [
  { name: 'Almond Butter- Creamy', price: 1200 },
  { name: 'Almond Butter- Crunchy', price: 1200 },
  { name: 'Almond Butter- Chocolate', price: 1400 },
  { name: 'Almond Butter- Chocolate Orange', price: 1400 },
  { name: 'Cashew Butter- Chilli', price: 1050 },
  { name: 'Cashew Butter- Plain', price: 900 },
  { name: 'Cashew Butter- Chocolate', price: 1050 },
  { name: 'Cashew Butter- Chocolate Orange', price: 1200 },
  { name: 'Cashew Butter- Coconut', price: 1050 },
  { name: 'Hazelnut Butter- Chocolate', price: 2600 },
  { name: 'Honey', price: 600 },
  { name: 'Macadamia Nut Butter', price: 1050 },
  { name: 'Macadamia Butter- Chocolate', price: 1200 },
  { name: 'Peanut Butter- Creamy', price: 500 },
  { name: 'Peanut Butter- Crunchy', price: 500 },
  { name: 'Peanut Butter- Chocolate', price: 800 },
  { name: 'Peanut Butter- Chocolate Mint', price: 600 },
  { name: 'Pumpkin Seed Butter', price: 1000 },
  // Also include the old product names
  { name: 'Creamy Almond Butter', price: 1200 },
  { name: 'Crunchy Peanut Butter', price: 500 },
  { name: 'Pure Honey', price: 600 },
  { name: 'Creamy Cashew Butter', price: 900 }
];

async function updateProductPrices() {
  try {
    console.log('Fetching products to update prices...');
    const response = await axios.get(`${API_URL}/api/products?limit=1000`);
    const products = response.data.data.products;
    console.log(`Found ${products.length} products`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      // Find the matching price update entry
      const priceUpdate = priceUpdates.find(update => update.name === product.name);
      
      if (priceUpdate) {
        // Check if price update is needed
        if (product.price !== priceUpdate.price) {
          console.log(`Updating price for "${product.name}": ${product.price} → ${priceUpdate.price}`);
          
          try {
            // Update product inventory (which includes price update capability)
            await axios.patch(
              `${API_URL}/api/products/${product._id}/inventory`,
              { 
                price: priceUpdate.price,
                notes: 'Price update from script'
              },
              { headers: { Authorization: `Bearer ${token}` }}
            );
            
            console.log(`✅ Successfully updated price for "${product.name}"`);
            updatedCount++;
          } catch (error) {
            console.error(`❌ Failed to update price for "${product.name}":`, error.message);
            if (error.response) {
              console.error('Response:', error.response.status, error.response.statusText);
            }
            errorCount++;
          }
        } else {
          console.log(`⏭️ Price already correct for "${product.name}": ${product.price}`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️ No price update defined for "${product.name}"`);
        skippedCount++;
      }
    }

    console.log('\n=== Price Update Summary ===');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Products skipped: ${skippedCount}`);
    console.log(`Failed updates: ${errorCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data));
    }
  }
}

updateProductPrices();
