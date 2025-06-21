// server/controllers/mpesaController.js

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { logMpesaTransaction, logMpesaError } = require('../utils/mpesaLogger');
const { formatPhoneNumber } = require('../utils/phoneNumber');
const socketService = require('../services/socketService');
const mpesaService = require('../services/mpesaService');
const { getUserFriendlyMessage } = require('../utils/mpesaErrorHandler');
const { getAuthToken } = require('../utils/darajaApi');
const config = require('../config');

/**
 * Retries a failed M-Pesa payment by initiating a new STK push.
 */
exports.retryPayment = async (req, res) => {
  const { orderId, amount, phoneNumber } = req.body;

  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format. Please use 2547XXXXXXXX or 07XXXXXXXX.' });
  }


  if (!orderId || !amount || !phoneNumber) {
    return res.status(400).json({ success: false, message: 'Missing required fields: orderId, amount, or phoneNumber.' });
  }

  console.log(`[retryPayment] Attempting to retry payment for Order ID: ${orderId}`);

  try {
    // Find the original order to ensure it exists and is in a retryable state
    const order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security Check: Ensure the authenticated user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      logMpesaError('Authorization Error on Retry', { orderId, userId: req.user._id });
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action.' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'This order has already been paid for.' });
    }

    const callbackUrl = `${process.env.PUBLIC_URL}/api/mpesa/callback/${process.env.MPESA_CALLBACK_SECRET}`;
    console.log(`[STK_PUSH] Initiating payment for Order #${order.orderNumber}. Callback URL: ${callbackUrl}`);

    const result = await mpesaService.initiateStkPush({ amount, phoneNumber, orderId: order.orderNumber, callbackUrl });

    console.log(`[STK_PUSH] New STK push initiated for Order ID: ${orderId}. New CheckoutRequestID: ${result.checkoutRequestId}`);

    // Notify the frontend that the STK push has been sent
    socketService.emitPaymentInitiated(result.checkoutRequestId, {
      message: 'Payment initiated. Please check your phone to enter your M-Pesa PIN.',
      orderId: order.orderNumber,
    });

    // The frontend will receive this and start listening for socket events
    res.status(200).json({
      success: true,
      message: 'New payment request initiated successfully.',
      checkoutRequestId: result.checkoutRequestId,
    });

  } catch (error) {
    console.error(`[retryPayment] Error retrying payment for Order ID: ${orderId}`, error);
    logMpesaError('Retry Payment Error', { orderId, error: error.message });
    const clientMessage = getUserFriendlyMessage(error);
    const statusCode = error.isMpesaError ? (error.originalError?.response?.status || 500) : 500;
    return res.status(statusCode).json({ success: false, message: clientMessage });
  }
};

/**
 * Tests the connection to the M-Pesa API by fetching an auth token.
 */
exports.testConnection = async (req, res) => {
  console.log('[testConnection] Testing M-Pesa API connection...');
  try {
    const token = await getAuthToken();
    console.log('[testConnection] Successfully fetched M-Pesa auth token.');
    res.status(200).json({ 
      success: true, 
      message: 'M-Pesa API connection successful.'
    });
  } catch (error) {
    console.error('[testConnection] M-Pesa API connection test failed:', error);
    const clientMessage = getUserFriendlyMessage(error);
    res.status(500).json({ 
      success: false, 
      message: clientMessage,
      error: error.message 
    });
  }
};

/**
 * Initiates an M-Pesa STK Push request.
 */
exports.initiateSTKPush = async (req, res) => {
  const { amount, phoneNumber, orderId } = req.body;

  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format. Please use 2547XXXXXXXX or 07XXXXXXXX.' });
  }

  if (!amount || !phoneNumber || !orderId) {
    return res.status(400).json({ success: false, message: 'Amount, phone number, and orderId are required.' });
  }

  // Perform critical, fast checks first
  try {
    const order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      logMpesaError('Authorization Error on STK Push', { orderId, userId: req.user._id });
      return res.status(403).json({ success: false, message: 'You are not authorized to pay for this order.' });
    }

    // If checks pass, acknowledge the request immediately with a 202 Accepted status
    res.status(202).json({
      success: true,
      message: 'Payment initiation accepted. We will notify you once the M-Pesa prompt is sent to your phone.',
      orderId: orderId,
    });

    // --- Perform the slow operation in the background ---
    // This runs after the response has been sent, preventing frontend timeouts.
    (async () => {
      try {
        const callbackUrl = `${process.env.PUBLIC_URL}/api/mpesa/callback/${process.env.MPESA_CALLBACK_SECRET}`;
        console.log(`[STK_PUSH_ASYNC] Initiating payment for Order #${order.orderNumber}. Callback URL: ${callbackUrl}`);

        const result = await mpesaService.initiateStkPush({ amount, phoneNumber: formattedPhone, orderId, callbackUrl });

        console.log(`[STK_PUSH_ASYNC] STK push initiated for Order ID: ${orderId}. CheckoutRequestID: ${result.checkoutRequestId}`);

        // Notify the frontend via socket that the STK push has actually been sent
        socketService.emitPaymentInitiated(result.checkoutRequestId, {
          message: 'Action required: Please check your phone to enter your M-Pesa PIN.',
          orderId,
        });
      } catch (error) {
        console.error(`[STK_PUSH_ASYNC] Error for Order ID ${orderId}:`, error);
        logMpesaError('STK Push Initiation Error (Async)', { orderId, error: error.message });
        
        // Notify the frontend of the failure via socket
        socketService.emitPaymentError(orderId, {
          message: `Payment initiation failed: ${getUserFriendlyMessage(error)}`,
          orderId,
        });
      }
    })();

  } catch (error) {
    // This will catch errors from the initial fast checks (e.g., database connection issue)
    console.error('[initiateSTKPush] Pre-check error:', error);
    logMpesaError('STK Push Pre-check Error', { orderId, error: error.message });
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'An internal server error occurred before initiating payment.' });
    }
  }
};

