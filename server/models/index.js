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

module.exports = {
  Customer,
  Feedback,
  Admin,
  Order,
  Transaction
};
