/**
 * Inventory Management Utility
 * 
 * Handles all inventory-related operations:
 * - Updating inventory when orders are placed
 * - Tracking inventory changes
 * - Generating alerts for low stock
 * - Automated reordering
 */

const { Product, InventoryLog } = require('../models');
const emailService = require('./emailService');
const config = require('../config');

/**
 * Update product inventory and log the change
 * 
 * @param {string} productId - ID of the product to update
 * @param {number} changeAmount - Amount to adjust inventory by (negative for decrease)
 * @param {string} changeType - Type of inventory change (PURCHASE, SALE, RETURN, ADJUSTMENT, RESTOCK)
 * @param {string} referenceId - ID of related document (order, transaction)
 * @param {string} referenceModel - Model name of related document
 * @param {string} notes - Additional notes about the inventory change
 * @param {string} createdBy - User or system that created the change
 * @returns {Promise<object>} - Updated product and inventory log entry
 */
const updateInventory = async (
  productId, 
  changeAmount, 
  changeType, 
  referenceId = null, 
  referenceModel = 'Order',
  notes = '', 
  createdBy = 'system'
) => {
  try {
    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    
    // Calculate new quantity
    const previousQuantity = product.stockQuantity;
    const newQuantity = previousQuantity + changeAmount;
    
    // Ensure stock doesn't go negative unless allowed in configuration
    if (newQuantity < 0 && !config.inventory.allowNegativeStock) {
      throw new Error(`Insufficient stock for product ${product.name}. Available: ${previousQuantity}`);
    }
    
    // Update inventory status based on quantity
    updateInventoryStatus(product, newQuantity);
    
    // Update product inventory
    product.stockQuantity = newQuantity;
    await product.save();
    
    // Create inventory log entry
    const log = await InventoryLog.create({
      product: productId,
      previousQuantity,
      newQuantity,
      changeAmount,
      changeType,
      referenceId,
      referenceModel,
      notes,
      createdBy,
      timestamp: new Date()
    });
    
        // Check if stock is below threshold and send notification if enabled
    if (newQuantity <= product.lowStockThreshold && product.notifyOnLowStock) {
      await sendLowStockAlert(product);
    }
    
    return { product, log };
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

/**
 * Process inventory for an entire order
 * 
 * @param {object} order - Order document with populated product references
 * @returns {Promise<Array>} - Array of inventory update results
 */
const processOrderInventory = async (order) => {
  try {
    const updateResults = [];
    
    // Process each item in the order
    for (const item of order.items) {
      // Deduct inventory for each product
      const result = await updateInventory(
        item.product,
        -item.quantity, // Negative amount to reduce inventory
        'SALE',
        order._id,
        'Order',
        `Sale from order #${order._id}`,
        'system'
      );
      
      updateResults.push(result);
    }
    
    return updateResults;
  } catch (error) {
    console.error(`Error processing inventory for order ${order._id}:`, error);
    throw error;
  }
};

/**
 * Send alert when product inventory falls below threshold
 * 
 * @param {object} product - Product that has low stock
 * @returns {Promise<void>}
 */
const sendLowStockAlert = async (product) => {
  try {
    // Prepare email notification with modern design
    const subject = `Low Stock Alert: ${product.name}`;
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          .header {
            background-color: #FF6B35;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            padding: 20px;
            border: 1px solid #e9e9e9;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .alert-box {
            background-color: #FFF3CD;
            border-left: 4px solid #FF6B35;
            padding: 15px;
            margin: 20px 0;
            border-radius: 3px;
          }
          .product-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            color: white;
            background-color: #FFA500;
          }
          .action-btn {
            display: inline-block;
            background-color: #FF6B35;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #E1E1E1;
          }
          th {
            background-color: #f5f5f5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inventory Alert</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2>Low Stock Alert</h2>
              <p>The following product inventory has fallen below the threshold.</p>
              <span class="status-badge">LOW STOCK</span>
            </div>
            
            <div class="product-info">
              <table>
                <tr>
                  <th>Product</th>
                  <td>${product.name}</td>
                </tr>
                <tr>
                  <th>SKU</th>
                  <td>${product.sku}</td>
                </tr>
                <tr>
                  <th>Category</th>
                  <td>${product.category}</td>
                </tr>
                <tr>
                  <th>Current Stock</th>
                  <td><strong>${product.stockQuantity}</strong></td>
                </tr>
                <tr>
                  <th>Threshold</th>
                  <td>${product.lowStockThreshold}</td>
                </tr>
              </table>
            </div>
            
            <p>Please take action to restock this item soon to avoid stockouts.</p>
            
            <a href="${config.server.baseUrl}/admin/products/${product._id}" class="action-btn">Manage Product</a>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email to admin
    if (config.notifications.email.enabled) {
      await emailService.sendEmail(
        config.notifications.email.adminEmail,
        subject,
        message
      );
    }
    
    // Log the alert
    console.log(`Low stock alert sent for product ${product.name} (${product.sku}). Current stock: ${product.stockQuantity}`);
    
    // Additional notification methods could be added here (SMS, etc.)
  } catch (error) {
    console.error('Error sending low stock alert:', error);
  }
};

/**
 * Get current inventory status for all products or filtered products
 * 
 * @param {object} filters - Optional filters (category, threshold, etc.)
 * @returns {Promise<Array>} - Array of products with inventory status
 */
const getInventoryStatus = async (filters = {}) => {
  try {
    const query = {};
    
    // Apply filters if provided
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.belowThreshold) {
      query.stockQuantity = { $lte: '$lowStockThreshold' };
    }
    
    if (filters.outOfStock) {
      query.stockQuantity = { $lte: 0 };
    }
    
    // Get products with inventory information
    const products = await Product.find(query)
      .select('name sku category stockQuantity lowStockThreshold price')
      .sort('stockQuantity');
    
    return products;
  } catch (error) {
    console.error('Error getting inventory status:', error);
    throw error;
  }
};

/**
 * Get inventory history for a specific product
 * 
 * @param {string} productId - Product ID to get history for
 * @param {object} options - Query options (limit, skip, etc.)
 * @returns {Promise<Array>} - Inventory log entries for the product
 */
const getInventoryHistory = async (productId, options = {}) => {
  try {
    const { limit = 50, skip = 0, sortBy = 'timestamp', sortDir = -1 } = options;
    
    const logs = await InventoryLog.find({ product: productId })
      .sort({ [sortBy]: sortDir })
      .limit(limit)
      .skip(skip)
      .populate('referenceId', 'referenceNumber customer.name');
    
    return logs;
  } catch (error) {
    console.error(`Error getting inventory history for product ${productId}:`, error);
    throw error;
  }
};

/**
 * Update inventory status based on stock quantity
 * 
 * @param {object} product - Product to update status for
 * @param {number} newQuantity - New stock quantity
 */
const updateInventoryStatus = (product, newQuantity) => {
  // Determine inventory status based on quantity
  let status;
  if (newQuantity <= 0) {
    status = 'OUT_OF_STOCK';
  } else if (newQuantity <= product.lowStockThreshold) {
    status = 'LOW_STOCK';
  } else {
    status = 'IN_STOCK';
  }
  
  // Only update if status changed
  if (product.inventoryStatus !== status) {
    product.inventoryStatus = status;
  }
};

/**
 * Bulk update inventory status for all products
 * Useful for initialization or periodic checks
 * 
 * @returns {Promise<object>} - Summary of update results
 */
const updateAllInventoryStatuses = async () => {
  try {
    const products = await Product.find();
    const results = {
      total: products.length,
      updated: 0,
      byStatus: {
        IN_STOCK: 0,
        LOW_STOCK: 0,
        OUT_OF_STOCK: 0
      }
    };
    
    for (const product of products) {
      const oldStatus = product.inventoryStatus;
      updateInventoryStatus(product, product.stockQuantity);
      
      if (oldStatus !== product.inventoryStatus) {
        await product.save();
        results.updated++;
      }
      
      results.byStatus[product.inventoryStatus]++;
    }
    
    return results;
  } catch (error) {
    console.error('Error updating all inventory statuses:', error);
    throw error;
  }
};

module.exports = {
  updateInventory,
  processOrderInventory,
  sendLowStockAlert,
  getInventoryStatus,
  getInventoryHistory,
  updateInventoryStatus,
  updateAllInventoryStatuses
};
