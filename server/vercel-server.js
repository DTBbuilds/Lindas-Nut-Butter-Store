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

// Create Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(rateLimiter);

// Connect to MongoDB Atlas
const connectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      // Connect using connection string and options from config
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      
      // Log information about the connection
      const dbName = mongoose.connection.name;
      const isProduction = process.env.NODE_ENV === 'production';
      const connectionType = isProduction ? 'MongoDB Atlas' : 'Local MongoDB';
      
      console.log(`Connected to ${connectionType} database: ${dbName}`);
      console.log(`Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    }
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error(err.stack);
    return false;
  }
};

// Connect to MongoDB immediately
connectMongoDB();

// Mount routes
app.use('/api', routes);

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
