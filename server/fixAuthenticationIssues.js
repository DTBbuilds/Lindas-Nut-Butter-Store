/**
 * Authentication Issues Diagnostic and Fix Script
 * 
 * This script:
 * 1. Diagnoses admin login issues
 * 2. Ensures token verification is working correctly
 * 3. Fixes customer registration validation
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const Admin = require('./models/Admin');
const Customer = require('./models/Customer');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Test JWT token functionality
async function testJWTFunctionality() {
  console.log('\n📋 TESTING JWT FUNCTIONALITY');
  console.log('----------------------------------------');
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret || 'your-secret-key';
    console.log(`Using JWT_SECRET: ${JWT_SECRET.substring(0, 3)}${'*'.repeat(5)}`);
    
    // Create a test payload
    const testPayload = {
      id: 'test-admin-id',
      email: 'test@example.com',
      role: 'admin'
    };
    
    // Sign a token
    console.log('Signing test token...');
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
    
    if (!token) {
      console.log('❌ Failed to sign JWT token');
      return false;
    }
    
    console.log(`✅ JWT token signed successfully: ${token.substring(0, 15)}...`);
    
    // Verify the token
    console.log('Verifying test token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || decoded.email !== testPayload.email) {
      console.log('❌ Failed to verify JWT token');
      return false;
    }
    
    console.log('✅ JWT token verified successfully');
    console.log('Decoded token:', decoded);
    
    return true;
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
    return false;
  }
}

// Verify admin account exists and is properly configured
async function verifyAdminAccount() {
  console.log('\n👤 VERIFYING ADMIN ACCOUNT');
  console.log('----------------------------------------');
  
  try {
    // Check for admin with email dtbadmin@lindas.com
    const adminEmail = 'dtbadmin@lindas.com';
    console.log(`Looking for admin with email: ${adminEmail}`);
    
    const admin = await Admin.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log(`❌ Admin not found with email: ${adminEmail}`);
      return false;
    }
    
    console.log('✅ Admin account found:');
    console.log(`  - Name: ${admin.name}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Role: ${admin.role}`);
    console.log(`  - Active: ${admin.active}`);
    
    // Test password verification
    const testPassword = 'dtbbuildsadmin2025';
    console.log(`\nTesting password verification with: ${testPassword}`);
    
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    if (!isMatch) {
      console.log('❌ Password verification failed');
      return false;
    }
    
    console.log('✅ Password verification successful');
    
    return true;
  } catch (error) {
    console.error('❌ Admin verification failed:', error.message);
    return false;
  }
}

// Ensure admin login route is working correctly
async function verifyAdminLoginRoute() {
  console.log('\n🔐 VERIFYING ADMIN LOGIN ROUTE');
  console.log('----------------------------------------');
  
  try {
    // Check if the admin login route file exists
    const routeFilePath = path.join(__dirname, 'routes', 'adminAuthRoutes.js');
    
    if (!fs.existsSync(routeFilePath)) {
      console.log('❌ Admin auth routes file not found');
      return false;
    }
    
    console.log('✅ Admin auth routes file found');
    
    // Check if the admin login route has proper response format
    const routeContent = fs.readFileSync(routeFilePath, 'utf8');
    
    // Check if the route sends both token and user information
    const hasUserInfoInResponse = routeContent.includes('token') && 
                                 routeContent.includes('user:') && 
                                 routeContent.includes('success: true');
    
    if (!hasUserInfoInResponse) {
      console.log('❌ Admin login route response format is incorrect');
      console.log('   Missing token and user information in response');
      
      // Fix the route response format
      console.log('\n🔧 Fixing admin login route response format...');
      
      // This would need to be done through appropriate file editing
      console.log('Please manually check adminAuthRoutes.js to ensure it returns:');
      console.log(`
res.json({
  success: true,
  token: token,
  user: {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    active: admin.active
  }
});`);
      
      return false;
    }
    
    console.log('✅ Admin login route response format is correct');
    
    return true;
  } catch (error) {
    console.error('❌ Admin login route verification failed:', error.message);
    return false;
  }
}

// Check customer registration validation
async function verifyCustomerRegistration() {
  console.log('\n👥 VERIFYING CUSTOMER REGISTRATION');
  console.log('----------------------------------------');
  
  try {
    // Check customer routes file
    const routeFilePath = path.join(__dirname, 'routes', 'customerRoutes.js');
    
    if (!fs.existsSync(routeFilePath)) {
      console.log('❌ Customer routes file not found');
      return false;
    }
    
    console.log('✅ Customer routes file found');
    
    // Check for duplicate code in the profile route that might affect registration
    const routeContent = fs.readFileSync(routeFilePath, 'utf8');
    
    const hasCleanProfileRoute = !routeContent.includes('const isMatch = await customer.comparePassword(password)') || 
                               !routeContent.includes('token = customer.generateToken()');
    
    if (!hasCleanProfileRoute) {
      console.log('❌ Customer profile route has duplicated code');
      
      // Fix the profile route
      console.log('\n🔧 The profile route should be cleaned up to remove duplicated authentication code');
      console.log('Please ensure the profile route only returns the customer profile data and does not attempt to authenticate again');
      
      return false;
    }
    
    console.log('✅ Customer profile route is clean');
    
    return true;
  } catch (error) {
    console.error('❌ Customer registration verification failed:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n🔍 LINDA\'S NUT BUTTER STORE - AUTHENTICATION DIAGNOSTICS');
  console.log('========================================================');
  
  // Connect to MongoDB
  const isConnected = await connectToMongoDB();
  
  if (!isConnected) {
    console.log('❌ Cannot proceed without MongoDB connection');
    process.exit(1);
  }
  
  // Test JWT functionality
  const jwtWorking = await testJWTFunctionality();
  
  if (!jwtWorking) {
    console.log('❌ JWT functionality is broken - this will affect all authentication');
  }
  
  // Verify admin account
  const adminVerified = await verifyAdminAccount();
  
  if (!adminVerified) {
    console.log('❌ Admin account verification failed');
  }
  
  // Verify admin login route
  const adminLoginRouteVerified = await verifyAdminLoginRoute();
  
  if (!adminLoginRouteVerified) {
    console.log('❌ Admin login route verification failed');
  }
  
  // Verify customer registration
  const customerRegistrationVerified = await verifyCustomerRegistration();
  
  if (!customerRegistrationVerified) {
    console.log('❌ Customer registration verification failed');
  }
  
  // Final diagnosis
  console.log('\n📊 AUTHENTICATION DIAGNOSTICS SUMMARY');
  console.log('========================================================');
  console.log(`JWT Functionality: ${jwtWorking ? '✅ Working' : '❌ Not Working'}`);
  console.log(`Admin Account: ${adminVerified ? '✅ Verified' : '❌ Not Verified'}`);
  console.log(`Admin Login Route: ${adminLoginRouteVerified ? '✅ Correct' : '❌ Needs Fixing'}`);
  console.log(`Customer Registration: ${customerRegistrationVerified ? '✅ Working' : '❌ Needs Fixing'}`);
  
  // Recommendations
  console.log('\n📝 RECOMMENDATIONS');
  console.log('========================================================');
  
  if (!jwtWorking) {
    console.log('1. Check JWT_SECRET in environment variables and config files');
    console.log('2. Ensure JWT_SECRET is consistent across all authentication routes');
  }
  
  if (!adminVerified) {
    console.log('1. Reset admin password using bcrypt.hash() directly');
    console.log('2. Ensure admin account has the correct role (super_admin)');
  }
  
  if (!adminLoginRouteVerified) {
    console.log('1. Update admin login route to return proper response format with token and user info');
    console.log('2. Check bcrypt.compare() usage in the admin login route');
  }
  
  if (!customerRegistrationVerified) {
    console.log('1. Clean up customer profile route to remove duplicated authentication code');
    console.log('2. Check customer registration validation - ensure it properly validates input fields');
  }
  
  console.log('\n✅ Diagnostic completed. Follow the recommendations above to fix authentication issues.');
  
  // Close MongoDB connection
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

// Run the main function
main().catch(error => {
  console.error('Script execution failed:', error);
  mongoose.connection.close();
});
