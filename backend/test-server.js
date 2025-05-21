/**
 * Test server to identify which modules are causing the startup issues
 */
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Create a simple Express app
const app = express();

// Try loading modules one by one
console.log('Testing module loading...');

try {
  console.log('1. Testing database connection module...');
  const database = require('./config/database');
  console.log('✓ Database module loaded successfully');
  
  console.log('2. Testing auth routes module...');
  const authRoutes = require('./routes/auth');
  console.log('✓ Auth routes module loaded successfully');
  
  console.log('3. Testing products routes module...');
  const productsModule = require('./routes/products');
  console.log('✓ Products routes module loaded successfully');
  
  console.log('4. Testing orders routes module...');
  const ordersRoutes = require('./routes/orders');
  console.log('✓ Orders routes module loaded successfully');
  
  console.log('5. Testing error handler module...');
  const errorHandler = require('./utils/errorHandler');
  console.log('✓ Error handler module loaded successfully');
  
  console.log('6. Testing validators module...');
  const validators = require('./utils/validators');
  console.log('✓ Validators module loaded successfully');
  
  console.log('All modules loaded successfully!');
} catch (error) {
  console.error('Error loading modules:', error);
}

// Start a simple server
const PORT = 5050; // Use a different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
