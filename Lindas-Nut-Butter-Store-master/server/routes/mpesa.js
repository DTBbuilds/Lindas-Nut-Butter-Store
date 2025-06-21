const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');
const { paymentValidation } = require('../middleware/validators');

// Route to initiate STK Push
router.post('/stk-push', paymentValidation.initiatePayment, mpesaController.initiateSTKPush);

// Callback URL for Safaricom to send payment status
router.post('/callback/:secretKey', mpesaController.stkPushCallback);

// [DEPRECATED] Optional legacy callback URL
router.post('/callback/:orderId', mpesaController.mpesaCallback);

// Route for the client to poll for transaction status
router.get('/status/:checkoutRequestId', mpesaController.queryTransactionStatus);

// Route to handle payment cancellation by the user
router.post('/cancel', mpesaController.cancelPayment);

// Route to retry a failed payment
router.post('/retry', mpesaController.retryPayment);

// Route to process refunds (placeholder)
router.post('/refund', mpesaController.processRefund);

// The C2B validation and confirmation routes are removed as they are not implemented.

module.exports = router;
