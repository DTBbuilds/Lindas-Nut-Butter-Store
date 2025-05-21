/**
 * Combined startup script for Linda's Nut Butter Store with ngrok
 * This script starts both the server and ngrok tunnel together
 */
const { spawn } = require('child_process');
const axios = require('axios');
const config = require('./config');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');

// Configuration
const SERVER_PORT = config.server.port || 5000;
const FRONTEND_PORT = 5001; // React development server port
const RETRY_INTERVAL = 2000; // 2 seconds between retries
const MAX_RETRIES = 10; // Maximum number of retries for ngrok API

/**
 * Start the local development server
 */
function startServer() {
  console.log('🚀 Starting Linda\'s Nut Butter Store development server...');
  
  // Use concurrently directly instead of npm run dev
  // This avoids issues with npm executable path
  const serverProcess = spawn('node', [
    './node_modules/concurrently/dist/bin/concurrently.js',
    'nodemon server/index.js',
    'react-scripts start'
  ], {
    cwd: process.cwd(),
    detached: false,
    shell: true,
    stdio: 'inherit'
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Development server exited with code ${code}`);
    process.exit(code);
  });
  
  return serverProcess;
}

/**
 * Start ngrok to tunnel to the local server port
 */
async function startNgrok() {
  console.log('🔄 Starting ngrok tunnel to port', SERVER_PORT);
  
  // Spawn ngrok process
  const ngrokProcess = spawn('ngrok', ['http', SERVER_PORT.toString()], {
    detached: false,
    stdio: 'pipe'
  });
  
  // Handle ngrok output
  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[NGROK]:', output);
  });
  
  ngrokProcess.stderr.on('data', (data) => {
    console.error('[NGROK ERROR]:', data.toString());
  });
  
  // Get the ngrok URL with retries
  let retries = 0;
  let ngrokUrl = null;
  
  while (!ngrokUrl && retries < MAX_RETRIES) {
    try {
      // Wait a bit for ngrok to start up
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      
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
        console.log(`Backend API: ${ngrokUrl}`);
        console.log(`Frontend: ${ngrokUrl.replace(`:${SERVER_PORT}`, `:${FRONTEND_PORT}`)}`);
        console.log('\n📱 M-Pesa callbacks are now configured to use this URL.');
        console.log('You can now test the full M-Pesa payment flow with real callbacks.\n');
        
        // Return the ngrok URL
        return ngrokUrl;
      }
    } catch (error) {
      retries++;
      console.log(`Waiting for ngrok to start... (Attempt ${retries}/${MAX_RETRIES})`);
    }
  }
  
  if (!ngrokUrl) {
    console.error('❌ Failed to establish ngrok tunnel after several attempts.');
    console.log('Make sure ngrok is running and the dashboard is accessible at http://localhost:4040');
    ngrokProcess.kill();
    return null;
  }
}

/**
 * Start everything
 */
async function startAll() {
  try {
    console.log('🚀 Starting Linda\'s Nut Butter Store with ngrok tunnel');
    console.log('===============================================');
    
    // Start the development server
    const serverProcess = startServer();
    
    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start ngrok
    const ngrokUrl = await startNgrok();
    
    if (!ngrokUrl) {
      console.error('Failed to start ngrok. Exiting...');
      process.exit(1);
    }
    
    console.log('Press Ctrl+C to stop all services and exit.');
    
    // Handle CTRL+C
    process.on('SIGINT', () => {
      console.log('Stopping all services...');
      serverProcess.kill();
      process.exit();
    });
  } catch (error) {
    console.error('Error starting services:', error);
    process.exit(1);
  }
}

// Start everything
startAll();
