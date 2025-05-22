const axios = require('axios');
const { Transaction, Order } = require('../models');
const config = require('../config');
const mpesaClient = require('../utils/darajaApi');
const { 
  getOAuthToken, 
  generateStkPushPassword, 
  formatPhoneNumber, 
  simulateStkCallback 
} = require('../utils/mpesaHelpers');
const { logMpesaTransaction, logMpesaError } = require('../utils/mpesaLogger');
const emailService = require('../utils/emailService');
const socketService = require('../utils/socketService');

// Get M-Pesa configuration from config file
const MPESA_BASE_URL = config.mpesa.baseUrl;
const PAYBILL_NUMBER = config.mpesa.paybillNumber;
const TILL_NUMBER = config.mpesa.tillNumber;
const ACCOUNT_NUMBER = config.mpesa.accountNumber;
const CALLBACK_URL = config.mpesa.callbackUrl;

// Add test endpoint for checking API connectivity
exports.testConnection = async (req, res) => {
  try {
    // Try to get an OAuth token as a connectivity test
    const token = await getOAuthToken();
    
    return res.status(200).json({
      success: true,
      message: 'Connection to Safaricom Daraja API successful',
      environment: process.env.NODE_ENV || 'development',
      baseUrl: MPESA_BASE_URL,
      callbackUrl: CALLBACK_URL,
      tokenReceived: !!token
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to Safaricom Daraja API',
      error: error.response?.data || error.message
    });
  }
};

// Initiate STK Push
exports.initiateSTKPush = async (req, res) => {
  try {
    console.log('Received payment request:', req.body);
    const { phoneNumber, amount, orderId, paymentType = 'paybill' } = req.body;
    
    // Validate inputs
    if (!phoneNumber || !amount || !orderId) {
      console.log('Missing required parameters:', { phoneNumber, amount, orderId });
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number, amount, and order ID are required' 
      });
    }
    
    // Validate payment type
    if (paymentType !== 'paybill' && paymentType !== 'till') {
      return res.status(400).json({
        success: false,
        message: 'Payment type must be either "paybill" or "till"'
      });
    }

    logMpesaTransaction('STK Push Request', { phoneNumber, amount, orderId });
    console.log(`Initiating STK Push for ${phoneNumber} for amount ${amount}`);
    
    // Use the new Daraja API client for better handling
    // Always use the latest callback URL from config (which may have been updated by ngrok)
    const callbackUrl = config.mpesa.callbackUrl;
    console.log(`Using callback URL: ${callbackUrl}`);
    
    console.log('Making STK push request with params:', {
      phoneNumber,
      amount,
      orderId,
      callbackUrl,
      paymentType
    });
    
    const response = await mpesaClient.initiateSTK(
      phoneNumber,
      amount,
      orderId,
      `Payment for Order #${orderId} at Linda's Nut Butter Store`,
      callbackUrl,
      paymentType
    );
    
    console.log('STK Push response:', response);
    logMpesaTransaction('STK Push Response', response);
    
    // Save transaction request to database
    // Handle the phone number formatting separately to avoid exceptions in the Transaction.create
    let formattedPhone;
    try {
      formattedPhone = mpesaClient.formatPhoneNumber(phoneNumber);
    } catch (error) {
      console.error('Error formatting phone number for transaction record:', error);
      formattedPhone = phoneNumber; // Fallback to original phone number if formatting fails
    }
    
    const transaction = await Transaction.create({
      orderId,
      phoneNumber: formattedPhone,
      amount,
      requestId: response.CheckoutRequestID,
      merchantRequestId: response.MerchantRequestID,
      status: 'PENDING',
      type: 'STK_PUSH',
      timestamp: new Date()
    });
    
    // Broadcast transaction creation to connected admin clients
    socketService.emitTransactionCreated(transaction);
    
    // For testing purposes only - simulate a callback after 5 seconds
    // This is only for sandbox testing when callbacks can't reach our local environment
    // Note: We're reusing the already declared formattedPhone variable from above
    if (process.env.NODE_ENV !== 'production' && formattedPhone === config.test.phoneNumbers.success) {
      setTimeout(async () => {
        try {
          console.log('Simulating successful STK Push callback for testing');
          const callbackData = simulateStkCallback(
            response.CheckoutRequestID,
            response.MerchantRequestID,
            0 // Success code
          );
          
          // Call our own callback endpoint directly
          await this.stkPushCallback({
            body: callbackData,
            // Mock response object
            status: (code) => ({
              json: (data) => console.log('Simulated callback response:', data)
            })
          });
          
          console.log('Simulated callback processed');
        } catch (error) {
          console.error('Error with simulated callback:', error);
          logMpesaError('Simulated Callback', error);
        }
      }, 5000);
    }
    
    return res.status(200).json({
      success: true,
      message: 'STK push sent successfully',
      data: response,
      testMode: process.env.NODE_ENV !== 'production',
      simulatedCallback: process.env.NODE_ENV !== 'production' && formattedPhone === config.test.phoneNumbers.success
    });
  } catch (error) {
    console.error('Error initiating STK push:', error.message);
    console.error('Error details:', error);
    
    // Enhanced error logging
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    // Check if the error is from the Safaricom API
    if (error.responseData) {
      console.error('Safaricom API error:', error.responseData);
      
      // Provide specific feedback based on error codes
      if (error.responseData.errorCode === '400.002.02') {
        if (error.responseData.errorMessage.includes('Invalid CallBackURL')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid callback URL. Please ensure ngrok is running and callbacks are configured properly.',
            error: error.responseData,
            code: 'INVALID_CALLBACK_URL'
          });
        } else if (error.responseData.errorMessage.includes('Invalid Timestamp')) {
          return res.status(400).json({
            success: false,
            message: 'Invalid timestamp format in request.',
            error: error.responseData,
            code: 'INVALID_TIMESTAMP'
          });
        }
      } else if (error.responseData.errorCode === '401.002.01') {
        return res.status(401).json({
          success: false,
          message: 'Authentication with Safaricom API failed. Check your API credentials.',
          error: error.responseData,
          code: 'AUTH_FAILED'
        });
      }
      
      // For other Safaricom API errors
      return res.status(400).json({
        success: false,
        message: `Safaricom API error: ${error.responseData.errorMessage || 'Unknown error'}`,
        error: error.responseData,
        code: 'SAFARICOM_API_ERROR'
      });
    }
    
    // For other errors
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment: ' + error.message,
      error: error.response?.data || error.message
    });
  }
};