exports.stkPushCallback = async (req, res) => {
  // --- IMPORTANT: Log the raw callback body immediately ---
  console.log('--- M-Pesa Callback Received ---');
  console.log(JSON.stringify(req.body, null, 2));

  const { secretKey } = req.params;
  if (secretKey !== process.env.MPESA_CALLBACK_SECRET) {
    logMpesaError('Invalid Callback Secret', { receivedKey: secretKey });
    return res.status(403).send('Forbidden');
  }

  // Acknowledge Safaricom Immediately
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  // Use a try-catch block to handle the entire async operation safely
  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      logMpesaError('Invalid STK Callback Structure', { body: req.body });
      return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
    const metadata = stkCallback.CallbackMetadata?.Item || [];
    console.log(`[Callback] Processing for CheckoutRequestID: ${CheckoutRequestID}`);

    const transaction = await Transaction.findOne({ checkoutRequestId: CheckoutRequestID });
    if (!transaction) {
      logMpesaError('TransactionNotFoundOnCallback', { CheckoutRequestID });
      return;
    }

    // Prevent Double Processing
    if (transaction.status !== 'PENDING') {
      console.log(`[Callback] Transaction ${transaction._id} already processed with status: ${transaction.status}. Ignoring callback.`);
      return;
    }

    const order = await Order.findById(transaction.orderId);
    if (!order) {
      logMpesaError('OrderNotFoundOnCallback', { orderId: transaction.orderId, CheckoutRequestID });
      return;
    }

    if (ResultCode === 0) {
      // --- PAYMENT SUCCESS ---
      const amountPaid = metadata.find(m => m.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(m => m.Name === 'MpesaReceiptNumber')?.Value;

      // Update Transaction
      transaction.status = 'COMPLETED';
      transaction.providerMetadata = { ...stkCallback };
      transaction.mpesaReceipt = mpesaReceiptNumber;
      await transaction.save();

      // Update Order
      order.paymentStatus = 'COMPLETED';
      order.status = 'processing';
      await order.save();

      console.log(`[Callback] SUCCESS: Order ${order.orderNumber} updated. M-Pesa Receipt: ${mpesaReceiptNumber}`);
      logMpesaTransaction('PaymentSuccess', { CheckoutRequestID, mpesaReceiptNumber, orderId: order.orderNumber });

      // Notify Frontend
      const orderRoom = order._id.toString();
      socketService.emitPaymentSuccess(orderRoom, {
        message: `Payment for order ${order.orderNumber} was successful.`,
        orderId: orderRoom,
        status: 'success',
      });

    } else {
      // --- PAYMENT FAILURE ---
      transaction.status = 'FAILED';
      transaction.providerMetadata = { ...stkCallback };
      await transaction.save();

      order.paymentStatus = 'FAILED';
      order.status = 'payment-failed';
      await order.save();

      console.log(`[Callback] FAILED: Order ${order.orderNumber} updated. Reason: ${ResultDesc}`);
      logMpesaError('PaymentFailureOnCallback', { CheckoutRequestID, ResultCode, ResultDesc, orderId: order.orderNumber });

      // Notify Frontend
      const orderRoom = order._id.toString();
      socketService.emitPaymentFailure(orderRoom, {
        message: `Payment failed: ${ResultDesc}`,
        orderId: orderRoom,
        status: 'failed',
        reason: ResultDesc,
      });
    }

  } catch (error) {
    logMpesaError('CallbackProcessingError', {
      error: error.message,
      stack: error.stack,
      callbackData: req.body,
    });
  }
};

/**
 * Allows the frontend to poll for the status of a transaction.
 */
