/**
 * Order Routes
 * 
 * API endpoints for order management
 */

const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const orderManager = require('../utils/orderManager');
const orderController = require('../controllers/orderController');
const { authMiddleware, adminMiddleware } = require('../authMiddleware');

/**
 * Create a new order
 * POST /api/orders
 */
router.post('/', authMiddleware, orderController.createOrder);

/**
 * Retry a failed payment for an existing order
 * POST /api/orders/:orderId/retry-payment
 */
router.post('/:orderId/retry-payment', authMiddleware, orderController.retryPayment);

// Route to manually check the payment status of an order
router.post('/:orderId/check-status', authMiddleware, orderController.checkPaymentStatus);

// Route to cancel an order
router.post('/:orderId/cancel', authMiddleware, orderController.cancelOrder);

/**
 * Get order by ID
 * GET /api/orders/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('items.productId', 'name price');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(`Error getting order ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
});

/**
 * Get order by reference number
 * GET /api/orders/reference/:referenceNumber
 */
router.get('/reference/:referenceNumber', async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const order = await Order.findOne({ referenceNumber });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error(`Error getting order by reference ${req.params.referenceNumber}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message
    });
  }
});

/**
 * Update order status
 * PUT /api/orders/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Update order status through order manager (handles inventory, notifications, etc.)
    const order = await orderManager.updateOrderStatus(id, status, notes);
    
    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error updating order status ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

/**
 * Get customer orders by phone number
 * GET /api/orders/customer/:phoneNumber
 */
router.get('/customer/id/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = req.query['params[limit]'] || 100;

    const orders = await Order.find({ 'customer.id': customerId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error(`Error getting customer orders for ${req.params.customerId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get customer orders',
      error: error.message
    });
  }
});

router.get('/customer/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const orders = await Order.find({ 'customer.phoneNumber': phoneNumber })
      .sort({ createdAt: -1 })
      .limit(20);
    
    return res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error(`Error getting customer orders for ${req.params.phoneNumber}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get customer orders',
      error: error.message
    });
  }
});

/**
 * Get list of orders with pagination and filtering
 * GET /api/orders
 * Query params: page, limit, status, paymentStatus, startDate, endDate
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      paymentStatus, 
      startDate, 
      endDate 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Count total matching orders
    const total = await Order.countDocuments(query);
    
    // Get paginated orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
});

/**
 * Get order sales analytics
 * GET /api/orders/analytics/sales
 * Query params: startDate, endDate
 */
router.get('/analytics/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get sales analytics through order manager
    const analytics = await orderManager.getSalesAnalytics({
      startDate,
      endDate
    });
    
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get sales analytics',
      error: error.message
    });
  }
});



module.exports = router;
