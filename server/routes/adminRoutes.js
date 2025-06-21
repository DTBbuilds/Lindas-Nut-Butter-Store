/**
 * Admin Routes
 * 
 * Centralized API endpoints for admin dashboard functionality
 * including customer management, order processing, and analytics
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const customerAdminController = require('../controllers/customerAdminController');

// Admin dashboard statistics and overview
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/recent-orders', adminController.getRecentOrders);
router.get('/dashboard/recent-transactions', adminController.getRecentTransactions);
router.get('/dashboard/realtime-transactions', adminController.getRealtimeTransactions);
router.get('/dashboard/monthly-sales', adminController.getMonthlySalesData);
router.get('/dashboard/product-rankings', adminController.getProductSalesRankings);
router.get('/dashboard/recent-feedback', adminController.getRecentFeedback);

// Orders management
router.get('/orders', orderController.getAllOrders);

// Transactions management
// router.get('/transactions', orderController.getAllTransactions);
// router.get('/transactions/export', orderController.exportTransactionsCSV);

// Customer management
router.get('/customers', customerAdminController.getAllCustomers);
router.get('/customers/stats', customerAdminController.getCustomerStats);
router.post('/customers', customerAdminController.createCustomer);
router.get('/customers/:customerId', customerAdminController.getCustomerDetails);
router.put('/customers/:customerId', customerAdminController.updateCustomer);
router.post('/customers/:customerId/reset-password', customerAdminController.resetCustomerPassword);
router.get('/customers/:customerId/orders', customerAdminController.getCustomerOrderHistory);
router.delete('/customers/:customerId', customerAdminController.deleteCustomer);

module.exports = router;
