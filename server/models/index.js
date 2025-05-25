/**
 * Models index file
 * 
 * Exports all models for the application
 */

const Customer = require('./Customer');
const Feedback = require('./Feedback');
const Admin = require('./admin.model.js');
const Order = require('./Order');
const Transaction = require('./Transaction');

// Create default admin if none exists
if (Admin && typeof Admin.createDefaultAdmin === 'function') {
  console.log('Initializing default admin account if needed...');
  Admin.createDefaultAdmin().catch(err => {
    console.error('Error initializing default admin:', err);
  });
}

module.exports = {
  Customer,
  Feedback,
  Admin,
  Order,
  Transaction
};
