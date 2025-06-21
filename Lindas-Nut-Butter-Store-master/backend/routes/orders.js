const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../../server/models/Order');
const Product = require('../../server/models/Product');
const Customer = require('../../server/models/Customer'); // Added Customer model import
const { AppError, CartError, createErrorResponse, catchAsync } = require('../utils/errorHandlers');
const { validateCartItems, validateDiscountCode } = require('../utils/validators');
const { calculateOrderTotals } = require('../utils/calculators');

// No longer needed - replaced by ../utils/validators.js
// Utility function placeholder for documentation purposes
const validateOrderItems = async (items) => {
  // This function is deprecated - using validateCartItems from validators.js instead
  console.warn('Deprecated: validateOrderItems is no longer used');
  return [];
};

// Get all orders (with pagination and filtering)
router.get('/', catchAsync(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by order status
    if (status) {
      query.orderStatus = status;
    }
    
    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: totalOrders,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalOrders / Number(limit))
        }
      }
    });
  // No catch block needed - errors are handled by catchAsync wrapper
}));

// Get a single order by ID
router.get('/:id', catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'LINDA_ORDER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: order
    });
  // Errors handled by catchAsync wrapper
}));

// Get orders for a specific customer
// Get orders for a specific customer by their User ID
router.get('/customer/:customerId', catchAsync(async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new AppError('Invalid customer ID format', 400, 'LINDA_INVALID_CUSTOMER_ID');
  }

  // Find the user by customerId to get their email
  const user = await User.findById(customerId);
  if (!user) {
    throw new AppError('Customer not found', 404, 'LINDA_CUSTOMER_NOT_FOUND');
  }

  // Now query orders using the customer's email
  const query = { 'customer.email': user.email };

  const orders = await Order.find(query)
    .sort({ orderDate: -1 }) // Sort by orderDate, more relevant for customer orders
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const totalOrders = await Order.countDocuments(query);

  if (!orders.length && totalOrders === 0) {
    // It's not an error if a customer has no orders, return empty array
    return res.json({
      success: true,
      data: {
        orders: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          pages: 0
        }
      }
    });
  }

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        total: totalOrders,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalOrders / Number(limit))
      }
    }
  });
}));

// Create a new order
// Use direct try/catch instead of catchAsync for create order endpoint for demonstration purposes
// Test endpoint for order creation - simple and focused
router.post('/test-order', async (req, res) => {
  try {
    // Create a simple test order with minimal data
    const testOrder = new Order({
      orderNumber: `TEST-${Date.now()}`,
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phoneNumber: '+254700000000'
      },
      items: [{
        productId: '682c8c0e8a4d94999b4de5b1', // Peanut Butter - Creamy
        name: 'Peanut Butter - Creamy',
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
        image: '/images/peanut-butter-creamy.jpg'
      }],
      subtotal: 500,
      shipping: 300,
      tax: 0,
      total: 800,
      paymentMethod: 'MPESA',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: 'Test order'
    });
    
    await testOrder.save();
    
    return res.status(201).json({
      success: true,
      message: 'Test order created successfully',
      order: testOrder
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating test order',
      error: error.message,
      stack: error.stack
    });
  }
});

