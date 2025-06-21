/**
 * Specific admin account creator
 * 
 * This script creates a specific admin account with predefined credentials
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
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// Create the specific admin account
async function createSpecificAdmin() {
  try {
    // Predefined admin details
    const adminDetails = {
      email: "btbbuildsadmin@gmail.com",
      password: "dtbadmin2025",
      name: "Linda's Admin",
      role: "super_admin",
      active: true
    };
    
    // Check if this admin already exists
    const existingAdmin = await Admin.findOne({ email: adminDetails.email });
    if (existingAdmin) {
      console.error(`❌ An admin with email "${adminDetails.email}" already exists`);
      return false;
    }
    
    // Create the new admin account
    const newAdmin = new Admin(adminDetails);
    await newAdmin.save();
    
    console.log('\n✅ Admin account created successfully!');
    console.log('\n📋 Admin Account Details:');
    console.log(`  Email: ${adminDetails.email}`);
    console.log(`  Name: ${adminDetails.name}`);
    console.log(`  Role: ${adminDetails.role}`);
    console.log('  Password: [MASKED] (as specified in script)');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n🔑 LINDA\'S NUT BUTTER STORE - CREATING SPECIFIC ADMIN ACCOUNT\n');
  
  const connected = await connectToDatabase();
  if (!connected) {
    return;
  }
  
  await createSpecificAdmin();
  
  // Close database connection
  mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  mongoose.connection.close();
});
