/**
 * Customer Admin Controller
 * 
 * Provides functionality for admins to manage customers
 * Enhanced with additional features for customer data management
 * Improved with standardized error handling
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import the model helper to safely access models without circular dependencies
const { getCustomer, getOrder, getFeedback, getTransaction } = require('../utils/modelHelper');
const { sendEmail } = require('../utils/emailService');
const { 
  asyncHandler, 
  validateObjectId, 
  ValidationError, 
  NotFoundError, 
  DatabaseError,
  safeAggregation,
  sendErrorResponse 
} = require('../utils/errorHandler');

/**
 * Get all customers for admin management
 * Enhanced with additional filtering and data enrichment
 * Updated with improved error handling
 */
exports.getAllCustomers = asyncHandler(async (req, res) => {
  try {
    // Validate and extract pagination parameters
    const page = Math.max(parseInt(req.query.page) || 1, 1); // Ensure page is at least 1
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Between 1 and 100
    const skip = (page - 1) * limit;
    
    // Extract search and sort parameters
    const searchTerm = req.query.search || '';
    const sortField = ['name', 'email', 'phoneNumber', 'createdAt', 'status'].includes(req.query.sortField) 
      ? req.query.sortField 
      : 'createdAt'; // Validate sort field
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Build search query
    let searchQuery = {};
    if (searchTerm) {
      searchQuery = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { phoneNumber: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }
    
    // Verify MongoDB connection before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB connection is not ready. Current state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection is not available. Please try again later.'
      });


    }
    
    // Get the Customer model safely using the helper
    const Customer = getCustomer();
    if (!Customer) {
      console.error('Customer model could not be loaded');
      return res.status(500).json({
        success: false,
        message: 'Customer model is not available. Please try again later.'
      });


    }
    
    // Execute queries with additional data
    let customers;
    try {
      customers = await Customer.find(searchQuery)
        .select('-password -passwordResetToken -passwordResetExpires')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
    } catch (dbError) {
      console.error('Error fetching customers from database:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customers from database',
        error: dbError.message
      });


    }
    
  // Safely enhance customers with improved error handling
  const enhancedCustomers = await Promise.all(customers.map(async (customer) => {
    // Basic validation of customer object to prevent errors
    if (!customer) {
      console.warn('Received null or undefined customer in getAllCustomers');
      return {
        _id: 'unknown',
        name: 'Unknown Customer',
        email: 'unknown@email.com',
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: null,
        registrationDate: new Date(),
        error: 'Invalid customer data'
      };
    }
    try {
      // Handle missing _id or email
      if (!customer._id && !customer.email) {
        return {
          ...customer,
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: null,
          registrationDate: customer.createdAt
        };
      }
      
      // Parse customer name into first and last for better display
      let firstName = '', lastName = '';
      if (customer.name) {
        const nameParts = customer.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Build query conditions based on available data
      const conditions = [];
      if (customer._id) {
        conditions.push({ 'customer': customer._id });


      }
      if (customer.email) {
        conditions.push({ 'customerEmail': customer.email });


      }
      
      const query = conditions.length > 0 ? { $or: conditions } : { _id: null };
      
      // Get the Order model safely
      const Order = getOrder();
      
      // Use Promise.all for parallel queries to improve performance
      const [orderCount, paidOrders, lastOrder] = await Promise.all([
        Order.countDocuments(query),
        Order.find({
          ...query,
          paymentStatus: 'PAID'
        }).select('totalAmount').lean(),
        Order.findOne(query)
          .sort({ createdAt: -1 })
          .select('createdAt')
          .lean()
      ]);
      
      const totalSpent = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      return {
        ...customer,
        firstName,
        lastName,
        orderCount,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        registrationDate: customer.createdAt
      };
    } catch (customerError) {
      console.error(`Error processing customer ${customer._id || customer.email}:`, customerError);
      // Return customer with default values if there's an error
      return {
        ...customer,
        firstName: customer.name ? customer.name.split(' ')[0] : '',
        lastName: customer.name ? customer.name.split(' ').slice(1).join(' ') : '',
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: null,
        registrationDate: customer.createdAt,
        error: 'Failed to load complete customer data'
      };
    }
  }));
  
  // Get total count with error handling
  let totalCustomers;
  try {
    const Customer = getCustomer();
    totalCustomers = await Customer.countDocuments(searchQuery);
  } catch (countError) {
    console.error('Error counting customers:', countError);
    if (countError.name === 'MongoError') {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred while counting customers',
        error: countError.message
      });


    } else {
      totalCustomers = customers.length; // Fallback to the current page count
    }
  }
  
  return res.json({
    success: true,
    customers: enhancedCustomers,
    pagination: {
      total: totalCustomers,
      page,
      limit,
      pages: Math.ceil(totalCustomers / limit)
    }
  });


  
  } catch (outerError) {
    // Final safety net to catch any errors that might have escaped other handlers
    console.error('Unexpected error in getAllCustomers:', outerError);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while processing your request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : outerError.message
    });


  }
});

