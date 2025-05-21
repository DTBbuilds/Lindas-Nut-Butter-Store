/**
 * Ngrok startup script for Linda's Nut Butter Store
 * This script starts ngrok and updates the M-Pesa callback URLs
 */
const { spawn } = require('child_process');
const axios = require('axios');
const config = require('./config');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');

// Configuration
const PORT = config.server.port || 5000;
const TIMEOUT_MS = 10000; // 10 seconds timeout to wait for ngrok to start

/**
 * Start ngrok to tunnel to the local server port
 */
async function startNgrok() {
  console.log('🚀 Starting ngrok tunnel to port', PORT);
  
  // Spawn ngrok process
  const ngrokProcess = spawn('ngrok', ['http', PORT.toString()], {
    detached: false,
    stdio: 'pipe'
  });
  
  // Handle ngrok output
  let ngrokUrl = null;
  
  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[NGROK]:', output);
  });
  
  ngrokProcess.stderr.on('data', (data) => {
    console.error('[NGROK ERROR]:', data.toString());
  });
  
  // Get the ngrok URL from the ngrok API
  try {
    // Wait a bit for ngrok to start up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Query the ngrok API to get the public URL
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = response.data.tunnels || [];
    
    const httpsTunnel = tunnels.find(t => t.proto === 'https');
    if (httpsTunnel) {
      ngrokUrl = httpsTunnel.public_url;
      console.log(`✅ Ngrok tunnel established: ${ngrokUrl}`);
      
      // Update M-Pesa callback URLs
      updateCallbackUrls(ngrokUrl);
      
      console.log('\n🌍 Your Linda\'s Nut Butter Store is now accessible at:');
      console.log(`Frontend: ${ngrokUrl.replace(`:${PORT}`, ':5001')}`);
      console.log(`Backend API: ${ngrokUrl}`);
      console.log('\n📱 M-Pesa callbacks are now configured to use this URL.');
      console.log('You can now test the full M-Pesa payment flow with real callbacks.\n');
      
      // Keep the script running
      console.log('Press Ctrl+C to stop the ngrok tunnel and exit.');
    } else {
      console.error('❌ Failed to establish ngrok tunnel. No HTTPS tunnel found.');
    }
  } catch (error) {
    console.error('❌ Error getting ngrok URL:', error.message);
    console.log('Make sure ngrok is running and the dashboard is accessible at http://localhost:4040');
  }
  
  // Handle process exit
  ngrokProcess.on('close', (code) => {
    console.log(`Ngrok process exited with code ${code}`);
  });
  
  // Keep the script alive
  process.stdin.resume();
  
  // Handle CTRL+C
  process.on('SIGINT', () => {
    console.log('Stopping ngrok tunnel...');
    ngrokProcess.kill();
    process.exit();
  });
}

// Start ngrok
startNgrok().catch(err => {
  console.error('Failed to start ngrok:', err);
  process.exit(1);
});
