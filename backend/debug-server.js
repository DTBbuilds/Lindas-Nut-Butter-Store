/**
 * Debug script to identify backend server startup issues
 * Run this with: node debug-server.js
 */

console.log('Starting debugging process...');

// 1. Test basic module loading
try {
  console.log('\n=== Testing basic modules ===');
  console.log('Loading express...');
  const express = require('express');
  console.log('✓ Express loaded');
  
  console.log('Loading mongoose...');
  const mongoose = require('mongoose');
  console.log('✓ Mongoose loaded');
  
  console.log('Loading basic NodeJS modules...');
  const path = require('path');
  const fs = require('fs');
  console.log('✓ Basic modules loaded');
} catch (error) {
  console.error('❌ Error loading basic modules:', error);
  process.exit(1);
}

// 2. Test configuration and utility modules
try {
  console.log('\n=== Testing configuration and utilities ===');
  
  console.log('Loading database configuration...');
  const database = require('./config/database');
  console.log('✓ Database config loaded');
  
  console.log('Loading error handler...');
  const errorHandler = require('./utils/errorHandler');
  console.log('✓ Error handler loaded');
  
  console.log('Loading validators...');
  const validators = require('./utils/validators');
  console.log('✓ Validators loaded');
} catch (error) {
  console.error('❌ Error loading configuration or utilities:', error);
  process.exit(1);
}

// 3. Test model loading
try {
  console.log('\n=== Testing models ===');
  
  console.log('Loading Product model...');
  const Product = require('./models/Product');
  console.log('✓ Product model loaded');
  
  console.log('Loading Order model...');
  const Order = require('./models/Order');
  console.log('✓ Order model loaded');
  
  // Test other models if they exist
  // ...
} catch (error) {
  console.error('❌ Error loading models:', error);
  process.exit(1);
}

// 4. Test routes one by one
try {
  console.log('\n=== Testing route modules ===');
  
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✓ Auth routes loaded');
  
  // Test products routes - this was modified recently
  try {
    console.log('Loading products routes...');
    const { router: productRoutes } = require('./routes/products');
    console.log('✓ Product routes loaded correctly as { router }');
  } catch (moduleError) {
    console.error('❌ Error with products routes as { router }:', moduleError.message);
    console.log('Trying alternate import method...');
    try {
      const productRoutes = require('./routes/products');
      console.log('✓ Product routes loaded as direct module');
      if (productRoutes.router) {
        console.log('✓ Product routes contains router property');
      } else {
        console.log('⚠ Product routes does not contain router property');
      }
    } catch (altError) {
      console.error('❌ Error loading products routes with alternate method:', altError.message);
    }
  }
  
  // This is likely the problematic module
  try {
    console.log('Loading orders routes...');
    const orderRoutes = require('./routes/orders');
    console.log('✓ Order routes loaded');
    
    if (typeof orderRoutes === 'function') {
      console.log('✓ Order routes is a function (Express Router)');
    } else {
      console.log('⚠ Order routes is not a function, type:', typeof orderRoutes);
    }
  } catch (orderError) {
    console.error('❌ ERROR LOADING ORDERS ROUTES:', orderError);
    console.error('This is likely the source of our server startup issues');
  }
} catch (error) {
  console.error('❌ Error in routes testing section:', error);
}

console.log('\n=== Debug process complete ===');
