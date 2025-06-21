/**
 * Validation utilities for Linda's Nut Butter Store
 * Handles validation of cart items, prices, and other critical data
 */

const mongoose = require('mongoose');
const Product = require('../../server/models/Product');

/**
 * Validates an array of cart items against the product database
 * Checks for product existence, price accuracy, and stock availability
 * 
 * @param {Array} items - Array of cart items to validate
 * @param {Object} options - Optional configuration
 * @param {Number} options.priceTolerance - Tolerance percentage for price variation (default: 0.05 or 5%)
 * @param {Boolean} options.checkStock - Whether to check stock availability (default: true)
 * @returns {Object} Validation result with success flag and any errors
 */
const validateCartItems = async (items, options = {}) => {
  // Default options
  const config = {
    priceTolerance: options.priceTolerance || 0.05, // 5% tolerance by default
    checkStock: options.checkStock !== false, // Check stock by default
    allowSpecialOrders: options.allowSpecialOrders === true // Allow special order products even if out of stock
  };
  
  console.log('Cart validation config:', config);

  // Validation results
  const result = {
    valid: true,
    errors: [],
    validatedItems: []
  };

  // Empty cart validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    result.valid = false;
    result.errors.push({ code: 'EMPTY_CART', message: 'Cart is empty or invalid' });
    return result;
  }

  try {
    // Extract unique product IDs for efficient querying
    const productIds = [...new Set(items.map(item => item.productId))];
    
    if (productIds.length === 0) {
      result.valid = false;
      result.errors.push({ code: 'INVALID_PRODUCT_IDS', message: 'No valid product IDs found in cart' });
      return result;
    }

    // Fetch all products in a single query
    const products = await Product.find({
      $or: [
        { _id: { $in: productIds } },
        { id: { $in: productIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) } }
      ]
    }).lean();

    // Create lookup map for products
    const productMap = {};
    products.forEach(product => {
      // Index by various ID formats for flexible lookup
      if (product._id) productMap[product._id.toString()] = product;
      if (product.id) productMap[product.id.toString()] = product;
    });

    // Validate each item
    for (const item of items) {
      const itemResult = {
        productId: item.productId,
        valid: true,
        errors: [],
        originalItem: item,
        validatedProduct: null
      };

      // Convert productId to string for consistent comparison
      const productIdStr = item.productId?.toString();
      const product = productMap[productIdStr];

      // 1. Check if product exists
      if (!product) {
        itemResult.valid = false;
        itemResult.errors.push({
          code: 'PRODUCT_NOT_FOUND',
          message: `Product not found: ${item.productId}`
        });
        result.errors.push(itemResult.errors[0]);
        result.valid = false;
        result.validatedItems.push(itemResult);
        continue;
      }

      itemResult.validatedProduct = product;
      
      // 2. Validate quantity
      if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        itemResult.valid = false;
        itemResult.errors.push({
          code: 'INVALID_QUANTITY',
          message: `Invalid quantity for ${product.name}: ${item.quantity}`
        });
        result.errors.push(itemResult.errors[0]);
        result.valid = false;
      }

      // 3. Check stock availability (skip for products marked as "order only")
      const isOrderOnly = product.name === 'Chocolate Mint Peanut Butter' || 
                          (product.name.includes('Chocolate Mint') && product.name.includes('Peanut Butter')) ||
                          product.specialOrder === true;
      
      console.log(`Stock check for ${product.name}:`, { 
        isOrderOnly, 
        stockQuantity: product.stockQuantity,
        requestedQuantity: item.quantity,
        allowSpecialOrders: config.allowSpecialOrders
      });
      
      // If this is a special order product and we're allowing special orders,
      // skip the stock check completely
      if (isOrderOnly && config.allowSpecialOrders) {
        console.log(`Allowing special order product: ${product.name} despite stock level`);
      }
      // Otherwise, perform normal stock check
      else if (config.checkStock && product.stockQuantity < item.quantity) {
        itemResult.valid = false;
        itemResult.errors.push({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        });
        result.errors.push(itemResult.errors[0]);
        result.valid = false;
      }

      // 4. Validate price to prevent client-side manipulation
      if (item.unitPrice) {
        const expectedPrice = parseFloat(product.price);
        const submittedPrice = parseFloat(item.unitPrice);
        
        if (isNaN(submittedPrice) || isNaN(expectedPrice)) {
          itemResult.valid = false;
          itemResult.errors.push({
            code: 'INVALID_PRICE_FORMAT',
            message: `Invalid price format for ${product.name}`
          });
          result.errors.push(itemResult.errors[0]);
          result.valid = false;
        } else {
          const priceDifference = Math.abs(expectedPrice - submittedPrice) / expectedPrice;
          
          if (priceDifference > config.priceTolerance) {
            itemResult.valid = false;
            itemResult.errors.push({
              code: 'PRICE_MISMATCH',
              message: `Price mismatch for ${product.name}. Expected: ${expectedPrice}, Got: ${submittedPrice}`
            });
            result.errors.push(itemResult.errors[0]);
            result.valid = false;
          }
        }
      }

      // 5. Validate total price calculation
      if (item.totalPrice && item.unitPrice && item.quantity) {
        const expectedTotal = parseFloat(item.unitPrice) * parseInt(item.quantity, 10);
        const submittedTotal = parseFloat(item.totalPrice);
        
        if (!isNaN(expectedTotal) && !isNaN(submittedTotal)) {
          const totalDifference = Math.abs(expectedTotal - submittedTotal);
          
          // Allow a small difference (1 unit) for rounding errors
          if (totalDifference > 1) {
            itemResult.valid = false;
            itemResult.errors.push({
              code: 'TOTAL_PRICE_MISMATCH',
              message: `Total price calculation error for ${product.name}`
            });
            result.errors.push(itemResult.errors[0]);
            result.valid = false;
          }
        }
      }

      result.validatedItems.push(itemResult);
    }

    return result;
  } catch (error) {
    console.error('Cart validation error:', error);
    return {
      valid: false,
      errors: [{ code: 'VALIDATION_ERROR', message: error.message }],
      validatedItems: []
    };
  }
};

