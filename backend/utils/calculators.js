/**
 * Calculation utilities for Linda's Nut Butter Store
 * Handles totals, shipping, discounts, and other financial calculations
 */

/**
 * Calculates order totals based on validated items
 * @param {Array} validatedItems - Array of validated cart items
 * @param {Object} discountValidation - Optional discount validation result
 * @returns {Object} Order totals with items, subtotal, shipping, and adjustments
 */
const calculateOrderTotals = (validatedItems, discountValidation = null) => {
  // Extract valid items only (with their validated product data)
  const validItems = validatedItems
    .filter(item => item.valid && item.validatedProduct)
    .map(item => {
      const product = item.validatedProduct;
      const quantity = item.originalItem.quantity;
      const unitPrice = product.price || 0;
      const totalPrice = unitPrice * quantity;
      
      return {
        product,
        quantity,
        unitPrice,
        totalPrice
      };
    });
  
  // Calculate subtotal (sum of all item totals)
  const subtotal = validItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Standard shipping rate (flat fee)
  const shipping = 300; // 300 KES flat fee
  
  // Calculate any discounts (if applicable - currently disabled)
  let discount = 0;
  let discountCode = null;
  if (discountValidation && discountValidation.valid) {
    discount = discountValidation.amount || 0;
    discountCode = discountValidation.code;
  }
  
  // Final total (subtotal + shipping - discount)
  const total = subtotal + shipping - discount;
  
  return {
    items: validItems,
    subtotal,
    shipping,
    discount,
    discountCode,
    total
  };
};

module.exports = {
  calculateOrderTotals
};
