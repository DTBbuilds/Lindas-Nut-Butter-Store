/**
 * Order Model
 * Represents an order in the system
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Order item schema (embedded in order)
const OrderItemSchema = new Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String
  }
});

// Order schema
const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  processingDate: {
    type: Date
  },
  shippedDate: {
    type: Date
  },
  deliveredDate: {
    type: Date
  },
  estimatedDeliveryDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate order number
OrderSchema.statics.generateOrderNumber = function() {
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LNB-${timestamp}-${random}`;
};

// Method to update order status with appropriate date
OrderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  // Update the corresponding date based on status
  switch(newStatus) {
    case 'PROCESSING':
      this.processingDate = new Date();
      break;
    case 'SHIPPED':
      this.shippedDate = new Date();
      break;
    case 'DELIVERED':
      this.deliveredDate = new Date();
      break;
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', OrderSchema);
