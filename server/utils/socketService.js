/**
 * Temporary Socket Service (No WebSockets Required)
 * 
 * This is a placeholder that logs events instead of using WebSockets
 * to allow the server to start without socket.io dependency
 */

// Placeholder for transactions that would be broadcast
let transactionEvents = [];

/**
 * Initialize the socket service - does nothing in this temporary version
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  console.log('⚠️ Using placeholder socket service (no real-time updates)');
  return {};
};

/**
 * Get the placeholder instance
 */
const getIO = () => {
  return {};
};

/**
 * Log transaction event instead of broadcasting
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const broadcastTransaction = (event, data) => {
  // Just log the event
  console.log(`📝 Would broadcast ${event}:`, data);
  
  // Store in memory for potential retrieval via API
  transactionEvents.push({
    event,
    data,
    timestamp: new Date()
  });
  
  // Keep only the last 20 events
  if (transactionEvents.length > 20) {
    transactionEvents.shift();
  }
  
  return true;
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
