import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faTimesCircle, faShoppingBag, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { socket } from '../services/socket';
import api from '../services/apiService'; // Use the central api service
import { useCart } from '../contexts/CartContext';

function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showCheckStatusButton, setShowCheckStatusButton] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const checkStatusTimer = useRef(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      // The backend should return the full order object with populated items
      const { data: orderData } = await api.get(`/orders/${orderId}`);
      setOrder(orderData);

      // Normalize payment status
      switch (orderData.paymentStatus) {
        case 'Paid':
        case 'COMPLETED':
          setPaymentStatus('success');
          setShowCheckStatusButton(false);
          clearTimeout(checkStatusTimer.current);
          break;
        case 'Failed':
        case 'FAILED':
        case 'CANCELLED':
          setPaymentStatus('failed');
          setShowCheckStatusButton(false);
          clearTimeout(checkStatusTimer.current);
          break;
        default:
          setPaymentStatus('pending');
          // Set timer only if it's still pending
          if (!checkStatusTimer.current) {
            checkStatusTimer.current = setTimeout(() => {
              setShowCheckStatusButton(true);
            }, 45000);
          }
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    const handlePaymentUpdate = (data) => {
      if (data.orderId === orderId) {
        fetchOrder(); // Refetch to get the latest complete status
        if (data.status === 'success') {
          clearCart();
        }
      }
    };

    socket.emit('join-order-room', orderId);
    socket.on('payment-success', handlePaymentUpdate);
    socket.on('payment-failed', handlePaymentUpdate);

    return () => {
      if (checkStatusTimer.current) {
        clearTimeout(checkStatusTimer.current);
      }
      socket.off('payment-success', handlePaymentUpdate);
      socket.off('payment-failed', handlePaymentUpdate);
    };
  }, [orderId, fetchOrder, clearCart]);

  const handleRetryPayment = async () => {
    setIsRetrying(true);
    setError('');
    try {
      await api.post(`/orders/${orderId}/retry-payment`);
      setPaymentStatus('pending');
      setShowCheckStatusButton(false);
      if (checkStatusTimer.current) clearTimeout(checkStatusTimer.current);
      checkStatusTimer.current = setTimeout(() => setShowCheckStatusButton(true), 45000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retry payment.');
    } finally {
      setIsRetrying(false);
    }
  };

    const handleChangePaymentMethod = async () => {
    if (!order) return;

    setIsCancelling(true);
    try {
      await api.post(`/orders/${order._id}/cancel`);
      toast.info('Previous order cancelled. Please select a new payment method.');

      const customerDetails = {
        name: order.customerInfo.name,
        email: order.customerEmail,
        phoneNumber: order.customerInfo.phone,
        deliveryAddress: order.customerInfo.address,
      };

      navigate('/checkout', {
        state: {
          step: 'payment',
          customerInfo: customerDetails,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel the previous order.');
      setIsCancelling(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setError('');
    try {
      await api.post(`/orders/${orderId}/check-status`);
      // Backend will emit socket event with the result.
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check status.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-golden-brown" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/" className="inline-block py-2 px-6 bg-golden-brown text-white font-semibold rounded-md hover:bg-golden-brown/90 transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  const renderStatus = () => {
    if (paymentStatus === 'success') {
      return (
        <>
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Payment Successful!</h1>
          <p className="text-gray-600 mt-2">Your order is confirmed. Thank you for your purchase!</p>
        </>
      );
    }
    if (paymentStatus === 'failed') {
      return (
        <>
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <FontAwesomeIcon icon={faTimesCircle} className="text-4xl text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Payment Failed</h1>
          <p className="text-gray-600 mt-2">{error || 'There was a problem with your payment.'}</p>
          <button
            onClick={handleRetryPayment}
            disabled={isRetrying}
            className="mt-6 py-2 px-6 bg-golden-brown text-white font-semibold rounded-md hover:bg-golden-brown/90 transition-colors disabled:opacity-50"
          >
            {isRetrying ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" />Processing...</> : 'Retry Payment'}
          </button>
        </>
      );
    }
    // Pending
    return (
      <>
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-yellow-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Awaiting Payment</h1>
        <p className="text-gray-600 mt-2">Please complete the transaction on your mobile phone.</p>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-4 sm:space-y-0">
          {showCheckStatusButton && (
            <button
              onClick={handleCheckStatus}
              disabled={isCheckingStatus || isCancelling}
              className="py-2 px-6 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isCheckingStatus ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" />Checking...</> : 'Check Payment Status'}
            </button>
          )}
          <button
            onClick={handleChangePaymentMethod}
            disabled={isCancelling || isCheckingStatus}
            className="py-2 px-6 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isCancelling ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" />Cancelling...</> : 'Change Payment Method'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-golden-brown hover:underline mb-4 inline-block">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Store
          </Link>
          {renderStatus()}
        </div>

        {order && (
          <>
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span className="font-mono">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800">
                  <span>Total Amount:</span>
                  <span>KSh {order.totalAmount?.toLocaleString() || '0.00'}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Items Ordered</h3>
              <ul className="divide-y divide-gray-200">
                {order.items?.map((item, index) => {
                  // The backend MUST populate the product details
                  if (!item || !item.product) return (
                    <li key={index} className="py-3">Loading item details...</li>
                  );

                  const price = typeof item.price === 'number' ? item.price : 0;
                  const quantity = typeof item.quantity === 'number' ? item.quantity : 1;

                  return (
                    <li key={item.product._id || index} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <img 
                          src={item.product.imageUrl || 'https://placehold.co/150'} 
                          alt={item.product.name || 'Product Image'} 
                          className="w-16 h-16 rounded-md object-cover mr-4 bg-gray-200"
                        />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">KSh {(price * quantity).toLocaleString()}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        <div className="border-t pt-8 mt-8 flex justify-center">
          <Link to="/orders" className="py-2 px-6 bg-golden-brown text-white font-semibold rounded-md hover:bg-golden-brown/90 transition-colors">
            <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmationPage;
