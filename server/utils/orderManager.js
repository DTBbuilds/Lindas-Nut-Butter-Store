/**
 * Order Management Utility
 * 
 * Handles all order-related operations:
 * - Order capture and creation
 * - Order processing workflow
 * - Order status updates
 * - Integration with inventory management
 */

const { Order, Transaction, Product } = require('../models');
const inventoryManager = require('./inventoryManager');
const deliveryService = require('./deliveryService');
const emailService = require('./emailService');
const config = require('../config');
const mongoose = require('mongoose');

/**
 * Create a new order with automated validation
 * 
 * @param {object} orderData - Order data including customer, delivery details, and items
 * @returns {Promise<object>} - Created order
 */
const createOrder = async (orderData) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Generate a unique reference number
    const referenceNumber = generateReferenceNumber();
    
    // Validate products and get current prices
    const validatedItems = await validateOrderItems(orderData.items);
    
    // Calculate total amount for products
    const productsTotal = validatedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    // Calculate order weight (for delivery fee calculation)
    const orderWeight = validatedItems.reduce((total, item) => {
      // Assuming each product has a standard weight, or default to 0.5kg
      return total + (item.quantity * 0.5);
    }, 0);
    
    // Process delivery information
    const deliveryDetails = processDeliveryDetails(orderData.delivery, orderWeight, productsTotal);
    
    // Add delivery fee to total amount
    const totalAmount = productsTotal + (deliveryDetails.deliveryFee || 0);
    
    // Create order object
    const order = new Order({
      customer: orderData.customer,
      delivery: deliveryDetails,
      pickupLocation: orderData.customer.pickupLocation || deliveryDetails.pickupLocation || '',
      items: validatedItems,
      totalAmount,
      referenceNumber,
      paymentMethod: 'MPESA',
      notes: orderData.notes || ''
    });
    
    // Save the order
    await order.save({ session });
    
    // Create pending M-Pesa transaction
    await Transaction.create([{
      orderId: order._id,
      phoneNumber: order.customer.phoneNumber,
      amount: order.totalAmount,
      status: 'PENDING',
      type: 'STK_PUSH',
      timestamp: new Date()
    }], { session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Send order confirmation
    await sendOrderConfirmation(order);
    
    return order;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Process an order after payment confirmation
 * 
 * @param {string} orderId - Order ID to process
 * @param {object} session - MongoDB session for transactions
 * @returns {Promise<object>} - Updated order
 */
const processOrder = async (orderId, session = null) => {
  const sessionOptions = session ? { session } : {};
  
  try {
    // Get order with populated product references
    const order = await Order.findById(orderId)
      .populate('items.product');
    
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Update inventory for each product in the order
    await inventoryManager.processOrderInventory(order);
    
    // Update order status to PROCESSING
    order.status = 'PROCESSING';
    await order.save(sessionOptions);
    
    // Send notification to fulfillment team
    await notifyFulfillmentTeam(order);
    
    return order;
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Update order status and trigger appropriate actions
 * 
 * @param {string} orderId - Order ID to update
 * @param {string} status - New order status
 * @param {string} notes - Optional notes about the status change
 * @returns {Promise<object>} - Updated order
 */
const updateOrderStatus = async (orderId, status, notes = '') => {
  try {
    // Validate status is one of the allowed enum values
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }
    
    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Handle cancellation specially - may need to restore inventory
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await handleOrderCancellation(order);
    }
    
    // Update the order status
    order.status = status;
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n${notes}` : notes;
    }
    
    await order.save();
    
    // Send notification to customer about status change
    await sendStatusUpdateNotification(order);
    
    return order;
  } catch (error) {
    console.error(`Error updating order status for ${orderId}:`, error);
    throw error;
  }
};

/**
 * Handle cancellation of an order
 * 
 * @param {object} order - Order to cancel
 * @returns {Promise<void>}
 */
const handleOrderCancellation = async (order) => {
  try {
    // Only restore inventory if order was in PROCESSING or SHIPPED state
    // If it was still PENDING, inventory hasn't been deducted yet
    if (['PROCESSING', 'SHIPPED'].includes(order.status)) {
      // Restore inventory for each item
      for (const item of order.items) {
        await inventoryManager.updateInventory(
          item.product,
          item.quantity, // Positive to restore inventory
          'RETURN',
          order._id,
          'Order',
          `Inventory restored from cancelled order #${order._id}`,
          'system'
        );
      }
    }
    
    // Handle refund if payment was already processed
    if (order.paymentStatus === 'PAID') {
      // Flag for refund processing
      await Transaction.create({
        orderId: order._id,
        relatedTransactionId: order.transactionId,
        phoneNumber: order.customer.phoneNumber,
        amount: order.totalAmount,
        status: 'PENDING',
        type: 'REFUND',
        remarks: 'Refund for cancelled order',
        timestamp: new Date()
      });
      
      // Refund processing would typically happen asynchronously
      // via an admin action or scheduled job
    }
  } catch (error) {
    console.error(`Error handling cancellation for order ${order._id}:`, error);
    throw error;
  }
};

