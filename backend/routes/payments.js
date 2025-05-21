const express = require('express');
const router = express.Router();

/**
 * Initiate M-PESA STK Push
 * 
 * This is a simulation for development purposes only
 * In production, you would integrate with the real M-PESA API
 */
router.post('/mpesa/stkpush', async (req, res) => {
  try {
    const { phoneNumber, amount, reference, description } = req.body;
    
    // Validate required fields
    if (!phoneNumber || !amount || !reference) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, amount, and reference are required'
      });
    }
    
    // Format validation for phone number (should be 254XXXXXXXXX)
    if (!phoneNumber.match(/^254[17]\d{8}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use format: 254XXXXXXXXX'
      });
    }
    
    // Amount validation
    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount. Minimum amount is 1 KES.'
      });
    }
    
    console.log('Processing M-PESA STK push request:', {
      phoneNumber,
      amount,
      reference,
      description
    });
    
    // Generate a random checkout request ID (for simulation)
    const checkoutRequestID = `ws_CO_${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    // Simulate a successful STK push response
    // In production, this would come from the actual M-PESA API
    res.status(200).json({
      success: true,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: 'Success. Request accepted for processing',
      CheckoutRequestID: checkoutRequestID,
      MerchantRequestID: `ws_MR_${Date.now()}`,
      TransactionDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('M-PESA STK push error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process M-PESA payment request'
    });
  }
});

/**
 * Check M-PESA payment status
 * 
 * This is a simulation for development purposes only
 */
router.get('/mpesa/status/:checkoutRequestID', async (req, res) => {
  try {
    const { checkoutRequestID } = req.params;
    
    // Validate checkout request ID
    if (!checkoutRequestID) {
      return res.status(400).json({
        success: false,
        message: 'Missing checkout request ID'
      });
    }
    
    console.log('Checking M-PESA payment status for:', checkoutRequestID);
    
    // Simulate a successful payment (for development)
    // In production, this would make a real API call to M-PESA
    res.status(200).json({
      success: true,
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully.',
      MpesaReceiptNumber: `LNP${Math.floor(Math.random() * 1000000000)}`,
      Amount: req.query.amount || '100',
      TransactionDate: new Date().toISOString(),
      PhoneNumber: req.query.phoneNumber || '254712345678'
    });
    
  } catch (error) {
    console.error('Error checking M-PESA payment status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check M-PESA payment status'
    });
  }
});

module.exports = router;
