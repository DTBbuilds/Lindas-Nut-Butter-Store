const { User } = require('../models');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function setupAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    // Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store');
    
    console.log('Connected to MongoDB. Checking for admin user...');
    
    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating admin user...');
      
      // Create admin user
      const admin = new User({
        name: 'Admin User',
        email: 'admin@lindas-nut-butter-store-store-store-store.com',
        password: 'AdminPassword123', // Will be hashed by the pre-save hook
        role: 'admin'
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@lindas-nut-butter-store-store-store-store.com');
      console.log('Password: AdminPassword123');
    } else {
      console.log('✅ Admin user already exists:', adminExists.email);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

setupAdmin();
