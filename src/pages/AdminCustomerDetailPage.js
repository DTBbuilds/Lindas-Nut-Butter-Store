import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faShoppingBag, faMoneyBill, faStar, faTrash, faArrowLeft, faEnvelope, faPhone, faEye } from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAdminAuth } from '../contexts/AdminAuthContext';

// Use the correct API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    'http://localhost:5000' : 
    ''
  );

const AdminCustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [customer, setCustomer] = useState(null);
  const [relatedData, setRelatedData] = useState({
    orders: [],
    feedback: [],
    metrics: {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      firstOrderDate: null,
      lastOrderDate: null,
      daysSinceLastOrder: null,
      customerLifetimeDays: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch customer details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          setError('Authorization required');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/admin/customers/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setCustomer(response.data.customer);
          setRelatedData(response.data.relatedData);
        } else {
          setError('Failed to fetch customer details');
        }
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError('Error fetching customer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (admin && customerId) {
      fetchCustomerDetails();
    }
  }, [admin, customerId]);

  // Delete customer
  const deleteCustomer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.delete(`${API_URL}/api/admin/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success('Customer deleted successfully');
        // Navigate back to customers list
        navigate('/admin/customers');
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error(err.response?.data?.message || 'Error deleting customer');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You must be logged in as an admin to view this page.</p>
          <Link to="/admin/login" className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded">
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1">
        <AdminHeader title="Customer Details" />
        
        <div className="container mx-auto px-4 py-6">
          {/* Back button */}
          <Link 
            to="/admin/customers" 
            className="inline-flex items-center text-green-600 hover:text-green-800 mb-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Customers
          </Link>
          
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500">
              {error}
            </div>
          ) : customer ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Delete Confirmation Modal */}
              {confirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
                    <p className="text-gray-700 mb-4">Are you sure you want to delete this customer?</p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            This action <span className="font-bold">cannot be undone</span>. All customer data including order history and personal information will be permanently removed.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={deleteCustomer}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete Customer
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Customer Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-green-600 text-white p-4">
                    <h2 className="text-xl font-bold">Customer Profile</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-center mb-6">
                      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-green-600 text-4xl" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-center mb-4">{customer.name}</h3>
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Total Orders</span>
                        <span className="font-semibold">{relatedData.metrics.totalOrders}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Total Spent</span>
                        <span className="font-semibold">{formatCurrency(relatedData.metrics.totalSpent)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Average Order</span>
                        <span className="font-semibold">{formatCurrency(relatedData.metrics.averageOrderValue)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">First Order</span>
                        <span className="font-semibold">{relatedData.metrics.firstOrderDate ? formatDate(relatedData.metrics.firstOrderDate) : 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Last Order</span>
                        <span className="font-semibold">{relatedData.metrics.lastOrderDate ? formatDate(relatedData.metrics.lastOrderDate) : 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-200">
                        <span className="text-gray-600">Days Since Last Order</span>
                        <span className="font-semibold">{relatedData.metrics.daysSinceLastOrder || 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3">
                        <span className="text-gray-600">Customer Age (days)</span>
                        <span className="font-semibold">{relatedData.metrics.customerLifetimeDays || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Delete Customer
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Customer Stats */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
                  <div className="bg-green-600 text-white p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Customer Stats</h2>
                    <h2 className="text-xl font-bold">Customer Stats</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faShoppingBag} className="text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-xl font-bold">{relatedData.metrics.totalOrders}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faMoneyBill} className="text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Total Spent</p>
                            <p className="text-xl font-bold">{formatCurrency(relatedData.metrics.totalSpent)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faShoppingBag} className="text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Average Order Value</p>
                            <p className="text-xl font-bold">
                              {relatedData.metrics.totalOrders > 0 
                                ? formatCurrency(relatedData.metrics.averageOrderValue) 
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Orders and Feedback */}
              <div className="lg:col-span-2">
                {/* Customer Orders History */}
                <div className="lg:col-span-2 row-span-2">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-green-600 text-white p-4 flex justify-between items-center">
                      <h2 className="text-xl font-bold">Customer Order History</h2>
                      <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {relatedData.orders.length} Orders
                      </span>
                    </div>
                    <div className="p-4">
                      {relatedData.orders.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {relatedData.orders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                                    <Link to={`/admin/orders/${order._id}`}>
                                      {order._id.substring(order._id.length - 8)}
                                    </Link>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(order.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatCurrency(order.totalAmount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                      ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                                      ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                      ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                                      ${order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : ''}
                                    `}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                      ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                                      ${order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                                      ${order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : ''}
                                    `}>
                                      {order.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <Link 
                                      to={`/admin/orders/${order._id}`}
                                      className="text-green-600 hover:text-green-800 mr-3"
                                      title="View Order Details"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No orders found for this customer
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Customer Feedback */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-green-600 text-white p-4">
                    <h2 className="text-xl font-bold">Customer Feedback</h2>
                  </div>
                  <div className="p-6">
                    {relatedData.feedback.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No feedback submitted by this customer
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {relatedData.feedback.map((feedback) => (
                          <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <FontAwesomeIcon 
                                        key={i}
                                        icon={faStar} 
                                        className={i < feedback.ratings?.overall ? "text-yellow-400" : "text-gray-300"}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-2 text-gray-600">{feedback.ratings?.overall || 0}/5</span>
                                </div>
                                <p className="mt-2 text-gray-700">{feedback.comments || 'No comments provided'}</p>
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(feedback.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p>Customer not found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FontAwesomeIcon icon={faTrash} className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Customer</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {customer.name}? This action cannot be undone and will remove all customer data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={deleteCustomer}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerDetailPage;
