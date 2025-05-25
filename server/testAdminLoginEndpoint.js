/**
 * Admin Login API Test Script
 * This script tests the admin login API endpoint and verifies that it returns the expected response
 */

const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const Admin = require('./models/Admin');

// Admin credentials to test
const EMAIL = 'dtbadmin@lindas.com';
const PASSWORD = 'dtbbuildsadmin2025';
const API_URL = 'http://localhost:5000';

// Test the login API directly
async function testLoginAPI() {
  console.log('\n🔒 TESTING ADMIN LOGIN API ENDPOINT');
  console.log('----------------------------------------');
  console.log(`Email: ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  
  try {
    console.log('\n📡 Making API request to /api/auth/admin/login...');
    
    const response = await axios.post(`${API_URL}/api/auth/admin/login`, {
      email: EMAIL,
      password: PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API request successful!');
    console.log(`Status code: ${response.status}`);
    console.log('\n📦 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify token is present
    if (response.data.token) {
      console.log('\n🔑 Token received and verified!');
      
      // Decode token to show admin info
      try {
        const decoded = jwt.verify(response.data.token, config.jwt.secret);
        console.log('\n👤 Token decoded:');
        console.log(JSON.stringify(decoded, null, 2));
      } catch (err) {
        console.log('\n❌ Token decoding failed:', err.message);
      }
    } else {
      console.log('\n⚠️ Token not found in response!');
    }
    
    // Verify user data is present
    if (response.data.user) {
      console.log('\n👤 User data received:');
      console.log(JSON.stringify(response.data.user, null, 2));
    } else {
      console.log('\n⚠️ User data not found in response!');
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ API request failed!');
    
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
      console.log('\n📦 Error response data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received from server');
      console.log(error.request);
    } else {
      console.log('Error message:', error.message);
    }
    
    return false;
  }
}

// Connect to MongoDB and check admin credentials directly
async function verifyAdminInDatabase() {
  console.log('\n🔍 VERIFYING ADMIN IN DATABASE');
  console.log('----------------------------------------');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');
    
    // Find admin by email
    console.log(`\nLooking up admin with email: ${EMAIL}`);
    const admin = await Admin.findOne({ email: EMAIL });
    
    if (!admin) {
      console.log('❌ Admin not found in database!');
      return false;
    }
    
    console.log('✅ Admin found in database!');
    console.log('\n👤 Admin details:');
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Active: ${admin.active}`);
    
    // Check password
    console.log('\n🔐 Verifying password...');
    const isMatch = await bcrypt.compare(PASSWORD, admin.password);
    console.log(`Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    
    return isMatch;
  } catch (error) {
    console.error('Error:', error);
    return false;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Examine admin route handler code
async function examineAdminRouteCode() {
  console.log('\n📋 CHECKING ADMIN ROUTE HANDLER');
  console.log('----------------------------------------');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const routeFilePath = path.join(__dirname, 'routes', 'adminAuthRoutes.js');
    
    if (fs.existsSync(routeFilePath)) {
      console.log('Reading admin auth routes file...');
      const routeContent = fs.readFileSync(routeFilePath, 'utf8');
      
      console.log('\nChecking for issues in login route handler:');
      
      // Check if the route returns proper user info with token
      const hasUserInResponse = routeContent.includes('res.json({ token');
      console.log(`- Returns user data with token: ${hasUserInResponse ? '✅ YES' : '❌ NO'}`);
      
      // Check if proper error handling exists
      const hasProperErrorHandling = routeContent.includes('catch (error)');
      console.log(`- Has proper error handling: ${hasProperErrorHandling ? '✅ YES' : '❌ NO'}`);
      
      return { hasUserInResponse, hasProperErrorHandling };
    } else {
      console.log('❌ Admin auth routes file not found!');
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Run all tests
async function main() {
  console.log('\n🔄 ADMIN LOGIN DIAGNOSTICS SCRIPT');
  console.log('========================================');
  
  // First verify admin in database
  const adminVerified = await verifyAdminInDatabase();
  
  if (!adminVerified) {
    console.log('\n❌ Admin verification failed. Cannot proceed with API test.');
    process.exit(1);
  }
  
  // Examine route code
  const routeCodeCheck = await examineAdminRouteCode();
  
  // Test login API
  const apiTestResult = await testLoginAPI();
  
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('========================================');
  console.log(`Admin exists in database: ${adminVerified ? '✅ YES' : '❌ NO'}`);
  console.log(`API login test successful: ${apiTestResult ? '✅ YES' : '❌ NO'}`);
  
  if (routeCodeCheck) {
    console.log(`Route returns user data: ${routeCodeCheck.hasUserInResponse ? '✅ YES' : '❌ NO'}`);
    console.log(`Route has error handling: ${routeCodeCheck.hasProperErrorHandling ? '✅ YES' : '❌ NO'}`);
  }
  
  if (adminVerified && apiTestResult) {
    console.log('\n✅ ADMIN LOGIN SYSTEM IS WORKING CORRECTLY');
    console.log('The issue is likely in the frontend redirection logic.');
    console.log('\nRECOMMENDED FIX:');
    console.log('1. Update the AdminLoginPage.js to use direct window.location.href instead of navigate()');
    console.log('2. Check browser console for any errors during redirection');
    console.log('3. Verify that the token is being stored properly in localStorage');
  } else {
    console.log('\n❌ ADMIN LOGIN SYSTEM HAS ISSUES');
    console.log('Follow the diagnostic output above to identify and fix the issues.');
  }
}

// Run the main function
main().catch(console.error);
