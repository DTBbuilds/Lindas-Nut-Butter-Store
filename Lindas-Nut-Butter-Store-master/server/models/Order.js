/**
 * Order Model
 * Represents an order in the system
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', // CRITICAL FIX: Changed ref from 'User' to 'Customer'
    required: false 
  }, // Allow null for guests
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, required: true, default: 0 },
  customerEmail: { type: String, required: true },
  customerInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true },
  // Order status reflects the fulfillment status
  status: {
    type: String,
    enum: ['pending-payment', 'payment-failed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending-payment'
  },
  // Payment status reflects the transaction status
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  orderNumber: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
