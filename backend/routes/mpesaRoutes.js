const express = require('express');
const router = express.Router();
const mpesaController = require('../../server/controllers/mpesaController'); // Adjusted path
const { authMiddleware } = require('../../server/authMiddleware'); // Import auth middleware

// Middleware for authentication/authorization can be added here if needed for specific routes
// For example: const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Initiate STK Push (Protected)
router.post('/stk-push', authMiddleware, mpesaController.initiateSTKPush);

// Check Transaction Status
router.get('/transaction-status/:checkoutRequestID', mpesaController.checkTransactionStatus);

// M-Pesa STK Push Callback URL (from Safaricom)
router.post('/stk-callback', mpesaController.stkPushCallback);

// M-Pesa C2B Validation URL (from Safaricom)
router.post('/c2b/validation', mpesaController.validation);

// M-Pesa C2B Confirmation URL (from Safaricom)
router.post('/c2b/confirmation', mpesaController.confirmation);

// --- Transaction Reversal Callbacks (from Safaricom) ---
// These endpoints need to be implemented in mpesaController if you expect data back from reversals
router.post('/reversals/result', (req, res) => {
  console.log('M-Pesa Reversal Result Callback Received:');
  console.log(JSON.stringify(req.body, null, 2));
  // TODO: Implement logic in mpesaController to handle this callback
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

router.post('/reversals/timeout', (req, res) => {
  console.log('M-Pesa Reversal Timeout Callback Received:');
  console.log(JSON.stringify(req.body, null, 2));
  // TODO: Implement logic in mpesaController to handle this callback
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// --- Application-Initiated Actions ---

// Process a refund (application initiates this, calls M-Pesa Reversal API via mpesaClient)
router.post('/refunds', mpesaController.processRefund);

// Test M-Pesa API Connection (gets an access token)
router.get('/test-connection', mpesaController.testConnection);

// New cancellation route for M-Pesa payment
router.post('/cancel-payment', mpesaController.cancelPayment);

// Retry a failed payment (Protected)
router.post('/retry-payment', authMiddleware, mpesaController.retryPayment);

module.exports = router;
