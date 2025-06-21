import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create a single, persistent socket connection
export const socket = io(API_URL, {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  autoConnect: true, // Automatically connect on initialization
});

socket.on('connect', () => {
  console.log('Global Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Global Socket disconnected:', reason);
});
