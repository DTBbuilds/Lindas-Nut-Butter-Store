// Simple Express server to test MongoDB Atlas connection
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0';

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 60000
};

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
console.log('Connecting to MongoDB Atlas...');
mongoose.connect(ATLAS_URI, options)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas!');
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    process.exit(1);
  });

// Simple product schema
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema, 'products');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MongoDB Atlas Test Server' });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    console.log(`Retrieved ${products.length} products from MongoDB Atlas`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 5050;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}/api/products`);
});