exports.queryTransactionStatus = async (req, res) => {
    const { checkoutRequestId } = req.params;
    
    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, message: 'Checkout Request ID is required.' });
    }
    
    console.log(`[queryTransactionStatus] Querying status for: ${checkoutRequestId}`);

    try {
      const transaction = await Transaction.findOne({ checkoutRequestId: checkoutRequestId });
      if (transaction && (transaction.status === 'SUCCESS' || transaction.status === 'FAILED')) {
        return res.status(200).json({
          success: true,
          message: 'Status retrieved from local database.',
          status: transaction.status,
          data: transaction.providerMetadata
        });
      }

      const result = await mpesaService.queryStkStatus(checkoutRequestId);
      console.log('[mpesaController] M-Pesa query result:', JSON.stringify(result, null, 2));

      if (!result) {
        // If M-Pesa returns no result, assume it's still pending and let the frontend retry.
        return res.status(200).json({
          success: true,
          message: 'Transaction status is still pending. Please wait.',
          status: 'PENDING',
        });
      }

      // Map M-Pesa ResultCode to our internal status and create a user-friendly message.
      let internalStatus = 'PENDING';
      let userMessage = 'Your transaction is still being processed. Please wait.';

      switch (result.ResultCode) {
        case '0':
          internalStatus = 'SUCCESS';
          userMessage = 'Payment successful! Your order has been confirmed.';
          break;
        case '1':
          internalStatus = 'FAILED';
          userMessage = 'Payment failed due to insufficient funds.';
          break;
        case '1032':
          internalStatus = 'FAILED';
          userMessage = 'You cancelled the transaction. Please try again if this was a mistake.';
          break;
        case '1037':
          internalStatus = 'FAILED';
          userMessage = 'The transaction timed out. Please try again.';
          break;
        case '2001':
          internalStatus = 'FAILED';
          userMessage = 'Invalid M-Pesa PIN. Please try again with the correct PIN.';
          break;
        default:
          // For any other non-zero code, consider it a failure.
          if (result.ResultCode !== '0') {
            internalStatus = 'FAILED';
            userMessage = result.ResultDesc || 'An unexpected error occurred. Please try again.';
          }
          break;
      }

      // If the status is final, update our local transaction record
      if (internalStatus === 'SUCCESS' || internalStatus === 'FAILED') {
        await Transaction.findOneAndUpdate(
          { checkoutRequestId: checkoutRequestId },
          { 
            status: internalStatus,
            providerMetadata: result 
          },
          { new: true, upsert: false } // Don't create a new one if it doesn't exist
        );
      }
      
      return res.status(200).json({
        success: true,
        status: internalStatus,
        message: userMessage, // Send our curated message
        resultCode: result.ResultCode,
        resultDesc: result.ResultDesc, // Keep the original for logging/debugging
        mpesaReceiptNumber: result.MpesaReceiptNumber, // Ensure consistent naming
      });

    } catch (error) {
      console.error(`[queryTransactionStatus] Error querying status for ${checkoutRequestId}:`, error);
      logMpesaError('Transaction Status Query Error', { checkoutRequestId, error: error.message });
      
      const clientMessage = getUserFriendlyMessage(error);
      const statusCode = error.isMpesaError ? (error.originalError?.response?.status || 500) : 500;

      return res.status(statusCode).json({
        success: false,
        message: clientMessage,
        error: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
};

/**
 * [DEPRECATED] Handles legacy C2B callbacks.
 */
exports.mpesaCallback = (req, res) => {
  console.log('--- C2B Callback Hit ---');
  logMpesaTransaction('C2B Callback Received', req.body);
  console.warn('DEPRECATED: C2B callback URL was hit. Please use STK Push callback URL.');
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
};

/**
 * Handles payment cancellation requests (internal).
 */
exports.cancelPayment = async (req, res) => {
  const { checkoutRequestId } = req.body;
  if (!checkoutRequestId) {
    return res.status(400).json({ success: false, message: 'checkoutRequestId is required.' });
  }
  try {
    const transaction = await Transaction.findOne({ transactionId: checkoutRequestId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot cancel a transaction with status '${transaction.status}'.` });
    }

    transaction.status = 'CANCELLED';
    transaction.providerMetadata.cancellationReason = 'User requested cancellation.';
    await transaction.save();

    await Order.findByIdAndUpdate(transaction.orderId, { status: 'cancelled' });

    console.log(`[cancelPayment] Transaction ${transaction._id} cancelled by user.`);
    
    return res.status(200).json({ success: true, message: 'Transaction cancelled successfully.' });

  } catch (error) {
    console.error(`[cancelPayment] Error cancelling transaction for ${checkoutRequestId}:`, error);
    logMpesaError('Transaction Cancellation Error', { checkoutRequestId, error: error.message });
    return res.status(500).json({ success: false, message: 'An internal error occurred.' });
  }
};

/**
 * Handles refund processing requests (placeholder).
 */
exports.processRefund = async (req, res) => {
  console.log('--- Refund Request Received ---');
  logMpesaTransaction('Refund Request', req.body);
  res.status(501).json({ success: false, message: 'Refund functionality is not yet implemented.' });
};
