/**
 * Socket.io Service for Real-time Updates
 * 
 * This module provides WebSocket functionality for real-time updates
 * using Socket.io to handle events like transaction updates
 */

const socketio = require('socket.io');
let io = null;

// Store transaction events for potential retrieval
let transactionEvents = [];

/**
 * Initialize the socket service with proper configuration
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  if (io) {
    console.log('Socket.io already initialized');
    return io;
  }

  io = socketio(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all origins in development
        if (process.env.NODE_ENV !== 'production' || !origin) {
          return callback(null, true);
        }
        
        // In production, check against allowed origins
        const allowedOrigins = [process.env.FRONTEND_URL, process.env.BASE_URL].filter(Boolean);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/ws'
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send recent events to newly connected clients
    socket.emit('recent_events', transactionEvents);
    
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
  
  console.log('✅ Socket.io initialized - Real-time updates enabled');
  return io;
};

/**
 * Get the Socket.io instance
 */
const getIO = () => {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized yet');
    return null;
  }
  return io;
};

/**
 * Broadcast transaction event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const broadcastTransaction = (event, data) => {
  // Log the event for debugging
  console.log(`📝 Broadcasting ${event}`);
  
  // Store in memory for potential retrieval via API
  const eventData = {
    event,
    data,
    timestamp: new Date()
  };
  
  transactionEvents.push(eventData);
  
  // Keep only the last 20 events
  if (transactionEvents.length > 20) {
    transactionEvents.shift();
  }
  
  // Broadcast to all connected clients if socket.io is initialized
  if (io) {
    io.emit(event, eventData);
    return true;
  } else {
    console.warn('⚠️ Socket.io not initialized, event not broadcast');
    return false;
  }
};

/**
 * Log transaction created event
 * @param {Object} transaction - Transaction data
 */
const emitTransactionCreated = (transaction) => {
  broadcastTransaction('transaction_created', {
    transaction,
    timestamp: new Date()
  });
};

/**
 * Log transaction updated event
 * @param {Object} transaction - Transaction data
 */
const emitTransactionUpdated = (transaction) => {
  broadcastTransaction('transaction_updated', {
    transaction,
    timestamp: new Date()
  });
};

/**
 * Log transaction completed event
 * @param {Object} transaction - Transaction data
 * @param {Object} order - Order data
 */
const emitTransactionCompleted = (transaction, order) => {
  broadcastTransaction('transaction_completed', {
    transaction,
    order,
    timestamp: new Date()
  });
};

/**
 * Log transaction failed event
 * @param {Object} transaction - Transaction data
 */
const emitTransactionFailed = (transaction) => {
  broadcastTransaction('transaction_failed', {
    transaction,
    timestamp: new Date()
  });
};

module.exports = {
  initialize,
  getIO,
  broadcastTransaction,
  emitTransactionCreated,
  emitTransactionUpdated,
  emitTransactionCompleted,
  emitTransactionFailed
};
