/**
 * Delivery Service for Kenya
 * 
 * Handles delivery-related operations:
 * - Delivery fee calculations based on location and delivery method
 * - Delivery time estimations
 * - Delivery zone management
 * - Tracking information generation
 */

const { Order } = require('../models');
const emailService = require('./emailService');
const config = require('../config');

// Kenya's counties with delivery information
const KENYA_COUNTIES = {
  'Nairobi': {
    zones: {
      'CBD': { standardDelivery: 200, expressDelivery: 400, estimatedDays: 1 },
      'Westlands': { standardDelivery: 250, expressDelivery: 450, estimatedDays: 1 },
      'Eastleigh': { standardDelivery: 250, expressDelivery: 450, estimatedDays: 1 },
      'Karen': { standardDelivery: 300, expressDelivery: 550, estimatedDays: 1 },
      'Langata': { standardDelivery: 300, expressDelivery: 550, estimatedDays: 1 },
      'Dagoretti': { standardDelivery: 300, expressDelivery: 550, estimatedDays: 1 },
      'Embakasi': { standardDelivery: 300, expressDelivery: 550, estimatedDays: 1 },
      'Kasarani': { standardDelivery: 300, expressDelivery: 550, estimatedDays: 1 },
      'Roysambu': { standardDelivery: 350, expressDelivery: 600, estimatedDays: 2 },
      'DEFAULT': { standardDelivery: 350, expressDelivery: 600, estimatedDays: 2 }
    },
    hasExpressDelivery: true
  },
  'Kiambu': {
    zones: {
      'Kikuyu': { standardDelivery: 400, expressDelivery: 700, estimatedDays: 2 },
      'Limuru': { standardDelivery: 450, expressDelivery: 750, estimatedDays: 2 },
      'Thika': { standardDelivery: 400, expressDelivery: 700, estimatedDays: 2 },
      'Ruiru': { standardDelivery: 400, expressDelivery: 700, estimatedDays: 2 },
      'Juja': { standardDelivery: 450, expressDelivery: 750, estimatedDays: 2 },
      'DEFAULT': { standardDelivery: 500, expressDelivery: 800, estimatedDays: 2 }
    },
    hasExpressDelivery: true
  },
  'Nakuru': {
    zones: {
      'Nakuru Town': { standardDelivery: 450, expressDelivery: 800, estimatedDays: 2 },
      'Naivasha': { standardDelivery: 500, expressDelivery: 850, estimatedDays: 3 },
      'DEFAULT': { standardDelivery: 550, expressDelivery: 900, estimatedDays: 3 }
    },
    hasExpressDelivery: true
  },
  'Mombasa': {
    zones: {
      'Nyali': { standardDelivery: 500, expressDelivery: 900, estimatedDays: 3 },
      'Bamburi': { standardDelivery: 500, expressDelivery: 900, estimatedDays: 3 },
      'Shanzu': { standardDelivery: 550, expressDelivery: 950, estimatedDays: 3 },
      'Likoni': { standardDelivery: 550, expressDelivery: 950, estimatedDays: 3 },
      'DEFAULT': { standardDelivery: 600, expressDelivery: 1000, estimatedDays: 3 }
    },
    hasExpressDelivery: true
  },
  'Kisumu': {
    zones: {
      'Kisumu CBD': { standardDelivery: 600, expressDelivery: 1100, estimatedDays: 3 },
      'DEFAULT': { standardDelivery: 650, expressDelivery: 1200, estimatedDays: 3 }
    },
    hasExpressDelivery: true
  },
  'DEFAULT': {
    zones: {
      'DEFAULT': { standardDelivery: 800, expressDelivery: null, estimatedDays: 5 }
    },
    hasExpressDelivery: false
  }
};