/**
 * Validate order items against current product data
 * 
 * @param {Array} items - Order items to validate
 * @returns {Promise<Array>} - Validated and normalized order items
 */
const validateOrderItems = async (items) => {
  try {
    const validatedItems = [];
    
    // Get all product IDs from the items
    const productIds = items.map(item => item.product);
    
    // Fetch all products in one query
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Create a map for quick lookup
    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});
    
    // Validate each item
    for (const item of items) {
      const productId = item.product.toString();
      const product = productMap[productId];
      
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      
      if (!product.isActive) {
        throw new Error(`Product is not available: ${product.name}`);
      }
      
      // Ensure there is enough inventory unless negative stock is allowed
      if (item.quantity > product.stockQuantity && !config.inventory.allowNegativeStock) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
      }
      
      // Use current product data for consistency
      validatedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity
      });
    }
    
    return validatedItems;
  } catch (error) {
    console.error('Error validating order items:', error);
    throw error;
  }
};

/**
 * Generate a unique reference number for an order
 * 
 * @returns {string} - Unique reference number
 */
const generateReferenceNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp.slice(-8)}-${random}`;
};

/**
 * Send order confirmation to customer
 * 
 * @param {object} order - Order to send confirmation for
 * @returns {Promise<void>}
 */
const sendOrderConfirmation = async (order) => {
  try {
    // Prepare email message
    const subject = `Order Confirmation #${order.referenceNumber}`;
    
    // Prepare delivery information section
    let deliverySection = '';
    if (order.delivery.deliveryMethod === 'PICKUP') {
      // Find pickup location details
      const pickupLocations = deliveryService.getPickupLocations();
      const pickupLocation = pickupLocations.find(loc => loc.id === order.delivery.pickupLocation) || {};
      
      deliverySection = `
        <h3>Pickup Information</h3>
        <p>You've chosen to pick up your order.</p>
        <ul>
          <li><strong>Pickup Location:</strong> ${pickupLocation.name || 'To be confirmed'}</li>
          <li><strong>Address:</strong> ${pickupLocation.address || 'To be confirmed'}</li>
          <li><strong>Hours:</strong> ${pickupLocation.operatingHours || 'To be confirmed'}</li>
        </ul>
        <p>Your order will be ready for pickup within 24 hours. We'll send you a notification when it's ready.</p>
      `;
    } else {
      deliverySection = `
        <h3>Delivery Information</h3>
        <ul>
          <li><strong>Recipient:</strong> ${order.delivery.recipient}</li>
          <li><strong>Delivery Address:</strong> ${order.delivery.estate}, ${order.delivery.subCounty}, ${order.delivery.county}</li>
          ${order.delivery.buildingName ? `<li><strong>Building:</strong> ${order.delivery.buildingName}</li>` : ''}
          ${order.delivery.houseNumber ? `<li><strong>House Number:</strong> ${order.delivery.houseNumber}</li>` : ''}
          ${order.delivery.nearestLandmark ? `<li><strong>Nearest Landmark:</strong> ${order.delivery.nearestLandmark}</li>` : ''}
          <li><strong>Phone Number:</strong> ${order.delivery.phoneNumber}</li>
          <li><strong>Delivery Method:</strong> ${order.delivery.deliveryMethod === 'EXPRESS' ? 'Express Delivery' : 'Standard Delivery'}</li>
          <li><strong>Estimated Delivery:</strong> ${order.delivery.estimatedDeliveryDate ? new Date(order.delivery.estimatedDeliveryDate).toDateString() : 'To be confirmed'}</li>
          <li><strong>Delivery Fee:</strong> KES ${order.delivery.deliveryFee.toFixed(2)}</li>
        </ul>
      `;
    }
    
    const message = `
      <h2>Thank you for your order!</h2>
      <p>We've received your order and are processing it now.</p>
      <h3>Order Details</h3>
      <ul>
        <li><strong>Order Number:</strong> ${order.referenceNumber}</li>
        <li><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</li>
        <li><strong>Total Amount:</strong> KES ${order.totalAmount.toFixed(2)}</li>
        <li><strong>Payment Method:</strong> ${order.paymentMethod}</li>
      </ul>
      
      ${deliverySection}
      
      <h3>Items</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
        ${order.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <p>We'll send you another notification when your order ships.</p>
      <p>Thank you for shopping with Linda's Nut Butter Store!</p>
    `;
    
    // Send email
    if (config.notifications.email.enabled) {
      await emailService.sendEmail(
        order.customer.email,
        subject,
        message
      );
    }
    
    // SMS notification could be added here
    
    console.log(`Order confirmation sent for order ${order._id}`);
  } catch (error) {
    console.error(`Error sending order confirmation for order ${order._id}:`, error);
  }
};

