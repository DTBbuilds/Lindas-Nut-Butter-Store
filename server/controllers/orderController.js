const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { initiateStkPush, queryStkStatus } = require('../services/mpesaService');
const { generateReferenceNumber } = require('../utils/referenceGenerator');

// Create a new order and initiate payment in a single atomic operation
exports.createOrder = async (req, res, next) => {
  // Master try-catch to prevent server crashes and ensure a JSON response is always sent.
  try {
    console.log('--- [OrderController] Create Order & Payment Initiated ---');
    console.log('[OrderController] Received Order Payload:', JSON.stringify(req.body, null, 2));

    const orderData = req.body;
    orderData.orderNumber = generateReferenceNumber();

    const order = new Order(orderData);
    const validationError = order.validateSync();

    if (validationError) {
      console.error('[OrderController] Mongoose Validation Failed:', JSON.stringify(validationError, null, 2));
      return res.status(400).json({
        message: 'Order validation failed. Please check your input.',
        error: validationError.message,
        details: validationError.errors
      });
    }

    const savedOrder = await order.save();
    console.log(`[OrderController] Order ${savedOrder.orderNumber} saved successfully.`);

    let mpesaResponse = null;
    if (savedOrder.paymentMethod && savedOrder.paymentMethod.toLowerCase() === 'mpesa') {
      if (!savedOrder.customerInfo || !savedOrder.customerInfo.phone) {
        console.error(`[OrderController] M-Pesa initiation failed for order ${savedOrder.orderNumber}: Missing phone number.`);
        savedOrder.status = 'payment-failed';
        savedOrder.paymentStatus = 'FAILED';
        await savedOrder.save();
        return res.status(400).json({
          message: 'M-Pesa payment requires a valid phone number.',
          order: savedOrder,
        });
      }

      console.log(`[OrderController] Initiating M-Pesa STK push for order ${savedOrder.orderNumber}.`);
      mpesaResponse = await initiateStkPush({
        amount: savedOrder.totalAmount,
        phoneNumber: savedOrder.customerInfo.phone,
        orderId: savedOrder._id.toString(),
      });
      console.log(`[OrderController] M-Pesa STK push initiated successfully for order ${savedOrder.orderNumber}.`);
    }

    res.status(201).json({
      message: 'Order created and payment initiated successfully.',
      order: savedOrder,
      mpesa: mpesaResponse,
    });

  } catch (error) {
    console.error('[OrderController] Unhandled Exception in createOrder:', error);

    // Attempt to update the order to 'payment-failed' if it exists
    if (error.orderId) {
      try {
        await Order.findByIdAndUpdate(error.orderId, { status: 'payment-failed', paymentStatus: 'FAILED' });
      } catch (updateError) {
        console.error(`[OrderController] Failed to update order status for orderId: ${error.orderId}`, updateError);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "A duplicate order was detected. Please try placing your order again.", error: error.message });
    }

    if (!res.headersSent) {
      res.status(500).json({ 
        message: "A critical server error occurred during order creation. Please contact support.", 
        error: error.message 
      });
    }
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Standardized response for the frontend
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(`Error fetching order ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error while fetching order.', error: error.message });
  }
};

// Get all orders for a specific customer
exports.getCustomerOrders = async (req, res) => {
  try {
    // The user's ID must be available in req.user.id from an auth middleware
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const orders = await Order.find({ customerId: customerId }).sort({ createdAt: -1 });
    if (!orders) {
      return res.status(404).json({ message: 'No orders found for this customer.' });
    }
    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    res.status(500).json({ message: 'Failed to fetch customer orders.' });
  }
};


// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments();
    
    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get all transactions (admin only)
exports.getAllTransactions = async (req, res) => {
  try {
    // This is a placeholder. Full implementation will be added later.
    res.status(200).json({ success: true, message: 'Transaction fetch functionality to be implemented.' });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// Export all transactions to CSV (admin only)
exports.exportTransactionsCSV = async (req, res) => {
  try {
    // This is a placeholder. Full implementation will be added later.
    res.status(200).json({ success: true, message: 'CSV export functionality to be implemented.' });
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export transactions',
      error: error.message
    });
  }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow cancellation if the payment is pending or has failed
    if (order.paymentStatus !== 'Pending' && order.paymentStatus !== 'Failed') {
      return res.status(400).json({ 
        success: false, 
        message: 'This order cannot be cancelled as it is already being processed.' 
      });
    }

    order.status = 'Cancelled';
    order.paymentStatus = 'Cancelled';
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled successfully.' });
  } catch (error) {
    console.error(`Error cancelling order ${req.params.orderId}:`, error);
    res.status(500).json({ success: false, message: 'Server error while cancelling order.', error: error.message });
  }
};

// Retry a failed payment
exports.retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.customer.id; // From authMiddleware

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Security check: Ensure the user owns the order
    if (!order.customerInfo || !order.customerInfo.id || order.customerInfo.id.toString() !== customerId) {
      return res.status(403).json({ message: 'You are not authorized to retry this payment.' });
    }

    // Check if the payment is in a retryable state
    if (order.paymentStatus !== 'FAILED' && order.paymentStatus !== 'CANCELLED') {
      return res.status(400).json({ message: 'This order is not eligible for a payment retry.' });
    }

    // Reset the order status to pending to allow for a new attempt
    order.status = 'pending';
    order.paymentStatus = 'PENDING';
    await order.save();

    // Re-initiate the STK push
    const mpesaResponse = await initiateStkPush({
      amount: order.totalAmount,
      phoneNumber: order.customerInfo.phone,
      orderId: order._id.toString(),
    });

    res.status(200).json({
      message: 'Payment retry initiated successfully.',
      order: order,
      mpesa: mpesaResponse,
    });

  } catch (error) {
    console.error(`[OrderController] Unhandled Exception in retryPayment for order ${req.params.orderId}:`, error);
    res.status(500).json({ 
      message: "A critical server error occurred during payment retry. Please contact support.", 
      error: error.message 
    });
  }
};

// Manually check the status of a payment
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.customer.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Security check
    if (order.customerInfo.id.toString() !== customerId) {
      return res.status(403).json({ message: 'You are not authorized to check this payment status.' });
    }

    // Find the latest transaction for this order to get the CheckoutRequestID
    const transaction = await Transaction.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    if (!transaction || !transaction.checkoutRequestId) {
      return res.status(404).json({ message: 'No payment transaction found for this order.' });
    }

    // Call the service to query M-Pesa
    const mpesaStatus = await queryStkStatus(transaction.checkoutRequestId);

    // The queryStkStatus function handles DB updates and socket emissions.
    // We just need to send a response back to the client that the check was initiated.
    res.status(200).json({ 
      message: 'Payment status check initiated. Listen for WebSocket updates for the final status.',
      mpesaResponse: mpesaStatus
    });

  } catch (error) {
    console.error(`[OrderController] Error in checkPaymentStatus for order ${req.params.orderId}:`, error);
    res.status(500).json({ message: 'Server error while checking payment status.', error: error.message });
  }
};
