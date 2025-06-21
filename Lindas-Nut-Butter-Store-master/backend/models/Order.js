const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: '/images/placeholder.png'
  },
  variant: {
    type: Object,
    default: null
  }
});

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
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
    },
    pickupLocation: {
      type: String,
      default: ''
    }
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  shipping: {
    type: Number,
    required: true,
    default: 300,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    code: String,
    amount: Number
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDeliveryDate: {
    type: Date,
    default: function() {
      // Default to 3 days from order date
      const date = new Date();
      date.setDate(date.getDate() + 3);
      return date;
    }
  },
  paymentMethod: {
    type: String,
    enum: ['MPESA', 'CASH', 'BANK_TRANSFER'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  mpesaDetails: {
    transactionId: String,
    phoneNumber: String,
    amount: Number,
    timestamp: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Add pre-save middleware to ensure default values are set
OrderSchema.pre('save', function(next) {
  // Make sure paymentStatus and orderStatus have values
  if (!this.paymentStatus) {
    this.paymentStatus = 'pending';
  }
  if (!this.orderStatus) {
    this.orderStatus = 'pending';
  }
  next();
});

// Add a text index for search functionality
OrderSchema.index({
  orderNumber: 'text',
  'customer.name': 'text',
  'customer.email': 'text',
  'customer.phoneNumber': 'text'
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
