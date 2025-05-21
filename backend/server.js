const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { connectWithRetry } = require('./config/database');
const authRoutes = require('./routes/auth');
const { router: productRoutes } = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : true, // Allow all origins in development mode
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initial connection to MongoDB database using config module
connectWithRetry();

// Serve static files from the public directory
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Database connection check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: 'error',
      message: 'Database not connected. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    memoryUsage: process.memoryUsage()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Log all unhandled routes and errors
app.use((req, res, next) => {
  console.log(`Unhandled route: ${req.method} ${req.originalUrl}`);
  next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error handler caught:', err);
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code
  });
  
  // Send appropriate response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Linda\'s Nut Butter Store API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/yourusername/lindas-nut-butter-store/docs'
  });
});

// 404 handler for unhandled routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Import centralized error handler
const { globalErrorHandler } = require('./utils/errorHandler');

// Global error handler middleware
app.use(globalErrorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Log errors to a file in production
  if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Write error to log file with timestamp
    const logFile = path.join(logDir, 'unhandled-rejections.log');
    const logMessage = `\n[${new Date().toISOString()}] ${err.name}: ${err.message}\n${err.stack}\n${'='.repeat(80)}`;
    
    fs.appendFileSync(logFile, logMessage);
  }
  
  // In production, keep the server running despite the error
  if (process.env.NODE_ENV === 'production') {
    console.error('Application continuing despite unhandled rejection');
  } else {
    // In development, crash the app to force developers to fix it
    console.error('Shutting down in development mode...');
    if (server) {
      server.close(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Always log to console and file
  if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Write error to log file with timestamp
    const logFile = path.join(logDir, 'uncaught-exceptions.log');
    const logMessage = `\n[${new Date().toISOString()}] ${err.name}: ${err.message}\n${err.stack}\n${'='.repeat(80)}`;
    
    fs.appendFileSync(logFile, logMessage);
  }
  
  // For uncaught exceptions, always crash the application
  // This is safer as the application might be in an unpredictable state
  console.error('Application is in an inconsistent state. Shutting down...');
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
