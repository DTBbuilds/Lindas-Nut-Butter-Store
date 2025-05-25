/**
 * Comprehensive startup script for Linda's Nut Butter Store
 * 
 * This script starts all necessary services in the correct order:
 * 1. Backend Server
 * 2. Frontend Development Server
 * 3. Ngrok Tunnel (for M-Pesa callbacks)
 * 
 * All services are properly monitored and terminated when the script exits.
 */
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const config = require('./config');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');

// Configuration
const SERVER_PORT = config.server.port || 5000;
const FRONTEND_PORT = 3000;
const RETRY_INTERVAL = 2000; // 2 seconds between retries
const MAX_RETRIES = 10; // Maximum number of retries for service checks

// Store all child processes for proper cleanup
const childProcesses = [];

/**
 * Helper to create a colored console output
 */
function colorLog(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'  // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

/**
 * Print a section header
 */
function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  colorLog(title, 'success');
  console.log('='.repeat(60) + '\n');
}

/**
 * Start the backend server
 */
function startBackendServer() {
  colorLog('Starting Backend Server...', 'info');
  
  const serverProcess = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true
  });
  
  childProcesses.push(serverProcess);
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[BACKEND]: ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[BACKEND ERROR]: ${data.toString().trim()}`);
  });
  
  serverProcess.on('close', (code) => {
    colorLog(`Backend server exited with code ${code}`, code === 0 ? 'info' : 'error');
  });
  
  return serverProcess;
}

/**
 * Start the frontend development server
 */
function startFrontendServer() {
  colorLog('Starting Frontend Development Server...', 'info');
  
  const frontendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      BROWSER: 'none', // Don't open browser automatically
      PORT: FRONTEND_PORT
    }
  });
  
  childProcesses.push(frontendProcess);
  
  frontendProcess.stdout.on('data', (data) => {
    console.log(`[FRONTEND]: ${data.toString().trim()}`);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    console.error(`[FRONTEND ERROR]: ${data.toString().trim()}`);
  });
  
  frontendProcess.on('close', (code) => {
    colorLog(`Frontend server exited with code ${code}`, code === 0 ? 'info' : 'error');
  });
  
  return frontendProcess;
}

/**
 * Start ngrok tunnel to the backend server
 */
async function startNgrok() {
  colorLog('Starting Ngrok Tunnel...', 'info');
  
  // Check if ngrok is already running
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels', { timeout: 1000 });
    const tunnels = response.data.tunnels || [];
    const httpsTunnel = tunnels.find(t => t.proto === 'https');
    
    if (httpsTunnel) {
      const ngrokUrl = httpsTunnel.public_url;
      colorLog(`Ngrok is already running at: ${ngrokUrl}`, 'warning');
      return { process: null, url: ngrokUrl };
    }
  } catch (error) {
    // Ngrok is not running, which is what we want
  }
  
  // Start ngrok process
  const ngrokProcess = spawn('ngrok', ['http', SERVER_PORT.toString()], {
    stdio: 'pipe'
  });
  
  childProcesses.push(ngrokProcess);
  
  ngrokProcess.stdout.on('data', (data) => {
    console.log(`[NGROK]: ${data.toString().trim()}`);
  });
  
  ngrokProcess.stderr.on('data', (data) => {
    console.error(`[NGROK ERROR]: ${data.toString().trim()}`);
  });
  
  ngrokProcess.on('close', (code) => {
    colorLog(`Ngrok process exited with code ${code}`, code === 0 ? 'info' : 'error');
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
        colorLog(`Ngrok tunnel established: ${ngrokUrl}`, 'success');
        break;
      }
    } catch (error) {
      retries++;
      colorLog(`Waiting for ngrok to start... (Attempt ${retries}/${MAX_RETRIES})`, 'warning');
    }
  }
  
  if (!ngrokUrl) {
    colorLog('Failed to establish ngrok tunnel after several attempts.', 'error');
    return { process: ngrokProcess, url: null };
  }
  
  return { process: ngrokProcess, url: ngrokUrl };
}

/**
 * Update M-Pesa callback URLs with the ngrok URL
 */
async function configureMpesa(ngrokUrl) {
  if (!ngrokUrl) return;
  
  colorLog('Configuring M-Pesa callbacks...', 'info');
  try {
    await updateCallbackUrls(ngrokUrl);
    colorLog('M-Pesa callbacks configured successfully', 'success');
  } catch (error) {
    colorLog(`Error configuring M-Pesa callbacks: ${error.message}`, 'error');
  }
}

/**
 * Wait for a service to be ready by checking its endpoint
 */
async function waitForService(url, name, maxRetries = MAX_RETRIES) {
  colorLog(`Waiting for ${name} to be ready...`, 'info');
  
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await axios.get(url, { timeout: 2000 });
      colorLog(`${name} is ready!`, 'success');
      return true;
    } catch (error) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
  
  colorLog(`${name} did not become ready after ${maxRetries} attempts`, 'error');
  return false;
}

/**
 * Start all services and configure them
 */
async function startAll() {
  printHeader('LINDA\'S NUT BUTTER STORE - STARTING ALL SERVICES');
  
  try {
    // Start backend server
    const backendProcess = startBackendServer();
    
    // Wait for backend to be ready
    await waitForService(`http://localhost:${SERVER_PORT}/api/health`, 'Backend server');
    
    // Start frontend
    const frontendProcess = startFrontendServer();
    
    // Wait for frontend to be ready
    await waitForService(`http://localhost:${FRONTEND_PORT}`, 'Frontend server');
    
    // Start ngrok
    const { process: ngrokProcess, url: ngrokUrl } = await startNgrok();
    
    if (ngrokUrl) {
      // Configure M-Pesa callbacks
      await configureMpesa(ngrokUrl);
      
      // Display success information
      printHeader('ALL SERVICES STARTED SUCCESSFULLY');
      console.log('Your Linda\'s Nut Butter Store is now running at:');
      colorLog(`Frontend: http://localhost:${FRONTEND_PORT}`, 'success');
      colorLog(`Backend API: http://localhost:${SERVER_PORT}`, 'success');
      colorLog(`Public URL (ngrok): ${ngrokUrl}`, 'success');
      console.log('\nM-Pesa callbacks are configured to use:');
      colorLog(`Callback URL: ${ngrokUrl}/api/mpesa/callback`, 'info');
      colorLog(`Validation URL: ${ngrokUrl}/api/mpesa/validation`, 'info');
      colorLog(`Confirmation URL: ${ngrokUrl}/api/mpesa/confirmation`, 'info');
      console.log('\nYou can now test real M-Pesa payments with callbacks.');
      colorLog('\nPress Ctrl+C to stop all services and exit.', 'warning');
    } else {
      colorLog('Not all services started correctly. Check the logs above for errors.', 'error');
    }
  } catch (error) {
    colorLog(`Error starting services: ${error.message}`, 'error');
    cleanupProcesses();
    process.exit(1);
  }
}

/**
 * Clean up all child processes
 */
function cleanupProcesses() {
  colorLog('Stopping all services...', 'warning');
  
  childProcesses.forEach(process => {
    if (!process.killed) {
      process.kill();
    }
  });
}

// Start everything
startAll();

// Handle process termination
process.on('SIGINT', () => {
  cleanupProcesses();
  process.exit();
});

process.on('SIGTERM', () => {
  cleanupProcesses();
  process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  colorLog(`Uncaught exception: ${error.message}`, 'error');
  cleanupProcesses();
  process.exit(1);
});