// Validation URL for C2B
exports.validation = (req, res) => {
  console.log('Validation request received:', req.body);
  
  // Check if account number is valid
  if (req.body.BillRefNumber === ACCOUNT_NUMBER) {
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Validation successful'
    });
  } else {
    return res.status(200).json({
      ResultCode: 1,
      ResultDesc: 'Invalid account number'
    });
  }
};

// Confirmation URL for C2B
exports.confirmation = async (req, res) => {
  try {
    console.log('Confirmation request received:', req.body);
    const {
      TransID,
      TransAmount,
      BillRefNumber,
      MSISDN,
      TransactionType,
      TransTime
    } = req.body;
    
    // Find order by BillRefNumber
    const order = await Order.findOne({ referenceNumber: BillRefNumber });
    
    if (!order) {
      console.error(`Order with reference ${BillRefNumber} not found`);
      // Still acknowledge Safaricom to prevent retries
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Confirmation received'
      });
    }
    
    // Update order status
    order.paymentStatus = 'PAID';
    order.transactionId = TransID;
    order.paymentDate = new Date();
    await order.save();
    
    // Create transaction record
    await Transaction.create({
      orderId: order._id,
      transactionId: TransID,
      phoneNumber: MSISDN,
      amount: TransAmount,
      type: TransactionType,
      status: 'COMPLETED',
      timestamp: new Date(TransTime)
    });
    
    // Process order (update inventory, etc.)
    await processOrder(order._id);
    
    // Send confirmation to customer
    await sendPaymentConfirmation(order);
    
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Confirmation received successfully'
    });
  } catch (error) {
    console.error('Error processing confirmation:', error);
    // Still acknowledge Safaricom to prevent retries
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Confirmation received'
    });
  }
};