// Main order creation endpoint
router.post('/', async (req, res) => {
  try {
    // Added detailed logging of the request body
    console.log('============= ORDER REQUEST =============');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new AppError('Database not connected. Please try again later.', 503, 'LINDA_DB_NOT_CONNECTED');
    }
    
    // Get order data from request body
    const {
      orderNumber,
      customer,
      items,
      discountCode,
      paymentMethod,
      notes
    } = req.body;
    
    // Validate required fields
    if (!orderNumber || !customer || !items || !paymentMethod) {
      throw new AppError('Missing required fields', 400, 'LINDA_MISSING_FIELDS');
    }
    
    // Validate customer details
    console.log('Validating customer data:', JSON.stringify(customer, null, 2));
    
    if (!customer.name || !customer.email || !customer.phoneNumber) {
      console.error('Missing required customer fields:', {
        hasName: !!customer.name, 
        hasEmail: !!customer.email, 
        hasPhone: !!customer.phoneNumber
      });
      throw new AppError('Missing required customer information', 400, 'LINDA_MISSING_CUSTOMER_INFO');
    }
    
    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      throw new CartError('Invalid cart data. Cart must contain at least one item.', 400, 'LINDA_INVALID_CART');
    }
    
    // Validate cart items using our utility
    console.log('Validating cart items for order creation...', { 
      itemCount: items.length,
      paymentMethod,
      orderNumber
    });

    // Resolve product SKUs to ObjectIds before validation
    console.log('Resolving product SKUs to ObjectIds...');
    const itemsWithObjectId = await Promise.all(
      items.map(async (item) => {
        // Find the product by its unique SKU
        const product = await Product.findOne({ sku: item.product });
        if (!product) {
          // If a product isn't found, this is a critical validation error
          throw new AppError(`Product with SKU '${item.product}' not found. Please check your cart and try again.`, 400, 'LINDA_INVALID_SKU');
        }
        // Return the item with the SKU replaced by the database ObjectId
        return { ...item, product: product._id };
      })
    );
    console.log('Product SKUs resolved successfully.');

    let cartValidation;
    try {
      // Use more tolerant validation for orders
      cartValidation = await validateCartItems(itemsWithObjectId, {
        // Don't block order creation for special order products 
        // like Chocolate Mint Peanut Butter
        allowSpecialOrders: true,
        checkStock: true,
        priceTolerance: 0.15 // Allow up to 15% price difference for orders
      });

      console.log('Order cart validation result:', { 
        valid: cartValidation.valid, 
        errorCount: cartValidation.errors?.length || 0,
        validItemCount: cartValidation.validatedItems?.length || 0
      });

      // Override validation for special products
      // Even if validation fails, check if it's only because of special products
      if (!cartValidation.valid) {
        // Check if all errors are related to out-of-stock special order products
        const specialOrderErrors = cartValidation.errors.filter(err => 
          err.message && err.message.includes('Chocolate Mint Peanut Butter'));

        if (specialOrderErrors.length === cartValidation.errors.length) {
          console.log('Overriding validation for special order products');
          // All errors are for special products, override validation
          cartValidation.valid = true;
          cartValidation.errors = [];
        } else {
          // There are other validation errors
          throw new CartError('Order validation failed', 400, 'LINDA_CART_VALIDATION_FAILED', {
            errors: cartValidation.errors,
            items: items.map(item => ({ id: item.productId, quantity: item.quantity }))
          });
        }
      }
    } catch (validationError) {
      console.error('Cart validation error during order creation:', validationError);
      throw new CartError(
        validationError.message || 'Error validating order items', 
        400, 
        'LINDA_CART_VALIDATION_ERROR', 
        validationError
      );
    }
    
    // Discount codes are disabled as per business requirements
    // Code preserved for future use
    let discountValidation = null;
    if (discountCode) {
      // Inform client that discount codes are disabled
      throw new AppError(
        'Discount codes are currently not accepted. Your order will be processed without a discount.',
        400,
        'LINDA_DISCOUNT_DISABLED'
      );
    }
    
    // Calculate order totals based on validated items and discount
    const orderTotals = calculateOrderTotals(cartValidation.validatedItems, discountValidation);
    
    // Add shipping cost if not already included
    if (!orderTotals.shipping) {
      orderTotals.shipping = 300; // Default shipping cost is 300 KES
    }
    
    // Ensure total includes shipping
    const totalWithShipping = orderTotals.subtotal + orderTotals.shipping;
    
    // Create order with validated and server-calculated values
    console.log('Creating order with data:', { 
      orderNumber, 
      items: orderTotals.items.length,
      subtotal: orderTotals.subtotal,
      shipping: orderTotals.shipping,
      total: totalWithShipping,
      paymentMethod 
    });
    
    // Log detailed item information for debugging
    console.log('Order items (first 2 for brevity):', orderTotals.items.slice(0, 2).map(item => ({
      productId: item.product._id || item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    })));

    // Basic validation for required fields
    if (!customer || !customer.name || !customer.email || !customer.phoneNumber) {
      console.error('Customer details validation failed:', { 
        customer: customer ? 'exists' : 'missing',
        name: customer?.name ? 'exists' : 'missing',
        email: customer?.email ? 'exists' : 'missing',
        phoneNumber: customer?.phoneNumber ? 'exists' : 'missing'
      });
      throw new AppError('Customer details are incomplete', 400, 'LINDA_INCOMPLETE_CUSTOMER_DATA');
    }
    
    if (!orderTotals.items || orderTotals.items.length === 0) {
      throw new AppError('Order must contain at least one item', 400, 'LINDA_EMPTY_ORDER');
    }

    // Normalize and sanitize the data to match schema requirements
    console.log('Processing customer data into order format...');
    const orderData = {
      orderNumber,
      customer: {
        name: customer.name && typeof customer.name === 'string' ? customer.name.trim() : '',
        email: customer.email && typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : '',
        phoneNumber: customer.phoneNumber && typeof customer.phoneNumber === 'string' ? customer.phoneNumber.trim() : '',
        pickupLocation: customer.pickupLocation || ''
      },
      items: orderTotals.items.map(item => ({
        productId: String(item.product._id || item.product.id),
        name: item.product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        image: item.product.image || (item.product.images && item.product.images[0]) || '/images/placeholder.png'
      })),
      subtotal: Number(orderTotals.subtotal),
      shipping: Number(orderTotals.shipping || 300), // Default 300 KES if not specified
      tax: 0, // VAT disabled as per business requirements
      total: Number(totalWithShipping), // Total with shipping included
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: notes || ''
    };
    
    // Sanitize and validate the order data before creating the model
    // This helps prevent MongoDB validation errors
    for (const key in orderData) {
      if (orderData[key] === undefined) {
        delete orderData[key];
      }
    }
    
    const order = new Order(orderData);
    
    // For M-Pesa payment, add payment details
    if (paymentMethod === 'MPESA' && req.body.mpesaDetails) {
      console.log('Adding M-PESA details to order:', JSON.stringify(req.body.mpesaDetails, null, 2));
      
      try {
        // Clean the M-PESA details to ensure they match schema requirements
        order.mpesaDetails = {
          transactionId: String(req.body.mpesaDetails.transactionId || ''),
          phoneNumber: String(req.body.mpesaDetails.phoneNumber || ''),
          amount: Number(req.body.mpesaDetails.amount || 0),
          timestamp: new Date() // Always use a fresh Date object
        };
        
        console.log('Formatted M-PESA details for order:', JSON.stringify(order.mpesaDetails, null, 2));
      } catch (mpesaError) {
        console.error('Error processing M-PESA details:', mpesaError);
        // Provide default values if there's an error
        order.mpesaDetails = {
          transactionId: 'error-formatting',
          phoneNumber: '',
          amount: 0,
          timestamp: new Date()
        };
      }
      
      order.paymentStatus = 'pending';
    }
    
    // Add shipping to order object if not present
    if (!order.shipping && orderTotals.shipping) {
      order.shipping = orderTotals.shipping;
    }
    
    console.log('Saving order with data:', {
      orderNumber: order.orderNumber,
      itemCount: order.items.length,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total
    });
    
    // Validate order before saving
    try {
      await order.validate();
      console.log('Order validation successful');
    } catch (validationError) {
      console.error('Order validation failed:', validationError);
      throw validationError;
    }

    // Save order
    try {
      // Log the full order object before saving to identify potential validation issues
      console.log('Full order to be saved:', JSON.stringify({
        orderNumber: order.orderNumber,
        customer: order.customer,
        itemCount: order.items.length,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        mpesaDetails: order.mpesaDetails,
        pickupLocation: order.customer.pickupLocation || 'Not provided'
      }, null, 2));
      
      await order.save();
      console.log('Order saved successfully with ID:', order._id);
      
      // For debugging, log the saved order data
      console.log('Saved order details:', {
        _id: order._id,
        orderNumber: order.orderNumber,
        items: order.items.length,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus
      });
    } catch (saveError) {
      console.error('Error saving order:', saveError);
      console.error('Order validation errors:', saveError.errors);
      throw saveError;
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    // Extended debugging for common error types
    console.error('\n======= ORDER CREATION ERROR DETAILS =======');
    console.error('Error type:', error.constructor.name);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check if error is related to customer data
    if (req.body && req.body.customer) {
      console.error('Customer data provided:', JSON.stringify(req.body.customer, null, 2));
    }
    
    // Check if error is related to items
    if (req.body && req.body.items) {
      console.error('Order items count:', req.body.items.length);
      console.error('First few items:', JSON.stringify(req.body.items.slice(0, 2), null, 2));
    }
    
    // Check if it's an M-PESA related error
    if (req.body && req.body.mpesaDetails) {
      console.error('M-PESA details:', JSON.stringify(req.body.mpesaDetails, null, 2));
    }
    console.error('===========================================\n');
    
    // Add more detailed error logging to identify the specific issue
    if (error instanceof mongoose.Error.ValidationError) {
      console.error('Mongoose validation error. Fields with errors:');
      for (const field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }
    
    // Check if there are issues with specific nested fields
    if (error.message && error.message.includes('mpesaDetails')) {
      console.error('M-PESA details validation error. Check the format of the mpesaDetails object.');
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json(createErrorResponse('Validation error', 400, 'LINDA_VALIDATION_ERROR', validationErrors));
    }
    
    // Handle cart errors
    if (error.name === 'CartError') {
      return res.status(error.statusCode || 400).json(createErrorResponse(error.message, error.statusCode || 400, error.code || 'LINDA_CART_ERROR', error.details));
    }
    
    // Handle duplicate order number
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json(createErrorResponse('Order with this order number already exists', 400, 'LINDA_DUPLICATE_ORDER'));
    }
    
    // Provide detailed error info to help debug the issue
    let errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      name: error.name || 'Error',
      stack: error.stack
    };
    
    // Add validation error details if available
    if (error.errors) {
      errorDetails.validationErrors = {};
      for (const field in error.errors) {
        errorDetails.validationErrors[field] = error.errors[field].message;
      }
    }
    
    console.error('Detailed order creation error:', JSON.stringify(errorDetails, null, 2));
    res.status(500).json(createErrorResponse('Error creating order', 500, 'LINDA_ORDER_CREATION_ERROR', errorDetails));
  }
});

