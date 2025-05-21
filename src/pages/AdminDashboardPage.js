import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, faCheckCircle, faTimesCircle, faMoneyBill, 
  faShoppingBag, faFileDownload, faSync, faCalendarAlt 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('transactions');
  // Date filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Product state declarations moved to the top
  const [products, setProducts] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  
  // Product form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productStockQuantity, setProductStockQuantity] = useState('');
  const [productLowStockThreshold, setProductLowStockThreshold] = useState('');
  const [productImages, setProductImages] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [productError, setProductError] = useState('');
  
  // Edit product state
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Function declarations moved up before the JSX return
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data.products || []);
    } catch (err) {
      setError('Failed to load products');
    }
    setLoading(false);
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions
      const transactionsResponse = await axios.get(`${API_URL}/api/admin/transactions`);
      setTransactions(transactionsResponse.data.data || []);
      
      // Fetch orders
      const ordersResponse = await axios.get(`${API_URL}/api/admin/orders`);
      setOrders(ordersResponse.data.data || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
    }
  };
  
  // Add useEffect hooks
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const handleRefresh = () => {
    fetchData();
  };
  
  const exportTransactions = async () => {
    try {
      // Build query string
      let queryParams = '';
      if (startDate && endDate) {
        queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      // Fetch CSV file
      window.open(`${API_URL}/api/admin/transactions/export${queryParams}`, '_blank');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES'
    });
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-golden-brown mr-3" />
        <p className="text-xl font-semibold text-golden-brown">Loading data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={handleRefresh}
            className="py-2 px-6 bg-golden-brown text-white font-semibold rounded-md hover:bg-golden-brown/90 transition-colors"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-golden-brown mb-4 md:mb-0">Admin Dashboard</h1>
        <button
          onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }}
          className="py-2 px-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors ml-4 mb-4 md:mb-0"
        >
          Logout
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleRefresh}
            className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Refresh
          </button>
          
          {activeTab === 'transactions' && (
            <button 
              onClick={exportTransactions}
              className="py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faFileDownload} className="mr-2" />
              Export CSV
            </button>
          )}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-3 px-6 font-semibold ${
            activeTab === 'transactions' 
              ? 'text-golden-brown border-b-2 border-golden-brown' 
              : 'text-gray-600 hover:text-golden-brown'
          }`}
        >
          <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
          Transactions
        </button>
        
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-6 font-semibold ${
            activeTab === 'orders' 
              ? 'text-golden-brown border-b-2 border-golden-brown' 
              : 'text-gray-600 hover:text-golden-brown'
          }`}
        >
          <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
          Orders
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 font-semibold ${
            activeTab === 'products' 
              ? 'text-golden-brown border-b-2 border-golden-brown' 
              : 'text-gray-600 hover:text-golden-brown'
          }`}
        >
          <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
          Products
        </button>
      </div>
      
      {/* Date Filter */}
      {activeTab === 'transactions' && (
        <div className="bg-warm-cream p-4 rounded-lg shadow-sm mb-6">
          <h3 className="font-semibold text-lg mb-3 text-golden-brown">Filter Transactions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-golden-yellow"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-gray-700 mb-1">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-golden-yellow"
              />
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors mr-2"
              >
                Clear
              </button>
              
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-golden-brown text-white rounded-md hover:bg-golden-brown/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transactionId || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Order: {transaction.orderId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatAmount(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order._id.substring(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-500">
                          Ref: {order.referenceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customer.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatAmount(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-golden-brown mb-6">Add New Product</h2>
          {productSuccess && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">{productSuccess}</div>
          )}
          {productError && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{productError}</div>
          )}
          <form onSubmit={handleProductSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Name</label>
              <input type="text" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productName} onChange={e => setProductName(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Description</label>
              <textarea className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productDescription} onChange={e => setProductDescription(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Price (KES)</label>
              <input type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productPrice} onChange={e => setProductPrice(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Category</label>
              <input type="text" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productCategory} onChange={e => setProductCategory(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">SKU</label>
              <input type="text" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productSku} onChange={e => setProductSku(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Stock Quantity</label>
              <input type="number" min="0" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productStockQuantity} onChange={e => setProductStockQuantity(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-semibold">Low Stock Threshold</label>
              <input type="number" min="0" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productLowStockThreshold} onChange={e => setProductLowStockThreshold(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1 font-semibold">Images (comma-separated URLs)</label>
              <input type="text" className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-golden-yellow" value={productImages} onChange={e => setProductImages(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-2 px-4 bg-golden-brown text-white font-semibold rounded hover:bg-golden-brown/90 transition-colors">Add Product</button>
          </form>
          <h2 className="text-xl font-bold text-golden-brown mb-4 mt-8">All Products</h2>
          {/* Product Table */}
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Category</th>
                  <th className="py-2 px-4 border-b">Price</th>
                  <th className="py-2 px-4 border-b">Stock</th>
                  <th className="py-2 px-4 border-b">SKU</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td className="py-2 px-4 border-b">
                      {editingId === product._id ? (
                        <input name="name" value={editFields.name} onChange={handleFieldChange} className="border px-2 py-1 rounded w-32" />
                      ) : product.name}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {editingId === product._id ? (
                        <input name="category" value={editFields.category} onChange={handleFieldChange} className="border px-2 py-1 rounded w-28" />
                      ) : product.category}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {editingId === product._id ? (
                        <input name="price" type="number" value={editFields.price} onChange={handleFieldChange} className="border px-2 py-1 rounded w-20" />
                      ) : `KES ${product.price}`}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {editingId === product._id ? (
                        <input name="stockQuantity" type="number" value={editFields.stockQuantity} onChange={handleFieldChange} className="border px-2 py-1 rounded w-16" />
                      ) : product.stockQuantity}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {editingId === product._id ? (
                        <input name="sku" value={editFields.sku} onChange={handleFieldChange} className="border px-2 py-1 rounded w-24" />
                      ) : product.sku}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {editingId === product._id ? (
                        <>
                          <button
                            className="mr-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            onClick={() => handleSave(product._id)}
                            disabled={savingId === product._id}
                          >
                            {savingId === product._id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </button>
                          <button
                            className={`px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 ${deletingId === product._id ? 'opacity-50' : ''}`}
                            onClick={() => handleDelete(product._id)}
                            disabled={deletingId === product._id}
                          >
                            {deletingId === product._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Product form submit handler
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductSuccess('');
    setProductError('');
    
    try {
      // Prepare product data
      const productData = {
        name: productName,
        description: productDescription,
        price: parseFloat(productPrice),
        category: productCategory,
        sku: productSku,
        stockQuantity: parseInt(productStockQuantity) || 0,
        lowStockThreshold: parseInt(productLowStockThreshold) || 5,
        images: productImages.split(',').map(url => url.trim()).filter(url => url !== '')
      };
      
      // Send API request
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API_URL}/api/products`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle success
      setProductSuccess('Product added successfully!');
      
      // Reset form
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductCategory('');
      setProductSku('');
      setProductStockQuantity('');
      setProductLowStockThreshold('');
      setProductImages('');
      
      // Refresh product list
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      setProductError(error.response?.data?.message || 'Failed to add product');
    }
  };
  
  // Edit product state declarations were moved to the top of the component

  // fetchProducts function moved to the top of the component

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      alert('Failed to delete product');
    }
    setDeletingId(null);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setEditFields({
      name: product.name,
      category: product.category,
      price: product.price,
      stockQuantity: product.stockQuantity,
      sku: product.sku
    });
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditFields(fields => ({ ...fields, [name]: value }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFields({});
  };

  const handleSave = async (id) => {
    setSavingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        name: editFields.name,
        category: editFields.category,
        price: parseFloat(editFields.price),
        stockQuantity: parseInt(editFields.stockQuantity, 10),
        sku: editFields.sku
      };
      await axios.put(`${API_URL}/api/products/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.map(p => p._id === id ? { ...p, ...payload } : p));
      setEditingId(null);
      setEditFields({});
    } catch (err) {
      alert('Failed to save changes');
    }
    setSavingId(null);
  };

  // The product table has been moved into the products tab section
};

export default AdminDashboardPage;
