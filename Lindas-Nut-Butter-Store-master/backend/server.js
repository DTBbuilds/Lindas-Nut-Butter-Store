require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { connectWithRetry } = require('./config/database');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const mpesaRoutes = require('./routes/mpesaRoutes'); // Import M-Pesa routes

const app = express();

// Early Express request logger
app.use((req, res, next) => {
  console.log(`[Express Entry] Request received: ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : true, // Allow all origins in development mode
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection will be handled in startServer

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
app.use('/api/payments', paymentRoutes); // For general payment routes if any, or simulated ones
app.use('/api/mpesa', mpesaRoutes); // Mount actual M-Pesa routes

// Log routes not handled by API routes or other specific handlers before the catch-all 404
app.use((req, res, next) => {
  // Avoid logging if it's a socket.io path, as it might be handled by Socket.IO engine directly or fall through if not a recognized socket.io sub-path
  if (!req.originalUrl.startsWith('/socket.io')) {
    console.log(`[Express Fallthrough] Route not handled by API/specific handlers: ${req.method} ${req.originalUrl}`);
  }
  next();
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
  console.error(`[Express 404] Final 404 handler reached for: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Import centralized error handler
const { globalErrorHandler } = require('./utils/errorHandlers');

// Instead of using app.listen, create an HTTP server
const http = require('http');
const server = http.createServer(app);

// Raw HTTP server request logger
server.on('request', (req, res) => {
  console.log(`[HTTP Server Raw] Request: ${req.method} ${req.url}`);
});

// Initialize Socket.IO server with proper configuration
const { Server } = require('socket.io');
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket']
});

// Attach Socket.IO to the app for global access if needed
app.set('io', io);

// Socket.IO event listeners
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// After Socket.IO configuration, add static file middleware for the 'public' dir while skipping '/socket.io' requests
app.use((req, res, next) => {
  if (req.url.startsWith('/socket.io')) {
    console.log(`[Socket Bypass Middleware] Skipping static files for Socket.IO path: ${req.url}`);
    return next(); // Socket.IO should handle this path
  }
  // console.log(`[Socket Bypass Middleware] Attempting to serve static for: ${req.url}`); // Optional: log static attempts
  express.static(path.join(__dirname, 'public'))(req, res, next); // Serves files from backend/public
});

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

// Async function to start the server after ensuring DB connection
async function startServer() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await connectWithRetry(); // Wait for the database to connect
    console.log(`[DB Check in startServer] Mongoose connection state AFTER connectWithRetry: ${mongoose.connection.readyState} (1 means connected)`);
    console.log('MongoDB connection established (according to connectWithRetry). Proceeding to start server.');

    // Start the server only after successful DB connection
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
