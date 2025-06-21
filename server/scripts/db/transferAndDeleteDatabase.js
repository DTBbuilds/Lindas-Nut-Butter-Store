// Script to safely transfer data from lindas-nut-butter to lindas-nut-butter-store if needed
// and then drop the unused database
const mongoose = require('mongoose');

// Database connection strings
const SOURCE_DB = 'mongodb://localhost:27017/lindas-nut-butter';
const TARGET_DB = 'mongodb://localhost:27017/lindas-nut-butter-store';

// Collections to transfer
const COLLECTIONS = ['users', 'products', 'orders', 'transactions', 'inventorylogs'];

// Connect to both databases
async function connectToDatabases() {
  console.log('Connecting to source and target databases...');
  const sourceConn = await mongoose.createConnection(SOURCE_DB);
  const targetConn = await mongoose.createConnection(TARGET_DB);
  return { sourceConn, targetConn };
}

// Check if item already exists in target collection
async function itemExists(targetCollection, query) {
  const count = await targetCollection.countDocuments(query);
  return count > 0;
}

// Transfer a single collection
async function transferCollection(sourceColl, targetColl, collName) {
  console.log(`Processing collection: ${collName}`);
  
  // Get all documents from source
  const sourceItems = await sourceColl.find({}).toArray();
  console.log(`Found ${sourceItems.length} items in source ${collName}`);
  
  let transferred = 0;
  
  // For each source item, check if it exists in target
  for (const item of sourceItems) {
    // Create a query to find matching item in target
    // Use email for users, name/sku for products, etc.
    let query = {};
    if (collName === 'users') {
      query = { email: item.email };
    } else if (collName === 'products') {
      query = { $or: [{ sku: item.sku }, { name: item.name }] };
    } else {
      // For other collections, use the _id if possible
      query = { _id: item._id };
    }
    
    // Skip if already exists
    const exists = await itemExists(targetColl, query);
    if (exists) {
      continue;
    }
    
    // Transfer item to target
    try {
      const cleanItem = { ...item };
      delete cleanItem._id; // Let MongoDB generate a new ID
      await targetColl.insertOne(cleanItem);
      transferred++;
    } catch (err) {
      console.error(`Error transferring item from ${collName}:`, err.message);
    }
  }
  
  console.log(`Transferred ${transferred} unique items from ${collName}`);
  return transferred;
}

// Process all collections
async function transferData() {
  try {
    const { sourceConn, targetConn } = await connectToDatabases();
    
    let totalTransferred = 0;
    
    // Process each collection
    for (const collName of COLLECTIONS) {
      const sourceColl = sourceConn.collection(collName);
      const targetColl = targetConn.collection(collName);
      
      const transferred = await transferCollection(sourceColl, targetColl, collName);
      totalTransferred += transferred;
    }
    
    console.log(`Total items transferred: ${totalTransferred}`);
    
    // Drop the source database if required
    if (totalTransferred === 0) {
      console.log('No data needed to be transferred. Safe to drop the source database.');
    } else {
      console.log(`Successfully transferred ${totalTransferred} unique items to the target database.`);
    }
    
    // Confirm and drop
    console.log('Dropping source database lindas-nut-butter...');
    await sourceConn.db.dropDatabase();
    console.log('Source database successfully dropped.');
    
    // Close connections
    await sourceConn.close();
    await targetConn.close();
    
    console.log('Operation completed successfully.');
  } catch (err) {
    console.error('Error during database operation:', err);
  } finally {
    process.exit(0);
  }
}

// Run the transfer
transferData();
