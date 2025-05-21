/**
 * Currency utility functions for Linda's Nut Butter Store
 */

/**
 * Format a number as Kenyan Shillings
 * @param {number} amount - The amount to format
 * @param {boolean} useSymbol - Whether to use KES symbol (true) or code (false)
 * @param {number} decimals - Number of decimal places (default: 0 for whole numbers)
 * @returns {string} Formatted currency string
 */
export const formatKES = (amount, useSymbol = false, decimals = 0) => {
  if (amount === undefined || amount === null) return '';
  
  // Format with commas and specified decimal places
  const formattedAmount = parseFloat(amount).toLocaleString('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  // Return with KES code or KSh symbol
  return useSymbol ? `KSh ${formattedAmount}` : `KES ${formattedAmount}`;
};

/**
 * Calculate discounted price
 * @param {number} originalPrice - The original price
 * @param {number} discountPercentage - The discount percentage
 * @returns {number} The discounted price (rounded to whole number)
 */
export const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  if (!originalPrice || !discountPercentage) return originalPrice;
  
  const discountAmount = (originalPrice * discountPercentage) / 100;
  return Math.round(originalPrice - discountAmount);
};

/**
 * Format a phone number for M-Pesa
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Formatted phone number (254XXXXXXXXX)
 */
export const formatPhoneForMpesa = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  let formattedPhone = phoneNumber;
  
  // Remove leading zero if present
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1);
  }
  
  // Remove +254 if present
  if (formattedPhone.startsWith('+254')) {
    formattedPhone = formattedPhone.substring(4);
  }
  
  // Add 254 prefix if needed
  if (!formattedPhone.startsWith('254')) {
    formattedPhone = '254' + formattedPhone;
  }
  
  return formattedPhone;
};
