import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Spinner } from '../Spinner';
import paymentService from '../../services/paymentService';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobile, faArrowLeft, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';

/**
 * Payment Method Form
 * Handles M-Pesa payment processing for Kenya
 */
const PaymentMethodForm = ({ 
  initialValues, 
  onSubmit, 
  onBack, 
  orderTotal, 
  customerPhone,
  isProcessing = false 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mpesaProcessing, setMpesaProcessing] = useState(false);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState(null);

  // Define form validation schema
  const validationSchema = Yup.object({
    method: Yup.string().required('Please select a payment method'),
    phoneNumber: Yup.string().test({
      name: 'phone-validation',
      test: function(value) {
        // Only validate phone number if method is MPESA
        if (this.parent.method === 'MPESA') {
          if (!value) {
            return this.createError({
              message: 'Phone number is required for M-Pesa payments',
            });
          }
          // Test for valid Kenyan phone number format
          const isValid = /^(\+?254|0)?[17]\d{8}$/.test(value);
          if (!isValid) {
            return this.createError({
              message: 'Please enter a valid Kenyan phone number',
            });
          }
        }
        return true;
      }
    }),
    notes: Yup.string()
  });

  // Handle M-PESA payment processing
  const processMpesaPayment = async (phoneNumber, amount, reference) => {
    try {
      // Ensure all required fields have values
      if (!phoneNumber || !amount || !reference) {
        console.error('Missing required M-PESA fields:', { phoneNumber, amount, reference });
        throw new Error('Phone number, amount, and reference are required for M-PESA payment');
      }

      // Initiate M-PESA STK Push
      const mpesaPaymentData = {
        phoneNumber: phoneNumber.trim(),
        amount: parseFloat(amount),
        orderId: reference.trim(), // Changed from 'reference' to 'orderId' to match backend requirements
        description: 'Linda\'s Nut Butter Store - Order Payment'
      };
      
      console.log('Initiating M-PESA payment with data:', mpesaPaymentData);
      
      // Make the API request
      const response = await paymentService.initiateMpesaPayment(mpesaPaymentData);
      console.log('Full M-PESA API response:', response);
      
      // Extract checkout request ID from response (handle different possible formats)
      // Look at the entire response object, it could be nested in data or directly in response
      let checkoutRequestID;
      
      if (response?.data?.CheckoutRequestID) {
        checkoutRequestID = response.data.CheckoutRequestID;
      } else if (response?.CheckoutRequestID) {
        checkoutRequestID = response.CheckoutRequestID;
      } else if (response?.data?.checkoutRequestID) {
        checkoutRequestID = response.data.checkoutRequestID;
      } else if (response?.checkoutRequestID) {
        checkoutRequestID = response.checkoutRequestID;
      } else if (typeof response === 'string') {
        // Try to parse the response if it's a string
        try {
          const parsedResponse = JSON.parse(response);
          checkoutRequestID = parsedResponse.CheckoutRequestID || parsedResponse.checkoutRequestID;
        } catch (e) {
          console.error('Failed to parse response string:', e);
        }
      }
      
      // Log the extracted checkout request ID for debugging
      console.log('Extracted M-PESA checkout request ID:', checkoutRequestID);
      
      // Store the ID for later use
      setMpesaCheckoutId(checkoutRequestID);
      
      // Show notification to user
      toast.info('M-PESA payment initiated. Please check your phone for the payment prompt and enter your PIN.', {
        autoClose: 15000
      });
      
      // Start checking payment status after a delay
      // Only schedule the check if we have a valid checkout request ID
      if (checkoutRequestID) {
        console.log('Scheduling payment status check in 10 seconds...');
        setTimeout(() => checkPaymentStatus(checkoutRequestID), 10000);
      } else {
        console.error('No checkout request ID found in response - cannot schedule status check');
        toast.error('Could not verify payment status. If you complete the payment, please contact customer support with your M-PESA transaction ID.');
      }
      
      return response;
    } catch (error) {
      console.error('M-PESA payment initiation error:', error);
      toast.error(`M-PESA payment failed: ${error.message || 'Unknown error'}`);
      throw error;
    }
  };
  
  // Check M-PESA payment status
  const checkPaymentStatus = async (checkoutRequestID) => {
    // Validate checkout request ID
    if (!checkoutRequestID) {
      console.error('No checkout request ID provided for status check');
      // Try to use the one from state as a fallback
      if (mpesaCheckoutId) {
        console.log('Using checkout request ID from state as fallback:', mpesaCheckoutId);
        checkoutRequestID = mpesaCheckoutId;
      } else {
        console.error('No checkout request ID available in state either');
        toast.error('Could not verify payment status. If you complete the payment, please contact customer support with your M-PESA transaction ID.');
        return;
      }
    }
    
    // Log that we're checking payment status
    console.log('Checking M-PESA payment status for checkout request ID:', checkoutRequestID);
    
    try {
      const statusResponse = await paymentService.checkMpesaPaymentStatus(checkoutRequestID);
      
      if (statusResponse.status === 'completed') {
        // Payment successful
        toast.success('Payment successful! Processing your order...');
        
        // Add M-PESA details to form data and submit order
        const mpesaDetails = {
          transactionId: statusResponse.MpesaReceiptNumber || checkoutRequestID,
          phoneNumber: formik.values.phoneNumber,
          amount: orderTotal,
          timestamp: new Date().toISOString()
        };
        
        // Submit order with payment details
        await onSubmit({
          ...formik.values,
          paymentMethod: 'MPESA',
          mpesaDetails
        });
        
        setMpesaProcessing(false);
      } else if (statusResponse.status === 'pending') {
        // Payment still processing, check again after 5 seconds
        toast.info('Waiting for M-PESA confirmation. Please complete the payment on your phone.');
        setTimeout(() => checkPaymentStatus(checkoutRequestID), 5000);
      } else {
        // Payment failed or was cancelled
        toast.error(`Payment failed: ${statusResponse.message || 'Transaction was not completed'}`);
        setMpesaProcessing(false);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to verify payment status. Please try again or contact customer support with your M-PESA transaction ID.');
      setMpesaProcessing(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      method: 'MPESA',
      phoneNumber: customerPhone || '',
      notes: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        if (values.method === 'MPESA') {
          await processMpesaPayment(
            values.phoneNumber,
            orderTotal,
            `LINDA-NUT-${Date.now().toString().slice(-6)}`
          );
          // Don't call onSubmit here - we'll call it after payment confirmation
          setMpesaProcessing(true);
        } else {
          // For other payment methods, submit directly
          await onSubmit({ ...values, paymentMethod: values.method });
        }
      } catch (error) {
        console.error('Payment submission error:', error);
        toast.error(`Payment error: ${error.message || 'An unexpected error occurred'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-yellow-100 rounded-full p-2 mr-3">
            <FontAwesomeIcon icon={faMobile} className="text-yellow-600" />
          </div>
          <div>
            <h4 className="font-medium text-yellow-800">M-Pesa Payment</h4>
            <p className="text-yellow-700">
              Pay securely using M-Pesa. You will receive a prompt on your phone to complete the payment.
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-semibold text-green-700">{formatKES(orderTotal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Payment Method:</span>
                <span className="text-green-700">M-Pesa</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* M-Pesa Payment */}
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faMobile} className="text-green-600 h-6 w-6 mr-3" />
            <h3 className="text-lg font-medium text-gray-800">M-Pesa Payment</h3>
          </div>
          
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              disabled={isSubmitting || mpesaProcessing}
              className={`w-full pl-3 pr-3 py-2 border ${formik.errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              placeholder="e.g., 0712345678"
            />
            {formik.errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.phoneNumber}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={mpesaProcessing}
          >
            Back
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !formik.isValid || mpesaProcessing}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Processing...
              </>
            ) : mpesaProcessing ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Waiting for M-PESA...
              </>
            ) : (
              'Complete Order'
            )}
          </button>
        </div>
        
        {/* M-PESA Payment Instructions */}
        {formik.values.method === 'MPESA' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-700">M-PESA Payment Instructions:</h4>
            <ol className="mt-2 text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Enter your Safaricom phone number above.</li>
              <li>Click "Complete Order" to receive an STK push notification.</li>
              <li>Enter your M-PESA PIN when prompted on your phone.</li>
              <li>Wait for payment confirmation (this may take a few moments).</li>
            </ol>
            <p className="mt-2 text-xs text-gray-500">Your order will be processed automatically once payment is confirmed.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentMethodForm;
