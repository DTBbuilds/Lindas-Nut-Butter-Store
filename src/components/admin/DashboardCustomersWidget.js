import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faSearch, faUserEdit, faEye, faTrash,
  faSort, faSortUp, faSortDown, faSpinner, faFileDownload,
  faCheckSquare, faSquare, faList
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { debounce } from 'lodash';
import BatchCustomerOperations from './BatchCustomerOperations';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DashboardCustomersWidget = () => {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Cache for customer data
  const [customerCache, setCustomerCache] = useState({});
  
  // Fetch customers - memoized to prevent infinite dependency loops
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setError('Authorization required');
        setLoading(false);
        return;
      }
      
      // Create a cache key based on current query parameters
      const cacheKey = `${pagination.page}_${pagination.limit}_${searchTerm}_${sortConfig.field}_${sortConfig.direction}`;
      
      // Check if we have cached data for this query
      if (customerCache[cacheKey]) {
        console.log('Using cached customer data');
        setCustomers(customerCache[cacheKey].customers);
        setPagination(customerCache[cacheKey].pagination);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/api/admin/customers`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          sortField: sortConfig.field,
          sortOrder: sortConfig.direction
        }
      });
      
      if (response.data.success) {
        const data = {
          customers: response.data.customers,
          pagination: response.data.pagination
        };
        
        // Update the cache with the new data
        setCustomerCache(prevCache => ({
          ...prevCache,
          [cacheKey]: data
        }));
        
        setCustomers(data.customers);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setLoading(false);
      if (err.response && err.response.status === 404) {
        setError('Customer data endpoint not found. This feature may not be available.');
      } else {
        setError('Error fetching customers. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination, searchTerm, sortConfig, setCustomers, setPagination, setError, setLoading, setCustomerCache]);

  // Create a debounced version of search handler
  const debouncedSearch = useCallback(
    debounce(() => {
      // Reset to first page when searching
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchCustomers();
    }, 500),
    // Include all dependencies used inside the callback
    [searchTerm, fetchCustomers, setPagination]
  );
  
  // Effect for search term changes
  useEffect(() => {
    debouncedSearch();
    // Cancel the debounce on useEffect cleanup
    return debouncedSearch.cancel;
  }, [searchTerm, debouncedSearch]);
  
  // Initial data load
  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, sortConfig, fetchCustomers]);

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    // The debounced search will be triggered by the useEffect
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Cancel the debounce and search immediately
    debouncedSearch.cancel();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCustomers();
  };
  
  // Export customers to CSV
  const exportCustomersCSV = () => {
    // Get all customers - this could be enhanced to use a dedicated endpoint
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      setError('Authorization required');
      return;
    }
    
    // Set loading state
    setLoading(true);
    
    axios.get(`${API_URL}/api/admin/customers`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        limit: 1000, // Get a larger number of customers
        search: searchTerm,
        sortField: sortConfig.field,
        sortOrder: sortConfig.direction
      }
    })
    .then(response => {
      if (response.data.success) {
        const customers = response.data.customers;
        
        // Convert customers to CSV
        const headers = ['Name', 'Email', 'Phone Number', 'Registered Date'];
        const csvData = customers.map(customer => {
          return [
            customer.name,
            customer.email,
            customer.phoneNumber || 'N/A',
            new Date(customer.createdAt).toLocaleDateString()
          ];
        });
        
        // Add headers to CSV data
        csvData.unshift(headers);
        
        // Convert to CSV string
        const csvString = csvData.map(row => row.join(',')).join('\n');
        
        // Create and download CSV file
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Failed to export customers');
      }
    })
    .catch(err => {
      console.error('Error exporting customers:', err);
      setError('Error exporting customers. Please try again.');
    })
    .finally(() => {
      setLoading(false);
    });
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

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Select/deselect all customers
  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(customer => customer._id));
    }
  };
  
  // Toggle selection of a single customer
  const toggleSelectCustomer = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };
  
  // Handle batch operation completion
  const handleBatchOperationComplete = () => {
    setShowBatchOperations(false);
    setSelectedCustomers([]);
    fetchCustomers();
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">All Customers</h2>
        <Link 
          to="/admin/customers" 
          className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Advanced Management
        </Link>
      </div>
      
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between mb-4">
          <form onSubmit={handleSearch} className="flex flex-1 mr-2">
            <div className="flex-grow relative">
              <input
                type="text"
                placeholder="Search by name, email or phone"
                className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearchInputChange}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-r-lg transition-colors duration-300"
            >
              Search
            </button>
          </form>
          
          <button
            onClick={exportCustomersCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faFileDownload} className="mr-2" />
            Export CSV
          </button>
        </div>
        
        {/* Advanced filters */}
        <div className="flex flex-wrap gap-2 mt-2">
          <select 
            className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                setSortConfig({
                  field: 'createdAt',
                  direction: value
                });
              }
            }}
          >
            <option value="">Registration Date</option>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Batch Operations */}
      {selectedCustomers.length > 0 && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">
              {selectedCustomers.length} customers selected
            </span>
          </div>
          <button
            onClick={() => setShowBatchOperations(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
          >
            <FontAwesomeIcon icon={faList} className="mr-2" />
            Batch Actions
          </button>
        </div>
      )}
      
      {/* Batch Operations Modal */}
      {showBatchOperations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            <BatchCustomerOperations 
              selectedCustomers={selectedCustomers}
              onOperationComplete={handleBatchOperationComplete}
              onCancel={() => setShowBatchOperations(false)}
            />
          </div>
        </div>
      )}
      
      {/* Customers Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <FontAwesomeIcon icon={faSpinner} className="text-green-600 text-3xl animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center p-6 text-red-500">{error}</div>
        ) : customers.length === 0 ? (
          <div className="text-center p-6 text-gray-500">No customers found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <button 
                      className="mr-2 focus:outline-none"
                      onClick={toggleSelectAll}
                      title={selectedCustomers.length === customers.length ? "Deselect all" : "Select all"}
                    >
                      <FontAwesomeIcon 
                        icon={selectedCustomers.length === customers.length ? faCheckSquare : faSquare} 
                        className="text-gray-500 hover:text-green-500"
                      />
                    </button>
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email {renderSortIcon('email')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Joined {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button 
                        className="focus:outline-none"
                        onClick={() => toggleSelectCustomer(customer._id)}
                      >
                        <FontAwesomeIcon 
                          icon={selectedCustomers.includes(customer._id) ? faCheckSquare : faSquare} 
                          className="text-gray-400 hover:text-green-500"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    {customer.phoneNumber && (
                      <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/admin/customers/${customer._id}`} 
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="View Customer Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Link>
                    <Link 
                      to={`/admin/customers/${customer._id}`} 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit Customer"
                    >
                      <FontAwesomeIcon icon={faUserEdit} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && !error && customers.length > 0 && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                pagination.page === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
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
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">First</span>
                  <span className="text-xs">First</span>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <span className="text-xs">Prev</span>
                </button>
                
                {/* Page numbers */}
                {[...Array(pagination.pages).keys()].map((pageIndex) => {
                  const pageNum = pageIndex + 1;
                  // Only show 5 page numbers around the current page
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.pages ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === pagination.page - 2 && pagination.page > 3) ||
                    (pageNum === pagination.page + 2 && pagination.page < pagination.pages - 2)
                  ) {
                    // Add ellipsis
                    return (
                      <span
                        key={pageNum}
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
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === pagination.pages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <span className="text-xs">Next</span>
                </button>
                <button
                  onClick={() => handlePageChange(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.page === pagination.pages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <span className="text-xs">Last</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCustomersWidget;
