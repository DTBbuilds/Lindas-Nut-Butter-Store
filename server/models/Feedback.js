/**
 * Feedback Model
 * 
 * Stores customer feedback submitted after order completion
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // Link to the order this feedback is for
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  // Reference to the order number for easier queries
  orderNumber: {
    type: String,
    required: true,
    index: true
  },
  
  // Customer details
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    }
  },
  
  // Feedback scores (1-5 scale)
  ratings: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    productQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    deliveryExperience: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    customerService: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  
  // Open feedback comments
  comments: {
    type: String,
    trim: true
  },
  
  // Product recommendations likelihood (0-10 scale)
  recommendationScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  
  // Follow-up preferences
  allowFollowUp: {
    type: Boolean,
    default: false
  },
  
  // Feedback status
  status: {
    type: String,
    enum: ['NEW', 'REVIEWED', 'ADDRESSED', 'CLOSED'],
    default: 'NEW'
  },
  
  // Administrative notes (for internal use)
  adminNotes: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// Add index for recent feedback queries
feedbackSchema.index({ createdAt: -1 });

// Calculate NPS category based on recommendation score
feedbackSchema.virtual('npsCategory').get(function() {
  if (this.recommendationScore >= 9) return 'PROMOTER';
  if (this.recommendationScore >= 7) return 'PASSIVE';
  return 'DETRACTOR';
});

// Calculate average rating
feedbackSchema.virtual('averageRating').get(function() {
  const ratings = this.ratings;
  const sum = ratings.overall + ratings.productQuality + 
              ratings.deliveryExperience + ratings.customerService;
  return (sum / 4).toFixed(1);
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
