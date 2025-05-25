/**
 * Utility to detect Ngrok tunnel URL and configure M-Pesa callbacks
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Detects active Ngrok tunnel and updates environment variables
 * @returns {Promise<string|null>} Ngrok URL if found, null otherwise
 */
const detectNgrokTunnel = async () => {
  try {
    console.log('🔍 Attempting to detect Ngrok tunnel...');
    // Try to connect to Ngrok API
    const response = await axios.get('http://127.0.0.1:4040/api/tunnels');
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      // Find the HTTPS tunnel
      const httpsTunnel = response.data.tunnels.find(
        tunnel => tunnel.proto === 'https'
      );
      
      if (httpsTunnel) {
        const ngrokUrl = httpsTunnel.public_url;
        console.log(`✅ Ngrok tunnel detected: ${ngrokUrl}`);
        
        // Set environment variables for M-Pesa callbacks
        process.env.CALLBACK_URL = `${ngrokUrl}/api/mpesa/callback`;
        process.env.VALIDATION_URL = `${ngrokUrl}/api/mpesa/validation`;
        process.env.CONFIRMATION_URL = `${ngrokUrl}/api/mpesa/confirmation`;
        process.env.MPESA_CALLBACK_URL = ngrokUrl;
        
        console.log('🔄 Updated M-Pesa callback URLs:');
        console.log(`- Callback URL: ${process.env.CALLBACK_URL}`);
        console.log(`- Validation URL: ${process.env.VALIDATION_URL}`);
        console.log(`- Confirmation URL: ${process.env.CONFIRMATION_URL}`);
        
        return ngrokUrl;
      }
    }
    
    console.log('⚠️ No Ngrok tunnel detected');
    return null;
  } catch (error) {
    console.log('⚠️ Could not detect Ngrok tunnel:', error.message);
    return null;
  }
};

module.exports = { detectNgrokTunnel };
