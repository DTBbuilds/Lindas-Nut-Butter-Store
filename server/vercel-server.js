// Server entry point optimized for Vercel deployment
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');

// Import routes and middleware
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const corsMiddleware = require('./middleware/cors');
const debugRoutes = require('./debug-routes');
const { connectToMongoDB } = require('./mongodb-connection');

// Create Express app
const app = express();

// Apply middleware
// Apply CORS middleware first - this is crucial for handling preflight requests
app.use(corsMiddleware);
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(rateLimiter);

// Connect to MongoDB using our enhanced connection module
// This handles reconnection and better error reporting
connectToMongoDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
});

// Mount routes
app.use('/api', routes);

// Add debug routes for deployment diagnostics
app.use('/api/debug', debugRoutes);

// Add a basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    mongodbConnected: mongoose.connection.readyState === 1
  });
});

// Explicitly serve manifest.json to fix 401 errors
app.get('/manifest.json', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(__dirname, '../public/manifest.json'));
});

// Handle production static files
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../build')));
  
  // For any other routes, serve the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server if not being imported
if (require.main === module) {
  const PORT = process.env.PORT || config.server.port || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless function
module.exports = app;
