// Simple MongoDB Atlas connection check
const mongoose = require('mongoose');

// MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0';

console.log('Starting MongoDB Atlas connection test...');
console.log(`Using connection string: ${ATLAS_URI.replace(/:[^@]+@/, ':****@')}`);

mongoose.connect(ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000
})
.then(async () => {
  console.log('✅ MongoDB Atlas connection successful!');
  
  // Get database information
  const db = mongoose.connection.db;
  console.log(`Connected to database: ${db.databaseName}`);
  
  // List collections
  const collections = await db.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections:`);
  collections.forEach(coll => console.log(`- ${coll.name}`));
  
  // Count documents in each collection
  console.log('\nDocument counts:');
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments();
    console.log(`${coll.name}: ${count} documents`);
  }
  
  console.log('\n✅ Connection test completed successfully!');
  
  // Close connection
  await mongoose.disconnect();
  console.log('MongoDB connection closed');
})
.catch(error => {
  console.error(`\n❌ Connection error: ${error.message}`);
  console.error(`Error name: ${error.name}`);
  console.error(`Full error stack: ${error.stack}`);
});
