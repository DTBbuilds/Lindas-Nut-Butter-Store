/**
 * Admin account creator utility
 * 
 * This script creates a new admin account with specified credentials
 * It performs validation and prevents duplicate accounts
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const config = require('./config');
const crypto = require('crypto');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Generate a secure random password
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    password += chars.charAt(randomIndex);
  }
  
  return password;
}

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

// Create a new admin account
async function createAdminAccount() {
  try {
    // Get admin details from user input
    console.log('\n📝 Please enter the new admin account details:');
    
    const email = await prompt('Email address: ');
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      return false;
    }
    
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.error(`❌ An admin with email "${email}" already exists`);
      return false;
    }
    
    const name = await prompt('Full name: ');
    if (!name || name.length < 2) {
      console.error('❌ Please enter a valid name (minimum 2 characters)');
      return false;
    }
    
    const role = await prompt('Role (admin/super_admin) [default: admin]: ');
    const validRole = role === 'super_admin' ? 'super_admin' : 'admin';
    
    // Ask if user wants to set their own password or generate one
    const passwordChoice = await prompt('Generate secure password? (y/n) [default: y]: ');
    let password;
    
    if (passwordChoice.toLowerCase() === 'n') {
      // Let user enter their own password
      password = await prompt('Enter password (minimum 8 characters): ');
      if (!password || password.length < 8) {
        console.error('❌ Password must be at least 8 characters long');
        return false;
      }
      
      const confirmPassword = await prompt('Confirm password: ');
      if (password !== confirmPassword) {
        console.error('❌ Passwords do not match');
        return false;
      }
    } else {
      // Generate a secure password
      password = generateSecurePassword(16);
    }
    
    // Create the new admin account
    const newAdmin = new Admin({
      email,
      password,
      name,
      role: validRole,
      active: true
    });
    
    await newAdmin.save();
    
    console.log('\n✅ Admin account created successfully!');
    console.log('\n📋 Admin Account Details:');
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Role: ${validRole}`);
    
    if (passwordChoice.toLowerCase() !== 'n') {
      console.log('\n🔐 Generated Password (copy this now, it will not be shown again):');
      console.log(`  ${password}`);
      console.log('\n⚠️ IMPORTANT: Store this password securely!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n🔑 LINDA\'S NUT BUTTER STORE - ADMIN ACCOUNT CREATOR\n');
  
  const connected = await connectToDatabase();
  if (!connected) {
    rl.close();
    return;
  }
  
  await createAdminAccount();
  
  // Close readline interface and database connection
  rl.close();
  mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  rl.close();
  mongoose.connection.close();
});
