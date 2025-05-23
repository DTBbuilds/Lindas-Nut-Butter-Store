/**
 * Frontend configuration file
 * Contains constants and configuration for the frontend
 */

// Helper function to determine if running in production environment
const isProduction = process.env.NODE_ENV === 'production';

// Default API URL based on environment
const defaultApiUrl = isProduction
  ? 'https://lindas-nut-butter.vercel.app'
  : 'http://localhost:5000';

// Default Base URL based on environment
const defaultBaseUrl = isProduction
  ? 'https://lindas-nut-butter.vercel.app'
  : 'http://localhost:3000';

// API URL - adjust based on environment
export const API_URL = process.env.REACT_APP_API_URL || defaultApiUrl;

// Base URL for the app
export const BASE_URL = process.env.REACT_APP_BASE_URL || defaultBaseUrl;

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
