/**
 * Transaction Model
 * Represents a payment transaction in the system
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  checkoutRequestId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['MPESA', 'CARD', 'PAYPAL', 'CASH']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  phoneNumber: {
    type: String
  },
  customerName: {
    type: String
  },
  customerEmail: {
    type: String
  },
  mpesaReceiptNumber: {
    type: String
  },
  notes: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
