/**
 * NgrokHelper - Utilities for working with ngrok for Mpesa callbacks
 * 
 * This module helps detect active ngrok tunnels and configure the application
 * to use them for Mpesa API callbacks, which require publicly accessible URLs.
 */
const axios = require('axios');
const config = require('../config');

// Ngrok API endpoint (default port is 4040)
const NGROK_API = 'http://localhost:4040/api/tunnels';

/**
 * Get the active ngrok URL
 * @returns {Promise<string|null>} The ngrok URL or null if not found
 */
async function getNgrokUrl() {
  try {
    // Try to get ngrok tunnels from the API
    const response = await axios.get(NGROK_API, { timeout: 3000 });
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      // Find the HTTPS tunnel (preferred)
      const httpsTunnel = response.data.tunnels.find(t => t.proto === 'https');
      
      if (httpsTunnel) {
        return httpsTunnel.public_url;
      } else if (response.data.tunnels.length > 0) {
        // Fall back to the first tunnel if no HTTPS tunnel is found
        return response.data.tunnels[0].public_url;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting ngrok URL:', error.message);
    return null;
  }
}

/**
 * Configure the application to use ngrok URLs for callbacks
 * @returns {Promise<boolean>} True if ngrok was detected and callbacks were updated
 */
async function configureNgrokCallbacks() {
  try {
    console.log('Checking for active ngrok tunnels...');
    
    const ngrokUrl = await getNgrokUrl();
    
    if (ngrokUrl) {
      console.log('✅ Active ngrok tunnel detected:', ngrokUrl);
      
      // Update the callback URLs directly in the config object
      config.mpesa.callbackUrl = `${ngrokUrl}/api/mpesa/callback`;
      config.mpesa.validationUrl = `${ngrokUrl}/api/mpesa/validation`;
      config.mpesa.confirmationUrl = `${ngrokUrl}/api/mpesa/confirmation`;
      
      console.log('✅ Mpesa callback URLs updated to use ngrok:');
      console.log('  - Callback URL:', config.mpesa.callbackUrl);
      console.log('  - Validation URL:', config.mpesa.validationUrl);
      console.log('  - Confirmation URL:', config.mpesa.confirmationUrl);
      
      return true;
    } else {
      console.warn('⚠️ No active ngrok tunnel detected. Mpesa callbacks may not work correctly.');
      console.warn('To enable Mpesa callbacks, please start ngrok with:');
      console.warn('  npm run tunnel   (or)   npx ngrok http 5000');
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error configuring ngrok callbacks:', error.message);
    return false;
  }
}

/**
 * Check if callback URLs are using localhost (which won't work with Mpesa)
 * @returns {boolean} True if callbacks are using localhost
 */
function isUsingLocalhostCallbacks() {
  const { callbackUrl, validationUrl, confirmationUrl } = config.mpesa;
  
  return (
    callbackUrl.includes('localhost') || 
    validationUrl.includes('localhost') || 
    confirmationUrl.includes('localhost')
  );
}

/**
 * Print helpful messages about Mpesa callback configuration
 */
function printCallbackHelp() {
  console.log('\n📱 M-Pesa Callback Configuration:');
  console.log('-----------------------------------');
  console.log('Current callback URLs:');
  console.log('  - Callback URL:', config.mpesa.callbackUrl);
  console.log('  - Validation URL:', config.mpesa.validationUrl);
  console.log('  - Confirmation URL:', config.mpesa.confirmationUrl);
  
  if (isUsingLocalhostCallbacks()) {
    console.log('\n⚠️ WARNING: Using localhost for callbacks!');
    console.log('M-Pesa API requires publicly accessible URLs for callbacks.');
    console.log('For testing, you should use ngrok to expose your local server.');
    console.log('\nHow to set up ngrok:');
    console.log('1. Run: npm run tunnel   (or)   npx ngrok http 5000');
    console.log('2. Restart the server, it will auto-detect the ngrok URL');
  }
}

module.exports = {
  getNgrokUrl,
  configureNgrokCallbacks,
  isUsingLocalhostCallbacks,
  printCallbackHelp
};
