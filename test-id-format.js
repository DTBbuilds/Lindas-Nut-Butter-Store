/**
 * Test script for ID format standardization between frontend and backend
 * 
 * This script helps verify that our changes to improve ID handling
 * in CartContext.js, CheckoutPage.js, and products.js are working correctly.
 */

// Import modified functions for testing
const normalizeProductId = (product) => {
  // Debug the incoming product
  console.log('Normalizing product ID for:', product ? 
    (product.name || 'unnamed product') : 'undefined product');

  // Handle product IDs consistently by checking all possible formats
  // 1. If product is an ID string or number itself, return it as string
  if (typeof product === 'string' || typeof product === 'number') {
    console.log(`Direct ID conversion: ${String(product)}`);
    return String(product);
  }

  // If product is null or undefined, return null
  if (!product) {
    console.warn('Product is null or undefined');
    return null;
  }

  // Priority for numeric ID (matches MongoDB schema)
  if (product.id !== undefined && product.id !== null) {
    console.log(`Using numeric ID: ${product.id}`);
    return String(product.id); // Always convert to string for consistent comparison
  }

  // Fall back to MongoDB _id if numeric id is not available
  if (product._id) {
    console.log(`Using MongoDB _id: ${product._id}`);
    return String(product._id);
  }

  // Last resort - check for productId field (already normalized)
  if (product.productId) {
    console.log(`Using productId field: ${product.productId}`);
    return String(product.productId);
  }

  // Handle nested product structure
  if (product.product && (typeof product.product === 'string' || typeof product.product === 'number')) {
    console.log(`Using nested product ID: ${product.product}`);
    return String(product.product);
  }
  
  console.warn('Product has no valid ID', product);
  return null;
};

// Create a standardized cart item structure
const createCartItem = (product, quantity = 1) => {
  // Get normalized string ID
  const productId = normalizeProductId(product);
  if (!productId) {
    throw new Error('Cannot add product without ID to cart');
  }

  // Important: Ensure we preserve the numeric id which corresponds to the database schema
  // The backend expects products with numeric IDs
  let numericId = 0;
  
  // Try to get numeric ID - first check if product already has numeric id
  if (product.id !== undefined && product.id !== null) {
    numericId = Number(product.id);
  } 
  // Fall back to converting the string productId to number if possible
  else if (!isNaN(Number(productId))) {
    numericId = Number(productId);
  }

  console.log(`Creating cart item for ${product.name || 'Unknown Product'} with ID: ${productId} (numeric: ${numericId})`);
  
  // Standardized cart item format - always includes necessary fields
  return {
    ...product,                        // Preserve all original product data
    _id: String(productId),            // Standard ID field for MongoDB compatibility as STRING
    id: numericId,                     // Numeric ID matching database schema
    productId: String(productId),      // Consistent ID field name for lookups as STRING
    name: product.name || 'Unknown Product',
    price: Number(product.price) || 0,
    quantity: Number(quantity) || 1,
    inStock: product.inStock === false ? false : true, // Explicitly set inStock status
  };
};

// Test cases with different ID formats
console.log('\n=== TEST CASES FOR ID NORMALIZATION ===\n');

// Test case 1: Numeric ID product (simulates database product)
const dbProduct = {
  id: 123,
  name: 'Database Product',
  price: 1200,
  inStock: true
};
console.log('\nTEST 1: Database Product with numeric ID');
const cartItem1 = createCartItem(dbProduct);
console.log('Result:', { id: cartItem1.id, _id: cartItem1._id, productId: cartItem1.productId });

// Test case 2: MongoDB _id product
const mongoProduct = {
  _id: '60f7c5c152a7bf001c9b5432',
  name: 'MongoDB Product',
  price: 900,
  inStock: true
};
console.log('\nTEST 2: MongoDB Product with string _id');
const cartItem2 = createCartItem(mongoProduct);
console.log('Result:', { id: cartItem2.id, _id: cartItem2._id, productId: cartItem2.productId });

// Test case 3: Product with both id and _id
const hybridProduct = {
  id: 456,
  _id: '60f7c5c152a7bf001c9b5433',
  name: 'Hybrid Product',
  price: 1500,
  inStock: true
};
console.log('\nTEST 3: Hybrid Product with both id and _id');
const cartItem3 = createCartItem(hybridProduct);
console.log('Result:', { id: cartItem3.id, _id: cartItem3._id, productId: cartItem3.productId });

// Test case 4: String ID that can be converted to number
const stringIdProduct = {
  id: '789',
  name: 'String ID Product',
  price: 2000,
  inStock: true
};
console.log('\nTEST 4: Product with string ID that can be numeric');
const cartItem4 = createCartItem(stringIdProduct);
console.log('Result:', { id: cartItem4.id, _id: cartItem4._id, productId: cartItem4.productId });

// Test case 5: Product with only productId field
const productIdProduct = {
  productId: '999',
  name: 'ProductId Product',
  price: 1800,
  inStock: true
};
console.log('\nTEST 5: Product with only productId field');
const cartItem5 = createCartItem(productIdProduct);
console.log('Result:', { id: cartItem5.id, _id: cartItem5._id, productId: cartItem5.productId });

// Validate the consistency of all cart items
console.log('\n=== VALIDATING CART ITEMS ===\n');

const productMap = {};
[cartItem1, cartItem2, cartItem3, cartItem4, cartItem5].forEach(item => {
  // Index by all ID formats
  if (item.id !== undefined) {
    productMap[String(item.id)] = item;
    productMap[Number(item.id)] = item;
  }
  if (item._id) {
    productMap[String(item._id)] = item;
  }
  if (item.productId) {
    productMap[String(item.productId)] = item;
  }
});

console.log('Product Map Keys:', Object.keys(productMap));

// Validation function similar to CheckoutPage.js
const validateCartItem = (item) => {
  console.log(`\nValidating: ${item.name}`);
  
  // Try multiple ID formats for maximum compatibility
  const possibleIds = [
    item.id,
    item._id,
    item.productId,
    String(item.id),
    String(item._id),
    String(item.productId),
    Number(item.id),
    Number(item.productId)
  ].filter(id => id !== undefined && id !== null);
  
  console.log('Possible IDs:', possibleIds);
  
  // Check if ANY of the possible IDs match a product
  let foundMatch = false;
  let matchedId = null;
  
  for (const id of possibleIds) {
    const product = productMap[id];
    if (product) {
      console.log(`Match found with ID ${id}`);
      foundMatch = true;
      matchedId = id;
      break;
    }
  }
  
  return { valid: foundMatch, matchedId };
};

// Test validation with each cart item
console.log('\n=== VALIDATION RESULTS ===\n');
[cartItem1, cartItem2, cartItem3, cartItem4, cartItem5].forEach(item => {
  const result = validateCartItem(item);
  console.log(`${item.name}: ${result.valid ? 'VALID ✓' : 'INVALID ✗'} (matched ID: ${result.matchedId})`);
});

console.log('\n=== TEST COMPLETE ===\n');
