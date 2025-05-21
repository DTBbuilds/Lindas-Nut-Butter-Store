/**
 * Simple ngrok tunnel script for Linda's Nut Butter Store
 * This script creates an ngrok tunnel to an already running server
 */
const { execSync } = require('child_process');
const axios = require('axios');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');

// Configuration
const SERVER_PORT = 5000; // Backend server port
const FRONTEND_PORT = 5001; // React development server port

/**
 * Start an ngrok tunnel to the local server
 */
async function startNgrokTunnel() {
  try {
    console.log('\n===============================================');
    console.log('🚀 LINDA\'S NUT BUTTER STORE - NGROK TUNNEL');
    console.log('===============================================\n');

    console.log('1️⃣ Checking if ngrok is already running...');
    let ngrokUrl = null;
    
    // Try to get ngrok URL if it's already running
    try {
      const response = await axios.get('http://localhost:4040/api/tunnels', { timeout: 1000 });
      const tunnels = response.data.tunnels || [];
      const httpsTunnel = tunnels.find(t => t.proto === 'https');
      
      if (httpsTunnel) {
        ngrokUrl = httpsTunnel.public_url;
        console.log(`✅ Ngrok is already running at: ${ngrokUrl}`);
      }
    } catch (error) {
      console.log('🔄 Starting new ngrok tunnel...');
      
      // Start ngrok with execSync to capture its output
      try {
        // Run ngrok in background
        execSync(`start cmd /c "ngrok http ${SERVER_PORT}"`, { stdio: 'inherit', shell: true });
        
        // Wait for ngrok to start
        console.log('⏳ Waiting for ngrok to initialize...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get the ngrok URL
        const response = await axios.get('http://localhost:4040/api/tunnels', { timeout: 3000 });
        const tunnels = response.data.tunnels || [];
        const httpsTunnel = tunnels.find(t => t.proto === 'https');
        
        if (httpsTunnel) {
          ngrokUrl = httpsTunnel.public_url;
          console.log(`✅ Ngrok tunnel established: ${ngrokUrl}`);
        } else {
          throw new Error('No HTTPS tunnel found');
        }
      } catch (error) {
        console.error('❌ Error starting ngrok:', error.message);
        console.log('\n📢 IMPORTANT: Make sure ngrok is installed and the authtoken is configured.');
        console.log('   If you just installed ngrok, you might need to restart your terminal.');
        return;
      }
    }
    
    if (ngrokUrl) {
      // Update M-Pesa callback URLs with the ngrok URL
      updateCallbackUrls(ngrokUrl);
      
      console.log('\n✅ NGROK TUNNEL CONFIGURATION COMPLETE');
      console.log('===============================================');
      console.log('🌍 Your Linda\'s Nut Butter Store is now accessible at:');
      console.log(`   Backend API: ${ngrokUrl}`);
      console.log(`   Frontend: ${ngrokUrl.replace(`:${SERVER_PORT}`, `:${FRONTEND_PORT}`)}`);
      console.log('\n📱 M-Pesa callbacks configured to use:');
      console.log(`   Callback URL: ${ngrokUrl}/api/mpesa/callback`);
      console.log(`   Validation URL: ${ngrokUrl}/api/mpesa/validation`);
      console.log(`   Confirmation URL: ${ngrokUrl}/api/mpesa/confirmation`);
      console.log('\n🔑 YOU CAN NOW TEST REAL M-PESA PAYMENTS WITH CALLBACKS');
      console.log('===============================================\n');
      
      console.log('ℹ️ Keep this terminal window open to maintain the ngrok tunnel.');
      console.log('   Press Ctrl+C to exit when you\'re done testing.\n');
    }
  } catch (error) {
    console.error('❌ Error during ngrok setup:', error.message);
  }
}

// Start the ngrok tunnel
startNgrokTunnel();

// Keep the script running
process.stdin.resume();
