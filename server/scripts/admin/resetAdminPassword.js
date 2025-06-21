// Script to reset the admin user password
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Use Admin model

const config = require('./config');
const MONGO_URI = config.mongodb.uri; // Use URI from config file

const email = 'dtbadmin@lindas.com'; // Target specific admin email
const newPassword = 'SuperAdminPass2025!'; // Set new password

async function resetPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
    
    // Find the admin user
    const adminUser = await Admin.findOne({ email }); // Find admin user
    
    if (!adminUser) {
      console.error(`Admin user with email ${email} not found`);
      process.exit(1);
    }
    
    // Generate salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password directly in the database
    await Admin.updateOne(
      { _id: adminUser._id },
      { $set: { password: hashedPassword } }
    ); // Update admin user's password
    
    console.log(`Password reset successfully for admin user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
