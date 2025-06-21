import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSearch, faTrash, faEye, faSort, faSortUp, faSortDown, faUserPlus, faEdit, faChartLine, faListUl } from '@fortawesome/free-solid-svg-icons';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomerForm from '../components/admin/CustomerForm';
import CustomerAnalytics from '../components/admin/CustomerAnalytics';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import adminApiService from '../services/adminApiService';

const AdminCustomersPage = () => {
  const { admin } = useAdminAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    newCustomersPercentage: 0,
    topCustomers: []
  });

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      const response = await adminApiService.getAllCustomers(
        pagination.page,
        pagination.limit,
        searchTerm,
        sortConfig.field,
        sortConfig.direction
      );
      
      if (response.data.success) {
        setCustomers(response.data.customers);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      if (err.response && err.response.status === 404) {
        setError('Customer data endpoint not found. This feature may not be available.');
      } else {
        setError('Error fetching customers. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer stats
  const fetchCustomerStats = async () => {
    try {
      const response = await adminApiService.getCustomerStats();
      
      if (response.data.success) {
        setCustomerStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error fetching customer stats:', err);
      if (err.response && err.response.status === 404) {
        console.warn('Customer stats endpoint not found. This feature may not be available.');
      }
    }
  };

  // Initial data load
  useEffect(() => {
    if (admin) {
      fetchCustomers();
      fetchCustomerStats();
    }
  }, [admin, pagination.page, sortConfig]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };

  // Handle sorting
  const handleSort = (field) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setCustomerToEdit(customer);
    setShowCustomerForm(true);
  };
  
  // Handle add new customer
  const handleAddCustomer = () => {
    setCustomerToEdit(null);
    setShowCustomerForm(true);
  };
  
  // Handle customer form success
  const handleCustomerFormSuccess = () => {
    fetchCustomers();
    fetchCustomerStats();
  };
  
  // Handle customer deletion
  const handleDeleteCustomer = async (customerId) => {
    try {
      setLoading(true);
      
      const response = await adminApiService.deleteCustomer(customerId);
      
      if (response.data.success) {
        toast.success('Customer deleted successfully');
        // Refresh customers list
        fetchCustomers();
        fetchCustomerStats();
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error(err.response?.data?.message || 'Error deleting customer');
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-green-600" />
      : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-green-600" />;
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
        <AdminHeader title="Customer Management" />
        
        <div className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Total Customers</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{customerStats.totalCustomers}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">New Customers (30 days)</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{customerStats.newCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {customerStats.newCustomersPercentage}% of total
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Top Customer</h3>
              {customerStats.topCustomers && customerStats.topCustomers.length > 0 ? (
                <p className="text-xl font-bold text-green-600 mt-2">
                  {customerStats.topCustomers[0]?.name || 'N/A'}
                </p>
              ) : (
                <p className="text-xl font-bold text-green-600 mt-2">N/A</p>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                  activeTab === 'list' 
                    ? 'text-green-600 border-b-2 border-green-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('list')}
              >
                <FontAwesomeIcon icon={faListUl} className="mr-2" />
                Customer List
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                  activeTab === 'analytics' 
                    ? 'text-green-600 border-b-2 border-green-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                Customer Analytics
              </button>
            </div>
          </div>
          
          {/* Customer List View */}
          {activeTab === 'list' && (
            <>
              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="mr-2 text-blue-600" />
                    Customers
                  </h1>
                  
                  <div className="flex space-x-4">
                    {/* Search Bar */}
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchCustomers()}
                      />
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-3 text-gray-400"
                      />
                    </div>
                    
                    {/* Add Customer Button */}
                    <button
                      onClick={handleAddCustomer}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                      Add Customer
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleSearch} className="flex flex-wrap items-center">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or phone"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Search
                  </button>
                </form>
              </div>
              
              {/* Customer Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex justify-center items-center p-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : error ? (
                    <div className="text-center p-6 text-red-500">{error}</div>
                  ) : customers.length === 0 ? (
                    <div className="text-center p-6 text-gray-500">
                      No customers found. {searchTerm && 'Try a different search term.'}
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('name')}
                          >
                            <span className="flex items-center">
                              Name {renderSortIcon('name')}
                            </span>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('email')}
                          >
                            <span className="flex items-center">
                              Email {renderSortIcon('email')}
                            </span>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('createdAt')}
                          >
                            <span className="flex items-center">
                              Registered {renderSortIcon('createdAt')}
                            </span>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Phone
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                          <tr key={customer._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{formatDate(customer.createdAt)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{customer.phoneNumber || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                to={`/admin/customers/${customer._id}`}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-green-600 hover:text-green-900 mr-3"
                                title="Edit Customer"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(customer._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Customer"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <CustomerAnalytics />
          )}
          
          {/* Pagination - Only shown in List tab */}
          {activeTab === 'list' && pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                    pagination.page === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white ${
                    pagination.page === pagination.pages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === 1 ? 'text-gray-400' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {[...Array(pagination.pages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show current page, first, last, and one before/after current
                      if (
                        pageNumber === 1 ||
                        pageNumber === pagination.pages ||
                        (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === pageNumber
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      
                      // Show ellipsis for breaks in sequence
                      if (
                        (pageNumber === 2 && pagination.page > 3) ||
                        (pageNumber === pagination.pages - 1 && pagination.page < pagination.pages - 2)
                      ) {
                        return (
                          <span
                            key={pageNumber}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === pagination.pages ? 'text-gray-400' : 'text-gray-500 hover:bg-gray-50'
                      }`}
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
      </div>
      
      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          customer={customerToEdit}
          onClose={() => setShowCustomerForm(false)}
          onSuccess={handleCustomerFormSuccess}
        />
      )}
      
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
                        Are you sure you want to delete this customer? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(confirmDelete)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
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

export default AdminCustomersPage;
