/**
 * Fix Ngrok Callbacks Script
 * 
 * This script detects the active ngrok tunnel and updates M-Pesa callback URLs
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');

async function getActiveNgrokUrl() {
  try {
    console.log('Checking for active ngrok tunnels...');
    // Using axios to make the request to the ngrok API
    const response = await axios.get('http://localhost:4040/api/tunnels');
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      // Find the HTTPS tunnel
      const httpsTunnel = response.data.tunnels.find(tunnel => tunnel.proto === 'https');
      if (httpsTunnel) {
        console.log(`Found active ngrok tunnel: ${httpsTunnel.public_url}`);
        return httpsTunnel.public_url;
      }
    }
    
    console.log('No active ngrok tunnels found.');
    return null;
  } catch (error) {
    console.error(`Error getting ngrok tunnels: ${error.message}`);
    return null;
  }
}

async function updateMpesaCallbacks() {
  console.log('\n🔄 UPDATING M-PESA CALLBACKS WITH NGROK URL');
  console.log('================================================');
  
  // Get the active ngrok URL
  const ngrokUrl = await getActiveNgrokUrl();
  if (!ngrokUrl) {
    console.error('❌ No active ngrok tunnel found. Please start ngrok first with:');
    console.error('npm run tunnel');
    return;
  }
  
  // Update the M-Pesa callback URLs
  console.log(`\nUpdating M-Pesa callbacks to use: ${ngrokUrl}`);
  const updatedUrls = updateCallbackUrls(ngrokUrl);
  
  console.log('\n✅ Callback URLs updated successfully:');
  console.log(`- Callback URL: ${updatedUrls.callbackUrl}`);
  console.log(`- Validation URL: ${updatedUrls.validationUrl}`);
  console.log(`- Confirmation URL: ${updatedUrls.confirmationUrl}`);
  
  console.log('\n⚠️ IMPORTANT: These URLs are only valid while ngrok is running.');
  console.log('If you restart ngrok, you will need to update the callbacks again.');
  
  console.log('\n🧪 Ready to test M-Pesa integration with:');
  console.log('npm run mpesa:test');
}

// Run the script
updateMpesaCallbacks();
