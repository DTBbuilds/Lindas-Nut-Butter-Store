const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product Schema
const ProductSchema = new Schema({
  originalId: { type: Number, index: true }, // To store the ID from the source data file
  sku: { type: String, index: true },      // To store the SKU from the source data file
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  inStock: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }, // To control product visibility
  inventoryStatus: { 
    type: String, 
    enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LOW_STOCK', 'AVAILABLE_ON_ORDER'], 
    default: 'IN_STOCK' 
  },
  stockQuantity: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for faster queries
ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1 });

// Hooks to update the updatedAt field
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create model or retrieve if already compiled
module.exports = mongoose.model('Product', ProductSchema);
