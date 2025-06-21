const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  mass: Number,
  price: Number,
  stock: Number
});

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  sku: {
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
  originalPrice: Number,
  image: String,
  secondaryImage: String,
  images: [String],
  description: String,
  features: [String],
  rating: Number,
  reviews: Number,
  inStock: {
    type: Boolean,
    default: true
  },
  isAvailableOnOrder: {
    type: Boolean,
    default: false
  },
  size: String,
  category: String,
  variants: [variantSchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
});

module.exports = mongoose.model('Product', productSchema);