/**
 * Notify fulfillment team about new order
 * 
 * @param {object} order - New order to notify about
 * @returns {Promise<void>}
 */
const notifyFulfillmentTeam = async (order) => {
  try {
    // Email notification to fulfillment team
    const subject = `New Order #${order.referenceNumber} Ready for Fulfillment`;
    
    // Prepare delivery information
    let deliverySection = '';
    if (order.delivery.deliveryMethod === 'PICKUP') {
      // Find pickup location details
      const pickupLocations = deliveryService.getPickupLocations();
      const pickupLocation = pickupLocations.find(loc => loc.id === order.delivery.pickupLocation) || {};
      
      deliverySection = `
        <h3>Pickup Information</h3>
        <ul>
          <li><strong>Pickup Location:</strong> ${pickupLocation.name || 'To be confirmed'}</li>
          <li><strong>Address:</strong> ${pickupLocation.address || 'To be confirmed'}</li>
        </ul>
        <p>Customer will pick up the order.</p>
      `;
    } else {
      deliverySection = `
        <h3>Delivery Information</h3>
        <p>
          <strong>Recipient:</strong> ${order.delivery.recipient}<br>
          <strong>Phone:</strong> ${order.delivery.phoneNumber}
          ${order.delivery.alternatePhoneNumber ? `<br><strong>Alternative Phone:</strong> ${order.delivery.alternatePhoneNumber}` : ''}<br>
          <strong>Location:</strong> ${order.delivery.estate}, ${order.delivery.subCounty}, ${order.delivery.county}<br>
          ${order.delivery.buildingName ? `<strong>Building:</strong> ${order.delivery.buildingName}<br>` : ''}
          ${order.delivery.houseNumber ? `<strong>House Number:</strong> ${order.delivery.houseNumber}<br>` : ''}
          ${order.delivery.nearestLandmark ? `<strong>Nearest Landmark:</strong> ${order.delivery.nearestLandmark}<br>` : ''}
        </p>
        <p>
          <strong>Delivery Method:</strong> ${order.delivery.deliveryMethod === 'EXPRESS' ? '<span style="color:#ff0000">EXPRESS DELIVERY</span>' : 'Standard Delivery'}<br>
          <strong>Preferred Time:</strong> ${order.delivery.preferredDeliveryTime.replace('_', ' ').toLowerCase()}<br>
          <strong>Estimated Delivery:</strong> ${order.delivery.estimatedDeliveryDate ? new Date(order.delivery.estimatedDeliveryDate).toDateString() : 'To be confirmed'}
        </p>
        ${order.delivery.deliveryInstructions ? `<p><strong>Special Instructions:</strong><br>${order.delivery.deliveryInstructions}</p>` : ''}
      `;
    }
    
    const message = `
      <h2>New Order Ready for Fulfillment</h2>
      <h3>Order Details</h3>
      <ul>
        <li><strong>Order Number:</strong> ${order.referenceNumber}</li>
        <li><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</li>
        <li><strong>Customer:</strong> ${order.customer.name}</li>
        <li><strong>Customer Email:</strong> ${order.customer.email}</li>
        <li><strong>Customer Phone:</strong> ${order.customer.phoneNumber}</li>
        <li><strong>Total Items:</strong> ${order.items.reduce((total, item) => total + item.quantity, 0)}</li>
        <li><strong>Payment Method:</strong> ${order.paymentMethod}</li>
        <li><strong>Payment Status:</strong> ${order.paymentStatus}</li>
      </ul>
      
      ${deliverySection}
      
      <h3>Items to Ship</h3>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr>
          <th>SKU</th>
          <th>Item</th>
          <th>Quantity</th>
        </tr>
        ${order.items.map(item => `
          <tr>
            <td>${item.sku}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
          </tr>
        `).join('')}
      </table>
      <p><a href="${config.server.baseUrl}/admin/orders/${order._id}">View Order Details</a></p>
    `;
    
    // Send to fulfillment team
    if (config.notifications.email.enabled) {
      await emailService.sendEmail(
        config.notifications.email.fulfillmentEmail,
        subject,
        message
      );
    }
    
    console.log(`Fulfillment notification sent for order ${order._id}`);
  } catch (error) {
    console.error(`Error sending fulfillment notification for order ${order._id}:`, error);
  }
};

/**
 * Send status update notification to customer
 * 
 * @param {object} order - Order with updated status
 * @returns {Promise<void>}
 */