/**
 * Create a new customer from the admin panel
 * Validates input and ensures the customer does not already exist
 */
exports.createCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError('Name, email, and password are required');
  }

  const Customer = getCustomer();
  const customerExists = await Customer.findOne({ email });

  if (customerExists) {
    throw new ValidationError('Customer with this email already exists');
  }

  const customer = new Customer({
    name,
    email,
    password, // Password will be hashed by the pre-save hook in the model
    phoneNumber,
  });

  const createdCustomer = await customer.save();

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: {
      _id: createdCustomer._id,
      name: createdCustomer.name,
      email: createdCustomer.email,
      phoneNumber: createdCustomer.phoneNumber,
      createdAt: createdCustomer.createdAt,
    },
  });
});

/**
 * Reset a customer's password from the admin panel
 * Validates the new password and sends a notification email
 */
exports.resetCustomerPassword = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { newPassword } = req.body;

  validateObjectId(customerId);

  if (!newPassword || newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long');
  }

  const Customer = getCustomer();
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  customer.password = newPassword;
  await customer.save();

  try {
    await sendEmail({
      to: customer.email,
      subject: 'Your Password Has Been Reset',
      html: `<p>Hello ${customer.name},</p><p>Your password has been reset by an administrator. If you did not request this, please contact support immediately.</p>`,
    });
  } catch (emailError) {
    console.error(`Failed to send password reset notification to ${customer.email}:`, emailError);
  }

  res.status(200).json({
    success: true,
    message: 'Customer password has been reset successfully.',
  });
});

/**
 * Get a single customer details with complete history
 * Updated with improved error handling
 */
exports.getCustomerDetails = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  
  // Validate ObjectId format
  validateObjectId(customerId);
  
  // Get the Customer model safely
  const Customer = getCustomer();
  
  // Find customer and populate with related data
  let customer = await Customer.findById(customerId)
    .select('-password -passwordResetToken -passwordResetExpires')
    .lean();
    
  // Check if customer exists
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
    
  // Parse name into first and last name for better UI display
  if (customer.name) {
    const nameParts = customer.name.split(' ');
    customer.firstName = nameParts[0] || '';
    customer.lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Create an array of promises for parallel execution
  // Get the necessary models
  const Order = getOrder();
  const Feedback = getFeedback();
  
  const [orders, feedback, customerMetrics] = await Promise.all([
    // Get all customer orders for complete history
    // Check both customer ID and customer email to catch guest checkouts
    Order.find({
      $or: [
        { customer: new mongoose.Types.ObjectId(customerId) },
        { 'customerEmail': customer.email }
      ]
    })
      .sort({ createdAt: -1 })
      .lean()
      .catch(err => {
        console.error(`Error fetching orders for customer ${customerId}:`, err);
        return []; // Return empty array in case of error
      }),
      
    // Get customer feedback and reviews
    Feedback.find({ customer: new mongoose.Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .lean()
      .catch(err => {
        console.error(`Error fetching feedback for customer ${customerId}:`, err);
        return []; // Return empty array in case of error
      }),
      
    // Calculate comprehensive customer metrics - using safeAggregation to handle errors
    safeAggregation(Order, [
      { 
        $match: { 
          $or: [
            { customer: new mongoose.Types.ObjectId(customerId) },
            { 'customerEmail': customer.email }
          ]
        } 
      },
      { 
        $group: { 
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] } },
          averageOrderValue: { $avg: "$totalAmount" },
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" }
        } 
      }
    ])
  ]);
  
  // Extract metrics with defaults if aggregation returned no results
  const metrics = customerMetrics.length > 0 ? customerMetrics[0] : {
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    firstOrderDate: null,
    lastOrderDate: null
  };
  
  // Calculate days since last order
  let daysSinceLastOrder = null;
  if (metrics.lastOrderDate) {
    const lastOrderDate = new Date(metrics.lastOrderDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastOrderDate);
    daysSinceLastOrder = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Calculate customer lifetime in days
  let customerLifetimeDays = null;
  if (customer.createdAt) {
    const createdAt = new Date(customer.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - createdAt);
    customerLifetimeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  return res.json({
    success: true,
    customer,
    relatedData: {
      orders,
      feedback,
      metrics: {
        totalOrders: metrics.totalOrders,
        totalSpent: metrics.totalSpent,
        averageOrderValue: metrics.averageOrderValue,
        firstOrderDate: metrics.firstOrderDate,
        lastOrderDate: metrics.lastOrderDate,
        daysSinceLastOrder,
        customerLifetimeDays
      }
    }
  });


});



