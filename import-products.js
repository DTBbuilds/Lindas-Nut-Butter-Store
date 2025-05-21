/**
 * Product Import Script for Linda's Nut Butter Store
 * 
 * This script imports products into the database with proper SKU generation,
 * ensuring each product is unique with appropriate naming, IDs, and all required
 * entities for the e-commerce database.
 * 
 * Run with: node import-products.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
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

// Product categories
const CATEGORIES = [
  { name: 'Almond Butter', slug: 'almond-butter', prefix: 'ALM' },
  { name: 'Peanut Butter', slug: 'peanut-butter', prefix: 'PNT' },
  { name: 'Cashew Butter', slug: 'cashew-butter', prefix: 'CSH' },
  { name: 'Hazelnut Spread', slug: 'hazelnut-spread', prefix: 'HZL' },
  { name: 'Mixed Nut Butter', slug: 'mixed-nut-butter', prefix: 'MIX' },
  { name: 'Specialty Spreads', slug: 'specialty-spreads', prefix: 'SPC' },
  { name: 'Honey', slug: 'honey', prefix: 'HNY' }
];

// Product data to import
const PRODUCTS_TO_IMPORT = [
  {
    name: 'Creamy Almond Butter',
    description: 'Our signature smooth almond butter made from premium organic almonds. Rich in flavor and perfect for spreading on toast or adding to smoothies.',
    category: 'Almond Butter',
    price: 1200, // $12.00
    images: ['/images/almond-butter.jpg'],
    stockQuantity: 25,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 190,
      totalFat: 17,
      saturatedFat: 1.5,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 7,
      dietaryFiber: 4,
      sugars: 2,
      protein: 7
    },
    ingredients: 'Organic roasted almonds',
    sizes: [
      { size: '8oz (227g)', price: 800 },
      { size: '16oz (454g)', price: 1200 }
    ]
  },
  {
    name: 'Crunchy Almond Butter',
    description: 'Our crunchy almond butter with bits of roasted almonds for added texture. Made from premium organic almonds with no added oils or sugars.',
    category: 'Almond Butter',
    price: 1250, // $12.50
    images: ['/images/crunchy-almond-butter.jpg'],
    stockQuantity: 20,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 190,
      totalFat: 17,
      saturatedFat: 1.5,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 7,
      dietaryFiber: 4,
      sugars: 2,
      protein: 7
    },
    ingredients: 'Organic roasted almonds',
    sizes: [
      { size: '8oz (227g)', price: 850 },
      { size: '16oz (454g)', price: 1250 }
    ]
  },
  {
    name: 'Chocolate Almond Butter',
    description: 'Rich chocolate blended with our premium almond butter. A delicious treat that satisfies your sweet tooth while providing nutritional benefits.',
    category: 'Almond Butter',
    price: 1450, // $14.50
    images: ['/images/chocolate-almond-butter.jpg'],
    stockQuantity: 18,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 210,
      totalFat: 16,
      saturatedFat: 3,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 12,
      dietaryFiber: 3,
      sugars: 7,
      protein: 6
    },
    ingredients: 'Organic roasted almonds, organic cocoa powder, organic coconut sugar, sea salt',
    sizes: [
      { size: '8oz (227g)', price: 950 },
      { size: '16oz (454g)', price: 1450 }
    ]
  },
  {
    name: 'Honey Almond Butter',
    description: 'Our creamy almond butter blended with pure local honey for a touch of natural sweetness. Perfect for breakfast or as a nutritious snack.',
    category: 'Almond Butter',
    price: 1350, // $13.50
    images: ['/images/honey-almond-butter.jpg'],
    stockQuantity: 15,
    features: ['Organic', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 200,
      totalFat: 16,
      saturatedFat: 1.5,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 10,
      dietaryFiber: 3,
      sugars: 6,
      protein: 6
    },
    ingredients: 'Organic roasted almonds, local honey',
    sizes: [
      { size: '8oz (227g)', price: 900 },
      { size: '16oz (454g)', price: 1350 }
    ]
  },
  {
    name: 'Creamy Peanut Butter',
    description: 'Classic smooth peanut butter made from freshly roasted peanuts. Rich in protein and perfect for sandwiches, baking, or eating straight from the jar.',
    category: 'Peanut Butter',
    price: 850, // $8.50
    images: ['/images/creamy-peanut-butter.jpg'],
    stockQuantity: 30,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 190,
      totalFat: 16,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 7,
      dietaryFiber: 2,
      sugars: 2,
      protein: 8
    },
    ingredients: 'Organic roasted peanuts',
    sizes: [
      { size: '8oz (227g)', price: 550 },
      { size: '16oz (454g)', price: 850 },
      { size: '32oz (907g)', price: 1450 }
    ]
  },
  {
    name: 'Crunchy Peanut Butter',
    description: 'Classic crunchy peanut butter with bits of roasted peanuts for extra texture. Made from freshly roasted peanuts with no added oils or sugars.',
    category: 'Peanut Butter',
    price: 850, // $8.50
    images: ['/images/crunchy-peanut-butter.jpg'],
    stockQuantity: 28,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 190,
      totalFat: 16,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 7,
      dietaryFiber: 2,
      sugars: 2,
      protein: 8
    },
    ingredients: 'Organic roasted peanuts',
    sizes: [
      { size: '8oz (227g)', price: 550 },
      { size: '16oz (454g)', price: 850 },
      { size: '32oz (907g)', price: 1450 }
    ]
  },
  {
    name: 'Honey Peanut Butter',
    description: 'Our creamy peanut butter blended with pure local honey. A perfect balance of savory and sweet that kids and adults both love.',
    category: 'Peanut Butter',
    price: 950, // $9.50
    images: ['/images/honey-peanut-butter.jpg'],
    stockQuantity: 22,
    features: ['Organic', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 200,
      totalFat: 15,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 11,
      dietaryFiber: 2,
      sugars: 7,
      protein: 7
    },
    ingredients: 'Organic roasted peanuts, local honey',
    sizes: [
      { size: '8oz (227g)', price: 650 },
      { size: '16oz (454g)', price: 950 }
    ]
  },
  {
    name: 'Creamy Cashew Butter',
    description: 'Luxuriously smooth cashew butter made from premium cashews. Milder and slightly sweeter than other nut butters with a rich, creamy texture.',
    category: 'Cashew Butter',
    price: 1400, // $14.00
    images: ['/images/cashew-butter.jpg'],
    stockQuantity: 20,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 190,
      totalFat: 16,
      saturatedFat: 3,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 9,
      dietaryFiber: 1,
      sugars: 2,
      protein: 5
    },
    ingredients: 'Organic roasted cashews',
    sizes: [
      { size: '8oz (227g)', price: 950 },
      { size: '16oz (454g)', price: 1400 }
    ]
  },
  {
    name: 'Chocolate Cashew Butter',
    description: 'Decadent chocolate blended with our creamy cashew butter. A luxurious treat that's perfect for desserts or as a special snack.',
    category: 'Cashew Butter',
    price: 1550, // $15.50
    images: ['/images/chocolate-cashew-butter.jpg'],
    stockQuantity: 15,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 210,
      totalFat: 15,
      saturatedFat: 4,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 14,
      dietaryFiber: 2,
      sugars: 8,
      protein: 5
    },
    ingredients: 'Organic roasted cashews, organic cocoa powder, organic coconut sugar, sea salt',
    sizes: [
      { size: '8oz (227g)', price: 1050 },
      { size: '16oz (454g)', price: 1550 }
    ]
  },
  {
    name: 'Coconut Cashew Butter',
    description: 'A tropical blend of creamy cashew butter and coconut. The perfect combination for a unique flavor experience that will transport you to the tropics.',
    category: 'Cashew Butter',
    price: 1500, // $15.00
    images: ['/images/coconut-cashew-butter.jpg'],
    stockQuantity: 18,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 200,
      totalFat: 17,
      saturatedFat: 5,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 9,
      dietaryFiber: 2,
      sugars: 3,
      protein: 5
    },
    ingredients: 'Organic roasted cashews, organic coconut',
    sizes: [
      { size: '8oz (227g)', price: 1000 },
      { size: '16oz (454g)', price: 1500 }
    ]
  },
  {
    name: 'Chocolate Hazelnut Spread',
    description: 'Our take on the classic chocolate hazelnut spread, made with premium hazelnuts and rich cocoa. Less sugar than commercial brands but all the flavor.',
    category: 'Hazelnut Spread',
    price: 1350, // $13.50
    images: ['/images/chocolate-hazelnut-spread.jpg'],
    stockQuantity: 22,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 200,
      totalFat: 14,
      saturatedFat: 3,
      transFat: 0,
      cholesterol: 0,
      sodium: 5,
      totalCarbohydrate: 16,
      dietaryFiber: 3,
      sugars: 10,
      protein: 4
    },
    ingredients: 'Organic roasted hazelnuts, organic cocoa powder, organic coconut sugar, organic coconut oil, sea salt',
    sizes: [
      { size: '8oz (227g)', price: 900 },
      { size: '16oz (454g)', price: 1350 }
    ]
  },
  {
    name: 'Pure Hazelnut Butter',
    description: 'Luxurious pure hazelnut butter made from premium roasted hazelnuts. Rich and distinctive flavor that's perfect for baking or as a special treat.',
    category: 'Hazelnut Spread',
    price: 1450, // $14.50
    images: ['/images/hazelnut-butter.jpg'],
    stockQuantity: 15,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 200,
      totalFat: 19,
      saturatedFat: 1.5,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 5,
      dietaryFiber: 3,
      sugars: 1,
      protein: 5
    },
    ingredients: 'Organic roasted hazelnuts',
    sizes: [
      { size: '8oz (227g)', price: 950 },
      { size: '16oz (454g)', price: 1450 }
    ]
  },
  {
    name: 'ABC Butter (Almond, Brazil, Cashew)',
    description: 'Our signature mixed nut butter combining almonds, Brazil nuts, and cashews. A nutritional powerhouse with a complex, satisfying flavor profile.',
    category: 'Mixed Nut Butter',
    price: 1600, // $16.00
    images: ['/images/abc-butter.jpg'],
    stockQuantity: 18,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 200,
      totalFat: 18,
      saturatedFat: 3,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 7,
      dietaryFiber: 3,
      sugars: 2,
      protein: 6
    },
    ingredients: 'Organic roasted almonds, organic Brazil nuts, organic roasted cashews',
    sizes: [
      { size: '8oz (227g)', price: 1100 },
      { size: '16oz (454g)', price: 1600 }
    ]
  },
  {
    name: 'Five Seed Butter',
    description: 'A nutritious blend of sunflower, pumpkin, flax, chia, and hemp seeds. High in omega fatty acids and protein, with a unique earthy flavor.',
    category: 'Specialty Spreads',
    price: 1250, // $12.50
    images: ['/images/five-seed-butter.jpg'],
    stockQuantity: 20,
    features: ['Organic', 'Vegan', 'Gluten-Free'],
    nutritionFacts: {
      servingSize: '2 tbsp (32g)',
      calories: 180,
      totalFat: 16,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 8,
      dietaryFiber: 4,
      sugars: 1,
      protein: 9
    },
    ingredients: 'Organic sunflower seeds, organic pumpkin seeds, organic flax seeds, organic chia seeds, organic hemp seeds',
    sizes: [
      { size: '8oz (227g)', price: 850 },
      { size: '16oz (454g)', price: 1250 }
    ]
  },
  {
    name: 'Pure Raw Honey',
    description: 'Unfiltered, raw honey sourced from local beekeepers. Rich in flavor with natural enzymes and antioxidants preserved through minimal processing.',
    category: 'Honey',
    price: 950, // $9.50
    images: ['/images/raw-honey.jpg'],
    stockQuantity: 25,
    features: ['Raw', 'Unfiltered', 'Local'],
    nutritionFacts: {
      servingSize: '1 tbsp (21g)',
      calories: 60,
      totalFat: 0,
      saturatedFat: 0,
      transFat: 0,
      cholesterol: 0,
      sodium: 0,
      totalCarbohydrate: 17,
      dietaryFiber: 0,
      sugars: 17,
      protein: 0
    },
    ingredients: '100% raw honey',
    sizes: [
      { size: '8oz (227g)', price: 650 },
      { size: '16oz (454g)', price: 950 }
    ]
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

// Generate a unique SKU for a product
function generateSku(category, productName, index) {
  // Find the category prefix
  const categoryObj = CATEGORIES.find(c => c.name === category);
  const prefix = categoryObj ? categoryObj.prefix : 'PRD';
  
  // Create a sequential number with leading zeros
  const number = String(index).padStart(3, '0');
  
  // Generate the SKU
  return `${prefix}${number}`;
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
  
  // Import products
  let importCount = 0;
  let updateCount = 0;
  let skuCounter = 1;
  
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
  for (const productData of PRODUCTS_TO_IMPORT) {
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
      nutritionFacts: productData.nutritionFacts || {},
      ingredients: productData.ingredients || '',
      sizes: productData.sizes || [],
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
