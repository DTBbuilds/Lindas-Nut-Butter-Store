/**
 * API Configuration for Linda's Nut Butter Store
 * This file contains configuration for API endpoints and external services
 */

// Default configuration
const config = {
  // API base URLs
  api: {
    // Base URL for backend API
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    
    // Public URL for callbacks (ngrok in development, actual domain in production)
    publicUrl: process.env.REACT_APP_PUBLIC_URL || 'https://2e15-41-90-64-164.ngrok-free.app/api',
  },
  
  // M-PESA configuration
  mpesa: {
    // Endpoints - must match server routes.js
    stkPushEndpoint: '/mpesa/stkpush',
    queryEndpoint: '/mpesa/query',
    
    // Use public URL for M-PESA callbacks
    usePublicUrl: true,
  }
};

export default config;
