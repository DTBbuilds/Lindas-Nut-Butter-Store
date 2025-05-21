const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Route to send shipping address email to customer
router.post('/send-shipping-address', emailController.sendShippingAddressEmail);

module.exports = router;
