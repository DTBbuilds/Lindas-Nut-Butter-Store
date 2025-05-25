import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, faUserTag, faEnvelope, faCheckSquare, faTimes,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BatchCustomerOperations = ({ selectedCustomers, onOperationComplete, onCancel }) => {
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [tagName, setTagName] = useState('');
  
  // Handle batch delete
  const handleBatchDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      // Create an array of promises for each delete operation
      const deletePromises = selectedCustomers.map(customerId => 
        axios.delete(`${API_URL}/api/admin/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      // Execute all delete operations in parallel
      const results = await Promise.allSettled(deletePromises);
      
      // Count successful and failed operations
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed === 0) {
        toast.success(`Successfully deleted ${successful} customers`);
      } else {
        toast.warning(`Deleted ${successful} customers, but failed to delete ${failed} customers`);
      }
      
      // Notify parent component to refresh the customer list
      onOperationComplete();
    } catch (error) {
      console.error('Error performing batch delete:', error);
      toast.error('Error performing batch operation');
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };
  
  // Handle batch email
  const handleBatchEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error('Please provide both subject and message for the email');
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/email/batch`,
        {
          customerIds: selectedCustomers,
          subject: emailSubject,
          message: emailBody
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success(`Email scheduled to be sent to ${selectedCustomers.length} customers`);
        onOperationComplete();
      } else {
        toast.error(response.data.message || 'Failed to schedule emails');
      }
    } catch (error) {
      console.error('Error sending batch emails:', error);
      toast.error('Error sending batch emails');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle batch tagging
  const handleBatchTag = async () => {
    if (!tagName) {
      toast.error('Please provide a tag name');
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/customers/tag`,
        {
          customerIds: selectedCustomers,
          tag: tagName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success(`Applied tag "${tagName}" to ${selectedCustomers.length} customers`);
        onOperationComplete();
      } else {
        toast.error(response.data.message || 'Failed to apply tags');
      }
    } catch (error) {
      console.error('Error applying batch tags:', error);
      toast.error('Error applying batch tags');
    } finally {
      setLoading(false);
    }
  };
  
  // Render operation form based on selected operation
  const renderOperationForm = () => {
    switch (operation) {
      case 'delete':
        return (
          <div className="mt-4">
            {confirmDelete ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Are you sure you want to delete {selectedCustomers.length} customers? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 mb-4">
                This will permanently delete {selectedCustomers.length} selected customers.
              </p>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setOperation('')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                disabled={loading}
              >
                {loading ? 'Processing...' : confirmDelete ? 'Confirm Delete' : 'Delete Customers'}
              </button>
            </div>
          </div>
        );
        
      case 'email':
        return (
          <div className="mt-4">
            <p className="text-gray-700 mb-4">
              Send an email to {selectedCustomers.length} selected customers.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">
                  Email Subject
                </label>
                <input
                  type="text"
                  id="emailSubject"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700">
                  Email Message
                </label>
                <textarea
                  id="emailBody"
                  rows={5}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter email message"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setOperation('')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchEmail}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'tag':
        return (
          <div className="mt-4">
            <p className="text-gray-700 mb-4">
              Apply a tag to {selectedCustomers.length} selected customers.
            </p>
            
            <div>
              <label htmlFor="tagName" className="block text-sm font-medium text-gray-700">
                Tag Name
              </label>
              <input
                type="text"
                id="tagName"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name (e.g., VIP, Inactive)"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setOperation('')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleBatchTag}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Apply Tag'}
              </button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="mt-4">
            <p className="text-gray-700 mb-4">
              Select an operation to perform on {selectedCustomers.length} customers:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setOperation('delete')}
                className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete Customers
              </button>
              
              <button
                onClick={() => setOperation('email')}
                className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                Email Customers
              </button>
              
              <button
                onClick={() => setOperation('tag')}
                className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faUserTag} className="mr-2" />
                Tag Customers
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Batch Operations ({selectedCustomers.length} customers selected)
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      {renderOperationForm()}
    </div>
  );
};

export default BatchCustomerOperations;
