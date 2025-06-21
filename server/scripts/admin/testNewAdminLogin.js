/**
 * Test admin login with the new credentials
 * This will help diagnose any issues with authentication
 */

const axios = require('axios');

// New admin credentials
const ADMIN_EMAIL = 'dtbadmin@lindas.com';
const ADMIN_PASSWORD = 'dtbbuildsadmin2025';

async function testAdminLogin() {
  console.log('🔑 Testing admin login with new credentials...');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password length: ${ADMIN_PASSWORD.length} characters`);
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Login failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

// Start the server and test login
const { spawn } = require('child_process');
let serverProcess;

function startServer() {
  console.log('🚀 Starting server...');
  
  serverProcess = spawn('node', ['server/index.js'], { 
    cwd: process.cwd(),
    detached: false,
    stdio: 'pipe'
  });
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER]: ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR]: ${data.toString().trim()}`);
  });
  
  return new Promise(resolve => {
    // Wait for server to start
    setTimeout(resolve, 5000);
  });
}

function stopServer() {
  if (serverProcess) {
    console.log('🛑 Stopping server...');
    serverProcess.kill();
  }
}

async function main() {
  try {
    // Start server
    await startServer();
    
    // Test admin login
    const success = await testAdminLogin();
    
    if (success) {
      console.log('\n✅ Admin login is working correctly with the new credentials.');
      console.log('You can now log in through the frontend with:');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log('\n❌ Admin login is not working with the new credentials.');
      console.log('Please check the server logs for more details.');
    }
  } finally {
    // Stop server
    stopServer();
  }
}

// Run the test
main().catch(error => {
  console.error('Script execution failed:', error);
  stopServer();
});
