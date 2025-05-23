// Simple products API route for Vercel serverless function
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { connectToDatabase } = require('./mongodb');

// Product schema for MongoDB
const ProductSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  stock: Number,
  popularity: { type: Number, default: 0 }
});

// Create Product model - use this pattern for Vercel serverless functions
let Product;
if (mongoose.models && mongoose.models.Product) {
  Product = mongoose.models.Product;
} else {
  Product = mongoose.model('Product', ProductSchema);
}

// Handler for Vercel serverless function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  try {
    // Connect to the database
    await connectToDatabase();
    
    // For testing purposes, just return some sample products if we can't fetch from DB
    try {
      // Parse query parameters
      const limit = parseInt(req.query.limit) || 100;
      const sort = req.query.sort || 'name';
      const sortDirection = sort.startsWith('-') ? -1 : 1;
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      
      // Build sort object
      const sortObject = {};
      sortObject[sortField] = sortDirection;
      
      // Query products
      const products = await Product.find()
        .sort(sortObject)
        .limit(limit)
        .lean();
      
      console.log(`Products API: Found ${products.length} products`);
      
      // Return products
      return res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (dbError) {
      console.error('DB Query Error:', dbError);
      
      // Fallback to sample products
      const sampleProducts = [
        {
          "_id": "sample1",
          "name": "Almond Butter",
          "description": "Rich and creamy almond butter",
          "price": 9.99,
          "image": "/images/almond-butter.jpg",
          "category": "nut-butter",
          "stock": 25
        },
        {
          "_id": "sample2",
          "name": "Cashew Butter",
          "description": "Smooth cashew butter",
          "price": 11.99,
          "image": "/images/cashew-butter.jpg",
          "category": "nut-butter",
          "stock": 15
        }
      ];
      
      return res.status(200).json({
        success: true,
        count: sampleProducts.length,
        data: sampleProducts,
        note: "Using sample data due to database connection issues. Please check server logs."
      });
    }
  } catch (error) {
    console.error('API Error:', error.message);
    console.error(error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to retrieve products. Please try again later."
    });
  }
};
