const { Server } = require('socket.io');

class SocketService {
  constructor() {
    if (SocketService.instance) {
      return SocketService.instance;
    }
    this._io = null;
    this.eventQueue = []; // Queue for events emitted before initialization
    SocketService.instance = this;
  }

  init(httpServer) {
    if (this._io) {
      console.warn('Socket.IO already initialized.');
      return this._io;
    }

    this._io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this._io.on('connection', (socket) => {
      console.log('✅ New client connected:', socket.id);

      socket.on('join-order-room', (orderId) => {
        socket.join(orderId);
        console.log(`Socket ${socket.id} joined room for order ${orderId}`);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });
    });

    console.log('🚀 Socket.IO service initialized successfully.');
    this.flushEventQueue(); // Emit any queued events
    return this._io;
  }

  emitToRoom(room, event, data) {
    if (this._io) {
      this._io.to(room).emit(event, data);
      console.log(`🚀 Emitting event '${event}' to room '${room}'.`);
    } else {
      console.warn(`Socket.io not initialized. Queuing event '${event}' for room '${room}'.`);
      this.eventQueue.push({ room, event, data }); // Queue the event
    }
  }

  emit(event, data) {
    if (this._io) {
      this._io.emit(event, data);
      console.log(`🚀 Emitting event '${event}' to all clients.`);
    } else {
      console.warn(`Socket.io not initialized. Queuing event '${event}'.`);
      this.eventQueue.push({ event, data }); // Queue the event
    }
  }

  flushEventQueue() {
    if (this._io && this.eventQueue.length > 0) {
      console.log(`Flushing ${this.eventQueue.length} queued events...`);
      this.eventQueue.forEach(({ event, data }) => {
        this._io.emit(event, data);
        console.log(`🚀 Emitted queued event '${event}'.`);
      });
      this.eventQueue = []; // Clear the queue
    }
  }

  get io() {
    if (!this._io) {
      // This is not an error, as events can be queued.
      // However, direct access to io might be problematic if not initialized.
      console.warn('Socket.IO has not been initialized. Call init() first.');
      return null;
    }
    return this._io;
  }

  /**
   * Emits a payment initiated event, used to notify the client that the STK push has been sent.
   * @param {string} checkoutRequestId - The unique ID for the transaction.
   * @param {object} data - The payload to send (e.g., { message: 'Please enter your PIN' }).
   */
  emitPaymentInitiated(checkoutRequestId, data) {
    this.emit(`payment-initiated:${checkoutRequestId}`, data);
  }

  /**
   * Emits a payment success event.
   * @param {string} checkoutRequestId - The unique ID for the transaction.
   * @param {object} data - The payload containing details of the successful transaction.
   */
  emitPaymentSuccess(orderId, data) {
    this.emitToRoom(orderId, 'payment-success', data);
  }

  /**
   * Emits a payment failure event.
   * @param {string} checkoutRequestId - The unique ID for the transaction.
   * @param {object} data - The payload containing the reason for the failure.
   */
  emitPaymentFailed(orderId, data) {
    this.emitToRoom(orderId, 'payment-failed', data);
  }
}

const socketServiceInstance = new SocketService();

module.exports = socketServiceInstance;
