// Debug router for Vercel deployment
const express = require('express');
const router = express.Router();

// Get MongoDB connection status
router.get('/mongo-status', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const status = {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name || 'Not connected',
      host: mongoose.connection.host || 'Not connected',
      connectionString: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'Not set',
      models: Object.keys(mongoose.models)
    };
    
    res.json({ 
      success: true, 
      message: 'MongoDB connection status', 
      status,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        hasMongoUri: !!process.env.MONGO_URI
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error checking MongoDB status', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

module.exports = router;
