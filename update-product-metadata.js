const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

// MongoDB connection settings
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'lindas_nut_butter';

// Weight and stock updates for each product
const productUpdates = [
  { name: 'Almond Butter- Creamy', weight: '370g', stockQuantity: 20 },
  { name: 'Almond Butter- Crunchy', weight: '370g', stockQuantity: 20 },
  { name: 'Almond Butter- Chocolate', weight: '370g', stockQuantity: 15 },
  { name: 'Almond Butter- Chocolate Orange', weight: '370g', stockQuantity: 15 },
  { name: 'Cashew Butter- Chilli', weight: '370g', stockQuantity: 18 },
  { name: 'Cashew Butter- Plain', weight: '370g', stockQuantity: 20 },
  { name: 'Cashew Butter- Chocolate', weight: '370g', stockQuantity: 18 },
  { name: 'Cashew Butter- Chocolate Orange', weight: '370g', stockQuantity: 15 },
  { name: 'Cashew Butter- Coconut', weight: '370g', stockQuantity: 18 },
  { name: 'Hazelnut Butter- Chocolate', weight: '370g', stockQuantity: 12 },
  { name: 'Honey', weight: '370g', stockQuantity: 25 },
  { name: 'Macadamia Nut Butter', weight: '370g', stockQuantity: 18 },
  { name: 'Macadamia Butter- Chocolate', weight: '370g', stockQuantity: 15 },
  { name: 'Peanut Butter- Creamy', weight: '370g', stockQuantity: 30 },
  { name: 'Peanut Butter- Crunchy', weight: '370g', stockQuantity: 30 },
  { name: 'Peanut Butter- Chocolate', weight: '370g', stockQuantity: 25 },
  { name: 'Peanut Butter- Chocolate Mint', weight: '370g', stockQuantity: 0 }, // On Order
  { name: 'Pumpkin Seed Butter', weight: '370g', stockQuantity: 20 },
  // Also include the old product names with updated data
  { name: 'Creamy Almond Butter', weight: '370g', stockQuantity: 20, price: 1200 },
  { name: 'Crunchy Peanut Butter', weight: '370g', stockQuantity: 30, price: 500 },
  { name: 'Pure Honey', weight: '370g', stockQuantity: 25, price: 600 },
  { name: 'Creamy Cashew Butter', weight: '370g', stockQuantity: 20, price: 900 }
];

async function updateProductMetadata() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    
    console.log('Updating product metadata...');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const update of productUpdates) {
      try {
        // Find the product by name
        const product = await productsCollection.findOne({ name: update.name });
        
        if (product) {
          // Prepare update object
          const updateObj = { 
            $set: { 
              weight: update.weight,
              stockQuantity: update.stockQuantity
            } 
          };
          
          // If price is included, update it too
          if (update.price) {
            updateObj.$set.price = update.price;
          }
          
          // Update inventory status based on stock
          if (update.stockQuantity <= 0) {
            updateObj.$set.inventoryStatus = 'OUT_OF_STOCK';
          } else if (update.stockQuantity <= (product.lowStockThreshold || 5)) {
            updateObj.$set.inventoryStatus = 'LOW_STOCK';
          } else {
            updateObj.$set.inventoryStatus = 'IN_STOCK';
          }
          
          // Update the product
          const result = await productsCollection.updateOne(
            { _id: product._id },
            updateObj
          );
          
          if (result.modifiedCount > 0) {
            console.log(`✅ Updated metadata for "${update.name}"`);
            updatedCount++;
          } else {
            console.log(`⏭️ No changes needed for "${update.name}"`);
            skippedCount++;
          }
        } else {
          console.log(`⚠️ Product not found: "${update.name}"`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating "${update.name}":`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Product Metadata Update Summary ===');
    console.log(`Total product updates attempted: ${productUpdates.length}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Products skipped: ${skippedCount}`);
    console.log(`Failed updates: ${errorCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the update function
updateProductMetadata();
