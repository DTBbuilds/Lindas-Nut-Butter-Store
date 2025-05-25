/**
 * Admin account checker utility
 * 
 * This script connects to the database and lists all admin accounts
 * It provides information about existing admin users without exposing passwords
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const config = require('./config');

// Load environment variables
dotenv.config();

// Connect to MongoDB database
async function connectToDatabase() {
  try {
    // Use the MONGODB_URI from the config, which should pull from .env
    await mongoose.connect(config.mongodb.uri);
    
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// Get all admin accounts
async function getAdminAccounts() {
  try {
    const admins = await Admin.find({}, {
      password: 0, // Exclude password field
    }).lean();
    
    if (admins.length === 0) {
      console.log('❌ No admin accounts found in the database');
      return;
    }
    
    console.log(`\n📋 Found ${admins.length} admin account(s):\n`);
    
    admins.forEach((admin, index) => {
      console.log(`Admin #${index + 1}:`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Role: ${admin.role || 'admin'}`);
      console.log(`  Active: ${admin.active ? 'Yes' : 'No'}`);
      console.log(`  Last Login: ${admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}`);
      console.log(`  Created: ${new Date(admin.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    console.log('💡 To reset an admin password, use the "node server/resetAdminPassword.js" utility');
  } catch (error) {
    console.error('❌ Error retrieving admin accounts:', error.message);
  }
}

// Main function
async function main() {
  console.log('\n🔍 LINDA\'S NUT BUTTER STORE - ADMIN ACCOUNT CHECKER\n');
  
  const connected = await connectToDatabase();
  if (!connected) {
    return;
  }
  
  await getAdminAccounts();
  
  // Close the database connection
  mongoose.connection.close();
  console.log('✅ Database connection closed');
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  mongoose.connection.close();
});
