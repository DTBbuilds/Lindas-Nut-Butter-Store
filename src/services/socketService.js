import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    if (SocketService.instance) {
      return SocketService.instance;
    }
    this.socket = null;
    this.listeners = new Map();
    SocketService.instance = this;
  }

  init() {
    if (this.socket) {
      return;
    }

    const socketUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected successfully:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.warn('[Socket] Disconnected.');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection Error:', error.message);
    });
  }

  subscribe(checkoutRequestId, { onInitiated, onSuccess, onFailure }) {
    if (!this.socket) {
      console.error('[Socket] Cannot subscribe, not initialized.');
      return;
    }

    const events = {
      initiated: `payment-initiated:${checkoutRequestId}`,
      success: `payment-success:${checkoutRequestId}`,
      failed: `payment-failed:${checkoutRequestId}`,
    };

    const handlers = {
      initiated: onInitiated,
      success: onSuccess,
      failed: onFailure,
    };

    // Register new listeners
    this.socket.on(events.initiated, handlers.initiated);
    this.socket.on(events.success, handlers.success);
    this.socket.on(events.failed, handlers.failed);

    this.listeners.set(checkoutRequestId, { events, handlers });
    console.log(`[Socket] Subscribed to events for ${checkoutRequestId}`);
  }

  unsubscribe(checkoutRequestId) {
    if (!this.socket || !this.listeners.has(checkoutRequestId)) {
      return;
    }

    const { events, handlers } = this.listeners.get(checkoutRequestId);
    this.socket.off(events.initiated, handlers.initiated);
    this.socket.off(events.success, handlers.success);
    this.socket.off(events.failed, handlers.failed);

    this.listeners.delete(checkoutRequestId);
    console.log(`[Socket] Unsubscribed from events for ${checkoutRequestId}`);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

const socketService = new SocketService();
export default socketService;
