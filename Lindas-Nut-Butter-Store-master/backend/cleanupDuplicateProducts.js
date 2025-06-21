require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Determine MongoDB URI from environment or use default
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    MONGODB_URI = 'mongodb://mongodb:27017/lindas-nut-butter-store';
  } else if (process.env.DOCKER_ENV === 'true') {
    MONGODB_URI = 'mongodb://host.docker.internal:27017/lindas-nut-butter-store';
  } else {
    MONGODB_URI = 'mongodb://localhost:27017/lindas-nut-butter-store';
  }
}

async function removeDuplicateProducts() {
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000
    });
    console.log('MongoDB connected successfully.');

    const pipeline = [
      {
        $group: {
          _id: { id: "$id" }, // Group by the custom 'id' field
          count: { $sum: 1 },
          docs: { $push: "$_id" } // Collect all MongoDB ObjectIds for this custom 'id'
        }
      },
      {
        $match: {
          count: { "$gt": 1 } // Find groups with more than one document (duplicates)
        }
      }
    ];

    console.log('Finding duplicate products by custom id...');
    const duplicates = await Product.aggregate(pipeline);

    if (duplicates.length === 0) {
      console.log('No duplicate products found based on custom id.');
      return;
    }

    console.log(`Found ${duplicates.length} custom ids with duplicate entries.`);
    let totalRemoved = 0;

    for (const group of duplicates) {
      // The 'docs' array contains all ObjectIds for this custom 'id'.
      // Sort them to keep the one with the 'smallest' ObjectId (typically the first one created).
      group.docs.sort(); 
      const idsToRemove = group.docs.slice(1); // Keep the first one, remove the rest

      if (idsToRemove.length > 0) {
        console.log(`For custom id ${group._id.id}, found ${group.count} docs. Removing ${idsToRemove.length} duplicates: ${idsToRemove.join(', ')}`);
        const result = await Product.deleteMany({ _id: { $in: idsToRemove } });
        console.log(`Removed ${result.deletedCount} products for custom id ${group._id.id}.`);
        totalRemoved += result.deletedCount;
      }
    }

    console.log(`Finished cleanup. Total duplicate products removed: ${totalRemoved}.`);

  } catch (error) {
    console.error('Error during duplicate product cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

removeDuplicateProducts();
