const mongoose = require('mongoose');
const { Admin } = require('./models');

// This function initializes a default admin user if one doesn't exist.
const initializeAdmin = async () => {
  try {
    console.log('Checking for default admin account...');
    const count = await Admin.countDocuments().maxTimeMS(5000); // Prevent hanging
    console.log('Admin count:', count);

    if (count === 0) {
      console.log('No admin account found. Creating default admin...');
      // In a real application, this password should be hashed before saving.
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123', 
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
      });
      console.log('Default admin account created successfully.');
    } else {
      console.log('Admin account already exists.');
    }
  } catch (error) {
    console.error('Error during admin account initialization:', error.message);
  }
};

// This function establishes the connection to the MongoDB database.
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout for server selection
      socketTimeoutMS: 45000,          // Increased timeout for socket operations
      family: 4                        // Force IPv4, which can resolve some connection issues
    });

    console.log('MongoDB Connected successfully.');
    
    // Initialize the admin account only after a successful connection.
    await initializeAdmin();

    return mongoose.connection;

  } catch (error) {
    console.error('CRITICAL: MongoDB connection failed.', error.message);
    console.error(error.stack);
    process.exit(1); // Exit the process with a failure code
  }

  // Optional: Add listeners for disconnection and errors after initial connection
  mongoose.connection.on('error', err => {
    console.error(`Mongoose runtime connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose was disconnected from the database.');
  });
};

module.exports = connectDB;
