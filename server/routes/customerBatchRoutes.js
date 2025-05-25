/**
 * Customer Batch Operation Routes
 * 
 * API endpoints for batch operations on customers:
 * - Tagging multiple customers
 * - Sending emails to multiple customers
 * - Customer segmentation
 */

const express = require('express');
const router = express.Router();
const customerBatchController = require('../controllers/customerBatchController');

// Note: Admin authentication is handled at the server level
// when these routes are mounted under /api/admin

// Apply tags to multiple customers
router.post('/customers/tag', customerBatchController.tagCustomers);

// Send email to multiple customers
router.post('/email/batch', customerBatchController.sendBatchEmail);

// Get customer segments (for filtering)
router.get('/customers/segments', customerBatchController.getCustomerSegments);

// Get customers by segment
router.get('/customers/segments/:segment', customerBatchController.getCustomersBySegment);

module.exports = router;
