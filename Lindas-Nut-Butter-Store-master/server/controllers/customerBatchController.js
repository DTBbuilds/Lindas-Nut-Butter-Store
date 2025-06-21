/**
 * Customer Batch Operations Controller
 * 
 * Provides functionality for batch operations on customers including:
 * - Tagging multiple customers
 * - Sending emails to multiple customers
 * - Customer segmentation
 */

const mongoose = require('mongoose');
const { Customer, Order } = require('../models');
const emailService = require('../utils/emailService');

// Tag multiple customers
exports.tagCustomers = async (req, res) => {
  try {
    const { customerIds, tag } = req.body;
    
    // Validate input
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer IDs are required and must be an array'
      });
    }
    
    if (!tag || typeof tag !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Tag is required and must be a string'
      });
    }
    
    // Validate customer IDs
    const validIds = customerIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid customer IDs provided'
      });
    }
    
    // Update customers with the tag
    // In this implementation, we'll add the tag to a tags array if it doesn't already exist
    const updateResult = await Customer.updateMany(
      { _id: { $in: validIds } },
      { $addToSet: { tags: tag } }
    );
    
    return res.status(200).json({
      success: true,
      message: `Tag '${tag}' applied to ${updateResult.modifiedCount} customers`,
      data: {
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount
      }
    });
  } catch (error) {
    console.error('Error tagging customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error tagging customers',
      error: error.message
    });
  }
};

// Send email to multiple customers
exports.sendBatchEmail = async (req, res) => {
  try {
    const { customerIds, subject, message } = req.body;
    
    // Validate input
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer IDs are required and must be an array'
      });
    }
    
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }
    
    // Validate customer IDs
    const validIds = customerIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid customer IDs provided'
      });
    }
    
    // Get customer emails
    const customers = await Customer.find({ _id: { $in: validIds } })
      .select('email name')
      .lean();
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No customers found with the provided IDs'
      });
    }
    
    // Queue emails for sending
    // This is using a fictional emailService that would handle queuing and sending
    // In a real implementation, you'd integrate with a service like SendGrid, Mailchimp, etc.
    const emailPromises = customers.map(customer => {
      // Personalize the message for each customer
      const personalizedMessage = message.replace(/\{name\}/g, customer.name);
      
      return emailService.sendEmail({
        to: customer.email,
        subject,
        text: personalizedMessage,
        // Add HTML version if needed
        html: personalizedMessage.replace(/\n/g, '<br>')
      });
    });
    
    // Process emails in batches to avoid overwhelming the email service
    // In a production app, this would likely be handled by a queue system
    await Promise.all(emailPromises);
    
    return res.status(200).json({
      success: true,
      message: `Email queued for ${customers.length} customers`,
      data: {
        emailsSent: customers.length,
        customerEmails: customers.map(c => c.email)
      }
    });
  } catch (error) {
    console.error('Error sending batch email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending batch email',
      error: error.message
    });
  }
};

// Get customer segments (for filtering and batch operations)
exports.getCustomerSegments = async (req, res) => {
  try {
    // Get count of all customers
    const totalCustomers = await Customer.countDocuments();
    
    // Get new customers (registered in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get customers without orders
    const customersWithOrders = await Order.distinct('customerEmail');
    const inactiveCustomers = await Customer.countDocuments({
      email: { $nin: customersWithOrders }
    });
    
    // Get customers with multiple orders (potential VIPs)
    const customerOrderCounts = await Order.aggregate([
      { $group: { _id: '$customerEmail', orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } }
    ]);
    
    const multipleOrderCustomers = customerOrderCounts.length;
    
    // Get high-value customers
    const highValueCustomers = await Order.aggregate([
      { 
        $group: { 
          _id: '$customerEmail', 
          totalSpent: { $sum: '$totalAmount' }
        } 
      },
      { $match: { totalSpent: { $gt: 10000 } } } // Example threshold: 10,000 KES
    ]);
    
    // Return segment data
    return res.status(200).json({
      success: true,
      data: {
        segments: {
          all: totalCustomers,
          new: newCustomers,
          inactive: inactiveCustomers,
          repeat: multipleOrderCustomers,
          highValue: highValueCustomers.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting customer segments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting customer segments',
      error: error.message
    });
  }
};

// Get customers by segment
exports.getCustomersBySegment = async (req, res) => {
  try {
    const { segment } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    let query = {};
    let customerIds = [];
    
    // Build query based on segment
    switch (segment) {
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = { createdAt: { $gte: thirtyDaysAgo } };
        break;
        
      case 'inactive':
        // Get emails of customers who have placed orders
        const customerEmails = await Order.distinct('customer.email');
        query = { email: { $nin: customerEmails } };
        break;
        
      case 'repeat':
        // Get emails of customers with multiple orders
        const repeatCustomers = await Order.aggregate([
          { $group: { _id: '$customerEmail', orderCount: { $sum: 1 } } },
          { $match: { orderCount: { $gt: 1 } } }
        ]);
        
        const repeatEmails = repeatCustomers.map(customer => customer._id);
        query = { email: { $in: repeatEmails } };
        break;
        
      case 'highValue':
        // Get emails of high-value customers
        const highValueCustomers = await Order.aggregate([
          { 
            $group: { 
              _id: '$customerEmail', 
              totalSpent: { $sum: '$totalAmount' }
            } 
          },
          { $match: { totalSpent: { $gt: 10000 } } } // Example threshold: 10,000 KES
        ]);
        
        const highValueEmails = highValueCustomers.map(customer => customer._id);
        query = { email: { $in: highValueEmails } };
        break;
        
      default:
        // 'all' segment or any other segment defaults to all customers
        break;
    }
    
    // Get total count for pagination
    const total = await Customer.countDocuments(query);
    
    // Get customers with pagination
    const customers = await Customer.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting customers by segment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting customers by segment',
      error: error.message
    });
  }
};
