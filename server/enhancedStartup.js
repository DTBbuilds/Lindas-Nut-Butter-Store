/**
 * Enhanced startup script for Linda's Nut Butter Store
 * 
 * This script starts all necessary services in the correct order:
 * 1. MongoDB (checks if running, starts if needed)
 * 2. Backend Server
 * 3. Frontend Development Server
 * 4. Ngrok Tunnel (for M-Pesa callbacks)
 * 
 * All services are properly monitored and terminated when the script exits.
 */
const { spawn, exec } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { updateCallbackUrls } = require('./utils/mpesaHelpers');

// Configuration
const SERVER_PORT = config.server.port || 5000;
const FRONTEND_PORT = 3000;
const MONGODB_PORT = 27017;
const RETRY_INTERVAL = 2000; // 2 seconds between retries
const MAX_RETRIES = 10; // Maximum number of retries for service checks
const MONGO_DATA_DIR = path.join(__dirname, '..', 'mongodb-data');

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
 * Check if MongoDB is already running - Windows optimized
 */
async function isMongoDbRunning() {
  return new Promise(resolve => {
    try {
      // First try connecting to MongoDB
      axios.get(`http://localhost:${MONGODB_PORT}`)
        .then(() => resolve(true))
        .catch(() => {
          // For Windows, use PowerShell to check for running MongoDB process
          const checkCommand = process.platform === 'win32' 
            ? 'powershell -Command "Get-Process mongod -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"'
            : 'pgrep mongod';

          exec(checkCommand, (error, stdout) => {
            if (error || !stdout.trim()) {
              // Also check if port is in use (Windows specific)
              exec('netstat -ano | findstr "27017"', (error, stdout) => {
                resolve(stdout && stdout.includes('LISTENING'));
              });
            } else {
              resolve(true); // Process is running
            }
          });
        });
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Start MongoDB server if not already running
 */
async function startMongoDb() {
  const isRunning = await isMongoDbRunning();
  
  if (isRunning) {
    colorLog('MongoDB is already running', 'success');
    return null;
  }
  
  colorLog('Starting MongoDB server...', 'info');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(MONGO_DATA_DIR)) {
    fs.mkdirSync(MONGO_DATA_DIR, { recursive: true });
  }
  
  // Windows-optimized MongoDB startup
  const mongoProcess = spawn('mongod', ['--dbpath', MONGO_DATA_DIR], {
    stdio: 'pipe',
    shell: true,
    windowsHide: false, // Show window on Windows
    // Use detached on Windows to allow the process to run independently
    detached: process.platform === 'win32'
  });
  
  childProcesses.push(mongoProcess);
  
  mongoProcess.stdout.on('data', (data) => {
    console.log(`[MONGODB]: ${data.toString().trim()}`);
  });
  
  mongoProcess.stderr.on('data', (data) => {
    console.error(`[MONGODB ERROR]: ${data.toString().trim()}`);
  });
  
  mongoProcess.on('close', (code) => {
    colorLog(`MongoDB server exited with code ${code}`, code === 0 ? 'info' : 'error');
  });
  
  // Wait for MongoDB to start
  let retries = 0;
  while (retries < MAX_RETRIES) {
    const running = await isMongoDbRunning();
    if (running) {
      colorLog('MongoDB server is ready!', 'success');
      return mongoProcess;
    }
    
    retries++;
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
  }
  
  colorLog('Failed to start MongoDB server', 'error');
  return mongoProcess;
}

/**
 * Check if a port is in use
 */
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

/**
 * Kill processes using a specific port (Windows-specific)
 */
async function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      // For non-Windows platforms
      exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (error) => {
        resolve();
      });
    } else {
      // For Windows
      exec(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`, (error) => {
        resolve();
      });
    }
  });
}

/**
 * Start the backend server
 */
async function startBackendServer() {
  colorLog('Starting Backend Server...', 'info');
  
  // Check if the server port is already in use
  const portInUse = await isPortInUse(SERVER_PORT);
  if (portInUse) {
    colorLog(`Port ${SERVER_PORT} is already in use. Attempting to free it...`, 'warning');
    await killProcessOnPort(SERVER_PORT);
    // Wait a moment for the port to be released
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const serverProcess = spawn('node', ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
    windowsHide: false // Show window on Windows
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
async function startFrontendServer() {
  colorLog('Starting Frontend Development Server...', 'info');
  
  // Check if the frontend port is already in use
  const portInUse = await isPortInUse(FRONTEND_PORT);
  if (portInUse) {
    colorLog(`Port ${FRONTEND_PORT} is already in use. Attempting to free it...`, 'warning');
    await killProcessOnPort(FRONTEND_PORT);
    // Wait a moment for the port to be released
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const frontendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
    windowsHide: false, // Show window on Windows
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
  
  // Start ngrok process - with correct path handling for Windows
  const ngrokProcess = spawn('ngrok', ['http', SERVER_PORT.toString()], {
    stdio: 'pipe',
    shell: true,
    windowsHide: false // Show window on Windows
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
    // Start MongoDB if not already running
    await startMongoDb();
    
    // Start backend server
    const backendProcess = await startBackendServer();
    
    // Wait for backend to be ready
    await waitForService(`http://localhost:${SERVER_PORT}/api/health`, 'Backend server');
    
    // Start frontend
    const frontendProcess = await startFrontendServer();
    
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
      colorLog(`MongoDB: mongodb://localhost:${MONGODB_PORT}`, 'success');
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
      try {
        // On Windows, we may need a more forceful approach for some processes
        if (process.platform === 'win32') {
          // First try the standard kill
          process.kill();
          
          // If that doesn't work and the process is still active, we could use this
          // (but we'll rely on the normal kill for now since it should work)
          // spawn('taskkill', ['/pid', process.pid, '/f', '/t']);
        } else {
          process.kill();
        }
      } catch (err) {
        colorLog(`Error stopping process: ${err.message}`, 'error');
      }
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