// STK Push Callback
exports.stkPushCallback = async (req, res) => {
  try {
    console.log('STK Callback received:', req.body);
    const { Body } = req.body;
    
    // Safaricom sometimes sends differently structured responses
    const stkCallback = Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
    
    // Find the transaction
    const transaction = await Transaction.findOne({ 
      requestId: CheckoutRequestID,
      merchantRequestId: MerchantRequestID 
    });
    
    if (!transaction) {
      console.error(`Transaction with request ID ${CheckoutRequestID} not found`);
      return res.status(200).json({ success: true });
    }
    
    // Update transaction status
    transaction.status = ResultCode === 0 ? 'COMPLETED' : 'FAILED';
    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;
    
    if (ResultCode === 0 && stkCallback.CallbackMetadata) {
      // Extract transaction details
      const callbackItems = stkCallback.CallbackMetadata.Item;
      const mpesaTransactionId = callbackItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const amount = callbackItems.find(item => item.Name === 'Amount')?.Value;
      const transactionDate = callbackItems.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackItems.find(item => item.Name === 'PhoneNumber')?.Value;
      
      transaction.transactionId = mpesaTransactionId;
      transaction.confirmedAmount = amount;
      transaction.transactionDate = transactionDate;
      transaction.confirmedPhoneNumber = phoneNumber;
      
      // Update order status
      const order = await Order.findById(transaction.orderId);
      if (order) {
        order.paymentStatus = 'PAID';
        order.transactionId = mpesaTransactionId;
        order.paymentDate = new Date();
        await order.save();
        
        // Process order
        await processOrder(order._id);
        
        // Send confirmation to customer
        await sendPaymentConfirmation(order);
        
        // Broadcast completed transaction to admin dashboard (with order details)
        socketService.emitTransactionCompleted(transaction, order);
      } else {
        // Broadcast successful transaction even without order
        socketService.emitTransactionUpdated(transaction);
      }
    } else {
      // Transaction failed
      socketService.emitTransactionFailed(transaction);
    }
    
    await transaction.save();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing STK callback:', error);
    return res.status(200).json({ success: true });
  }
};

