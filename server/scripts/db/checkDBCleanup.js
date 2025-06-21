// Script to verify database cleanup and check for duplicates
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'lindas-nut-butter-store-store-store-store';

async function checkDatabase() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = client.db(dbName);
    
    // Check existing databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('Available databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk / 1024} KiB)`);
    });
    
    // Verify old database is gone
    const oldDbExists = dbs.databases.some(db => db.name === 'lindas-nut-butter-store-store-store');
    console.log(`Old database 'lindas-nut-butter-store-store-store' exists: ${oldDbExists}`);
    
    // Check users collection
    const users = await db.collection('users').find({}).toArray();
    console.log(`\nFound ${users.length} users in database:`);
    
    // Check for duplicate users
    const emails = {};
    let duplicates = 0;
    
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
      
      if (emails[user.email]) {
        console.log(`  WARNING: Duplicate email found: ${user.email}`);
        duplicates++;
      } else {
        emails[user.email] = true;
      }
    });
    
    if (duplicates === 0) {
      console.log('\nNO DUPLICATES FOUND - Database is clean');
    } else {
      console.log(`\nWARNING: Found ${duplicates} duplicate user emails`);
    }
    
    // Check products
    const products = await db.collection('products').find({}).toArray();
    console.log(`\nFound ${products.length} products in database`);
    
    // Check for duplicate products (by SKU)
    const skus = {};
    duplicates = 0;
    
    products.forEach(product => {
      if (skus[product.sku]) {
        console.log(`WARNING: Duplicate SKU found: ${product.sku} (${product.name})`);
        duplicates++;
      } else {
        skus[product.sku] = true;
      }
    });
    
    if (duplicates === 0 && products.length > 0) {
      console.log('NO DUPLICATE PRODUCTS FOUND - Database is clean');
    } else if (duplicates > 0) {
      console.log(`WARNING: Found ${duplicates} duplicate product SKUs`);
    }
    
    console.log('\nDatabase verification complete');
  } catch (err) {
    console.error('Error during database check:', err);
  } finally {
    await client.close();
  }
}

checkDatabase().catch(console.error);
