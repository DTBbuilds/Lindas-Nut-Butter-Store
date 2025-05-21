const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:5000';
// Try to read token from file, fallback to environment variable
let token;
try {
  token = fs.readFileSync('admin-token.txt', 'utf8').trim();
  console.log('Using admin token from file');
} catch (err) {
  token = process.env.ADMIN_TOKEN || '<YOUR_ADMIN_TOKEN>';
  console.log('Token file not found, using environment variable');
}

// Mapping of problematic image paths to their correct versions
const imagePathFixes = {
  '/images/crunchy%20Peanut%20butter.jpg': '/images/crunchy-peanut-butter.jpg',
  '/images/Pure%20Honey.jpg': '/images/pure-honey.jpg',
  '/images/Plain%20Almond.jpg': '/images/almond-butter.jpg',
  '/images/plain%20cashew.jpg': '/images/cashew-butter.jpg',
  
  // Add more mappings as needed
  '/images/crunchy Peanut butter.jpg': '/images/crunchy-peanut-butter.jpg',
  '/images/Pure Honey.jpg': '/images/pure-honey.jpg',
  '/images/Plain Almond.jpg': '/images/almond-butter.jpg',
  '/images/plain cashew.jpg': '/images/cashew-butter.jpg'
};

async function fixImagePaths() {
  try {
    console.log('Fetching all products...');
    const productsResponse = await axios.get(`${API_URL}/api/products?limit=1000`);
    const products = productsResponse.data.data.products || [];
    
    console.log(`Found ${products.length} products. Checking for image path issues...`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      const updatedImages = [];
      
      // Check if any of the product's images need updating
      for (const imagePath of product.images || []) {
        if (imagePathFixes[imagePath]) {
          console.log(`Found problematic image path in product "${product.name}": ${imagePath}`);
          updatedImages.push(imagePathFixes[imagePath]);
          needsUpdate = true;
        } else {
          updatedImages.push(imagePath);
        }
      }
      
      // Update the product if needed
      if (needsUpdate) {
        try {
          console.log(`Updating product "${product.name}" with fixed image paths...`);
          
          await axios.put(`${API_URL}/api/products/${product._id}`, 
            { images: updatedImages },
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          console.log(`✅ Successfully updated product "${product.name}"`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Failed to update product "${product.name}":`, error.message);
          errorCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n=== Image Path Fix Summary ===');
    console.log(`Total products checked: ${products.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Products skipped (no issues): ${skippedCount}`);
    console.log(`Failed updates: ${errorCount}`);
    
  } catch (error) {
    console.error('Failed to complete image path fixes:', error.message);
  }
}

if (!token || token === '<YOUR_ADMIN_TOKEN>') {
  console.log('Please provide an admin token to continue.');
} else {
  fixImagePaths();
}
