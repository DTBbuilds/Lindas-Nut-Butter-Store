/**
 * Script to reset admin user in the database
 * Run with: node server/scripts/resetAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set up MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linda_nut_butter';

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the Admin model collection directly to avoid schema issues
    const Admin = mongoose.connection.collection('admins');
    
    // Delete existing admin
    const result = await Admin.deleteMany({ email: 'admin@lindas.com' });
    console.log(`Deleted ${result.deletedCount} admin users`);
    
    // Create a salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new admin with hashed password
    const newAdmin = {
      email: 'admin@lindas.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the new admin
    await Admin.insertOne(newAdmin);
    
    console.log('Admin user reset successfully!');
    console.log('You can now log in with these credentials:');
    console.log('Email: admin@lindas.com');
    console.log('Password: admin123');
    
    // Close connection
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error resetting admin:', error);
  }
}

resetAdmin();
