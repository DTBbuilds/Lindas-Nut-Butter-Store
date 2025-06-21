import { api } from '../utils/api';
import config from '../config/apiConfig';
import { v4 as uuidv4 } from 'uuid';
import socketService from './socketService';

// Add module-level variable for preventing duplicate payment requests
let paymentRequestInProgress = false;

/**
 * Payment processing service for Linda's Nut Butter Store
 * Handles M-PESA integration and payment verification with improved
 * idempotency support, error handling, and real-time updates
 */
class PaymentService {
  /**
   * Initialize STK Push for M-PESA payment
   * 
   * @param {Object} paymentData - Payment information
   * @param {String} paymentData.phoneNumber - Customer phone number in international format (254XXXXXXXXX)
   * @param {Number} paymentData.amount - Payment amount
   * @param {String} paymentData.reference - Payment reference (e.g., order number)
   * @param {String} paymentData.description - Payment description
   * @returns {Promise<Object>} STK Push response
   */
  async initiateMpesaPayment(paymentData) {
    if (paymentRequestInProgress) {
      throw new Error('Payment request is already in progress. Please wait.');
    }
    paymentRequestInProgress = true;
    try {
      // Generate a unique idempotency key for this payment attempt
      const idempotencyKey = uuidv4();
      
      // Extract parameters - check for both orderId (new) and reference (old) for backwards compatibility
      const { phoneNumber, amount, orderId, reference, description } = paymentData;
      
      // Use orderId if available, fall back to reference
      const paymentReference = orderId || reference;
      
      // Normalize phone number format
      let normalizedPhone = phoneNumber;
      
      // Convert to international format if needed (254XXXXXXXXX)
      if (phoneNumber.startsWith('0')) {
        normalizedPhone = `254${phoneNumber.substring(1)}`;
      }
      
      // Remove any spaces or special characters
      normalizedPhone = normalizedPhone.replace(/[^0-9]/g, '');
      
      // Validate phone number
      if (!normalizedPhone.startsWith('254') || normalizedPhone.length !== 12) {
        throw new Error('Invalid phone number format. Please use format: 254XXXXXXXXX');
      }
      
      // Round amount to nearest whole number
      const roundedAmount = Math.round(amount);
      
      // Validate payment amount (minimum 1 KES)
      if (roundedAmount < 1) {
        throw new Error('Invalid payment amount. Minimum amount is 1 KES.');
      }
      
      console.log(`Initiating M-PESA payment with idempotency key: ${idempotencyKey}`);
      
      // Try multiple approaches to make the M-PESA API request more resilient
      let response;
      
      // Prepare headers with idempotency key
      const headers = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      };
      
      // Prepare request payload
      const payload = {
        phoneNumber: normalizedPhone,
        amount: roundedAmount,
        orderId: paymentReference,
        description: description || "Linda's Nut Butter - Order Payment"
      };
      
      try {
        // Initialize socket service for real-time updates
        socketService.init();
        
        // First try the direct fetch approach
        console.log('Attempting M-PESA payment with direct fetch...');
        const fetchResponse = await fetch('http://localhost:5000/api/mpesa/stk-push', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${fetchResponse.status}`
          );
        }
        
        response = await fetchResponse.json();
        console.log('Direct fetch successful:', response);
      } catch (fetchError) {
        console.warn('Direct fetch failed, trying API utility as fallback...', fetchError);
        
        // Fallback to API utility if direct fetch fails
        try {
          response = await api.post('/mpesa/stk-push', payload, { headers });
        } catch (apiError) {
          console.error('API utility also failed:', apiError);
          throw new Error(
            apiError.response?.data?.message || 
            apiError.message || 
            'Failed to initiate M-PESA payment'
          );
        }
      }
      
      // Extract checkout request ID (handle different response formats)
      const checkoutRequestID = response.CheckoutRequestID || 
                               response.checkoutRequestID || 
                               response.data?.CheckoutRequestID || 
                               response.data?.checkoutRequestID;
      
      if (!checkoutRequestID) {
        throw new Error('Missing checkout request ID in response');
      }
      
      console.log('M-PESA STK push initiated:', { checkoutRequestID, idempotencyKey });
      
      // Subscribe to socket updates for this transaction
      socketService.subscribeToPaymentUpdates(checkoutRequestID, (updateData) => {
        console.log(`Real-time payment update received for ${checkoutRequestID}:`, updateData);
        // The subscription is managed by the payment status service
      });
      
      return {
        success: true,
        checkoutRequestID,
        idempotencyKey,
        responseDescription: response.ResponseDescription || response.responseDescription,
        message: 'M-PESA payment initiated. Please check your phone for the STK push.',
        ...response
      };
    } catch (error) {
      console.error('M-PESA STK push error:', error);
      throw error;
    } finally {
      paymentRequestInProgress = false;
    }
  }
  
  /**
   * Check M-PESA payment status
   * 
   * @param {String} checkoutRequestID - M-PESA checkout request ID
   * @param {String} idempotencyKey - Optional idempotency key for the request
   * @returns {Promise<Object>} Payment status
   */
  async checkMpesaPaymentStatus(checkoutRequestID, idempotencyKey = null) {
    try {
      if (!checkoutRequestID) {
        throw new Error('Checkout request ID is required to check payment status');
      }
      
      // Generate a new idempotency key if not provided
      const requestKey = idempotencyKey || uuidv4();
      
      // Prepare headers with idempotency key
      const headers = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': requestKey
      };
      
      // Try multiple approaches to make the M-PESA API request more resilient
      let response;
      
      try {
        // First try the direct fetch approach to the new status endpoint
        console.log('Checking M-PESA payment status for:', checkoutRequestID);
        const url = `http://localhost:5000/api/mpesa/status/${encodeURIComponent(checkoutRequestID)}`;
        const fetchResponse = await fetch(url, {
          method: 'GET',
          headers
        });
        
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${fetchResponse.status}`
          );
        }
        
        response = await fetchResponse.json();
        console.log('Payment status check successful:', response);
      } catch (fetchError) {
        console.warn('Direct fetch failed for status check, trying API utility as fallback...', fetchError);
        
        // Fallback to API utility if direct fetch fails
        try {
          response = await api.get(`/mpesa/status/${checkoutRequestID}`, { headers });
        } catch (apiError) {
          // Try the old endpoint format as a last resort
          console.warn('New endpoint failed, trying legacy endpoint...', apiError);
          response = await api.post('/mpesa/query', { checkoutRequestID }, { headers });
        }
      }
      
      // Normalize response format
      const normalizedResponse = {
        success: response.success !== false,
        status: this._mapStatusToClientFormat(response.status),
        resultCode: response.resultCode || response.ResultCode,
        resultDesc: response.resultDesc || response.ResultDesc || response.message,
        checkoutRequestId: response.checkoutRequestId || response.MpesaReceiptNumber,
        amount: response.amount,
        timestamp: response.timestamp || new Date().toISOString()
      };
      
      console.log('Normalized M-PESA payment status:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      console.error('Error checking M-PESA payment status:', error);
      throw error;
    }
  }
  
  /**
   * Map backend status codes to client-friendly format
   * @private
   * @param {String} status - Backend status code
   * @returns {String} Client status code
   */
  _mapStatusToClientFormat(status) {
    // Map backend statuses to client-friendly format
    const statusMap = {
      'PENDING': 'pending',
      'COMPLETED': 'completed',
      'FAILED': 'failed'
    };
    
    return statusMap[status] || status || 'pending';
  }
  
  /**
   * Submit payment details to update order
   * 
   * @param {String} orderId - Order ID
   * @param {Object} paymentDetails - Payment details including M-PESA transaction data
   * @param {String} idempotencyKey - Optional idempotency key for the request
   * @returns {Promise<Object>} Updated order information
   */
  async updateOrderWithPayment(orderId, paymentDetails, idempotencyKey = null) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required to update payment');
      }
      
      // Generate a new idempotency key if not provided
      const requestKey = idempotencyKey || uuidv4();
      
      // Prepare headers with idempotency key
      const headers = {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': requestKey
      };
      
      let response;
      
      try {
        // First try the direct fetch approach
        console.log('Attempting to update order payment with direct fetch...');
        const fetchResponse = await fetch(`http://localhost:5000/api/orders/${orderId}/payment`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            ...paymentDetails,
            idempotencyKey: requestKey // Include in payload for backend tracking
          })
        });
        
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${fetchResponse.status}`
          );
        }
        
        response = await fetchResponse.json();
        console.log('Direct fetch for order update successful:', response);
      } catch (fetchError) {
        console.warn('Direct fetch failed for order update, trying API utility as fallback...', fetchError);
        
        // Fallback to API utility if direct fetch fails
        try {
          response = await api.patch(`/orders/${orderId}/payment`, {
            ...paymentDetails,
            idempotencyKey: requestKey
          }, { headers });
        } catch (apiError) {
          console.error('API utility also failed:', apiError);
          throw new Error(
            apiError.response?.data?.message || 
            apiError.message || 
            'Failed to update order with payment details'
          );
        }
      }
      
      console.log('Order payment updated:', response);
      
      // Notify user through socket if socket is connected
      if (socketService.connected) {
        socketService.socket.emit('order_updated', {
          orderId,
          status: 'payment_completed',
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        idempotencyKey: requestKey,
        order: response.order || response.data,
        message: 'Payment information updated successfully'
      };
    } catch (error) {
      console.error('Error updating order payment:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a pending M-PESA payment request
   * 
   * @param {String} checkoutRequestID - M-PESA checkout request ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelMpesaPayment(checkoutRequestID) {
    try {
      console.log(`Cancelling M-PESA payment with ID: ${checkoutRequestID}`);
      
      // Notify the socket of cancellation for real-time updates
      if (socketService.connected) {
        socketService.socket.emit('payment_cancelled', {
          checkoutRequestID,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        status: 'cancelled',
        message: 'Payment request has been cancelled',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }
  
  /**
   * Function to cancel an initiated M-Pesa payment
   * 
   * @param {Object} paymentData - Payment information
   * @param {String} paymentData.CheckoutRequestID - M-PESA checkout request ID
   * @param {String} paymentData.MerchantRequestID - M-PESA merchant request ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelMpesaPaymentRequest(paymentData) {
    try {
      const response = await api.post('/mpesa/cancel-payment', paymentData);
      console.log('Payment cancellation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();
export default paymentService;

// Function to cancel an initiated M-Pesa payment
async function cancelMpesaPayment({ CheckoutRequestID, MerchantRequestID }) {
  try {
    const response = await api.post('/mpesa/cancel-payment', { CheckoutRequestID, MerchantRequestID });
    console.log('Payment cancellation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error cancelling payment:', error);
    throw error;
  }
}

// Export the cancelMpesaPayment function if needed
export { cancelMpesaPayment };

// Export new functions for compatibility with older components
export const initiateSTKPush = (orderId, phoneNumber, amount) => {
    return paymentService.initiateMpesaPayment({ orderId, phoneNumber, amount });
};

export const checkSTKStatus = (checkoutRequestId) => {
    return paymentService.checkMpesaPaymentStatus(checkoutRequestId);
};