/**
 * Delete a customer
 * Updated with improved error handling
 */
exports.deleteCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  
  // Validate ObjectId format
  validateObjectId(customerId);
  
  // Get the Customer model safely
  const Customer = getCustomer();
  
  // Check if customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Check if customer has orders before deleting
  let orderCount;
  try {
    orderCount = await Order.countDocuments({ customer: customerId });


  } catch (countError) {
    console.error(`Error counting orders for customer ${customerId}:`, countError);
    throw new DatabaseError('Error checking customer orders', countError);
  }
  
  // If customer has orders, we'll warn the admin
  if (orderCount > 0) {
    // If force delete is not specified, return warning
    if (req.query.force !== 'true') {
      return sendErrorResponse(res, 400, 
        `This customer has ${orderCount} orders. Use force=true parameter to confirm deletion.`, 
        { hasOrders: true, orderCount }
      );
    }
  }
  
  // Use Promise.all for parallel operations
  try {
    // Get the Feedback model safely
    const Feedback = getFeedback();
    
    await Promise.all([
      // Delete related data
      Feedback.deleteMany({ customer: customerId }),
      // Finally delete the customer
      Customer.findByIdAndDelete(customerId)
    ]);
  } catch (deleteError) {
    console.error(`Error performing delete operations for customer ${customerId}:`, deleteError);
    throw new DatabaseError('Error deleting customer data', deleteError);
  }
  
  return res.json({
    success: true,
    message: 'Customer deleted successfully'
  });


});



/**
 * Get customer order history
 * Updated with improved error handling
 */
exports.getCustomerOrderHistory = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  
  // Validate ObjectId format
  validateObjectId(customerId);
  
  // Find customer
  const customer = await Customer.findById(customerId)
    .select('-password -passwordResetToken -passwordResetExpires')
    .lean()
    .catch(err => {
      console.error(`Error finding customer ${customerId}:`, err);
      throw new DatabaseError('Error retrieving customer data', err);
    });


  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Add pagination with validation
  const page = Math.max(parseInt(req.query.page) || 1, 1); // Minimum page 1
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Between 1 and 100
  const skip = (page - 1) * limit;
  
  // Add filtering and sorting with validation
  const validSortFields = ['createdAt', 'totalAmount', 'status', 'paymentStatus'];
  const sortField = validSortFields.includes(req.query.sortField) ? req.query.sortField : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
  // Validate status filter if provided
  const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  let statusFilter = {};
  if (req.query.status) {
    if (validStatuses.includes(req.query.status.toUpperCase())) {
      statusFilter = { status: req.query.status.toUpperCase() };
    } else {
      // Non-blocking warning for invalid status
      console.warn(`Invalid status filter: ${req.query.status}`);
    }
  }
  
  // Build the query to find orders by customer ID or customer email
  const query = {
    $or: [
      { 'customer': customerId },
      { 'customerEmail': customer.email }
    ],
    ...statusFilter
  };
  
  // Use Promise.all for parallel queries
  try {
    const [orders, totalOrders] = await Promise.all([
      // Get orders with pagination
      Order.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      
      // Get total count for pagination
      Order.countDocuments(query)
    ]);
    
    return res.json({
      success: true,
      orders,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      },
      pagination: {
        total: totalOrders,
        page,
        limit,
        pages: Math.ceil(totalOrders / limit)
      }
    });


  } catch (queryError) {
    console.error(`Error querying orders for customer ${customerId}:`, queryError);
    throw new DatabaseError('Error retrieving order history', queryError);
  }
});



/**
 * Create a new customer from admin panel
 * Allows admins to manually create customer accounts
 * Updated with improved error handling
 */