// Pickup locations across Kenya
const PICKUP_LOCATIONS = [
  { 
    id: 'NRB-CBD-01', 
    name: 'Nairobi CBD Store', 
    address: 'Moi Avenue, Near Bazaar Plaza, Nairobi', 
    county: 'Nairobi',
    coordinates: { lat: -1.2833, lng: 36.8167 },
    operatingHours: '8:00 AM - 6:00 PM (Mon-Sat)'
  },
  { 
    id: 'NRB-WES-01', 
    name: 'Westlands Branch', 
    address: 'Sarit Centre, 1st Floor, Westlands, Nairobi', 
    county: 'Nairobi',
    coordinates: { lat: -1.2614, lng: 36.8030 },
    operatingHours: '9:00 AM - 7:00 PM (Daily)'
  },
  { 
    id: 'MSA-CBD-01', 
    name: 'Mombasa Town Branch', 
    address: 'Nyali Centre, Mombasa Road, Mombasa', 
    county: 'Mombasa',
    coordinates: { lat: -4.0435, lng: 39.6682 },
    operatingHours: '9:00 AM - 6:00 PM (Mon-Sat)'
  },
  { 
    id: 'KSM-CBD-01', 
    name: 'Kisumu Store', 
    address: 'Mega Plaza, Kisumu CBD', 
    county: 'Kisumu',
    coordinates: { lat: -0.1022, lng: 34.7617 },
    operatingHours: '9:00 AM - 5:00 PM (Mon-Fri), 9:00 AM - 2:00 PM (Sat)'
  }
];

/**
 * Calculate delivery fee based on delivery details
 * 
 * @param {object} deliveryDetails - Delivery information including county, subCounty, and method
 * @returns {object} - Calculated delivery fee and estimated delivery date
 */
const calculateDeliveryFee = (deliveryDetails) => {
  try {
    const { 
      county, 
      subCounty, 
      deliveryMethod = 'STANDARD',
      orderWeight = 1, // in kg, default 1kg for standard nut butter products
      orderValue = 0   // may be used for free delivery thresholds
    } = deliveryDetails;
    
    // Get county information or default if not found
    const countyInfo = KENYA_COUNTIES[county] || KENYA_COUNTIES['DEFAULT'];
    
    // For pickup option, no delivery fee
    if (deliveryMethod === 'PICKUP') {
      return { 
        deliveryFee: 0, 
        estimatedDays: 0,
        message: 'Ready for pickup within 24 hours of order processing'
      };
    }
    
    // Check if express delivery is available
    if (deliveryMethod === 'EXPRESS' && !countyInfo.hasExpressDelivery) {
      throw new Error(`Express delivery not available in ${county}`);
    }
    
    // Find the zone or use default for the county
    const zoneInfo = countyInfo.zones[subCounty] || countyInfo.zones['DEFAULT'];
    
    // Calculate base fee based on delivery method
    let deliveryFee = deliveryMethod === 'EXPRESS' 
      ? zoneInfo.expressDelivery 
      : zoneInfo.standardDelivery;
    
    // Apply weight surcharge for heavier packages (over 3kg)
    if (orderWeight > 3) {
      const extraWeight = orderWeight - 3;
      deliveryFee += (extraWeight * 100); // 100 KES per extra kg
    }
    
    // Apply free delivery for orders above threshold
    if (orderValue > config.delivery.freeDeliveryThreshold) {
      deliveryFee = 0;
    }
    
    // Calculate estimated delivery date
    const estimatedDays = deliveryMethod === 'EXPRESS' 
      ? Math.max(1, zoneInfo.estimatedDays - 1) // Express is at least 1 day faster
      : zoneInfo.estimatedDays;
    
    const today = new Date();
    const estimatedDeliveryDate = new Date(today);
    estimatedDeliveryDate.setDate(today.getDate() + estimatedDays);
    
    // Format user-friendly message
    let message = '';
    if (deliveryFee === 0) {
      message = 'Free delivery!';
    } else {
      message = `${deliveryMethod === 'EXPRESS' ? 'Express' : 'Standard'} delivery to ${county}, ${subCounty}`;
    }
    
    return {
      deliveryFee,
      estimatedDays,
      estimatedDeliveryDate,
      message
    };
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    throw error;
  }
};

/**
 * Get available pickup locations, optionally filtered by county
 * 
 * @param {string} county - Optional county to filter pickup locations
 * @returns {Array} - List of available pickup locations
 */
const getPickupLocations = (county = null) => {
  if (county) {
    return PICKUP_LOCATIONS.filter(location => location.county === county);
  }
  return PICKUP_LOCATIONS;
};

/**
 * Get delivery options available for a specific county
 * 
 * @param {string} county - County name
 * @param {string} subCounty - Sub-county name
 * @returns {object} - Available delivery options
 */
