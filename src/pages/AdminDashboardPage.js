import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, faCheckCircle, faTimesCircle, faMoneyBill, 
  faShoppingBag, faFileDownload, faSync, faCalendarAlt,
  faComments, faChartBar, faUsers, faBoxes, faShoppingCart,
  faChartLine, faTag, faExclamationTriangle, faPercent, faStar,
  faBell, faBellSlash, faSearch, faUserPlus, faUserMinus, faUserCog,
  faIdCard, faArrowRight, faUserShield, faAddressBook, faUserFriends,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import FeedbackDashboard from '../components/admin/FeedbackDashboard';
import RealtimeTransactions from '../components/admin/RealtimeTransactions';
import CustomerManagementWidget from '../components/admin/CustomerManagementWidget';
import DashboardCustomersWidget from '../components/admin/DashboardCustomersWidget';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboardPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [productRankings, setProductRankings] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    newCustomersPercentage: 0,
    topCustomers: []
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRealTimeTransaction, setLastRealTimeTransaction] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRealtimePanel, setShowRealtimePanel] = useState(true);
  // Date filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Transaction states
  const [statusFilter, setStatusFilter] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionPagination, setTransactionPagination] = useState({ 
    page: 1, 
    limit: 10, 
    total: 0, 
    pages: 1 
  });
  
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
      // Use the inventory API endpoint which is specifically for admin access
      const res = await axios.get(`${API_URL}/api/inventory/products`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000, // 8 second timeout
        params: {
          limit: 100,
          page: 1
        }
      });
      
      // Handle different possible response formats
      let productsData = [];
      if (res.data && res.data.data && res.data.data.products) {
        // Format: { data: { products: [...] } }
        productsData = res.data.data.products;
      } else if (res.data && res.data.products) {
        // Format: { products: [...] }
        productsData = res.data.products;
      } else if (res.data && Array.isArray(res.data)) {
        // Format: [...]
        productsData = res.data;
      } else if (res.data && res.data.success && res.data.data) {
        // Format: { success: true, data: { products: [...] } }
        productsData = Array.isArray(res.data.data) ? res.data.data : res.data.data.products || [];
      }
      
      console.log('Products loaded successfully:', productsData.length);
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = err.response?.data?.message || 
        (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Failed to load products');
      setError(errorMessage);
      
      // Provide fallback empty products array to prevent UI errors
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // Helper function to safely fetch data with better error handling
    const safelyFetchData = async (url, setter, defaultValue = [], retries = 1) => {
      try {
        const response = await axios.get(`${API_URL}${url}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          // Add timeout to prevent long-hanging requests
          timeout: 12000 // Increased timeout for slower connections
        });
        
        // Check for different response formats
        if (response.data && response.data.data !== undefined) {
          setter(response.data.data || defaultValue);
        } else if (response.data && Array.isArray(response.data)) {
          setter(response.data);
        } else if (response.data && response.data.success) {
          setter(response.data.data || defaultValue);
        } else {
          console.warn(`Unexpected data format from ${url}:`, response.data);
          setter(defaultValue);
        }
        return true;
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        
        // Retry logic for transient errors
        if (retries > 0 && (err.code === 'ECONNABORTED' || err.response?.status >= 500)) {
          console.log(`Retrying ${url}, ${retries} attempts left`);
          return await safelyFetchData(url, setter, defaultValue, retries - 1);
        }
        
        setter(defaultValue);
        return false;
      }
    };
    
    // Fetch all data in parallel
    const results = await Promise.allSettled([
      // Dashboard statistics
      safelyFetchData('/api/admin/dashboard/stats', setDashboardStats, null),
      
      // Transactions
      safelyFetchData('/api/admin/transactions', setTransactions, []),
      
      // Orders
      safelyFetchData('/api/admin/orders', setOrders, []),
      
      // Monthly sales data
      safelyFetchData('/api/admin/dashboard/monthly-sales', setMonthlySales, []),
      
      // Product rankings
      safelyFetchData('/api/admin/dashboard/product-rankings', setProductRankings, []),
      
      // Recent feedback - with 2 retries for this specific endpoint
      safelyFetchData('/api/admin/dashboard/recent-feedback', setRecentFeedback, [], 2),
      
      // Customer statistics
      safelyFetchData('/api/admin/customers/stats', (data) => {
        if (data && data.stats) {
          setCustomerStats(data.stats);
        } else {
          setCustomerStats({
            totalCustomers: 0,
            newCustomers: 0,
            newCustomersPercentage: 0,
            topCustomers: []
          });
        }
      }, {
        totalCustomers: 0,
        newCustomers: 0,
        newCustomersPercentage: 0,
        topCustomers: []
      }),
      
      // Recent customers
      safelyFetchData('/api/admin/customers?limit=5&sortField=createdAt&sortOrder=desc', (data) => {
        if (data && data.customers) {
          setRecentCustomers(data.customers);
        } else {
          setRecentCustomers([]);
        }
      }, [])
    ]);
    
    // Check if all requests failed
    const allFailed = results.every(result => result.status === 'rejected' || result.value === false);
    if (allFailed) {
      setError('Unable to connect to the server. Please check your connection and try again.');
    }
    
    setLoading(false);
  };
  
  // Add useEffect hooks
  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Only poll if on transactions tab and not already loading
    if (activeTab !== 'transactions' || loading) return;
    
    console.log('Setting up transaction polling');
    
    // Create polling interval (every 10 seconds)
    const pollInterval = setInterval(async () => {
      try {
        // Fetch the most recent transactions
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(
          `${API_URL}/api/admin/transactions?limit=5&sort=-timestamp`, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        const latestTransactions = response.data.data || [];
        
        if (latestTransactions.length > 0) {
          const newTransaction = latestTransactions[0];
          
          // Check if this is a new transaction we haven't seen
          if (transactions.length === 0) {
            handleNewTransaction(newTransaction, 'created');
            return;
          }
          
          const existingTransaction = transactions.find(t => 
            t._id === newTransaction._id ||
            t.checkoutRequestId === newTransaction.checkoutRequestId
          );
          
          // If new transaction, update the UI
          if (!existingTransaction) {
            console.log('New transaction detected:', newTransaction);
            handleNewTransaction(newTransaction, 'created');
          } 
          // If status changed to completed, update UI
          else if (existingTransaction.status !== newTransaction.status && 
                  newTransaction.status === 'COMPLETED') {
            console.log('Transaction completed:', newTransaction);
            handleNewTransaction(newTransaction, 'completed');
          }
        }
      } catch (error) {
        console.error('Error polling for transactions:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    // Clean up interval on unmount or tab change
    return () => {
      console.log('Clearing transaction polling');
      clearInterval(pollInterval);
    };
  }, [activeTab, transactions, loading]);
  
  // Export transactions as CSV
  const exportTransactions = async () => {
    try {
      // Get current date for filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `transactions_export_${date}.csv`;
      
      // Set up query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter) params.append('status', statusFilter);
      
      // Fetch CSV data
      const response = await axios.get(
        `${API_URL}/api/admin/transactions/export?${params.toString()}`,
        { 
          responseType: 'blob',
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      setError('Failed to export transactions');
    }
  };

  // Transaction filtering
  const filterTransactions = () => {
    setLoading(true);
    // Call the API with date filters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (statusFilter) params.append('status', statusFilter);
    params.append('page', transactionPagination.page);
    params.append('limit', transactionPagination.limit);
    
    // Make API request
    axios.get(`${API_URL}/api/admin/transactions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    })
      .then(response => {
        setTransactions(response.data.data || []);
        setTransactionPagination(response.data.pagination || { 
          page: 1, 
          limit: 10, 
          total: 0, 
          pages: 1 
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error filtering transactions:', error);
        setError(error.response?.data?.message || 'Failed to filter transactions');
        setLoading(false);
      });
  };
  
  // Change transaction page
  const changeTransactionPage = (newPage) => {
    if (newPage < 1 || newPage > transactionPagination.pages) return;
    setTransactionPagination({ ...transactionPagination, page: newPage });
    // Update and re-fetch
    setTimeout(filterTransactions, 0);
  };
  
  // View transaction details
  const viewTransactionDetails = (transaction) => {
    setCurrentTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleRefresh = () => {
    filterTransactions();
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Format amount with currency
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return `KES ${parseFloat(amount).toLocaleString()}`;
  };
  
  // Handle real-time transaction updates
  const handleNewTransaction = (transaction, type) => {
    // Only update if it's a completed transaction or a new transaction
    if (type === 'completed' || type === 'created') {
      // Refresh the transaction list to include the new transaction
      fetchData();
      
      // Show notification for transaction
      setLastRealTimeTransaction({
        transaction,
        type,
        timestamp: new Date()
      });
    }
  };
  
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
        <div className="flex items-center mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-golden-brown">Admin Dashboard</h1>
          {lastRealTimeTransaction && (
            <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full animate-pulse">
              New transaction {lastRealTimeTransaction.timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowRealtimePanel(!showRealtimePanel)}
            className={`py-2 px-4 ${showRealtimePanel ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} font-semibold rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center`}
          >
            <FontAwesomeIcon icon={faBell} className="mr-2" />
            {showRealtimePanel ? 'Hide Live Updates' : 'Show Live Updates'}
          </button>
          
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
          
          <button
            onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }}
            className="py-2 px-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors flex items-center justify-center"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Real-time transactions panel */}
      {showRealtimePanel && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Real-time Transaction Updates</h3>
          <RealtimeTransactions onNewTransaction={handleNewTransaction} />
        </div>
      )}
      
      {/* Tab Navigation - Improved with sticky position and better visual hierarchy */}
      <div className="sticky top-0 z-10 bg-white pt-2 pb-0 shadow-sm">
        <div className="flex border-b border-gray-200 mb-0 overflow-x-auto scrollbar-hide">
          <button 
            className={`px-6 py-3 text-base font-medium transition-all duration-200 ${activeTab === 'dashboard' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
            onClick={() => setActiveTab('dashboard')}
            title="Overview of store performance"
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Dashboard
          </button>
          <button 
            className={`px-6 py-3 text-base font-medium transition-all duration-200 ${activeTab === 'transactions' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
            onClick={() => setActiveTab('transactions')}
            title="View and manage transactions"
          >
            <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
            Transactions
          </button>
          <button 
            className={`px-6 py-3 text-base font-medium transition-all duration-200 ${activeTab === 'customers' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
            onClick={() => setActiveTab('customers')}
            title="View and manage customers"
          >
            <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
            Customers
          </button>
          <button 
            className={`px-6 py-3 text-base font-medium transition-all duration-200 ${activeTab === 'products' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
            onClick={() => setActiveTab('products')}
            title="Manage your product inventory"
          >
            <FontAwesomeIcon icon={faBoxes} className="mr-2" />
            Products
          </button>
          <button 
            className={`px-6 py-3 text-base font-medium transition-all duration-200 ${activeTab === 'orders' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
            onClick={() => setActiveTab('orders')}
            title="Manage customer orders"
          >
            <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
            Orders
          </button>
          <button 
            className={`px-6 py-3 text-base font-medium transition-all duration-200 ${activeTab === 'feedback' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
            onClick={() => setActiveTab('feedback')}
            title="View customer feedback"
          >
            <FontAwesomeIcon icon={faComments} className="mr-2" />
            Feedback
          </button>
        </div>
        
        {/* Quick action buttons */}
        <div className="flex justify-end px-4 py-2 bg-gray-50 border-b border-gray-200">
          <button 
            onClick={() => fetchData()}
            className="text-sm text-gray-600 hover:text-green-600 mr-4 flex items-center"
            title="Refresh data"
          >
            <FontAwesomeIcon icon={faSync} className="mr-1" spin={loading} />
            Refresh
          </button>
          {activeTab === 'transactions' && (
            <button 
              onClick={exportTransactions}
              className="text-sm text-gray-600 hover:text-green-600 flex items-center"
              title="Export transactions to CSV"
            >
              <FontAwesomeIcon icon={faFileDownload} className="mr-1" />
              Export
            </button>
          )}
        </div>
      </div>
      
      {/* Add spacing after the sticky navigation */}
      <div className="mb-6"></div>
      
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
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard Overview</h2>
          
          {!dashboardStats ? (
            <div className="flex justify-center py-8">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-green-600" />
            </div>
          ) : (
            <div>
              {/* Real-time Transaction Notification */}
              {lastRealTimeTransaction && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in
                  ${lastRealTimeTransaction.type === 'completed' ? 'bg-green-100 border-green-500' : 
                    lastRealTimeTransaction.type === 'failed' ? 'bg-red-100 border-red-500' : 
                    'bg-blue-100 border-blue-500'} border-l-4`}
                >
                  <div className="flex items-start">
                    <div className="mr-3">
                      <FontAwesomeIcon 
                        icon={lastRealTimeTransaction.type === 'completed' ? faCheckCircle : 
                              lastRealTimeTransaction.type === 'failed' ? faTimesCircle : 
                              faMoneyBill} 
                        className={`${lastRealTimeTransaction.type === 'completed' ? 'text-green-500' : 
                                  lastRealTimeTransaction.type === 'failed' ? 'text-red-500' : 
                                  'text-blue-500'} text-xl`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {lastRealTimeTransaction.type === 'completed' ? 'Payment Completed' : 
                         lastRealTimeTransaction.type === 'failed' ? 'Payment Failed' : 
                         'New Transaction'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {lastRealTimeTransaction.transaction.amount ? 
                          `KES ${lastRealTimeTransaction.transaction.amount.toLocaleString()}` : ''}
                        {lastRealTimeTransaction.transaction.phoneNumber ? 
                          ` - ${lastRealTimeTransaction.transaction.phoneNumber}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(lastRealTimeTransaction.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => setLastRealTimeTransaction(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FontAwesomeIcon icon={faTimesCircle} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Dashboard Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Orders Stats */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.orders.total}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full">
                      <FontAwesomeIcon icon={faShoppingCart} className="text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Today: {dashboardStats.orders.today}</span>
                    <span className="text-gray-500">This Month: {dashboardStats.orders.month}</span>
                  </div>
                </div>
                
                {/* Revenue Stats */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                      <p className="text-2xl font-bold text-gray-800">KES {dashboardStats.revenue.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FontAwesomeIcon icon={faMoneyBill} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Today: KES {dashboardStats.revenue.today.toLocaleString()}</span>
                    <span className="text-gray-500">This Month: KES {dashboardStats.revenue.month.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Products Stats */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Products</h3>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.products.total}</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-full">
                      <FontAwesomeIcon icon={faBoxes} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 mr-1" />
                    <span className="text-gray-500">{dashboardStats.products.lowStock} Low Stock</span>
                  </div>
                </div>
                
                {/* Feedback Stats */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Customer Feedback</h3>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.feedback.total}</p>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-full">
                      <FontAwesomeIcon icon={faStar} className="text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Avg Rating: {dashboardStats.feedback.averageRating}/5</span>
                    <span className="text-gray-500">NPS: {dashboardStats.feedback.averageNps}</span>
                  </div>
                </div>
              </div>
              
              {/* Monthly Sales Chart */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Monthly Sales (2025)</h3>
                <div className="h-64 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex h-full">
                    {monthlySales.map((data, index) => {
                      // Calculate height as percentage of max value (max 90% of container height)
                      const maxValue = Math.max(...monthlySales.map(d => d.sales));
                      const height = maxValue > 0 ? (data.sales / maxValue * 90) : 0;
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col justify-end items-center">
                          <div className="relative group">
                            <div 
                              className="bg-green-500 w-8 rounded-t-sm transition-all duration-300 hover:bg-green-600"
                              style={{ height: `${height}%` }}
                            ></div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              KES {data.sales.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{monthNames[data.month - 1]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Customer Management Section */}
              <CustomerManagementWidget customerStats={customerStats} recentCustomers={recentCustomers} />
              
              {/* Top Products & Recent Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Top Selling Products</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {productRankings.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No product data available</div>
                    ) : (
                      productRankings.slice(0, 5).map((product, index) => (
                        <div key={index} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <span className="text-gray-900 font-medium">{product.name}</span>
                            <div className="text-sm text-gray-500">{product.totalSold} sold</div>
                          </div>
                          <div className="text-green-600 font-medium">KES {product.totalRevenue.toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Recent Feedback */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Recent Customer Feedback</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {recentFeedback.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No feedback available</div>
                    ) : (
                      recentFeedback.slice(0, 5).map((feedback, index) => (
                        <div key={index} className="px-4 py-3">
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-medium">{feedback.customer.name}</span>
                            <div className="flex items-center">
                              <span className="text-amber-500 mr-1">{feedback.ratings.overall}</span>
                              <FontAwesomeIcon icon={faStar} className="text-amber-500 text-sm" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{feedback.comments || 'No comment provided'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Filter Section */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Transaction Records</h3>
              <button 
                onClick={exportTransactions}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-1 text-sm flex items-center"
              >
                <FontAwesomeIcon icon={faFileDownload} className="mr-1" />
                Export CSV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input 
                  type="date" 
                  id="startDate"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input 
                  type="date" 
                  id="endDate"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Transaction Status</label>
                <select
                  id="statusFilter"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={filterTransactions}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-green-600" />
            </div>
          ) : (
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction._id || transaction.checkoutRequestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.checkoutRequestId || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Order: {transaction.orderId?.referenceNumber || transaction.orderId || 'N/A'}
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
                            {transaction.type || 'MPESA'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          <button onClick={() => viewTransactionDetails(transaction)} className="hover:text-blue-800">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {transactions.length > 0 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => changeTransactionPage(transactionPagination.page - 1)}
                      disabled={transactionPagination.page === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${transactionPagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => changeTransactionPage(transactionPagination.page + 1)}
                      disabled={transactionPagination.page === transactionPagination.pages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${transactionPagination.page === transactionPagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{Math.min((transactionPagination.page - 1) * transactionPagination.limit + 1, transactionPagination.total)}</span> to <span className="font-medium">{Math.min(transactionPagination.page * transactionPagination.limit, transactionPagination.total)}</span> of <span className="font-medium">{transactionPagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => changeTransactionPage(transactionPagination.page - 1)}
                          disabled={transactionPagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${transactionPagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {Array.from({ length: Math.min(5, transactionPagination.pages) }, (_, i) => {
                          // Calculate page numbers to show (centered around current page)
                          const totalPages = transactionPagination.pages;
                          const currentPage = transactionPagination.page;
                          let startPage = Math.max(1, currentPage - 2);
                          const endPage = Math.min(startPage + 4, totalPages);
                          
                          if (endPage - startPage < 4) {
                            startPage = Math.max(1, endPage - 4);
                          }
                          
                          const pageNum = startPage + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => changeTransactionPage(pageNum)}
                              aria-current={pageNum === currentPage ? 'page' : undefined}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === currentPage
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => changeTransactionPage(transactionPagination.page + 1)}
                          disabled={transactionPagination.page === transactionPagination.pages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${transactionPagination.page === transactionPagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
      
      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <FeedbackDashboard />
        </div>
      )}
      
      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Customer Management</h2>
            <a 
              href="/admin/customers" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              View All Customers
            </a>
          </div>
          
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
                  <p className="text-2xl font-bold text-gray-800">{customerStats.totalCustomers}</p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <FontAwesomeIcon icon={faUsers} className="text-indigo-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>Active accounts</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">New Customers (30 days)</h3>
                  <p className="text-2xl font-bold text-gray-800">{customerStats.newCustomers}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <FontAwesomeIcon icon={faUserPlus} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>{customerStats.newCustomersPercentage}% growth</span>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Top Customer</h3>
                  <p className="text-xl font-bold text-gray-800 truncate max-w-[180px]">
                    {customerStats.topCustomers && customerStats.topCustomers.length > 0 ? 
                      customerStats.topCustomers[0]?.customerDetails?.[0]?.name || 'N/A' : 
                      'N/A'}
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded-full">
                  <FontAwesomeIcon icon={faUserShield} className="text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <span>Most valuable customer</span>
              </div>
            </div>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/admin/customers" 
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mr-4">
                  <FontAwesomeIcon icon={faUsers} size="lg" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">View All Customers</h4>
                  <p className="text-sm text-gray-500">Browse and manage all customer accounts</p>
                </div>
              </a>
              
              <a 
                href="/admin/customers?filter=new" 
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4">
                  <FontAwesomeIcon icon={faUserPlus} size="lg" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">New Customers</h4>
                  <p className="text-sm text-gray-500">View recently registered customers</p>
                </div>
              </a>
              
              <a 
                href="/admin/reports/customers" 
                className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4">
                  <FontAwesomeIcon icon={faChartBar} size="lg" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Customer Analytics</h4>
                  <p className="text-sm text-gray-500">View detailed customer metrics and reports</p>
                </div>
              </a>
            </div>
          </div>
          
          {/* Recent Customers */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Customers</h3>
              <span className="text-sm text-gray-500">Last 10 registrations</span>
            </div>
            
            {recentCustomers && recentCustomers.length > 0 ? (
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentCustomers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                              <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phoneNumber || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a 
                            href={`/admin/customers/${customer._id}`} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-500 mb-2">No recent customers found</div>
                <a 
                  href="/admin/customers" 
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View All Customers
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Management</h2>
          
          <div className="mb-8">
            <DashboardCustomersWidget />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Customers:</span>
                  <span className="text-lg font-semibold text-gray-800">{customerStats.totalCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Customers (30 days):</span>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-800">{customerStats.newCustomers}</span>
                    {customerStats.newCustomersPercentage > 0 && (
                      <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        +{customerStats.newCustomersPercentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
              {customerStats.topCustomers && customerStats.topCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerStats.topCustomers.map((customer) => (
                        <tr key={customer._id || customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faUser} className="text-green-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.totalOrders}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(customer.totalSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a href={`/admin/customers/${customer._id || customer.id}`} className="text-green-600 hover:text-green-900">
                              View Details
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No customer data available</div>
              )}
            </div>
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
      
      {/* Transaction Details Modal */}
      {showTransactionModal && currentTransaction && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
          <button 
            onClick={() => setShowTransactionModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Transaction ID</p>
              <p className="mt-1 text-sm text-gray-900">{currentTransaction.checkoutRequestId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Order Reference</p>
              <p className="mt-1 text-sm text-gray-900">
                {currentTransaction.orderId?.referenceNumber || currentTransaction.orderId || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="mt-1 text-sm text-gray-900 font-medium">KES {currentTransaction.amount?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Payment Type</p>
              <p className="mt-1 text-sm text-gray-900">{currentTransaction.type || 'MPESA'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                  ${currentTransaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                    currentTransaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    currentTransaction.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    currentTransaction.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                    currentTransaction.status === 'REFUNDED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'}
                `}>
                  {currentTransaction.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="mt-1 text-sm text-gray-900">{currentTransaction.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date & Time</p>
              <p className="mt-1 text-sm text-gray-900">{new Date(currentTransaction.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created By</p>
              <p className="mt-1 text-sm text-gray-900">{currentTransaction.createdBy || 'System'}</p>
            </div>
          </div>
          
          {/* Additional transaction details if available */}
          {currentTransaction.mpesaReceipt && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">M-Pesa Details</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm"><span className="font-medium">Receipt Number:</span> {currentTransaction.mpesaReceipt}</p>
                {currentTransaction.mpesaPhoneNumber && (
                  <p className="text-sm"><span className="font-medium">M-Pesa Phone:</span> {currentTransaction.mpesaPhoneNumber}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-3 bg-gray-50 text-right rounded-b-lg">
          <button
            onClick={() => setShowTransactionModal(false)}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );

  // These functions were moved above the JSX return

  // The product table has been moved into the products tab section
};

export default AdminDashboardPage;
