// Data migration script from local MongoDB to MongoDB Atlas
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store-store';
const ATLAS_URI = 'mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0';

// Configure mongoose
mongoose.set('strictQuery', false);

// Migration log file
const logFile = path.join(__dirname, 'migration-log.txt');
fs.writeFileSync(logFile, `Migration Log - ${new Date().toISOString()}\n\n`);

// Helper function to log messages to console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

// Load all models
const modelsDir = path.join(__dirname, 'server', 'models');
let modelFiles = [];
try {
  modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  log('Starting data migration from local MongoDB to MongoDB Atlas...');
  log(`Found ${modelFiles.length} model files to migrate.`);
} catch (error) {
  log(`Error reading models directory: ${error.message}`);
  log('Using fallback model list...');
  // Fallback list of common models
  modelFiles = ['Admin.js', 'Customer.js', 'Feedback.js', 'Order.js', 'Transaction.js'];
  log(`Using ${modelFiles.length} fallback models.`);
}

// Connect to local database
let localConnection, atlasConnection;
let migrationStats = {};

async function migrateCollection(modelName, schema) {
  log(`\nMigrating ${modelName}...`);
  
  try {
    // Create models for both connections
    const LocalModel = localConnection.model(modelName, schema);
    const AtlasModel = atlasConnection.model(modelName, schema);
    
    // Count documents in local database
    const localCount = await LocalModel.countDocuments();
    log(`Found ${localCount} documents in local ${modelName} collection.`);
    
    if (localCount === 0) {
      log(`No documents to migrate for ${modelName}.`);
      migrationStats[modelName] = { success: true, migrated: 0, total: 0 };
      return;
    }
    
    // Check if documents already exist in Atlas
    const atlasCount = await AtlasModel.countDocuments();
    if (atlasCount > 0) {
      log(`⚠️ Found ${atlasCount} existing documents in Atlas ${modelName} collection.`);
      log(`Proceeding with migration, but there may be duplicate data.`);
    }
    
    // Get all documents from local database in batches to avoid memory issues
    const batchSize = 100;
    const totalBatches = Math.ceil(localCount / batchSize);
    let totalMigrated = 0;
    
    for (let batch = 0; batch < totalBatches; batch++) {
      log(`Processing batch ${batch + 1}/${totalBatches} for ${modelName}...`);
      
      const documents = await LocalModel.find({})
        .skip(batch * batchSize)
        .limit(batchSize)
        .lean();
      
      try {
        // Insert documents into Atlas database
        const result = await AtlasModel.insertMany(documents, { ordered: false });
        totalMigrated += result.length;
        log(`✅ Batch ${batch + 1}: Migrated ${result.length} documents`);
      } catch (error) {
        // Check if this is a duplicate key error (which is often expected)
        if (error.code === 11000) {
          const successCount = error.result?.result?.insertedCount || 0;
          totalMigrated += successCount;
          log(`⚠️ Batch ${batch + 1}: Partial success - ${successCount} inserted, some duplicates skipped`);
        } else {
          log(`❌ Batch ${batch + 1}: Failed - ${error.message}`);
          throw error; // Re-throw non-duplicate errors
        }
      }
    }
    
    log(`✅ Successfully migrated ${totalMigrated} of ${localCount} documents for ${modelName}.`);
    migrationStats[modelName] = { success: true, migrated: totalMigrated, total: localCount };
  } catch (error) {
    log(`❌ Error migrating ${modelName}: ${error.message}`);
    migrationStats[modelName] = { success: false, error: error.message };
  }
}

async function migrateData() {
  try {
    // Connect to both databases with options
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000 // 30 seconds timeout
    };
    
    log('Connecting to local MongoDB...');
    try {
      localConnection = await mongoose.createConnection(LOCAL_URI, connectionOptions);
      log('✅ Connected to local MongoDB.');
    } catch (error) {
      log(`❌ Failed to connect to local MongoDB: ${error.message}`);
      log('Migration cannot proceed without local database connection.');
      return;
    }
    
    log('Connecting to MongoDB Atlas...');
    try {
      atlasConnection = await mongoose.createConnection(ATLAS_URI, connectionOptions);
      log('✅ Connected to MongoDB Atlas.');
    } catch (error) {
      log(`❌ Failed to connect to MongoDB Atlas: ${error.message}`);
      log('Migration cannot proceed without Atlas database connection.');
      return;
    }
    
    // Load all models and migrate data
    for (const file of modelFiles) {
      try {
        const modelPath = path.join(modelsDir, file);
        let model;
        
        try {
          model = require(modelPath);
        } catch (error) {
          log(`❌ Error loading model file ${file}: ${error.message}`);
          log('Trying alternative model loading approach...');
          
          // Try a more flexible approach with a basic schema
          const modelName = path.basename(file, '.js');
          const basicSchema = new mongoose.Schema({}, { strict: false });
          await migrateCollection(modelName, basicSchema);
          continue;
        }
        
        // Extract model name and schema
        const modelName = path.basename(file, '.js');
        const schema = model.schema || model;
        
        await migrateCollection(modelName, schema);
      } catch (error) {
        log(`❌ Error processing model ${file}: ${error.message}`);
        migrationStats[file] = { success: false, error: error.message };
      }
    }
    
    // Print migration summary
    log('\n=== Migration Summary ===');
    for (const [model, stats] of Object.entries(migrationStats)) {
      if (stats.success) {
        log(`${model}: ✅ Migrated ${stats.migrated}/${stats.total} documents`);
      } else {
        log(`${model}: ❌ Failed - ${stats.error}`);
      }
    }
    
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`);
  } finally {
    // Close connections
    if (localConnection) {
      try {
        await localConnection.close();
        log('Local MongoDB connection closed.');
      } catch (error) {
        log(`Error closing local connection: ${error.message}`);
      }
    }
    
    if (atlasConnection) {
      try {
        await atlasConnection.close();
        log('MongoDB Atlas connection closed.');
      } catch (error) {
        log(`Error closing Atlas connection: ${error.message}`);
      }
    }
    
    log('\nMigration process completed. Check migration-log.txt for details.');
  }
}

// Execute the migration
migrateData()
  .then(() => {
    log('Migration script execution completed.');
  })
  .catch(error => {
    log(`Unhandled error in migration script: ${error.message}`);
    log(error.stack);
  });
