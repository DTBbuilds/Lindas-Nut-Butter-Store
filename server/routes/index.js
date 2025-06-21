const express = require('express');
const router = express.Router();

// Import individual route modules
const adminAuthRoutes = require('./adminAuthRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const customerBatchRoutes = require('./customerBatchRoutes');
const customerRoutes = require('./customerRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const directAdminRoutes = require('./directAdminRoutes');
const emailRoutes = require('./emailRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const mpesaRoutes = require('./mpesa');
const orderRoutes = require('./orderRoutes');
const productRoutes = require('./productRoutes');

// Mount the individual routes on the main router
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/customers/batch', customerBatchRoutes);
router.use('/customers', customerRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/direct-admin', directAdminRoutes);
router.use('/email', emailRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/mpesa', mpesaRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);

module.exports = router;