const sendStatusUpdateNotification = async (order) => {
  try {
    let subject, message;
    
    // Create appropriate message based on order status
    switch (order.status) {
      case 'SHIPPED':
        subject = `Your Order #${order.referenceNumber} Has Shipped`;
        message = `
          <h2>Your Order Has Shipped!</h2>
          <p>Good news! Your order is on its way to you.</p>
          <h3>Order Details</h3>
          <ul>
            <li><strong>Order Number:</strong> ${order.referenceNumber}</li>
            <li><strong>Shipping Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can expect delivery within the next 3-5 business days.</p>
          <p>Thank you for shopping with Linda's Nut Butter Store!</p>
        `;
        break;
        
      case 'DELIVERED':
        subject = `Your Order #${order.referenceNumber} Has Been Delivered`;
        message = `
          <h2>Your Order Has Been Delivered!</h2>
          <p>Your order has been marked as delivered. We hope you enjoy your products!</p>
          <h3>Order Details</h3>
          <ul>
            <li><strong>Order Number:</strong> ${order.referenceNumber}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>If you have any issues with your order, please contact our customer service.</p>
          <p>Thank you for shopping with Linda's Nut Butter Store!</p>
        `;
        break;
        
      case 'CANCELLED':
        subject = `Your Order #${order.referenceNumber} Has Been Cancelled`;
        message = `
          <h2>Your Order Has Been Cancelled</h2>
          <p>Your order has been cancelled as requested.</p>
          <h3>Order Details</h3>
          <ul>
            <li><strong>Order Number:</strong> ${order.referenceNumber}</li>
            <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>If a payment was processed, a refund will be issued within 5-7 business days.</p>
          <p>If you have any questions, please contact our customer service.</p>
        `;
        break;
        
      default:
        // Don't send notification for other status changes
        return;
    }
    
    // Send email notification
    if (config.notifications.email.enabled) {
      await emailService.sendEmail(
        order.customer.email,
        subject,
        message
      );
    }
    
    console.log(`Status update notification sent for order ${order._id}`);
  } catch (error) {
    console.error(`Error sending status update for order ${order._id}:`, error);
  }
};

/**
 * Get sales analytics
 * 
 * @param {object} options - Filter options (date range, etc.)
 * @returns {Promise<object>} - Sales analytics data
 */
const getSalesAnalytics = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    // Set up date range query
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get completed orders
    const orders = await Order.find({
      ...dateQuery,
      paymentStatus: 'PAID'
    }).populate('items.product');
    
    // Calculate total sales
    const totalSales = orders.reduce((total, order) => total + order.totalAmount, 0);
    
    // Calculate sales by product
    const productSales = {};
    for (const order of orders) {
      for (const item of order.items) {
        const productId = item.product.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name,
            sku: item.sku,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += (item.price * item.quantity);
      }
    }
    
    return {
      totalSales,
      orderCount: orders.length,
      productSales: Object.values(productSales).sort((a, b) => b.revenue - a.revenue)
    };
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw error;
  }
};

/**
 * Process delivery details for an order
 * 
 * @param {object} deliveryData - Delivery information from the client
 * @param {number} orderWeight - Weight of the order in kg
 * @param {number} orderValue - Total value of products in the order
 * @returns {object} - Processed delivery details
 */
const processDeliveryDetails = (deliveryData = {}, orderWeight = 1, orderValue = 0) => {
  // For pickup orders, we only need the pickup location
  // Default to pickup method if not specified
  const deliveryMethod = deliveryData.deliveryMethod || 'PICKUP';
  
  // Handle pickup method - this is our primary use case now
  if (deliveryMethod === 'PICKUP') {
    return {
      deliveryMethod: 'PICKUP',
      pickupLocation: deliveryData.pickupLocation || '',
      deliveryFee: 0,
      estimatedDeliveryDate: null // Will be set when order is ready for pickup
    };
  }
  
  // If for some reason we're still doing delivery (not the primary use case)
  // Calculate delivery fee and estimated delivery date if all required fields are present
  if (deliveryData.county && deliveryData.subCounty) {
    const deliveryCalc = deliveryService.calculateDeliveryFee({
      county: deliveryData.county,
      subCounty: deliveryData.subCounty,
      deliveryMethod: deliveryMethod,
      orderWeight,
      orderValue
    });
    
    return {
      ...deliveryData,
      deliveryFee: deliveryCalc.deliveryFee,
      estimatedDeliveryDate: deliveryCalc.estimatedDeliveryDate
    };
  }
  
  // Fallback to pickup if delivery details are incomplete
  return {
    deliveryMethod: 'PICKUP',
    pickupLocation: deliveryData.pickupLocation || '',
    deliveryFee: 0,
    estimatedDeliveryDate: null
  };
};

module.exports = {
  createOrder,
  processOrder,
  updateOrderStatus,
  validateOrderItems,
  sendOrderConfirmation,
  sendStatusUpdateNotification,
  notifyFulfillmentTeam,
  getSalesAnalytics,
  processDeliveryDetails
};
