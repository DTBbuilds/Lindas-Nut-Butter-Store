/**
 * Admin credentials verification script
 * 
 * This script verifies if the provided admin credentials are valid
 * by directly checking the database and testing password verification
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const config = require('./config');

// Load environment variables
dotenv.config();

// Admin credentials to test
const TEST_EMAIL = "btbbuildsadmin@gmail.com";
const TEST_PASSWORD = process.env.ADMIN_TEST_PASSWORD;

// Connect to MongoDB database
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

// Verify admin credentials
async function verifyAdminCredentials() {
  if (!TEST_PASSWORD) {
    console.error('❌ Error: ADMIN_TEST_PASSWORD environment variable is not set.');
    console.log('Please set it to the admin password you want to verify.');
    process.exit(1);
  }
  try {
    console.log('🔍 Verifying admin credentials for:', TEST_EMAIL);
    
    // Find admin by email
    const admin = await Admin.findOne({ email: TEST_EMAIL });
    
    if (!admin) {
      console.error('❌ Admin account not found in database');
      return false;
    }
    
    console.log('✅ Admin account found:');
    console.log(`  - Name: ${admin.name}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Role: ${admin.role}`);
    console.log(`  - Active: ${admin.active}`);
    console.log(`  - ID: ${admin._id}`);
    console.log(`  - Password hash length: ${admin.password.length}`);
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    
    try {
      // Method 1: Using bcrypt.compare directly
      console.log('Method 1: Using bcrypt.compare directly');
      const isMatchDirect = await bcrypt.compare(TEST_PASSWORD, admin.password);
      console.log(`Result: ${isMatchDirect ? '✅ Password matched' : '❌ Password did not match'}`);
      
      // Method 2: Using the model's isValidPassword method if available
      if (typeof admin.isValidPassword === 'function') {
        console.log('Method 2: Using model\'s isValidPassword method');
        const isMatchModel = await admin.isValidPassword(TEST_PASSWORD);
        console.log(`Result: ${isMatchModel ? '✅ Password matched' : '❌ Password did not match'}`);
      } else {
        console.log('Method 2: isValidPassword method not available on admin model');
      }
      
      // Method 3: Re-hash the password and compare hashes (not recommended but for debugging)
      console.log('Method 3: Re-hash current password and compare visually');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(TEST_PASSWORD, salt);
      console.log(`New hash for "${TEST_PASSWORD}": ${newHash}`);
      console.log(`Stored hash: ${admin.password}`);
      console.log('Visual comparison shows different hashes (normal for bcrypt)');
      
      return isMatchDirect;
    } catch (error) {
      console.error('❌ Error during password verification:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying admin credentials:', error.message);
    return false;
  }
}

// Update admin password if needed
async function resetAdminPassword() {
  try {
    console.log('\n🔧 Resetting admin password...');
    
    // Find admin by email
    const admin = await Admin.findOne({ email: TEST_EMAIL });
    
    if (!admin) {
      console.error('❌ Admin account not found');
      return false;
    }
    
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
    
    // Update admin password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('✅ Admin password has been reset');
    console.log(`  - New password hash: ${hashedPassword}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n🔒 LINDA\'S NUT BUTTER STORE - ADMIN CREDENTIALS VERIFICATION\n');
  
  const connected = await connectToDatabase();
  if (!connected) {
    return;
  }
  
  const isValid = await verifyAdminCredentials();
  
  if (!isValid) {
    console.log('\n⚠️ Admin credentials verification failed. Would you like to reset the password?');
    console.log('Automatically resetting password to fix the issue...');
    await resetAdminPassword();
    
    // Verify again after reset
    console.log('\n🔄 Verifying credentials after password reset...');
    const isValidAfterReset = await verifyAdminCredentials();
    
    if (isValidAfterReset) {
      console.log('\n✅ Password reset successful. You can now log in with:');
      console.log(`  - Email: ${TEST_EMAIL}`);
      console.log(`  - Password: ${TEST_PASSWORD}`);
    } else {
      console.error('\n❌ Password reset did not fix the issue. Please check the database and models.');
    }
  } else {
    console.log('\n✅ Admin credentials are valid! You should be able to log in.');
  }
  
  // Close the database connection
  mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  mongoose.connection.close();
});
