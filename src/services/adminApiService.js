import axios from 'axios';

// Base URL for API requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthenticatedRequest = (token) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

// Helper to handle errors consistently
const handleApiError = (error) => {
  const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
  console.error('API Service Error:', errorMessage, error);
  throw new Error(errorMessage);
};

const adminApiService = {
  // Customer management
  getAllCustomers: async (page = 1, limit = 10, search = '', sortField = 'createdAt', sortDirection = 'desc') => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.get('/admin/customers', {
        params: { page, limit, search, sortField, sortDirection }
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getCustomerById: async (customerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.get(`/admin/customers/${customerId}`);
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  createCustomer: async (customerData) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.post('/admin/customers', customerData);
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  updateCustomer: async (customerId, customerData) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.put(`/admin/customers/${customerId}`, customerData);
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  deleteCustomer: async (customerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.delete(`/admin/customers/${customerId}`);
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Customer analytics
  getCustomerAnalytics: async (timeRange = 'month') => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.get('/admin/analytics/customers', {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Batch operations
  bulkDeleteCustomers: async (customerIds) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.post('/admin/customers/bulk-delete', { customerIds });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  bulkExportCustomers: async (format = 'csv') => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Authentication required');
      
      const request = createAuthenticatedRequest(token);
      const response = await request.get('/admin/customers/export', {
        params: { format },
        responseType: 'blob'
      });
      
      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers-export-${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

export default adminApiService;
