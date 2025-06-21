/**
 * Models index file
 * 
 * Exports all models for the application
 */

const Customer = require('./Customer');
const Feedback = require('./Feedback');
const Admin = require('./Admin');
const Order = require('./Order');
const Transaction = require('./Transaction');
const Product = require('./Product'); // Import Product model



module.exports = {
  Customer,
  Feedback,
  Admin,
  Order,
  Transaction,
  Product // Export Product model
};
