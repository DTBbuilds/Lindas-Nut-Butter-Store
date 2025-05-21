const { Order, Transaction } = require('../models');
const crypto = require('crypto');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { customer, items, totalAmount, paymentMethod, notes } = req.body;
    
    // Log the request body for debugging
    console.log('Order Request Body:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!customer) missingFields.push('customer');
    if (!items) missingFields.push('items');
    if (items && items.length === 0) missingFields.push('items (empty array)');
    if (totalAmount === undefined || totalAmount === null) missingFields.push('totalAmount');
    // Validate payment method is M-Pesa
    if (!paymentMethod || paymentMethod !== 'MPESA') {
      return res.status(400).json({
        success: false,
        message: 'Only M-Pesa payments are accepted'
      });
    }
    
    // Check customer object if it exists
    if (customer && (!customer.name || !customer.email || !customer.phoneNumber)) {
      const missingCustomerFields = [];
      if (!customer.name) missingCustomerFields.push('name');
      if (!customer.email) missingCustomerFields.push('email');
      if (!customer.phoneNumber) missingCustomerFields.push('phoneNumber');
      
      if (missingCustomerFields.length > 0) {
        missingFields.push(`customer fields: ${missingCustomerFields.join(', ')}`);
      }
    }
    
    if (missingFields.length > 0) {
      console.log('Validation failed. Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Generate unique reference number (for M-Pesa account number)
    const referenceNumber = generateReferenceNumber();
    
    // Create order in database
    const order = new Order({
      customer,
      items,
      totalAmount,
      paymentMethod: 'MPESA',
      notes,
      referenceNumber,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await order.save();
    
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id,
      referenceNumber: order.referenceNumber
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Request body that caused error:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.stack || error.message
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    
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
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
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

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update order status
    order.status = status;
    order.updatedAt = new Date();
    
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Admin get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    // Add date filtering
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId', 'referenceNumber customer.name');
    
    const total = await Transaction.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

// Export transactions as CSV
exports.exportTransactionsCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .populate('orderId', 'referenceNumber');
    
    // Convert to CSV
    const fields = [
      'transactionId', 
      'orderId', 
      'amount', 
      'phoneNumber', 
      'status', 
      'type', 
      'timestamp'
    ];
    
    let csv = fields.join(',') + '\n';
    
    transactions.forEach(transaction => {
      const row = fields.map(field => {
        let value = transaction[field];
        if (field === 'timestamp') {
          return value ? new Date(value).toISOString() : '';
        }
        if (field === 'orderId' && transaction.orderId) {
          value = transaction.orderId.referenceNumber || transaction.orderId;
        }
        // Escape commas in CSV
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      });
      csv += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export transactions',
      error: error.message
    });
  }
};

// Generate a unique reference number for M-Pesa
const generateReferenceNumber = () => {
  // Generate a random string with timestamp to ensure uniqueness
  const timestamp = new Date().getTime().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LNB${timestamp.substring(timestamp.length - 6)}${random}`;
};
