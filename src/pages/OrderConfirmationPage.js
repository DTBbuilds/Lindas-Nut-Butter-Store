import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner, faShoppingBag, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL } from '../config';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          throw new Error('Order ID is required');
        }
        
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`);
        setOrder(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error.response?.data?.message || 'Failed to fetch order details');
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-golden-brown mb-4" />
        <h2 className="text-2xl font-bold text-golden-brown">Loading order details...</h2>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-red-600 mb-6">{error || 'Order not found'}</p>
          <Link 
            to="/"
            className="inline-block py-2 px-6 bg-golden-brown text-white font-semibold rounded-md hover:bg-golden-brown/90 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-warm-cream p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-golden-brown">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">Thank you for choosing Linda's Nut Butter Store!</p>
        </div>
        
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-golden-brown">Order Details</h2>
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
              {order.status}
            </span>
          </div>
          <p className="text-gray-600">Order ID: <span className="font-medium">{order._id}</span></p>
          <p className="text-gray-600">Date: <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span></p>
          
          {order.transactionId && (
            <p className="text-gray-600">
              M-Pesa Transaction ID: <span className="font-medium">{order.transactionId}</span>
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-golden-brown mb-3">Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-golden-brown mb-3">Payment Summary</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-medium">KSh {(order.totalAmount - 200).toLocaleString()}</p>
            </div>
            <div className="flex justify-between mb-2">
              <p className="text-gray-600">Shipping</p>
              <p className="font-medium">KSh 200</p>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <p className="font-semibold">Total</p>
              <p className="font-bold text-lg">KSh {order.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-golden-brown mb-3">Shipping Information</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-gray-600">{order.customer.email}</p>
            <p className="text-gray-600">{order.customer.phoneNumber}</p>
            <p className="text-gray-600 mt-2">
              {order.customer.address.street}, {order.customer.address.city}<br />
              {order.customer.address.state}, {order.customer.address.postalCode}<br />
              {order.customer.address.country}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/"
            className="py-3 px-6 bg-golden-brown text-white font-semibold rounded-md text-center hover:bg-golden-brown/90 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Continue Shopping
          </Link>
          
          <Link 
            to="/orders"
            className="py-3 px-6 bg-white border border-golden-brown text-golden-brown font-semibold rounded-md text-center hover:bg-golden-yellow/10 transition-colors"
          >
            <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