// Query transaction status
exports.queryTransactionStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    
    // Get transaction from database first
    const transaction = await Transaction.findOne({ requestId: checkoutRequestId });
    
    // For testing purposes, we'll simulate different responses based on phone number
    if (process.env.NODE_ENV !== 'production' && transaction) {
      const phoneNumber = transaction.phoneNumber;
      
      // Create a test response
      let simulatedResponse = {
        success: true,
        testMode: true,
        transactionStatus: transaction.status
      };
      
      if (phoneNumber === config.test.phoneNumbers.success) {
        // Simulate successful transaction
        simulatedResponse.data = {
          ResponseCode: '0',
          ResponseDescription: 'The service request is processed successfully.',
          MerchantRequestID: transaction.merchantRequestId,
          CheckoutRequestID: transaction.requestId,
          ResultCode: '0',
          ResultDesc: 'The service request is processed successfully.'
        };
        
        // Update transaction status if it's still pending
        if (transaction.status === 'PENDING') {
          transaction.status = 'COMPLETED';
          transaction.resultCode = '0';
          transaction.resultDesc = 'The service request is processed successfully.';
          await transaction.save();
          
          // Also update the order
          const order = await Order.findById(transaction.orderId);
          if (order) {
            order.paymentStatus = 'PAID';
            order.transactionId = 'SIM_' + Math.random().toString(36).substring(2, 10).toUpperCase();
            order.paymentDate = new Date();
            await order.save();
            
            // Send payment confirmation email if in production or explicitly enabled
            if (process.env.NODE_ENV === 'production' || process.env.SEND_EMAILS === 'true') {
              try {
                await emailService.sendPaymentConfirmation(order, transaction);
              } catch (emailError) {
                console.error('Failed to send payment confirmation email:', emailError);
              }
            }
          }
        }
        
        console.log(`Payment completed: KES ${amount} from ${phoneNumber}`);
      } else { 
        // All other test phone numbers show different error statuses
        let resultCode = '1';
        let resultDesc = 'Failed for testing purposes';
        
        if (phoneNumber === config.test.phoneNumbers.insufficient) {
          resultCode = '1032';
          resultDesc = 'Request cancelled by user';
        } else if (phoneNumber === config.test.phoneNumbers.timeout) {
          resultCode = '1037';
          resultDesc = 'DS timeout';
        } else if (phoneNumber === config.test.phoneNumbers.reject) {
          resultCode = '1';
          resultDesc = 'The balance is insufficient for the transaction';
        }
        
        simulatedResponse.data = {
          ResponseCode: '0',
          ResponseDescription: 'Service request successful',
          MerchantRequestID: transaction.merchantRequestId,
          CheckoutRequestID: transaction.requestId,
          ResultCode: resultCode,
          ResultDesc: resultDesc
        };
        
        // Update transaction status
        if (transaction.status === 'PENDING') {
          transaction.status = 'FAILED';
          transaction.resultCode = resultCode;
          transaction.resultDesc = resultDesc;
          await transaction.save();
        }
      }
      
      return res.status(200).json(simulatedResponse);
    }
    
    // Real implementation for production
    // Get OAuth token
    const token = await getOAuthToken();
    
    // Generate password and timestamp
    const { password, timestamp } = generateStkPushPassword();
    
    // Query request
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: PAYBILL_NUMBER,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error querying transaction:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to query transaction',
      error: error.response?.data || error.message
    });
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  try {
    const { transactionId, amount, remarks } = req.body;
    
    // Get OAuth token
    const token = await getOAuthToken();
    
    // Find the original transaction
    const transaction = await Transaction.findOne({ transactionId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Original transaction not found'
      });
    }
    
    // Initiate reversal
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/reversal/v1/request`,
      {
        Initiator: config.mpesa.initiatorName,
        SecurityCredential: config.mpesa.securityCredential,
        CommandID: 'TransactionReversal',
        TransactionID: transactionId,
        Amount: amount,
        ReceiverParty: PAYBILL_NUMBER,
        RecieverIdentifierType: '11', // Organization identifier type for Paybill
        ResultURL: `${config.server.baseUrl}/api/mpesa/reversal-result`,
        QueueTimeOutURL: `${config.server.baseUrl}/api/mpesa/reversal-timeout`,
        Remarks: remarks || 'Refund for cancelled order',
        Occasion: ''
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Create refund transaction record
    await Transaction.create({
      relatedTransactionId: transactionId,
      orderId: transaction.orderId,
      amount,
      status: 'PENDING',
      type: 'REFUND',
      remarks,
      timestamp: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: response.data
    });
  } catch (error) {
    console.error('Error processing refund:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.response?.data || error.message
    });
  }
};

// Helper function to process order after payment
const processOrder = async (orderId) => {
  try {
    // Get order details
    const order = await Order.findById(orderId).populate('items.product');
    
    // Update order status
    order.status = 'PROCESSING';
    await order.save();
    
    console.log(`Order ${orderId} processed successfully`);
    return true;
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    return false;
  }
};

// Helper function to send payment confirmation for production use
const sendPaymentConfirmation = async (order, transaction) => {
  try {
    if (!order) {
      console.error('Cannot send payment confirmation: Missing order details');
      return false;
    }
    
    // Send email confirmation using email service
    if (order.customer && order.customer.email) {
      try {
        await emailService.sendPaymentConfirmation(order, transaction);
        console.log(`Email payment confirmation sent for order ${order._id}`);
      } catch (emailError) {
        console.error(`Error sending email confirmation for order ${order._id}:`, emailError);
      }
    }
    
    // If SMS notifications are configured, send SMS
    if (order.customer && order.customer.phoneNumber && process.env.SMS_ENABLED === 'true') {
      console.log(`SMS confirmation would be sent to ${order.customer.phoneNumber}`);
      // SMS implementation would go here
    }
    
    return true;
  } catch (error) {
    console.error(`Error sending payment confirmation for order ${order._id}:`, error);
    return false;
  }
};
