// Script to create a simple admin user with a basic password
const mongoose = require('mongoose');
const { User } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store';

async function createSimpleAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
    
    // Delete any existing admin users
    await User.deleteMany({ role: 'admin' });
    console.log('Deleted existing admin users');
    
    // Create a new admin user with a simple password
    const newAdmin = new User({
      email: 'admin@example.com',
      password: 'admin123',  // This will be hashed by the pre-save hook
      role: 'admin'
    });
    
    await newAdmin.save();
    console.log('Created new admin user:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createSimpleAdmin();