exports.createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, password, address } = req.body;
  
  // Enhanced validation
  if (!email) {
    throw new ValidationError('Email is required');
  }
  
  if (!password) {
    throw new ValidationError('Password is required');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  // Check if customer with this email already exists
  const existingCustomer = await Customer.findOne({ email: email.toLowerCase() })
    .catch(err => {
      console.error(`Error checking for existing customer with email ${email}:`, err);
      throw new DatabaseError('Error checking existing customers', err);
    });


    
  if (existingCustomer) {
    throw new ValidationError(`A customer with email ${email} already exists`);
  }
  
  // Hash password with error handling
  let hashedPassword;
  try {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  } catch (hashError) {
    console.error('Error hashing password:', hashError);
    throw new Error('Error securing password');
  }
  
  // Prepare customer data with validated fields
  const customerData = {
    name: name || '',
    email: email.toLowerCase(),
    phoneNumber: phoneNumber || '',
    password: hashedPassword,
    addresses: address ? [{
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'Kenya',
      isDefault: true
    }] : [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active',
    source: 'admin_created'
  };
  
  // Create and save new customer
  let newCustomer;
  try {
    newCustomer = new Customer(customerData);
    await newCustomer.save();
  } catch (saveError) {
    console.error('Error saving new customer:', saveError);
    throw new DatabaseError('Error creating customer record', saveError);
  }
  
  // Send welcome email to customer - non-blocking
  sendEmail({
    to: email,
    subject: 'Welcome to Linda\'s Nut Butter Store',
    text: `Hello ${name || 'Valued Customer'},\n\nYour account has been created by our admin team. You can now log in with your email and the provided password.\n\nThank you for joining Linda's Nut Butter Store!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Linda's Nut Butter Store!</h2>
        <p>Hello ${name || 'Valued Customer'},</p>
        <p>Your account has been created by our admin team. You can now log in with your email and the provided password.</p>
        <p>Thank you for joining Linda's Nut Butter Store!</p>
      </div>
    `
  }).catch(emailError => {
    console.error(`Error sending welcome email to ${email}:`, emailError);
    // Continue even if email fails
  });


  
  // Return success response with customer data (excluding sensitive fields)
  const customerToReturn = await Customer.findById(newCustomer._id)
    .select('-password -passwordResetToken -passwordResetExpires')
    .lean()
    .catch(err => {
      // This shouldn't fail since we just created it, but handle just in case
      console.error(`Error retrieving created customer ${newCustomer._id}:`, err);
      return { _id: newCustomer._id, email, name }; // Return minimal data if retrieval fails
    });


  
  return res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    customer: customerToReturn
  });


});



/**
 * Update customer from admin panel
 * Allows admins to edit customer details
 * Updated with improved error handling
 */
exports.updateCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { name, email, phoneNumber, status, address } = req.body;
  
  // Validate ObjectId format
  validateObjectId(customerId);
  
  // Find customer with error handling
  let customer;
  try {
    customer = await Customer.findById(customerId);
  } catch (findError) {
    console.error(`Error finding customer ${customerId}:`, findError);
    throw new DatabaseError('Error retrieving customer data', findError);
  }
  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }
  
  // Check if email is being changed and if it's already in use
  if (email && email.toLowerCase() !== customer.email) {
    try {
      const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });


      if (existingCustomer) {
        throw new ValidationError(`Email ${email} is already in use by another customer`);
      }
      customer.email = email.toLowerCase();
    } catch (emailCheckError) {
      if (emailCheckError instanceof ValidationError) {
        throw emailCheckError;
      }
      console.error(`Error checking existing email ${email}:`, emailCheckError);
      throw new DatabaseError('Error checking email availability', emailCheckError);
    }
  }
  
  // Validate status if provided
  if (status) {
    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new ValidationError(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
    }
    customer.status = status.toLowerCase();
  }
  
  // Update customer fields
  if (name) customer.name = name;
  if (phoneNumber) customer.phoneNumber = phoneNumber;
  
  // Update address if provided with validation
  if (address) {
    // Validate address fields if provided
    if (address.postalCode && !/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
      // This is a simple validation - customize based on your requirements
      console.warn(`Potentially invalid postal code format: ${address.postalCode}`);
    }
    
    // If customer has no addresses, create a new one
    if (customer.addresses.length === 0) {
      customer.addresses.push({
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'Kenya',
        isDefault: true
      });


    } else {
      // Update the default address
      const defaultAddressIndex = customer.addresses.findIndex(addr => addr.isDefault);
      if (defaultAddressIndex >= 0) {
        // Only update fields that are provided
        if (address.street) customer.addresses[defaultAddressIndex].street = address.street;
        if (address.city) customer.addresses[defaultAddressIndex].city = address.city;
        if (address.state) customer.addresses[defaultAddressIndex].state = address.state;
        if (address.postalCode) customer.addresses[defaultAddressIndex].postalCode = address.postalCode;
        if (address.country) customer.addresses[defaultAddressIndex].country = address.country;
      } else {
        // No default address found, add this as default
        customer.addresses.push({
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || 'Kenya',
          isDefault: true
        });


      }
    }
  }
  
  // Update timestamp
  customer.updatedAt = new Date();
  
  // Save customer with error handling
  try {
    await customer.save();
  } catch (saveError) {
    console.error(`Error saving customer ${customerId}:`, saveError);
    throw new DatabaseError('Error updating customer data', saveError);
  }
  
  // Return updated customer
  let updatedCustomer;
  try {
    updatedCustomer = await Customer.findById(customerId)
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean();
  } catch (retrieveError) {
    console.error(`Error retrieving updated customer ${customerId}:`, retrieveError);
    // Return a basic success response if we can't retrieve the updated customer
    return res.json({
      success: true,
      message: 'Customer updated successfully but unable to retrieve updated data',
      customer: { _id: customerId }
    });


  }
  
  return res.json({
    success: true,
    message: 'Customer updated successfully',
    customer: updatedCustomer
  });


});



