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

// Create a function to add a new product with all the correct data
async function addOrUpdateProduct(productData) {
  try {
    // Check if product with this name already exists
    const response = await axios.get(`${API_URL}/api/products?limit=1000`);
    const existingProducts = response.data.data.products;
    const existingProduct = existingProducts.find(p => p.name === productData.name);

    if (existingProduct) {
      // Product exists, but we can't update it directly using API
      // Log what we would update
      console.log(`Product "${productData.name}" already exists (ID: ${existingProduct._id})`);
      console.log(`Current price: ${existingProduct.price}, New price: ${productData.price}`);
      console.log(`Current stock: ${existingProduct.stockQuantity}, New stock: ${productData.stockQuantity}`);
      return { status: 'ALREADY_EXISTS', productId: existingProduct._id };
    } else {
      // Create new product
      const createResponse = await axios.post(
        `${API_URL}/api/products`,
        productData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      console.log(`✅ Created new product: "${productData.name}"`);
      return { status: 'CREATED', productId: createResponse.data.data._id };
    }
  } catch (error) {
    console.error(`Error with product "${productData.name}":`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { status: 'ERROR', error: error.message };
  }
}

// Define the remaining products to add
const remainingProductsToAdd = [
  {
    name: "Peanut Butter- Chocolate Mint",
    description: "Refreshing mint chocolate peanut butter, a unique and tasty combination. Available on order.",
    price: 600,
    category: "Peanut Butter",
    sku: "PNT-CHCM-370",
    stockQuantity: 0, // Out of stock - "On Order"
    lowStockThreshold: 5,
    images: ["/images/placeholder.png"], // Using placeholder since this is on order
    weight: "370g",
    isActive: true,
    inventoryStatus: "OUT_OF_STOCK"
  }
];

// Function to run the product operations
async function updateProducts() {
  console.log('Starting product operations...');
  
  // Add any remaining products
  for (const productData of remainingProductsToAdd) {
    console.log(`Processing product: ${productData.name}`);
    const result = await addOrUpdateProduct(productData);
    console.log(`Result: ${result.status}`);
    console.log('-'.repeat(50));
  }
  
  console.log('Product operations completed!');
}

// Run the product update function
updateProducts();
