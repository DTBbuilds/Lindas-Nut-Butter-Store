/**
 * Admin Routes
 * 
 * Centralized API endpoints for admin dashboard functionality
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');

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
router.get('/transactions', orderController.getAllTransactions);
router.get('/transactions/export', orderController.exportTransactionsCSV);

module.exports = router;