/**
 * Reset customer password from admin panel
 * Updated with improved error handling
 */
exports.resetCustomerPassword = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const { newPassword, sendEmail: shouldSendEmail } = req.body;
  
  // Validate ObjectId format
  validateObjectId(customerId);
  
  // Validate password strength
  if (!newPassword) {
    throw new ValidationError('New password is required');
  }
  
  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Check for common password patterns (simple check)
  if (/^(12345|password|admin|qwerty)/i.test(newPassword)) {
    throw new ValidationError('Password is too common or weak. Please use a stronger password.');
  }
  
  // Find customer with error handling
  let customer;
  try {
    customer = await Customer.findById(customerId);
  } catch (findError) {
    console.error(`Error finding customer ${customerId}:`, findError);
    throw new DatabaseError('Error retrieving customer data', findError);
  }
  
  if (!customer) {
    throw new NotFoundError(`Customer with ID ${customerId} not found`);
  }
  
  // Hash new password with error handling
  let hashedPassword;
  try {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(newPassword, salt);
  } catch (hashError) {
    console.error('Error hashing new password:', hashError);
    throw new Error('Error securing password');
  }
  
  // Update password
  customer.password = hashedPassword;
  customer.updatedAt = new Date();
  
  // Save with error handling
  try {
    await customer.save();
  } catch (saveError) {
    console.error(`Error saving customer ${customerId} with new password:`, saveError);
    throw new DatabaseError('Error updating customer password', saveError);
  }
  
  // Send password reset email if requested - non-blocking
  if (shouldSendEmail) {
    sendEmail({
      to: customer.email,
      subject: 'Your Password Has Been Reset',
      text: `Hello ${customer.name || 'Valued Customer'},\n\nYour password has been reset by our admin team. You can now log in with your new password.\n\nIf you did not request this change, please contact our support team immediately.\n\nThank you,\nLinda's Nut Butter Store Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Notification</h2>
          <p>Hello ${customer.name || 'Valued Customer'},</p>
          <p>Your password has been reset by our admin team. You can now log in with your new password.</p>
          <p><strong>If you did not request this change, please contact our support team immediately.</strong></p>
          <p>Thank you,<br>Linda's Nut Butter Store Team</p>
        </div>
      `
    }).catch(emailError => {
      console.error(`Error sending password reset email to ${customer.email}:`, emailError);
      // Log error but continue - email sending should not block the API response
    });


  }
  
  // Add audit log entry (in production, would typically log to a separate collection)
  console.log(`[AUDIT] Password reset for customer ${customerId} by admin on ${new Date().toISOString()}`);
  
  return res.json({
    success: true,
    message: 'Customer password reset successfully'
  });


});



/**
 * Get customer stats for admin dashboard
 * Updated with improved error handling
 */
