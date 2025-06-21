/**
 * Simple admin password reset script
 * This script directly resets the admin password using bcrypt
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const config = require('./config');

// Connect to MongoDB
async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');

  const email = 'btbbuildsadmin@gmail.com';
  const newPassword = 'dtbadmin2025';

  try {
    // Find the admin user
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found');
      return;
    }

    console.log(`Found admin: ${admin.name} (${admin.email})`);
    
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Admin password updated successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

run().catch(console.error);
