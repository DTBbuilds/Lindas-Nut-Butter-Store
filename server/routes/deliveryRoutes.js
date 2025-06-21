/**
 * Delivery Routes
 * 
 * API endpoints for Kenya-specific delivery management
 */

const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const deliveryService = require('../utils/deliveryService');

/**
 * Get delivery options for a location in Kenya
 * GET /api/delivery/options
 * Query params: county, subCounty
 */
router.get('/options', (req, res) => {
  try {
    const { county, subCounty } = req.query;
    
    if (!county || !subCounty) {
      return res.status(400).json({
        success: false,
        message: 'County and sub-county are required'
      });
    }
    
    const options = deliveryService.getDeliveryOptions(county, subCounty);
    
    return res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error getting delivery options:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get delivery options',
      error: error.message
    });
  }
});

/**
 * Calculate delivery fee
 * POST /api/delivery/calculate-fee
 */
router.post('/calculate-fee', (req, res) => {
  try {
    const { 
      county, 
      subCounty, 
      deliveryMethod,
      orderWeight,
      orderValue
    } = req.body;
    
    if (!county || !subCounty) {
      return res.status(400).json({
        success: false,
        message: 'County and sub-county are required'
      });
    }
    
    const result = deliveryService.calculateDeliveryFee({
      county,
      subCounty,
      deliveryMethod,
      orderWeight,
      orderValue
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate delivery fee',
      error: error.message
    });
  }
});

/**
 * Get pickup locations
 * GET /api/delivery/pickup-locations
 * Query params: county (optional)
 */
router.get('/pickup-locations', (req, res) => {
  try {
    const { county } = req.query;
    const locations = deliveryService.getPickupLocations(county);
    
    return res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error getting pickup locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pickup locations',
      error: error.message
    });
  }
});

/**
 * Update delivery status
 * PUT /api/delivery/status/:orderId
 */
router.put('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const order = await deliveryService.updateDeliveryStatus(orderId, status, notes);
    
    return res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        trackingNumber: order.delivery.trackingNumber,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error updating delivery status for order ${req.params.orderId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
});

/**
 * Track order by tracking number
 * GET /api/delivery/track/:trackingNumber
 */
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    // Find order by tracking number
    const order = await Order.findOne({ 'delivery.trackingNumber': trackingNumber });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Return tracking information
    return res.status(200).json({
      success: true,
      data: {
        trackingNumber: order.delivery.trackingNumber,
        status: order.status,
        recipient: order.delivery.recipient,
        county: order.delivery.county,
        subCounty: order.delivery.subCounty,
        estate: order.delivery.estate,
        estimatedDeliveryDate: order.delivery.estimatedDeliveryDate,
        deliveryMethod: order.delivery.deliveryMethod,
        orderDate: order.createdAt,
        lastUpdate: order.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error tracking order ${req.params.trackingNumber}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track order',
      error: error.message
    });
  }
});

/**
 * Get list of counties and sub-counties in Kenya for dropdowns
 * GET /api/delivery/locations
 */
router.get('/locations', (req, res) => {
  try {
    const counties = deliveryService.KENYA_COUNTIES;
    const formattedLocations = [];
    
    // Format the data for easy consumption by frontend
    Object.keys(counties).forEach(county => {
      if (county !== 'DEFAULT') {
        const subCounties = Object.keys(counties[county].zones).filter(zone => zone !== 'DEFAULT');
        formattedLocations.push({
          county,
          subCounties,
          hasExpressDelivery: counties[county].hasExpressDelivery
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      data: formattedLocations
    });
  } catch (error) {
    console.error('Error getting location data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get location data',
      error: error.message
    });
  }
});

module.exports = router;