/**
 * Validates and standardizes discount codes
 * Note: Currently disabled as per business requirements
 * 
 * @param {String} code - Discount code to validate
 * @returns {Object} Validation result with valid flag and discount details
 */
const validateDiscountCode = (code) => {
  // DISCOUNT CODES ARE CURRENTLY DISABLED
  // Return invalid for all codes
  console.log('Discount codes are currently disabled, but code preserved for future use');
  return { valid: false, message: 'Discount codes are not currently accepted' };
  
  // Code below is preserved for future use
  /*
  // Standardize code format
  const normalizedCode = code ? code.toUpperCase().trim() : '';
  
  if (!normalizedCode) {
    return { valid: false, message: 'No discount code provided' };
  }
  
  // Hardcoded discount codes and their values
  // In a real app, these would come from a database
  const validCodes = {
    'WELCOME10': { type: 'percentage', value: 10 },
    'FREESHIP': { type: 'shipping', value: 0 },
    'LINDA25': { type: 'percentage', value: 25 }
  };
  
  if (validCodes[normalizedCode]) {
    return {
      valid: true,
      code: normalizedCode,
      ...validCodes[normalizedCode]
    };
  }
  
  return { valid: false, message: 'Invalid discount code' };
  */
};

/**
 * Calculates order totals based on validated items and discounts
 * Note: VAT and discounts are currently disabled as per business requirements
 * 
 * @param {Array} validatedItems - Array of validated cart items
 * @param {Object} discount - Optional discount to apply (currently ignored)
 * @returns {Object} Calculated order totals
 */
const calculateOrderTotals = (validatedItems, discount = null) => {
  // Filter to only valid items with products
  const items = validatedItems
    .filter(item => item.valid && item.validatedProduct)
    .map(item => ({
      product: item.validatedProduct,
      quantity: item.originalItem.quantity,
      unitPrice: item.validatedProduct.price,
      totalPrice: item.validatedProduct.price * item.originalItem.quantity
    }));
  
  // Calculate subtotal from validated prices (not client-submitted prices)
  const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
  
  // Flat shipping fee of 300 KSH for all orders
  const shipping = 300; // Flat shipping fee regardless of order total
  
  // VAT and discounts are disabled
  const tax = 0; // VAT disabled
  const discountAmount = 0; // Discounts disabled
  
  // Calculate final total
  const total = subtotal + shipping;
  
  return {
    items,
    subtotal,
    tax, // Will be 0
    shipping,
    discount: discountAmount, // Will be 0
    total: Math.round(total * 100) / 100, // Round to 2 decimal places
    discountCode: null // Discounts disabled
  };
  
  /* 
  // Code preserved for future reference if VAT and discounts are re-enabled
  const taxRate = 0.16; // 16% VAT
  const tax = subtotal * taxRate;
  
  // Apply discount
  let discountAmount = 0;
  if (discount && discount.valid) {
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === 'shipping') {
      shipping = discount.value;
    }
  }
  
  // Calculate final total with VAT and discounts
  const total = subtotal + tax + shipping - discountAmount;
  */
};

module.exports = {
  validateCartItems,
  validateDiscountCode,
  calculateOrderTotals
};
