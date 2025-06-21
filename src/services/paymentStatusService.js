import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

/**
 * PaymentStatusService
 * 
 * A dedicated service for handling M-Pesa payment status tracking,
 * timeout management, and idempotency protection.
 */
class PaymentStatusService {
  constructor() {
    this.activePayments = new Map();
    this.statusCheckInterval = 5000; // 5 seconds between status checks
    this.maxStatusChecks = 12; // Maximum 1 minute of checking (12 * 5000ms)
    this.pendingTimeouts = new Map(); // Store timeout IDs for cleanup
    
    // Track idempotency keys to prevent duplicate processing
    this.processedTransactions = new Map();
    
    // Clear old transactions from memory every hour
    setInterval(() => this.cleanupOldTransactions(), 3600000);
  }
  
  /**
   * Start tracking a new payment request
   * @param {string} checkoutRequestID - M-Pesa checkout request ID
   * @param {string} orderId - Order ID associated with this payment
   * @param {function} statusCallback - Callback function to execute on status updates
   * @returns {string} idempotencyKey - Unique key for this payment attempt
   */
  trackPayment(checkoutRequestID, orderId, statusCallback) {
    // Generate a unique idempotency key for this payment attempt
    const idempotencyKey = uuidv4();
    
    // Store payment tracking info
    this.activePayments.set(checkoutRequestID, {
      orderId,
      idempotencyKey,
      startTime: Date.now(),
      statusCallback,
      checkCount: 0,
      status: 'initiated',
      lastChecked: null,
      transactionDetails: null
    });
    
    // Start the status checking process
    this.scheduleNextStatusCheck(checkoutRequestID);
    
    return idempotencyKey;
  }
  
  /**
   * Schedule the next status check for a payment
   * @param {string} checkoutRequestID - M-Pesa checkout request ID
   */
  scheduleNextStatusCheck(checkoutRequestID) {
    const payment = this.activePayments.get(checkoutRequestID);
    
    if (!payment) return;
    
    // Clear any existing timeout
    if (this.pendingTimeouts.has(checkoutRequestID)) {
      clearTimeout(this.pendingTimeouts.get(checkoutRequestID));
    }
    
    // Schedule next check
    const timeoutId = setTimeout(() => {
      this.checkPaymentStatus(checkoutRequestID);
    }, this.statusCheckInterval);
    
    this.pendingTimeouts.set(checkoutRequestID, timeoutId);
  }
  
  /**
   * Check the status of a payment with the backend
   * @param {string} checkoutRequestID - M-Pesa checkout request ID
   */
  async checkPaymentStatus(checkoutRequestID) {
    const payment = this.activePayments.get(checkoutRequestID);
    
    if (!payment) return;
    
    try {
      payment.checkCount++;
      payment.lastChecked = Date.now();
      
      // Update status to 'processing' if it's still 'initiated'
      if (payment.status === 'initiated') {
        payment.status = 'processing';
        payment.statusCallback(payment.status, null, this.getElapsedTime(payment));
      }
      
      // Call the backend API to check payment status
      const response = await fetch(`/api/mpesa/status/${checkoutRequestID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': payment.idempotencyKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error checking payment status: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process the status response
      if (data.success) {
        // Normalize the status to lowercase for consistent handling
        const normalizedStatus = data.status ? data.status.toLowerCase() : null;
        
        if (data.status === 'COMPLETED' || normalizedStatus === 'completed') {
          // Payment completed successfully
          payment.status = 'completed';
          payment.transactionDetails = {
            checkoutRequestId: data.checkoutRequestId,
            amount: data.amount,
            timestamp: data.timestamp
          };
          
          // Record this transaction as processed to prevent duplicates
          this.processedTransactions.set(payment.idempotencyKey, {
            orderId: payment.orderId,
            checkoutRequestId: data.checkoutRequestId,
            timestamp: Date.now()
          });
          
          // Notify the callback
          payment.statusCallback(payment.status, payment.transactionDetails, this.getElapsedTime(payment));
          
          // Clean up the payment tracking
          this.cleanupPaymentTracking(checkoutRequestID);
        } else if (data.status === 'FAILED' || normalizedStatus === 'failed') {
          // Payment failed
          payment.status = 'failed';
          payment.transactionDetails = {
            errorCode: data.resultCode,
            errorMessage: data.resultDesc || 'Payment was declined or failed'
          };
          
          // Notify the callback
          payment.statusCallback(payment.status, payment.transactionDetails, this.getElapsedTime(payment));
          
          // Clean up the payment tracking
          this.cleanupPaymentTracking(checkoutRequestID);
        } else if (payment.checkCount >= this.maxStatusChecks) {
          // Payment has timed out
          payment.status = 'timeout';
          payment.statusCallback(payment.status, null, this.getElapsedTime(payment));
          
          // Clean up the payment tracking
          this.cleanupPaymentTracking(checkoutRequestID);
        } else {
          // Payment is still pending, schedule next check
          payment.statusCallback(payment.status, null, this.getElapsedTime(payment));
          this.scheduleNextStatusCheck(checkoutRequestID);
        }
      } else {
        // Error in API response
        if (payment.checkCount >= this.maxStatusChecks) {
          payment.status = 'timeout';
          payment.statusCallback(payment.status, null, this.getElapsedTime(payment));
          this.cleanupPaymentTracking(checkoutRequestID);
        } else {
          // Schedule another check
          this.scheduleNextStatusCheck(checkoutRequestID);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      // Check if we've exceeded the maximum check count
      if (payment.checkCount >= this.maxStatusChecks) {
        payment.status = 'timeout';
        payment.statusCallback(payment.status, null, this.getElapsedTime(payment));
        this.cleanupPaymentTracking(checkoutRequestID);
      } else {
        // Schedule another check despite the error
        this.scheduleNextStatusCheck(checkoutRequestID);
      }
    }
  }
  
  /**
   * Get the elapsed time since payment started
   * @param {Object} payment - Payment tracking object
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime(payment) {
    return Math.floor((Date.now() - payment.startTime) / 1000);
  }
  
  /**
   * Clean up payment tracking resources
   * @param {string} checkoutRequestID - M-Pesa checkout request ID
   */
  cleanupPaymentTracking(checkoutRequestID) {
    // Clear any pending timeout
    if (this.pendingTimeouts.has(checkoutRequestID)) {
      clearTimeout(this.pendingTimeouts.get(checkoutRequestID));
      this.pendingTimeouts.delete(checkoutRequestID);
    }
    
    // We'll keep the payment in activePayments for a short while
    // to allow for any final UI updates, then remove it
    setTimeout(() => {
      this.activePayments.delete(checkoutRequestID);
    }, 5000);
  }
  
  /**
   * Clean up old processed transactions to prevent memory leaks
   */
  cleanupOldTransactions() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Remove transactions older than 24 hours
    for (const [key, transaction] of this.processedTransactions.entries()) {
      if (transaction.timestamp < oneDayAgo) {
        this.processedTransactions.delete(key);
      }
    }
  }
  
  /**
   * Check if a transaction has already been processed
   * @param {string} idempotencyKey - Unique key for the payment attempt
   * @returns {boolean} True if already processed
   */
  isTransactionProcessed(idempotencyKey) {
    return this.processedTransactions.has(idempotencyKey);
  }
  
  /**
   * Cancel an active payment tracking
   * @param {string} checkoutRequestID - M-Pesa checkout request ID
   */
  cancelPaymentTracking(checkoutRequestID) {
    this.cleanupPaymentTracking(checkoutRequestID);
  }
}

const paymentStatusService = new PaymentStatusService();
export default paymentStatusService;
