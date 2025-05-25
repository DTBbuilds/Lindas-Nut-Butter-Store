/**
 * Admin Account Replacement Script
 * 
 * This script:
 * 1. Removes the existing admin account
 * 2. Creates a new admin account with the specified credentials
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const config = require('./config');

// Configuration
const OLD_ADMIN_EMAIL = 'btbbuildsadmin@gmail.com';
const NEW_ADMIN_EMAIL = 'dtbadmin@lindas.com';
const NEW_ADMIN_PASSWORD = 'dtbbuildsadmin2025';
const NEW_ADMIN_NAME = 'Linda\'s Store Admin';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// Delete existing admin account
async function deleteExistingAdmin() {
  try {
    console.log(`🔍 Looking for existing admin account: ${OLD_ADMIN_EMAIL}`);
    
    const existingAdmin = await Admin.findOne({ email: OLD_ADMIN_EMAIL });
    
    if (!existingAdmin) {
      console.log('ℹ️ No existing admin found with that email');
      return false;
    }
    
    console.log(`✅ Found existing admin account: ${existingAdmin.name} (${existingAdmin.email})`);
    
    // Delete the admin account
    await Admin.deleteOne({ email: OLD_ADMIN_EMAIL });
    console.log(`✅ Successfully deleted admin account: ${OLD_ADMIN_EMAIL}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting existing admin:', error.message);
    return false;
  }
}

// Create new admin account
async function createNewAdmin() {
  try {
    console.log(`🔍 Checking if admin already exists with email: ${NEW_ADMIN_EMAIL}`);
    
    const existingAdmin = await Admin.findOne({ email: NEW_ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log(`ℹ️ Admin already exists with email: ${NEW_ADMIN_EMAIL}`);
      console.log('ℹ️ Updating password for existing admin account');
      
      // Generate salt and hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(NEW_ADMIN_PASSWORD, salt);
      
      // Update the existing admin
      existingAdmin.password = hashedPassword;
      existingAdmin.name = NEW_ADMIN_NAME;
      existingAdmin.role = 'super_admin';
      existingAdmin.active = true;
      
      await existingAdmin.save();
      console.log(`✅ Successfully updated existing admin account: ${NEW_ADMIN_EMAIL}`);
      
      return existingAdmin;
    }
    
    console.log(`✅ Creating new admin account: ${NEW_ADMIN_EMAIL}`);
    
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_ADMIN_PASSWORD, salt);
    
    // Create new admin
    const newAdmin = new Admin({
      email: NEW_ADMIN_EMAIL,
      password: hashedPassword,
      name: NEW_ADMIN_NAME,
      role: 'super_admin',
      active: true
    });
    
    await newAdmin.save();
    console.log(`✅ Successfully created new admin account: ${NEW_ADMIN_EMAIL}`);
    
    return newAdmin;
  } catch (error) {
    console.error('❌ Error creating new admin:', error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('\n🔄 LINDA\'S NUT BUTTER STORE - ADMIN ACCOUNT REPLACEMENT\n');
  
  const connected = await connectToDatabase();
  if (!connected) {
    return;
  }
  
  // Delete existing admin
  await deleteExistingAdmin();
  
  // Create new admin
  const newAdmin = await createNewAdmin();
  
  if (newAdmin) {
    console.log('\n✅ ADMIN ACCOUNT REPLACEMENT COMPLETE');
    console.log('=================================================');
    console.log('New Admin Account Details:');
    console.log(`Email: ${NEW_ADMIN_EMAIL}`);
    console.log(`Password: ${NEW_ADMIN_PASSWORD}`);
    console.log(`Name: ${NEW_ADMIN_NAME}`);
    console.log(`Role: ${newAdmin.role}`);
    console.log('=================================================');
    console.log('You can now log in with these credentials at:');
    console.log('http://localhost:3000/admin/login');
    console.log('=================================================\n');
  } else {
    console.error('\n❌ ADMIN ACCOUNT REPLACEMENT FAILED');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  mongoose.connection.close();
});