exports.getCustomerStats = asyncHandler(async (req, res) => {
  // Use Promise.all for parallel data fetching where possible
  let totalCustomers, newCustomers;
  
  // Define time periods for stats
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  try {
    
    // Get the Customer model safely using the helper
    const Customer = getCustomer();
    if (!Customer) {
      throw new Error('Customer model could not be loaded');
    }

    // Execute queries in parallel
    [totalCustomers, newCustomers] = await Promise.all([
      // Total customers
      Customer.countDocuments().catch(err => {
        console.error('Error counting total customers:', err);
        return 0; // Provide a fallback
      }),
      
      // New customers in the last 30 days
      Customer.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }).catch(err => {
        console.error('Error counting new customers:', err);
        return 0; // Provide a fallback
      })
    ]);
  } catch (countError) {
    console.error('Error fetching customer counts:', countError);
    totalCustomers = 0;
    newCustomers = 0;
  }
  
  // Define reusable month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Get customers by month (last 6 months) - using safeAggregation utility
  
  // Get the Customer model safely using the helper
  const Customer = getCustomer();
  if (!Customer) {
    throw new Error('Customer model could not be loaded');
  }

  const customersByMonth = await safeAggregation(Customer, [
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { 
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ], 'Error fetching customers by month');
  
  // Format months for display with safe handling of potential null values
  const formattedCustomersByMonth = customersByMonth.map(item => ({
    month: `${monthNames[((item._id?.month || 1) - 1) % 12]} ${item._id?.year || new Date().getFullYear()}`,
    count: item.count || 0
  }));
  
  // Get the Order model safely using the helper
  const Order = getOrder();
  if (!Order) {
    throw new Error('Order model could not be loaded');
  }

  // Execute the remaining aggregations in parallel
  const [
    customerSegments,
    orderStats,
    retentionByMonth,
    topCustomers
  ] = await Promise.all([
    // Customer segments by spending
    safeAggregation(Order, [
      { $match: { paymentStatus: 'PAID' } },
      {
        $group: {
          _id: '$customerEmail',
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          segment: {
            $cond: [
              { $gte: ["$totalSpent", 10000] }, "Premium",
              { $cond: [
                { $gte: ["$totalSpent", 5000] }, "Gold",
                { $cond: [
                  { $gte: ["$totalSpent", 2000] }, "Silver",
                  "Bronze"
                ]}
              ]}
            ]
          }
        }
      },
      {
        $group: {
          _id: "$segment",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ], 'Error calculating customer segments'),
    
    // Order statistics for average order value
    safeAggregation(Order, [
      { $match: { paymentStatus: 'PAID' } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ], 'Error calculating order statistics'),
    
    // Customer retention by month
    safeAggregation(Order, [
      { $match: { paymentStatus: 'PAID' } },
      {
        $group: {
          _id: {
            email: '$customerEmail',
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { 
            year: "$_id.year", 
            month: "$_id.month" 
          },
          totalCustomers: { $sum: 1 },
          returningCustomers: {
            $sum: { $cond: [{ $gt: ["$count", 1] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ], 'Error calculating customer retention'),
    
    // Top customers by spending
    safeAggregation(Order, [
      { $match: { paymentStatus: 'PAID', customerEmail: { $exists: true, $ne: null } } },
      { 
        $group: { 
          _id: '$customerEmail', 
          customerName: { $first: '$customer.name' },
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' }
        } 
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      { 
        $project: { 
          _id: 0,
          email: '$_id',
          name: { $ifNull: ['$customerName', 'Guest'] },
          totalSpent: 1,
          orderCount: 1,
          lastOrderDate: 1
        } 
      }
    ], 'Error fetching top customers')
  ]);
  
  // Format segments for display with error protection
  const formattedSegments = customerSegments.map(segment => ({
    name: segment._id || 'Unknown',
    count: segment.count || 0
  }));
  
  // Calculate average order value with error protection
  const averageOrderValue = orderStats.length > 0 && orderStats[0]?.totalOrders > 0 
    ? (orderStats[0].totalRevenue / orderStats[0].totalOrders) 
    : 0;
  
  // Format retention data with error protection
  const formattedRetention = retentionByMonth.map(item => {
    const retentionRate = (item.totalCustomers || 0) > 0 
      ? ((item.returningCustomers || 0) / item.totalCustomers) * 100 
      : 0;
    
    return {
      month: `${monthNames[((item._id?.month || 1) - 1) % 12]} ${item._id?.year || new Date().getFullYear()}`,
      rate: Math.round(retentionRate)
    };
  });


  
  // Return the compiled statistics
  return res.json({
    success: true,
    stats: {
      totalCustomers,
      newCustomers,
      newCustomersPercentage: totalCustomers ? ((newCustomers / totalCustomers) * 100) : 0,
      averageOrderValue,
      customersByMonth: formattedCustomersByMonth,
      customerSegments: formattedSegments,
      customerRetention: formattedRetention,
      topCustomers
    }
  });


});


