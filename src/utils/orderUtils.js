/**
 * Utility functions for order processing
 */

/**
 * Generate a unique order reference number
 * Format: LNB-YYMMDD-XXXX (where XXXX is a random alphanumeric string)
 * 
 * @returns {string} Unique order number
 */
export const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `LNB-${year}${month}${day}-${random}`;
};

/**
 * Format a date for display
 * 
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatOrderDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return dateObj.toLocaleDateString('en-KE', options);
};

/**
 * Get human-readable status label
 * 
 * @param {string} status - Status code
 * @returns {string} Human-readable status
 */
export const getStatusLabel = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled',
    'PAID': 'Paid',
    'FAILED': 'Failed',
    'REFUNDED': 'Refunded'
  };
  
  return statusMap[status] || status;
};

/**
 * Get color code for status
 * 
 * @param {string} status - Status code
 * @returns {object} Color classes for the status
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'PROCESSING': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'SHIPPED': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'DELIVERED': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'PAID': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'FAILED': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'REFUNDED': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
  };
  
  return colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
};
