/**
 * Utility functions for data formatting
 */

/**
 * Format number as Kenyan Shilling
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show KES symbol
 * @returns {string} Formatted currency string
 */
export const formatKES = (amount, showSymbol = true) => {
  // Handle null/undefined amount
  if (amount === null || amount === undefined) return showSymbol ? 'KES 0' : '0';
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with thousands separators
  const formattedAmount = numAmount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return showSymbol ? `KES ${formattedAmount}` : formattedAmount;
};

/**
 * Format a date in a user-friendly format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
