/**
 * Simple Product Import Script for Linda's Nut Butter Store
 * 
 * This script imports products into the database with proper SKU generation,
 * ensuring each product is unique with appropriate naming and IDs.
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');
const slugify = require('slugify');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Database connection string
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'lindas-nut-butter-store';

// Product categories with their SKU prefixes
const CATEGORIES = [
  { name: 'Almond Butter', slug: 'almond-butter', prefix: 'ALM' },
  { name: 'Peanut Butter', slug: 'peanut-butter', prefix: 'PNT' },
  { name: 'Cashew Butter', slug: 'cashew-butter', prefix: 'CSH' },
  { name: 'Hazelnut Spread', slug: 'hazelnut-spread', prefix: 'HZL' },
  { name: 'Mixed Nut Butter', slug: 'mixed-nut-butter', prefix: 'MIX' },
  { name: 'Specialty Spreads', slug: 'specialty-spreads', prefix: 'SPC' },
  { name: 'Honey', slug: 'honey', prefix: 'HNY' }
];

// Sample products to import (simplified for reliability)
const PRODUCTS = [
  {
    name: 'Creamy Almond Butter',
    description: 'Our signature smooth almond butter made from premium organic almonds.',
    category: 'Almond Butter',
    price: 1200,
    images: ['/images/almond-butter.jpg'],
    stockQuantity: 25,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted almonds'
  },
  {
    name: 'Crunchy Almond Butter',
    description: 'Our crunchy almond butter with bits of roasted almonds for added texture.',
    category: 'Almond Butter',
    price: 1250,
    images: ['/images/crunchy-almond-butter.jpg'],
    stockQuantity: 20,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted almonds'
  },
  {
    name: 'Chocolate Almond Butter',
    description: 'Rich chocolate blended with our premium almond butter.',
    category: 'Almond Butter',
    price: 1450,
    images: ['/images/chocolate-almond-butter.jpg'],
    stockQuantity: 18,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted almonds, organic cocoa powder, organic coconut sugar, sea salt'
  },
  {
    name: 'Creamy Peanut Butter',
    description: 'Classic smooth peanut butter made from freshly roasted peanuts.',
    category: 'Peanut Butter',
    price: 850,
    images: ['/images/creamy-peanut-butter.jpg'],
    stockQuantity: 30,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted peanuts'
  },
  {
    name: 'Crunchy Peanut Butter',
    description: 'Classic crunchy peanut butter with bits of roasted peanuts for extra texture.',
    category: 'Peanut Butter',
    price: 850,
    images: ['/images/crunchy-peanut-butter.jpg'],
    stockQuantity: 28,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted peanuts'
  },
  {
    name: 'Creamy Cashew Butter',
    description: 'Luxuriously smooth cashew butter made from premium cashews.',
    category: 'Cashew Butter',
    price: 1400,
    images: ['/images/cashew-butter.jpg'],
    stockQuantity: 20,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted cashews'
  },
  {
    name: 'Chocolate Cashew Butter',
    description: 'Decadent chocolate blended with our creamy cashew butter.',
    category: 'Cashew Butter',
    price: 1550,
    images: ['/images/chocolate-cashew-butter.jpg'],
    stockQuantity: 15,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    ingredients: 'Organic roasted cashews, organic cocoa powder, organic coconut sugar, sea salt'
  },
  {
    name: 'Pure Raw Honey',
    description: 'Unfiltered, raw honey sourced from local beekeepers.',
    category: 'Honey',
    price: 950,
    images: ['/images/raw-honey.jpg'],
    stockQuantity: 25,
    features: ['Raw', 'Unfiltered', 'Local'],
    ingredients: '100% raw honey'
  }
];

// Connect to MongoDB
async function connectToMongo() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Generate a slug from product name
function generateSlug(productName) {
  return slugify(productName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

// Import categories
async function importCategories(db) {
  console.log('\n🏷️ Importing product categories...');
  
  const categoryCollection = db.collection('categories');
  
  // Check for existing categories
  const existingCategories = await categoryCollection.find({}).toArray();
  
  if (existingCategories.length > 0) {
    console.log(`ℹ️ Found ${existingCategories.length} existing categories`);
  }
  
  // Create a map of existing categories by name
  const existingCategoryMap = {};
  existingCategories.forEach(cat => {
    existingCategoryMap[cat.name] = cat;
  });
  
  // Import categories
  const categoryMap = {};
  let importCount = 0;
  
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i];
    
    // Check if category already exists
    if (existingCategoryMap[category.name]) {
      console.log(`ℹ️ Category already exists: ${category.name}`);
      categoryMap[category.name] = existingCategoryMap[category.name]._id;
      continue;
    }
    
    // Create new category
    const newCategory = {
      name: category.name,
      slug: category.slug,
      description: `${category.name} products from Linda's Nut Butter Store`,
      isActive: true,
      displayOrder: i + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await categoryCollection.insertOne(newCategory);
    categoryMap[category.name] = result.insertedId;
    importCount++;
    
    console.log(`✅ Imported category: ${category.name}`);
  }
  
  console.log(`✅ Imported ${importCount} new categories`);
  return categoryMap;
}

// Import products
async function importProducts(db, categoryMap) {
  console.log('\n📦 Importing products...');
  
  const productCollection = db.collection('products');
  const inventoryLogCollection = db.collection('inventorylogs');
  
  // Check for existing products
  const existingProducts = await productCollection.find({}).toArray();
  
  if (existingProducts.length > 0) {
    console.log(`ℹ️ Found ${existingProducts.length} existing products`);
  }
  
  // Create a map of existing products by name
  const existingProductMap = {};
  existingProducts.forEach(product => {
    existingProductMap[product.name] = product;
  });
  
  // Get the highest existing SKU number for each category
  const skuCounters = {};
  for (const product of existingProducts) {
    if (product.sku) {
      const prefix = product.sku.substring(0, 3);
      const number = parseInt(product.sku.substring(3), 10);
      
      if (!skuCounters[prefix] || number >= skuCounters[prefix]) {
        skuCounters[prefix] = number + 1;
      }
    }
  }
  
  // Import products
  let importCount = 0;
  let updateCount = 0;
  
  for (const productData of PRODUCTS) {
    // Find the category
    const categoryId = categoryMap[productData.category];
    
    if (!categoryId) {
      console.log(`⚠️ Category not found for product: ${productData.name}`);
      continue;
    }
    
    // Generate SKU
    const categoryObj = CATEGORIES.find(c => c.name === productData.category);
    const prefix = categoryObj ? categoryObj.prefix : 'PRD';
    const skuNumber = skuCounters[prefix] || 1;
    const sku = `${prefix}${String(skuNumber).padStart(3, '0')}`;
    skuCounters[prefix] = skuNumber + 1;
    
    // Generate slug
    const slug = generateSlug(productData.name);
    
    // Create product object
    const product = {
      name: productData.name,
      slug: slug,
      sku: sku,
      description: productData.description,
      price: productData.price,
      images: productData.images || [],
      category: productData.category,
      categoryId: categoryId,
      stockQuantity: productData.stockQuantity || 0,
      lowStockThreshold: 5,
      inventoryStatus: productData.stockQuantity > 5 ? 'IN_STOCK' : 'LOW_STOCK',
      notifyOnLowStock: true,
      isActive: true,
      features: productData.features || [],
      ingredients: productData.ingredients || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if product already exists
    if (existingProductMap[productData.name]) {
      // Update existing product
      const existingProduct = existingProductMap[productData.name];
      const updateResult = await productCollection.updateOne(
        { _id: existingProduct._id },
        { $set: { ...product, updatedAt: new Date() } }
      );
      
      console.log(`🔄 Updated product: ${product.name} (${product.sku})`);
      updateCount++;
      
      // Create inventory log for update if stock changed
      if (existingProduct.stockQuantity !== product.stockQuantity) {
        await inventoryLogCollection.insertOne({
          productId: existingProduct._id,
          productName: product.name,
          sku: product.sku,
          quantityChange: product.stockQuantity - existingProduct.stockQuantity,
          previousQuantity: existingProduct.stockQuantity,
          newQuantity: product.stockQuantity,
          reason: 'STOCK_UPDATE',
          notes: 'Updated during product import',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } else {
      // Insert new product
      const insertResult = await productCollection.insertOne(product);
      const productId = insertResult.insertedId;
      
      console.log(`✅ Imported product: ${product.name} (${product.sku})`);
      importCount++;
      
      // Create inventory log for new product
      await inventoryLogCollection.insertOne({
        productId: productId,
        productName: product.name,
        sku: product.sku,
        quantityChange: product.stockQuantity,
        previousQuantity: 0,
        newQuantity: product.stockQuantity,
        reason: 'INITIAL_STOCK',
        notes: 'Added during product import',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  console.log(`\n✅ Import summary:`);
  console.log(`- Imported ${importCount} new products`);
  console.log(`- Updated ${updateCount} existing products`);
  
  return { importCount, updateCount };
}

// Main function
async function main() {
  let client;
  
  try {
    client = await connectToMongo();
    const db = client.db(DB_NAME);
    
    console.log(`\n🛒 Starting product import for Linda's Nut Butter Store...`);
    
    // Ask for confirmation
    rl.question('\n⚠️ This will import products into the database. Continue? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Import categories
        const categoryMap = await importCategories(db);
        
        // Import products
        const importResult = await importProducts(db, categoryMap);
        
        console.log('\n🚀 Product import complete!');
        console.log(`The database now contains ${importResult.importCount + importResult.updateCount} products ready for your e-commerce store.`);
        
        await client.close();
        rl.close();
      } else {
        console.log('❌ Import cancelled.');
        await client.close();
        rl.close();
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) await client.close();
    rl.close();
    process.exit(1);
  }
}

// Start the script
main();
