const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product Schema
const ProductSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  description: { 
    type: String,
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  category: { 
    type: String,
    required: true 
  },
  stockQuantity: { 
    type: Number, 
    required: true,
    default: 20
  },
  lowStockThreshold: { 
    type: Number,
    default: 5
  },
  inventoryStatus: {
    type: String,
    enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
    default: 'IN_STOCK'
  },
  notifyOnLowStock: {
    type: Boolean,
    default: true
  },
  restockDate: {
    type: Date
  },
  restockQuantity: {
    type: Number
  },
  sku: { 
    type: String,
    required: true,
    index: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Inventory Log Schema to track all inventory changes
const InventoryLogSchema = new Schema({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  previousQuantity: { 
    type: Number, 
    required: true 
  },
  newQuantity: { 
    type: Number, 
    required: true 
  },
  changeAmount: { 
    type: Number, 
    required: true 
  },
  changeType: { 
    type: String, 
    required: true,
    enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'RESTOCK']
  },
  referenceId: { 
    type: Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Order', 'Transaction'],
    default: 'Order'
  },
  notes: { 
    type: String 
  },
  createdBy: { 
    type: String,
    default: 'system'
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Order Schema
const OrderSchema = new Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  },
  delivery: {
    recipient: { type: String },
    phoneNumber: { type: String },
    alternatePhoneNumber: { type: String },
    county: { type: String },
    subCounty: { type: String },
    ward: { type: String },
    estate: { type: String },
    buildingName: { type: String },
    houseNumber: { type: String },
    nearestLandmark: { type: String },
    deliveryInstructions: { type: String },
    preferredDeliveryTime: { 
      type: String,
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'ANY_TIME'],
      default: 'ANY_TIME'
    },
    deliveryMethod: {
      type: String,
      enum: ['STANDARD', 'EXPRESS', 'PICKUP'],
      default: 'PICKUP'
    },
    deliveryFee: { type: Number, default: 0 },
    estimatedDeliveryDate: { type: Date },
    pickupLocation: { type: String },
    trackingNumber: { type: String },
    trackingUrl: { type: String }
  },
  pickupLocation: { type: String, required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentStatus: { 
    type: String, 
    required: true,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['MPESA'],
    default: 'MPESA'
  },
  transactionId: { type: String },
  referenceNumber: { type: String, required: true, index: true }, // Used in the M-Pesa API as BillRefNumber
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  paymentDate: { type: Date }
});

// Transaction Schema
const TransactionSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  transactionId: { type: String }, // M-Pesa transaction ID
  merchantRequestId: { type: String }, // For STK push
  requestId: { type: String }, // CheckoutRequestID for STK push
  relatedTransactionId: { type: String }, // For refunds
  phoneNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  confirmedAmount: { type: Number }, // Amount confirmed by M-Pesa
  confirmedPhoneNumber: { type: String }, // Phone number confirmed by M-Pesa
  status: { 
    type: String, 
    required: true,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  type: { 
    type: String, 
    required: true,
    enum: ['STK_PUSH', 'C2B', 'B2C'],
    default: 'STK_PUSH'
  },
  resultCode: { type: String },
  resultDesc: { type: String },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now },
  transactionDate: { type: String } // TransactionDate from M-Pesa
});

// Add indexes for faster queries
OrderSchema.index({ referenceNumber: 1 }, { unique: true });
OrderSchema.index({ transactionId: 1 });
OrderSchema.index({ 'customer.phoneNumber': 1 });
OrderSchema.index({ 'delivery.phoneNumber': 1 });
OrderSchema.index({ 'delivery.county': 1 });
OrderSchema.index({ 'delivery.deliveryMethod': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ 'delivery.estimatedDeliveryDate': 1 });

TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ requestId: 1, merchantRequestId: 1 });
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ phoneNumber: 1 });
TransactionSchema.index({ timestamp: -1 });

ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ stockQuantity: 1 });

InventoryLogSchema.index({ product: 1 });
InventoryLogSchema.index({ timestamp: -1 });
InventoryLogSchema.index({ changeType: 1 });
InventoryLogSchema.index({ referenceId: 1, referenceModel: 1 });

// Hooks to update the updatedAt field
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create models
const Order = mongoose.model('Order', OrderSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Product = mongoose.model('Product', ProductSchema);
const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);

// User Schema
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: {
      values: ['customer', 'admin'],
      message: 'Role must be either customer or admin'
    },
    default: 'customer'
  },
  phoneNumber: {
    type: String,
    match: [/^(?:\+?254|0)[17]\d{8}$/, 'Please provide a valid Kenyan phone number']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });

/**
 * Hash password before saving
 */
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Update timestamps on save
 */
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Compare password method
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate password reset token
 */
UserSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

/**
 * Generate email verification token
 */
UserSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

/**
 * Increment login attempts
 */
UserSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 }; // 1 hour
  }
  
  return await this.updateOne(updates);
};

/**
 * Reset login attempts on successful login
 */
UserSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
    lastLogin: Date.now()
  });
};

/**
 * Query helper to exclude inactive users by default
 */
UserSchema.pre(/^find/, function(next) {
  // This points to the current query
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', UserSchema);

module.exports = {
  Order,
  Transaction,
  Product,
  InventoryLog,
  User
};
