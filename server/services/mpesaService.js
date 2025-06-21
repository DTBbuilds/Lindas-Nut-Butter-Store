// server/services/mpesaService.js

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const config = require('../config');
const mpesaClient = require('../utils/darajaApi');
const { logMpesaTransaction, logMpesaError } = require('../utils/mpesaLogger');
const { formatPhoneNumber } = require('../utils/phoneNumber');
const socketService = require('../services/socketService');

/**
 * @description Initiates an M-Pesa STK push request.
 * @param {object} params - The parameters for the STK push.
 * @param {number} params.amount - The amount to be paid.
 * @param {string} params.phoneNumber - The user's phone number.
 * @param {string} params.orderId - The ID of the order being paid for.
 * @returns {Promise<object>} The response from the M-Pesa API.
 */
const initiateStkPush = async ({ amount, phoneNumber, orderId, callbackUrl }) => {
  try {
    // 1. Validate inputs
    if (!phoneNumber || !amount || !orderId) {
      throw new Error('Phone number, amount, and order ID are required.');
    }

    logMpesaTransaction('STK Push Request', { phoneNumber, amount, orderId });

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new Error('Invalid phone number format.');
    }

    // 2. Call M-Pesa API
    const response = await mpesaClient.initiateSTK(
      formattedPhone,
      amount,
      `ORDER-${orderId}`,
      `Payment for Linda's Nut Butter Order #${orderId}`,
      callbackUrl || config.mpesa.callbackUrl,
    );

    // 3. Validate M-Pesa API Response
    if (!response || !response.CheckoutRequestID) {
      logMpesaError('STK Push Failure: Invalid response from Daraja', { response });
      throw new Error('M-Pesa API failed to provide a CheckoutRequestID.');
    }

    logMpesaTransaction('STK Push Response', response);
    console.log(`STK Push initiated successfully. CheckoutRequestID: ${response.CheckoutRequestID}`);

    // 4. Create pending transaction record before returning
    const transaction = new Transaction({
      checkoutRequestId: response.CheckoutRequestID,
      orderId: new mongoose.Types.ObjectId(orderId),
      amount,
      phoneNumber: formattedPhone,
      status: 'PENDING',
      paymentMethod: 'MPESA',
      provider: 'mpesa',
      providerMetadata: { ...response },
    });
    await transaction.save();
    await Order.findByIdAndUpdate(orderId, { status: 'pending-payment' });
    socketService.emitPaymentInitiated(response.CheckoutRequestID, { message: 'STK push sent. Please enter your PIN.' });

    // 5. Return the crucial M-Pesa response.
    return response;
  } catch (error) {
    console.error(`[MpesaService] Error in initiateStkPush for order ${orderId}:`, error);
    logMpesaError('Initiate STK Push Main Error', { error: error.message, orderId });
    // Re-throw the error with context to be caught by the controller
    error.orderId = orderId; // Attach orderId for context in the controller's catch block
    throw error;
  }
};

/**
 * @description Queries the status of an M-Pesa STK push transaction.
 * @param {string} checkoutRequestId - The CheckoutRequestID of the transaction to query.
 * @returns {Promise<object>} The response from the M-Pesa API.
 */
const PENDING_ERROR_CODE = '500.001.1001';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const _queryWithRetry = async (checkoutRequestId, retries = 0) => {
  logMpesaTransaction('STK Status Query', { checkoutRequestId, attempt: retries + 1 });
  const response = await mpesaClient.querySTKStatus(checkoutRequestId);

  // Check for the specific pending error code from Daraja API
  if (response?.errorCode === PENDING_ERROR_CODE && retries < MAX_RETRIES) {
    console.log(`[Retry] Transaction ${checkoutRequestId} is still processing. Retrying in ${RETRY_DELAY_MS / 1000}s... (Attempt ${retries + 1})`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    return _queryWithRetry(checkoutRequestId, retries + 1);
  }

  // If all retries are exhausted and it's still pending, treat as a timeout
  if (response?.errorCode === PENDING_ERROR_CODE && retries >= MAX_RETRIES) {
    console.error(`[Timeout] Maximum retries reached for ${checkoutRequestId}. Transaction timed out.`);
    // Return a standard M-Pesa timeout response structure
    return { ResultCode: '1037', ResultDesc: 'Transaction timed out after maximum retries.' };
  }

  return response;
};

const queryStkStatus = async (checkoutRequestId) => {
  if (!checkoutRequestId) {
    const err = new Error('CheckoutRequestID is required for status query.');
    logMpesaError('Query STK Status Validation Error', { error: err.message });
    throw err;
  }

  try {
    const response = await _queryWithRetry(checkoutRequestId);
    logMpesaTransaction('STK Status Query Final Response', { checkoutRequestId, response });

    const transaction = await Transaction.findOne({ checkoutRequestId: checkoutRequestId });
    if (!transaction) {
      console.warn(`[Query Status] Transaction not found for CheckoutRequestID: ${checkoutRequestId}. Cannot sync status.`);
      return response; // Return the response but cannot update DB
    }

    // Only update if the transaction is still pending to avoid race conditions with the main callback
    if (transaction.status !== 'PENDING') {
      console.log(`[Query Status] Transaction ${transaction._id} is no longer PENDING. Current status: ${transaction.status}. No action taken.`);
      return response;
    }

    const { ResultCode, ResultDesc } = response;

    if (ResultCode === '0') {
      // Payment was successful
      transaction.status = 'COMPLETED';
      transaction.providerMetadata = { ...transaction.providerMetadata, queryResponse: response };
      await transaction.save();

      const order = await Order.findByIdAndUpdate(transaction.orderId, { status: 'processing', paymentStatus: 'COMPLETED' }, { new: true });
      socketService.emitPaymentSuccess(transaction.orderId, { orderId: transaction.orderId, status: 'success', message: 'Payment confirmed via status query.' });
      console.log(`[Query Status] Synced transaction ${transaction._id} for order ${order._id} to COMPLETED.`);
    } else {
      // Any non-zero ResultCode indicates a failure (e.g., timeout, cancellation, insufficient funds).
      transaction.status = 'FAILED';
      transaction.resultDescription = ResultDesc;
      transaction.providerMetadata = { ...transaction.providerMetadata, queryResponse: response };
      await transaction.save();

      const order = await Order.findByIdAndUpdate(transaction.orderId, { status: 'payment-failed', paymentStatus: 'FAILED' }, { new: true });
      socketService.emitPaymentFailed(transaction.orderId, { orderId: transaction.orderId, status: 'failed', message: ResultDesc });
      console.log(`[Query Status] Synced transaction ${transaction._id} for order ${order._id} to FAILED. Reason: ${ResultDesc}`);
    }

    return response;
  } catch (error) {
    console.error(`[Query Status] CRITICAL ERROR during queryStkStatus for ${checkoutRequestId}:`, error);
    logMpesaError('Query STK Status Main Error', { error: error.message, checkoutRequestId });
    // Do not re-throw, as this might be called from a background job.
    // The error is logged, which is sufficient.
    return { error: true, message: error.message };
  }
};

module.exports = {
  initiateStkPush,
  queryStkStatus,
};
