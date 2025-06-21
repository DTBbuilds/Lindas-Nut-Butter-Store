// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Add global error handlers to catch silent crashes
process.on('uncaughtException', (err, origin) => {
  console.error('Caught uncaught exception. Error:', err);
  console.error('Exception origin:', origin);
  if (err && err.stack) {
    console.error(err.stack);
  }
  process.exit(1); // Exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason && reason.stack) {
    console.error(reason.stack);
  }
  process.exit(1); // Exit gracefully
});

// =================================================================
// IMPORTS
// =================================================================
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Local modules
console.log('[DEBUG] Requiring ./config...');
const config = require('./config');
console.log('[DEBUG] Requiring ./db...');
const connectDB = require('./db');
console.log('[DEBUG] Requiring ./utils/darajaApi...');
const mpesaHelpers = require('./utils/darajaApi');
console.log('[DEBUG] Requiring ./services/socketService...');
const socketService = require('./services/socketService');
const { initUploadsDir } = require('./services/fileUploadService');
console.log('[DEBUG] Requiring ./middleware/rateLimiter...');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
console.log('[DEBUG] Requiring ./routes...');
const allRoutes = require('./routes'); // Centralized routes
console.log('[DEBUG] ./routes required successfully.');
const Admin = require('./models/Admin');
console.log('[DEBUG] All local modules required.');

// =================================================================
// CONFIGURATION VERIFICATION
// =================================================================
// Centralized environment variable validation
require('./utils/validateEnv');

// =================================================================
// APP INITIALIZATION
// =================================================================
const app = express();
const server = http.createServer(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    databaseStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Socket.io will be initialized just before the server starts listening.

// =================================================================
// MIDDLEWARE
// =================================================================
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In development, the React development server handles static files.
// The following is for production only.

// Apply rate limiting to API routes (excluding health check)
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  return apiLimiter(req, res, next);
});
app.use('/api', apiLimiter);
app.use('/api/admin/auth', authLimiter);

// =================================================================
// ROUTES
// =================================================================
// Add a root endpoint for testing the API's availability
app.get('/', (req, res) => {
  res.json({
    message: "Linda's Nut Butter Store API is running",
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api', allRoutes);

// Static file serving for uploads is now handled within startApp()

// =================================================================
// SERVE STATIC FILES (PRODUCTION)
// =================================================================
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the 'build' directory
  const buildPath = path.join(__dirname, '../build');
  app.use(express.static(buildPath));

  // For any other request, serve the index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'));
  });
}

// Import the new, robust error handling middleware
const { notFoundHandler, errorHandler } = require('./middleware/robustErrorHandler');

// 404 handler (must be after all other routes)
app.use(notFoundHandler);

// Global error handler (must be after all other middleware and routes)
app.use(errorHandler);

// =================================================================
// SERVER STARTUP
// =================================================================
const PORT = config.server.port || 5000;

const createDefaultAdmin = async () => {
  try {
    console.log('Checking for default admin account...');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('No admin accounts found. Creating default admin...');
      const admin = new Admin({
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'super-admin',
      });
      await admin.save();
      console.log('✅ Default admin user created successfully.');
    } else {
      console.log('Admin account already exists.');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

const startApp = async () => {
  try {
    // 1. Connect to the database
    console.log('Connecting to database...');
    await connectDB();
    console.log('✅ Database connection successful.');

    // 2. Test M-Pesa Credentials
    await mpesaHelpers.getAuthToken()
      .then(() => console.log('✅ M-Pesa API credentials are valid.'))
      .catch(err => console.error('❌ M-Pesa API credential test failed:', err.message));

    // 3. Initialize application data (e.g., create default admin)
    await createDefaultAdmin();
    console.log('✅ Application data initialized.');

    // 4. Initialize upload directories and serve them
    initUploadsDir();
    const uploadsPath = path.resolve(__dirname, '../public/uploads');
    console.log(`[DEBUG] Serving static uploads from: ${uploadsPath}`);
    app.use('/uploads', express.static(uploadsPath));

    // 4. Initialize Socket.IO
    socketService.init(server);
    console.log('✅ Socket.io initialized - Real-time updates enabled');

    // 5. Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log('Environment:', process.env.NODE_ENV || 'development');
      console.log('Press Ctrl+C to quit.');
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ FATAL ERROR: Port ${PORT} is already in use.`);
        console.error('Please stop the process running on this port or specify a different one in your .env file.');
      } else {
        console.error('An unexpected error occurred during server startup:', err);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ FATAL: A critical error occurred during server startup. The application will now exit.');
    console.error(error);
    process.exit(1);
  }
};

// Start the application
startApp();
