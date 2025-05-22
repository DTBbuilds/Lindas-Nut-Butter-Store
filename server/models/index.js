/**
 * Models index file
 * 
 * Exports all models for the application
 */

const Customer = require('./Customer');
const Feedback = require('./Feedback');
const Admin = require('./Admin');
// Import models from database schemas directory
const { Order, Transaction, Product, InventoryLog, User } = require('../database/schemas');

module.exports = {
  Customer,
  Feedback,
  Admin,
  Order,
  Transaction,
  Product,
  InventoryLog,
  User
};