// Update order status
router.patch('/:id/status', catchAsync(async (req, res) => {
    const { orderStatus } = req.body;
    
    if (!orderStatus) {
      throw new AppError('Order status is required', 400, 'LINDA_MISSING_STATUS');
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      throw new AppError(`Invalid order status. Valid options are: ${validStatuses.join(', ')}`, 400, 'LINDA_INVALID_STATUS');
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { orderStatus } },
      { new: true }
    );
    
    if (!order) {
      throw new AppError('Order not found', 404, 'LINDA_ORDER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  // Errors handled by catchAsync wrapper
}));

// Validate cart endpoint - checks items and calculates totals without creating an order
router.post('/validate-cart', catchAsync(async (req, res) => {
    const { items, discountCode } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new CartError('Invalid cart data. Cart must contain at least one item.', 400, 'LINDA_INVALID_CART');
    }

    // Validate cart items using our utility
    console.log('Validating cart items...', { itemCount: items.length });
    let cartValidation;
    try {
        cartValidation = await validateCartItems(items, {
            // Don't block order creation for special order products
            // like Chocolate Mint Peanut Butter
            allowSpecialOrders: true,
            checkStock: true,
            priceTolerance: 0.1 // Allow up to 10% price difference
        });
        console.log('Cart validation result:', { 
            valid: cartValidation.valid, 
            errors: cartValidation.errors?.length || 0,
            validatedItems: cartValidation.validatedItems?.length || 0 
        });
    } catch (validationError) {
        console.error('Cart validation error:', validationError);
        throw new CartError('Error validating cart items', 400, 'LINDA_CART_VALIDATION_ERROR', validationError.message);
    }
    
    // Discount codes are disabled as per business requirements
    let discountValidation = null;
    if (discountCode) {
        // Simply log that discount codes are disabled - this is validation only endpoint
        console.log('Discount code provided but feature is disabled:', discountCode);
    }
    
    // Calculate order totals based on validated items and discount
    const orderTotals = calculateOrderTotals(cartValidation.validatedItems, discountValidation);
    
    // Return validation result to client
    return res.json({
        success: cartValidation.valid,
        message: cartValidation.valid ? 'Cart validation successful' : 'Cart validation failed',
        errors: cartValidation.errors,
        totals: orderTotals,
        validatedItems: cartValidation.validatedItems.map(item => ({
            productId: item.productId,
            valid: item.valid,
            errors: item.errors,
            product: item.valid ? {
                name: item.validatedProduct.name,
                price: item.validatedProduct.price,
                stock: item.validatedProduct.stockQuantity,
                image: item.validatedProduct.image || (item.validatedProduct.images && item.validatedProduct.images[0])
            } : null
        }))
    });
}));

// Update payment status
router.patch('/:id/payment', catchAsync(async (req, res) => {
    const { paymentStatus, mpesaDetails } = req.body;
    
    if (!paymentStatus) {
      throw new AppError('Payment status is required', 400, 'LINDA_MISSING_PAYMENT_STATUS');
    }
    
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      throw new AppError(`Invalid payment status. Valid options are: ${validStatuses.join(', ')}`, 400, 'LINDA_INVALID_PAYMENT_STATUS');
    }
    
    const updateData = { paymentStatus };
    
    // If M-Pesa details are provided, update them
    if (mpesaDetails) {
      updateData.mpesaDetails = mpesaDetails;
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!order) {
      throw new AppError('Order not found', 404, 'LINDA_ORDER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  // Errors handled by catchAsync wrapper
}));

// Delete an order (admin only)
router.delete('/:id', catchAsync(async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      throw new AppError('Order not found', 404, 'LINDA_ORDER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  // Errors handled by catchAsync wrapper
}));

module.exports = router;
