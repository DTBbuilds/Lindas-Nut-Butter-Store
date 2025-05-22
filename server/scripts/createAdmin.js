/**
 * Script to create an admin user in the database
 * Run with: node server/scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set up MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linda_nut_butter';

// Define Admin schema (copy of the one in models/Admin.js)
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin'],
    default: 'admin'
  },
  lastLogin: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// No middleware hooks for direct script use

// Register the model
const Admin = mongoose.model('Admin', adminSchema);

// Admin user data
const adminData = {
  email: 'admin@lindas.com',
  password: 'admin123',  // This will be hashed before saving
  name: 'Admin User',
  role: 'admin',
  active: true
};

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log(`Admin with email ${adminData.email} already exists`);
      process.exit(0);
    }
    
    // Hash password directly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);
    
    // Create new admin with hashed password
    const admin = new Admin({
      ...adminData,
      password: hashedPassword
    });
    await admin.save();
    
    console.log(`Admin created successfully with email: ${adminData.email}`);
    console.log('You can now log in with these credentials:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
