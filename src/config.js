/**
 * Frontend configuration file
 * Contains constants and configuration for the frontend
 */

// API URL - adjust based on environment
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Base URL for the app
export const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

// Configuration for services
export const SERVICES = {
  // Socket.IO connection timeout in milliseconds
  socketTimeout: 10000,
  
  // Default currency for display
  currency: 'KES',
  
  // Payment options
  paymentMethods: ['MPESA'],
  
  // Notification settings
  notifications: {
    autoClose: 5000,
    defaultSound: true
  }
};

// Feature flags
export const FEATURES = {
  enableRealTimeUpdates: true,
  enableNotifications: true,
  enableSounds: true
};

// App metadata
export const APP_META = {
  name: "Linda's Nut Butter Store",
  version: "1.0.0",
  copyright: `© ${new Date().getFullYear()} Linda's Nut Butter Store`
};
