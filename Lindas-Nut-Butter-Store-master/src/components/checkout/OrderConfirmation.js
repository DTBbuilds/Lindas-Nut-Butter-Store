import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../utils/api';
import { io } from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faTimesCircle, faHourglassHalf, faHome, faPrint, 
  faReceipt, faTruck, faLocationDot, faComment, faRedo
} from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';
import { formatOrderDate, getStatusLabel, getStatusColor } from '../../utils/orderUtils';
import { downloadReceipt } from '../../utils/receiptGenerator';
import { toast } from 'react-toastify';
import FeedbackForm from '../feedback/FeedbackForm';

/**
 * Order Confirmation Component
 * Displays dynamic order and payment status after checkout.
 */
const OrderConfirmation = ({ orderInfo, customerInfo, paymentInfo, cartItems, cartTotal, onContinueShopping, onGoBackToPayment, clearCart }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryPhoneNumber, setRetryPhoneNumber] = useState(customerInfo?.phoneNumber || '');
  const pollingInterval = useRef(null);

  const [paymentDetails, setPaymentDetails] = useState(() => ({
    status: paymentInfo?.paymentStatus || 'PENDING',
    message: 'Waiting for M-Pesa payment confirmation...',
    checkoutRequestId: paymentInfo?.checkoutRequestId,
    mpesaReceiptNumber: paymentInfo?.mpesaReceiptNumber || null,
    paymentMethod: paymentInfo?.paymentMethod,
  }));

  const stopPolling = useCallback((reason) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null; // Prevent multiple intervals
      console.log(`Polling stopped: ${reason}`);
    }
  }, []);

  // Centralized function to handle all payment status updates
  const handlePaymentUpdate = useCallback((update) => {
    console.log('Handling payment update:', update);

    setPaymentDetails(prev => ({
      ...prev,
      status: update.status,
      message: update.message, // Use the new user-friendly message from backend
      mpesaReceiptNumber: update.mpesaReceiptNumber || prev.mpesaReceiptNumber,
    }));

    if (update.status === 'SUCCESS') {
      toast.success(update.message || 'Payment successful!');
      if (clearCart) clearCart(); // Clear cart only on success
    } else if (update.status === 'FAILED') {
      toast.error(update.message || 'Payment failed.');
    }

    if (['SUCCESS', 'FAILED'].includes(update.status)) {
      stopPolling(`Final status received (${update.status})`);
    }
  }, [stopPolling, clearCart]);

  // Function to manually check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentDetails.checkoutRequestId || isCheckingStatus) return;

    setIsCheckingStatus(true);
    try {
      const response = await api.get(`/mpesa/status/${paymentDetails.checkoutRequestId}`);
      if (response) handlePaymentUpdate(response);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred while checking payment status.';
      handlePaymentUpdate({ status: 'FAILED', message: errorMessage });
    } finally {
      setIsCheckingStatus(false);
    }
  }, [paymentDetails.checkoutRequestId, handlePaymentUpdate]);

  // Effect for WebSocket/polling management
  useEffect(() => {
    if (!paymentDetails.checkoutRequestId) {
      setPaymentDetails(prev => ({ ...prev, message: 'Could not get payment request ID. Cannot check status in real-time.' }));
      return;
    }

    const socket = io(process.env.REACT_APP_API_BASE_URL);
    socket.on('connect', () => console.log('Socket connected:', socket.id));
    socket.on('disconnect', () => console.log('Socket disconnected.'));
    socket.on('paymentUpdate', (data) => {
      if (data.checkoutRequestId === paymentDetails.checkoutRequestId) {
        handlePaymentUpdate(data);
      }
    });

    if (paymentDetails.status === 'PENDING' && !pollingInterval.current) {
      checkPaymentStatus(); // Initial check
      pollingInterval.current = setInterval(checkPaymentStatus, 15000);
    }

    return () => {
      stopPolling('Component unmounted');
      socket.disconnect();
    };
  }, [paymentDetails.checkoutRequestId, paymentDetails.status, checkPaymentStatus, handlePaymentUpdate, stopPolling]);

  const handleDownloadReceipt = () => {
    const result = downloadReceipt(orderInfo, customerInfo, paymentDetails, cartItems, cartTotal, (filename) => {
      setReceiptDownloaded(true);
      toast.success(<div><p className="font-medium">Receipt downloaded!</p><p className="text-sm mt-1">Saved as: {filename}</p></div>);
    });
    if (!result.success) {
      toast.error(<div><p className="font-medium">Could not generate receipt</p><p className="text-sm mt-1">Please try again later</p></div>);
    }
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackSubmitted(true);
    setShowFeedback(false);
  };

  const handleRetryPayment = async () => {
    if (!orderInfo || isRetrying || !retryPhoneNumber) return;

    setIsRetrying(true);
    toast.info('Sending a new payment request to your phone...');

    try {
      const response = await api.post('/mpesa/retry', {
        orderId: orderInfo.orderNumber,
        amount: cartTotal,
        phoneNumber: retryPhoneNumber, // Use the new or edited phone number
      });

      if (response && response.checkoutRequestId) {
        // Reset payment state to poll for the new transaction
        setPaymentDetails(prev => ({
          ...prev,
          status: 'PENDING',
          message: 'New payment request sent. Awaiting confirmation...',
          checkoutRequestId: response.checkoutRequestId, // IMPORTANT: Update the ID
          mpesaReceiptNumber: null,
        }));
        // The main useEffect will now handle polling/sockets for this new ID
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to initiate retry. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  // Dynamic UI rendering based on payment status
  const getStatusUI = () => {
    switch (paymentDetails.status) {
      case 'SUCCESS':
        return {
          icon: faCheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          title: 'Payment Successful!',
          subtitle: 'Your order has been confirmed and will be processed shortly.'
        };
      case 'FAILED':
        return {
          icon: faTimesCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          title: 'Payment Failed',
          subtitle: 'Unfortunately, we could not process your payment. Please check the details and try again or contact support.'
        };
      default: // PENDING
        return {
          icon: faHourglassHalf,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          title: 'Payment Pending',
          subtitle: 'We are waiting for M-Pesa to confirm your payment. This page will update automatically.'
        };
    }
  };

  if (!orderInfo || !customerInfo || !paymentInfo || !cartItems) {
    return <div className="text-center py-20"><h1 className="text-2xl font-bold">Generating Your Order Confirmation...</h1></div>;
  }

  const statusUI = getStatusUI();
  const statusClasses = getStatusColor(paymentDetails.status);
  const safeOrderNumber = orderInfo?.orderNumber || 'PENDING';
  const safeOrderDate = orderInfo?.orderDate || new Date().toISOString();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className={`inline-block ${statusUI.bgColor} rounded-full p-3 mb-4`}>
          <FontAwesomeIcon icon={statusUI.icon} className={`${statusUI.color} text-4xl`} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">{statusUI.title}</h1>
        <p className="text-lg text-gray-600 mt-2">{statusUI.subtitle}</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Order #{safeOrderNumber}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses.bg} ${statusClasses.text}`}>
              {getStatusLabel(paymentDetails.status)}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">Placed on {formatOrderDate(safeOrderDate, true)}</p>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FontAwesomeIcon icon={statusUI.icon} className={`mr-3 ${statusUI.color}`} />
            <p className={`text-sm font-medium ${statusUI.color}`}>{paymentDetails.message}</p>
            {paymentDetails.status === 'PENDING' && (
              <button 
                onClick={checkPaymentStatus} 
                disabled={isCheckingStatus}
                className="ml-4 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCheckingStatus ? 'Checking...' : 'Check Now'}
              </button>
            )}
            {paymentDetails.status === 'FAILED' && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                <input 
                  type="text"
                  value={retryPhoneNumber}
                  onChange={(e) => setRetryPhoneNumber(e.target.value)}
                  placeholder="Enter M-Pesa number"
                  className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-auto focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={handleRetryPayment}
                  disabled={isRetrying || !retryPhoneNumber}
                  className="w-full bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
                <button
                  onClick={onGoBackToPayment}
                  className="w-full mt-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Back to Payment
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Customer Information</h3>
              <div className="space-y-2">
                <p className="text-gray-800"><span className="font-medium">Name:</span> {customerInfo.name}</p>
                <p className="text-gray-800"><span className="font-medium">Phone:</span> {customerInfo.phoneNumber}</p>
                <p className="text-gray-800"><span className="font-medium">Email:</span> {customerInfo.email}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Delivery Information</h3>
              <div className="space-y-2">
                <p className="text-gray-800"><FontAwesomeIcon icon={faLocationDot} className="mr-1" /> {orderInfo?.shippingAddress?.street || 'Address not available'}</p>
                <p className="text-gray-600"><FontAwesomeIcon icon={faTruck} className="mr-1" /> Delivery: Within 48 hours</p>
                <p className="text-gray-600">Shipping Fee: {formatKES(orderInfo.shippingFee || 300)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Information</h3>
            <div className="space-y-2">
              <p className="text-gray-800"><span className="font-medium">Method:</span> {paymentDetails.paymentMethod}</p>
              <p className="text-gray-800"><span className="font-medium">Status:</span> <span className={`font-medium ${statusUI.color}`}>{getStatusLabel(paymentDetails.status)}</span></p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatKES(item.price)}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">{formatKES(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">Subtotal</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatKES(cartTotal.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">Shipping</td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{formatKES(orderInfo.shippingFee || 300)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right text-base font-semibold text-gray-800">Total</td>
                    <td className="px-6 py-3 text-right text-base font-semibold text-green-700">{formatKES(cartTotal.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-6 mt-6 border-t border-gray-200">
            <button onClick={onContinueShopping} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <FontAwesomeIcon icon={faHome} className="mr-2" /> Continue Shopping
            </button>
            {paymentDetails.status === 'FAILED' && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                <input 
                  type="text"
                  value={retryPhoneNumber}
                  onChange={(e) => setRetryPhoneNumber(e.target.value)}
                  placeholder="Enter M-Pesa number"
                  className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-auto focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={handleRetryPayment}
                  disabled={isRetrying || !retryPhoneNumber}
                  className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faRedo} className="mr-2" />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              </div>
            )}

            <button onClick={handleDownloadReceipt} disabled={paymentDetails.status !== 'SUCCESS'} className={`flex items-center px-4 py-2 text-white rounded-md transition-colors ${receiptDownloaded ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
              <FontAwesomeIcon icon={receiptDownloaded ? faCheckCircle : faReceipt} className="mr-2" /> {receiptDownloaded ? 'Downloaded' : 'Download Receipt'}
            </button>
            <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <FontAwesomeIcon icon={faPrint} className="mr-2" /> Print Order
            </button>
          </div>

          {/* Feedback Section */}
          {paymentDetails.status === 'SUCCESS' && !feedbackSubmitted && (
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              {!showFeedback ? (
                <button 
                  onClick={() => setShowFeedback(true)}
                  className="inline-flex items-center px-6 py-2 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <FontAwesomeIcon icon={faComment} className="mr-2" /> Provide Feedback
                </button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">We value your feedback!</h3>
                  <p className="text-gray-600 mb-4">Please let us know how we did with your order. Your feedback helps us improve.</p>
                  <FeedbackForm 
                    orderId={safeOrderNumber}
                    onFeedbackSubmitted={handleFeedbackSubmitted} 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">What Happens Next?</h3>
        <ol className="list-decimal ml-6 space-y-2 text-gray-600">
          <li>You'll receive an order confirmation email with your order details.</li>
          <li>Our team will process your order and prepare it for delivery.</li>
          {paymentDetails.status !== 'SUCCESS' && (
            <li>Once your M-Pesa payment is confirmed, we'll begin processing your order.</li>
          )}
          <li>Your order will be delivered to the address you provided within 48 hours.</li>
          <li>Our delivery team will contact you before delivery.</li>
          <li>If you have any questions, please contact our customer service team at <span className="font-medium">0712 345 678</span>.</li>
        </ol>
      </div>
    </div>
  );
};

export default OrderConfirmation;
