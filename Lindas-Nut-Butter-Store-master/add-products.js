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

const products = [
  {
    name: 'Almond Butter- Creamy',
    description: 'Rich, creamy almond butter made from high-quality almonds. Perfect for spreading on toast or adding to smoothies.',
    price: 1200,
    category: 'Almond Butter',
    sku: 'ALM-CRM-370',
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: ['/images/almond-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Almond Butter- Crunchy',
    description: 'Delicious crunchy almond butter with small almond chunks for extra texture.',
    price: 1200,
    category: 'Almond Butter',
    sku: 'ALM-CRN-370',
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: ['/images/almond-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Almond Butter- Chocolate',
    description: 'Decadent chocolate almond butter combining the goodness of almonds with rich chocolate flavor.',
    price: 1400,
    category: 'Almond Butter',
    sku: 'ALM-CHC-370',
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: ['/images/chocolate-almond-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Almond Butter- Chocolate Orange',
    description: 'Unique chocolate almond butter with a refreshing orange twist.',
    price: 1400,
    category: 'Almond Butter',
    sku: 'ALM-CHCO-370',
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: ['/images/chocolate-orange-almond.jpg'],
    weight: '370g'
  },
  {
    name: 'Cashew Butter- Chilli',
    description: 'Spicy cashew butter with a hint of chili for those who enjoy a little heat.',
    price: 1050,
    category: 'Cashew Butter',
    sku: 'CSH-CHI-370',
    stockQuantity: 18,
    lowStockThreshold: 5,
    images: ['/images/chilli-choco-cashew-.jpg'],
    weight: '370g'
  },
  {
    name: 'Cashew Butter- Plain',
    description: 'Smooth, creamy cashew butter made from premium cashews.',
    price: 900,
    category: 'Cashew Butter',
    sku: 'CSH-PLN-370',
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: ['/images/cashew-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Cashew Butter- Chocolate',
    description: 'Indulgent chocolate cashew butter, perfect for spreading or as a dip.',
    price: 1050,
    category: 'Cashew Butter',
    sku: 'CSH-CHC-370',
    stockQuantity: 18,
    lowStockThreshold: 5,
    images: ['/images/chocolate-cashew.jpg'],
    weight: '370g'
  },
  {
    name: 'Cashew Butter- Chocolate Orange',
    description: 'Luxurious chocolate cashew butter with a bright orange flavor.',
    price: 1200,
    category: 'Cashew Butter',
    sku: 'CSH-CHCO-370',
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: ['/images/chocolate-orange-cashew.jpg'],
    weight: '370g'
  },
  {
    name: 'Cashew Butter- Coconut',
    description: 'Tropical coconut cashew butter, a unique and delicious flavor combination.',
    price: 1050,
    category: 'Cashew Butter',
    sku: 'CSH-CCN-370',
    stockQuantity: 18,
    lowStockThreshold: 5,
    images: ['/images/coconut-cashew-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Hazelnut Butter- Chocolate',
    description: 'Premium chocolate hazelnut butter, similar to popular chocolate spreads but healthier.',
    price: 2600,
    category: 'Hazelnut Butter',
    sku: 'HZL-CHC-370',
    stockQuantity: 12,
    lowStockThreshold: 5,
    images: ['/images/chocolate-hazelnut-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Honey',
    description: 'Pure, natural honey with no additives or preservatives.',
    price: 600,
    category: 'Honey',
    sku: 'HNY-PUR-370',
    stockQuantity: 25,
    lowStockThreshold: 8,
    images: ['/images/pure-honey.jpg'],
    weight: '370g'
  },
  {
    name: 'Macadamia Nut Butter',
    description: 'Luxurious macadamia nut butter made from premium macadamia nuts.',
    price: 1050,
    category: 'Macadamia Butter',
    sku: 'MAC-PLN-370',
    stockQuantity: 18,
    lowStockThreshold: 5,
    images: ['/images/macadamia-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Macadamia Butter- Chocolate',
    description: 'Rich chocolate macadamia butter, a special treat for nut butter lovers.',
    price: 1200,
    category: 'Macadamia Butter',
    sku: 'MAC-CHC-370',
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: ['/images/chocolate-macadamia-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Peanut Butter- Creamy',
    description: 'Smooth, creamy peanut butter made from high-quality peanuts.',
    price: 500,
    category: 'Peanut Butter',
    sku: 'PNT-CRM-370',
    stockQuantity: 30,
    lowStockThreshold: 10,
    images: ['/images/creamy-peanut-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Peanut Butter- Crunchy',
    description: 'Traditional crunchy peanut butter with small peanut pieces for extra texture.',
    price: 500,
    category: 'Peanut Butter',
    sku: 'PNT-CRN-370',
    stockQuantity: 30,
    lowStockThreshold: 10,
    images: ['/images/crunchy-peanut-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Peanut Butter- Chocolate',
    description: 'Delicious chocolate peanut butter, a perfect balance of chocolate and peanut flavors.',
    price: 800,
    category: 'Peanut Butter',
    sku: 'PNT-CHC-370',
    stockQuantity: 25,
    lowStockThreshold: 8,
    images: ['/images/chocolate-peanut-butter.jpg'],
    weight: '370g'
  },
  {
    name: 'Peanut Butter- Chocolate Mint',
    description: 'Refreshing mint chocolate peanut butter, a unique and tasty combination.',
    price: 600,
    category: 'Peanut Butter',
    sku: 'PNT-CHCM-370',
    stockQuantity: 0, // Out of stock - "On Order"
    lowStockThreshold: 5,
    images: ['/images/placeholder.png'], // Using placeholder since this is on order
    weight: '370g'
  },
  {
    name: 'Pumpkin Seed Butter',
    description: 'Nutritious pumpkin seed butter rich in minerals and antioxidants.',
    price: 1000,
    category: 'Seed Butter',
    sku: 'PMP-PLN-370',
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: ['/images/pumkin-seed-butter.jpg'],
    weight: '370g'
  }
];

async function addProducts() {
  console.log('Starting to add products...');
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // First get existing products to avoid duplicates
    const existingProductsResponse = await axios.get(`${API_URL}/api/products`);
    const existingProducts = existingProductsResponse.data.data.products || [];
    const existingNames = existingProducts.map(p => p.name);
    
    console.log(`Found ${existingProducts.length} existing products`);
    
    // Create a log file
    const logStream = fs.createWriteStream('product-import-log.txt', { flags: 'a' });
    logStream.write(`=== Product Import ${new Date().toISOString()} ===\n`);
    
    for (const product of products) {
      try {
        // Skip if product with same name already exists
        if (existingNames.includes(product.name)) {
          console.log(`Product "${product.name}" already exists, updating...`);
          
          // Find the existing product
          const existingProduct = existingProducts.find(p => p.name === product.name);
          
          // Update the product
          await axios.put(`${API_URL}/api/products/${existingProduct._id}`, product, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          logStream.write(`UPDATED: ${product.name} (${product.sku})\n`);
          successCount++;
        } else {
          // Add new product
          console.log(`Adding new product: ${product.name}`);
          
          await axios.post(`${API_URL}/api/products`, product, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          logStream.write(`ADDED: ${product.name} (${product.sku})\n`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error with product "${product.name}":`, error.message);
        logStream.write(`ERROR: ${product.name} - ${error.message}\n`);
        errorCount++;
      }
    }
    
    logStream.write(`=== Import Summary ===\n`);
    logStream.write(`Successful operations: ${successCount}\n`);
    logStream.write(`Failed operations: ${errorCount}\n`);
    logStream.end();
    
    console.log('Product import completed!');
    console.log(`Successful: ${successCount}, Failed: ${errorCount}`);
  } catch (error) {
    console.error('Failed to complete product import:', error.message);
  }
}

// Check if admin token is provided
if (!token || token === '<YOUR_ADMIN_TOKEN>') {
  console.log('Please provide an admin token to continue. You can:');
  console.log('1. Edit this file to add your token directly');
  console.log('2. Run with the token as an environment variable:');
  console.log('   ADMIN_TOKEN=your_token node add-products.js');
} else {
  addProducts();
}
