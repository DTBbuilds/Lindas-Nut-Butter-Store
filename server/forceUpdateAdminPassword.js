/**
 * Force update admin password
 * This script directly sets the admin password with bcrypt to ensure proper hashing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config');

// Admin credentials
const ADMIN_EMAIL = 'dtbadmin@lindas.com';
const ADMIN_PASSWORD = 'dtbbuildsadmin2025';

async function run() {
  console.log('Starting admin password forced update...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');
    
    // Direct database operation to avoid model middleware issues
    const adminCollection = mongoose.connection.db.collection('admins');
    
    // Find the admin account
    const admin = await adminCollection.findOne({ email: ADMIN_EMAIL });
    
    if (!admin) {
      console.error(`Admin account not found with email: ${ADMIN_EMAIL}`);
      return false;
    }
    
    console.log(`Found admin account: ${admin.name} (${admin.email})`);
    
    // Generate salt and hash directly
    console.log('Generating new password hash...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    // Update admin password directly in the database
    console.log('Updating admin password directly in database...');
    const updateResult = await adminCollection.updateOne(
      { email: ADMIN_EMAIL },
      { $set: { password: hashedPassword } }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log('✅ Admin password updated successfully!');
      
      // Verify the update
      const updatedAdmin = await adminCollection.findOne({ email: ADMIN_EMAIL });
      console.log('New password hash:', updatedAdmin.password);
      
      // Test the password verification
      const passwordMatches = await bcrypt.compare(ADMIN_PASSWORD, updatedAdmin.password);
      console.log(`Password verification test: ${passwordMatches ? 'PASSED ✅' : 'FAILED ❌'}`);
      
      return true;
    } else {
      console.error('❌ Failed to update admin password');
      return false;
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
    return false;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
run()
  .then(success => {
    if (success) {
      console.log('\n==============================================');
      console.log('🔐 ADMIN PASSWORD UPDATED SUCCESSFULLY');
      console.log('==============================================');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
      console.log('==============================================');
      console.log('You can now log in with these credentials at:');
      console.log('http://localhost:3000/admin/login');
      console.log('==============================================');
    } else {
      console.error('\n❌ ADMIN PASSWORD UPDATE FAILED');
    }
  })
  .catch(error => {
    console.error('Script execution failed:', error);
  });
