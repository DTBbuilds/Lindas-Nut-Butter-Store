import { api } from '../utils/api';
import config from '../config/apiConfig';

/**
 * Payment processing service for Linda's Nut Butter Store
 * Handles M-PESA integration and payment verification
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
    try {
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
      
      // Try multiple approaches to make the M-PESA API request more resilient
      let response;
      
      try {
        // First try the direct fetch approach
        console.log('Attempting M-PESA payment with direct fetch...');
        const fetchResponse = await fetch('http://localhost:5000/api/mpesa/stkpush', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumber: normalizedPhone,
            amount: roundedAmount,
            orderId: paymentReference,
            description
          })
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();
        console.log('Direct fetch successful:', response);
      } catch (fetchError) {
        console.warn('Direct fetch failed, trying API utility as fallback...', fetchError);
        
        // Fallback to API utility if direct fetch fails
        response = await api.post('/mpesa/stkpush', {
          phoneNumber: normalizedPhone,
          amount: roundedAmount,
          orderId: paymentReference,
          description
        });
      }
      
      console.log('M-PESA STK push initiated:', response);
      
      return {
        success: true,
        checkoutRequestID: response.CheckoutRequestID,
        responseDescription: response.ResponseDescription,
        message: 'M-PESA payment initiated. Please check your phone.',
        ...response
      };
    } catch (error) {
      console.error('M-PESA STK push error:', error);
      throw error;
    }
  }
  
  /**
   * Check M-PESA payment status
   * 
   * @param {String} checkoutRequestID - M-PESA checkout request ID
   * @returns {Promise<Object>} Payment status
   */
  async checkMpesaPaymentStatus(checkoutRequestID) {
    try {
      // Try multiple approaches to make the M-PESA API request more resilient
      let response;
      
      try {
        // First try the direct fetch approach
        console.log('Attempting to check M-PESA status with direct fetch...');
        const url = `http://localhost:5000/api/mpesa/query?checkoutRequestID=${encodeURIComponent(checkoutRequestID)}`;
        const fetchResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();
        console.log('Direct fetch for status check successful:', response);
      } catch (fetchError) {
        console.warn('Direct fetch failed for status check, trying API utility as fallback...', fetchError);
        
        // Fallback to API utility if direct fetch fails
        response = await api.get('/mpesa/query', { 
          params: { checkoutRequestID }
        });
      }
      
      console.log('M-PESA payment status:', response);
      
      return {
        success: true,
        status: response.ResultCode === '0' ? 'completed' : 'pending',
        message: response.ResultDesc,
        ...response
      };
    } catch (error) {
      console.error('Error checking M-PESA payment status:', error);
      throw error;
    }
  }
  
  /**
   * Submit payment details to update order
   * 
   * @param {String} orderId - Order ID
   * @param {Object} paymentDetails - Payment details including M-PESA transaction data
   * @returns {Promise<Object>} Updated order information
   */
  async updateOrderWithPayment(orderId, paymentDetails) {
    try {
      let response;
      
      try {
        // First try the direct fetch approach
        console.log('Attempting to update order payment with direct fetch...');
        const fetchResponse = await fetch(`http://localhost:5000/api/orders/${orderId}/payment`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentDetails)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();
        console.log('Direct fetch for order update successful:', response);
      } catch (fetchError) {
        console.warn('Direct fetch failed for order update, trying API utility as fallback...', fetchError);
        
        // Fallback to API utility if direct fetch fails
        response = await api.patch(`/orders/${orderId}/payment`, paymentDetails);
      }
      
      console.log('Order payment updated:', response);
      
      return {
        success: true,
        order: response.order || response.data,
        message: 'Payment information updated successfully'
      };
    } catch (error) {
      console.error('Error updating order payment:', error);
      throw error;
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();
export default paymentService;
