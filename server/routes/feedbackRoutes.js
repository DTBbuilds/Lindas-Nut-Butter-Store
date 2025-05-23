/**
 * Feedback Routes
 * 
 * API endpoints for customer feedback management
 */

const express = require('express');
const router = express.Router();
const { Feedback, Order } = require('../models');
const emailService = require('../utils/emailService');
const config = require('../config');

/**
 * Submit new feedback
 * POST /api/feedback
 */
router.post('/', async (req, res) => {
  try {
    const { 
      orderId, 
      orderNumber, 
      ratings, 
      comments, 
      recommendationScore,
      allowFollowUp 
    } = req.body;
    
    // Validate required fields
    if (!orderId || !ratings || !recommendationScore) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, ratings, and recommendation score are required'
      });
    }
    
    // Get order information to populate customer details
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if feedback already exists for this customer email and order
    const existingFeedback = await Feedback.findOne({
      orderId,
      'customer.email': order.customer.email
    });
    
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this order'
      });
    }
    
    // Create feedback document
    const feedback = new Feedback({
      orderId,
      orderNumber: orderNumber || order.orderNumber,
      customer: order.customer,
      ratings,
      comments,
      recommendationScore,
      allowFollowUp: !!allowFollowUp
    });
    
    // Save feedback
    await feedback.save();
    
    // Send thank you email if email service is enabled
    if (config.notifications && config.notifications.email && config.notifications.email.enabled) {
      try {
        await emailService.sendEmail(
          order.customer.email,
          'Thank you for your feedback - Linda\'s Nut Butter',
          `<h1>Thank You for Your Feedback!</h1>
          <p>Dear ${order.customer.name},</p>
          <p>We greatly appreciate you taking the time to share your thoughts with us about your recent purchase.</p>
          <p>Your feedback helps us improve our products and services.</p>
          <p>If you have any additional thoughts or questions, please don't hesitate to contact us.</p>
          <p>Warm regards,</p>
          <p>Linda's Nut Butter Team</p>`
        );
      } catch (emailError) {
        console.error('Failed to send feedback thank you email:', emailError);
        // Continue processing even if email fails
      }
    }
    
    // Alert team about low scores (NPS detractors)
    if (recommendationScore < 7) {
      try {
        // Send alert to team about detractor feedback
        await emailService.sendEmail(
          config.notifications?.email?.alertRecipient || 'lindagrocer254@gmail.com',
          'ALERT: Low Customer Satisfaction Feedback Received',
          `<h1>Low Satisfaction Feedback Received</h1>
          <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
          <p><strong>Order Number:</strong> ${orderNumber || order.referenceNumber}</p>
          <p><strong>NPS Score:</strong> ${recommendationScore}/10</p>
          <p><strong>Overall Rating:</strong> ${ratings.overall}/5</p>
          <p><strong>Comments:</strong> ${comments || 'No comments provided'}</p>
          <p><strong>Action Required:</strong> Please review this feedback and consider reaching out to the customer.</p>`
        );
      } catch (alertError) {
        console.error('Failed to send low satisfaction alert:', alertError);
        // Continue processing even if alert fails
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: feedback._id
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

/**
 * Get feedback by ID
 * GET /api/feedback/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error(`Error getting feedback ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get feedback',
      error: error.message
    });
  }
});

/**
 * Get feedback for an order
 * GET /api/feedback/order/:orderId
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const feedback = await Feedback.findOne({ orderId }).sort({ createdAt: -1 });
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'No feedback found for this order'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error(`Error getting feedback for order ${req.params.orderId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get feedback for order',
      error: error.message
    });
  }
});

/**
 * Get list of feedback with pagination and filtering
 * GET /api/feedback
 * Query params: page, limit, status, minRating, minRecommendationScore, startDate, endDate
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      minRating, 
      minRecommendationScore,
      startDate, 
      endDate 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (minRating) {
      query['ratings.overall'] = { $gte: parseInt(minRating) };
    }
    
    if (minRecommendationScore) {
      query.recommendationScore = { $gte: parseInt(minRecommendationScore) };
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Count total matching feedback
    const total = await Feedback.countDocuments(query);
    
    // Get paginated feedback
    const feedbackList = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: {
        feedback: feedbackList,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting feedback list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get feedback list',
      error: error.message
    });
  }
});

/**
 * Update feedback status
 * PUT /api/feedback/:id/status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Update feedback status
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { 
        status,
        ...(adminNotes && { adminNotes })
      },
      { new: true }
    );
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });
  } catch (error) {
    console.error(`Error updating feedback status ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
      error: error.message
    });
  }
});

/**
 * Get feedback statistics
 * GET /api/feedback/stats
 * Query params: startDate, endDate
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date query
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get all feedback for the period
    const feedback = await Feedback.find(dateQuery);
    
    // Calculate statistics
    const totalFeedback = feedback.length;
    
    // Skip further calculations if no feedback
    if (totalFeedback === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalFeedback: 0,
          averageRatings: {
            overall: 0,
            productQuality: 0,
            deliveryExperience: 0,
            customerService: 0
          },
          nps: {
            score: 0,
            promoters: 0,
            passives: 0,
            detractors: 0
          }
        }
      });
    }
    
    // Calculate average ratings
    const sumRatings = feedback.reduce((acc, f) => {
      return {
        overall: acc.overall + f.ratings.overall,
        productQuality: acc.productQuality + f.ratings.productQuality,
        deliveryExperience: acc.deliveryExperience + f.ratings.deliveryExperience,
        customerService: acc.customerService + f.ratings.customerService
      };
    }, { 
      overall: 0, 
      productQuality: 0, 
      deliveryExperience: 0, 
      customerService: 0 
    });
    
    const averageRatings = {
      overall: (sumRatings.overall / totalFeedback).toFixed(1),
      productQuality: (sumRatings.productQuality / totalFeedback).toFixed(1),
      deliveryExperience: (sumRatings.deliveryExperience / totalFeedback).toFixed(1),
      customerService: (sumRatings.customerService / totalFeedback).toFixed(1)
    };
    
    // Calculate NPS metrics
    const promoters = feedback.filter(f => f.recommendationScore >= 9).length;
    const passives = feedback.filter(f => f.recommendationScore >= 7 && f.recommendationScore <= 8).length;
    const detractors = feedback.filter(f => f.recommendationScore <= 6).length;
    
    const npsScore = Math.round(((promoters - detractors) / totalFeedback) * 100);
    
    return res.status(200).json({
      success: true,
      data: {
        totalFeedback,
        averageRatings,
        nps: {
          score: npsScore,
          promoters,
          passives,
          detractors
        }
      }
    });
  } catch (error) {
    console.error('Error getting feedback statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get feedback statistics',
      error: error.message
    });
  }
});

module.exports = router;