const getDeliveryOptions = (county, subCounty) => {
  // Get county information or default if not found
  const countyInfo = KENYA_COUNTIES[county] || KENYA_COUNTIES['DEFAULT'];
  
  // Find the zone or use default for the county
  const zoneInfo = countyInfo.zones[subCounty] || countyInfo.zones['DEFAULT'];
  
  // Build delivery options
  const options = {
    standard: {
      available: true,
      fee: zoneInfo.standardDelivery,
      estimatedDays: zoneInfo.estimatedDays
    },
    express: {
      available: countyInfo.hasExpressDelivery,
      fee: zoneInfo.expressDelivery,
      estimatedDays: Math.max(1, zoneInfo.estimatedDays - 1)
    },
    pickup: {
      available: true,
      locations: getPickupLocations(county)
    }
  };
  
  return options;
};

/**
 * Generate a tracking number for an order
 * 
 * @param {string} orderId - Order ID
 * @returns {string} - Generated tracking number
 */
const generateTrackingNumber = (orderId) => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LNBTS-${timestamp}-${random}`;
};

/**
 * Update delivery status for an order
 * 
 * @param {string} orderId - Order ID
 * @param {string} status - New delivery status
 * @param {string} notes - Additional notes
 * @returns {Promise<object>} - Updated order
 */
const updateDeliveryStatus = async (orderId, status, notes = '') => {
  try {
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    
    // Update order status
    order.status = status;
    
    // Add tracking information if status is SHIPPED
    if (status === 'SHIPPED' && !order.delivery.trackingNumber) {
      order.delivery.trackingNumber = generateTrackingNumber(orderId);
      order.delivery.trackingUrl = `${config.server.baseUrl}/track/${order.delivery.trackingNumber}`;
    }
    
    // Add notes if provided
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n${notes}` : notes;
    }
    
    await order.save();
    
    // Send delivery update notification
    await sendDeliveryUpdateNotification(order);
    
    return order;
  } catch (error) {
    console.error(`Error updating delivery status for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Send delivery update notification to customer
 * 
 * @param {object} order - Order with updated delivery status
 * @returns {Promise<void>}
 */
const sendDeliveryUpdateNotification = async (order) => {
  try {
    let subject, message;
    
    // Create appropriate message based on order status
    switch (order.status) {
      case 'SHIPPED':
        subject = `Your Order #${order.referenceNumber} Is On The Way`;
        message = `
          <h2>Your Order Is On The Way!</h2>
          <p>Hello ${order.customer.name},</p>
          <p>Great news! Your order is now on its way to you.</p>
          <h3>Delivery Details</h3>
          <ul>
            <li><strong>Tracking Number:</strong> ${order.delivery.trackingNumber}</li>
            <li><strong>Delivery Method:</strong> ${order.delivery.deliveryMethod}</li>
            <li><strong>Estimated Delivery:</strong> ${new Date(order.delivery.estimatedDeliveryDate).toDateString()}</li>
            <li><strong>Delivery Location:</strong> ${order.delivery.estate}, ${order.delivery.subCounty}, ${order.delivery.county}</li>
          </ul>
          <p><a href="${order.delivery.trackingUrl}">Track Your Order</a></p>
          <p>If you have any questions about your delivery, please contact our customer support.</p>
          <p>Thank you for shopping with Linda's Nut Butter Store!</p>
        `;
        break;
        
      case 'DELIVERED':
        subject = `Your Order #${order.referenceNumber} Has Been Delivered`;
        message = `
          <h2>Your Order Has Been Delivered!</h2>
          <p>Hello ${order.customer.name},</p>
          <p>Your order has been delivered successfully. We hope you enjoy your products!</p>
          <h3>Delivery Details</h3>
          <ul>
            <li><strong>Order Number:</strong> ${order.referenceNumber}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toDateString()}</li>
          </ul>
          <p>Thank you for shopping with Linda's Nut Butter Store. We'd love to hear your feedback!</p>
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
    
    console.log(`Delivery update notification sent for order ${order._id}`);
  } catch (error) {
    console.error(`Error sending delivery update for order ${order._id}:`, error);
  }
};

module.exports = {
  calculateDeliveryFee,
  getPickupLocations,
  getDeliveryOptions,
  generateTrackingNumber,
  updateDeliveryStatus,
  sendDeliveryUpdateNotification,
  KENYA_COUNTIES,
  PICKUP_LOCATIONS
};
