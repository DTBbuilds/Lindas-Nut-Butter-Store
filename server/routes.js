const express = require('express');
const router = express.Router();
const orderController = require('./controllers/orderController');
const mpesaController = require('./controllers/mpesaController');

// Order Routes
router.post('/orders', orderController.createOrder);
router.get('/orders/:id', orderController.getOrderById);
router.get('/admin/orders', orderController.getAllOrders);
router.patch('/orders/:id/status', orderController.updateOrderStatus);
router.get('/admin/transactions', orderController.getAllTransactions);
router.get('/admin/transactions/export', orderController.exportTransactionsCSV);

// M-Pesa Routes
router.get('/mpesa/test', mpesaController.testConnection); // Test endpoint for API connection
router.post('/mpesa/stkpush', mpesaController.initiateSTKPush);
router.post('/mpesa/validation', mpesaController.validation);
router.post('/mpesa/confirmation', mpesaController.confirmation);
router.post('/mpesa/callback', mpesaController.stkPushCallback);
router.post('/mpesa/query', mpesaController.queryTransactionStatus);
router.post('/mpesa/refund', mpesaController.processRefund);

module.exports = router;
