/**
 * Production Build Test Script for Linda's Nut Butter Store
 * 
 * This script tests the production build locally to ensure everything is working
 * correctly before deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const dotenv = require('dotenv');

// Load production environment variables
try {
  dotenv.config({ path: '.env.production' });
  console.log('✅ Loaded production environment variables');
} catch (error) {
  console.error('❌ Failed to load production environment variables:', error.message);
  process.exit(1);
}

// Configuration
const config = {
  buildDir: path.join(__dirname, 'build'),
  requiredEnvVars: [
    'MONGO_URI',
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'CALLBACK_URL',
    'VALIDATION_URL',
    'CONFIRMATION_URL',
    'BASE_URL',
    'FRONTEND_URL'
  ]
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper functions for logging
const log = {
  info: (msg) => console.log(`${colors.blue}INFO:${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}SUCCESS:${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}ERROR:${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}WARNING:${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}==== ${msg} ====${colors.reset}`)
};

// Check if required environment variables are set
function checkEnvironmentVariables() {
  log.header('Checking Environment Variables');
  
  const missingVars = [];
  
  config.requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    log.info('Please update your .env.production file with these values');
    return false;
  }
  
  log.success('All required environment variables are set');
  return true;
}

// Build the React frontend
function buildFrontend() {
  log.header('Building React Frontend');
  
  try {
    log.info('Running production build...');
    execSync('npm run build', { stdio: 'inherit' });
    
    if (!fs.existsSync(config.buildDir)) {
      log.error('Build directory not found after build');
      return false;
    }
    
    log.success('Frontend built successfully');
    return true;
  } catch (error) {
    log.error(`Frontend build failed: ${error.message}`);
    return false;
  }
}

// Test MongoDB connection
async function testMongoDBConnection() {
  log.header('Testing MongoDB Connection');
  
  try {
    log.info(`Connecting to MongoDB: ${process.env.MONGO_URI.substring(0, process.env.MONGO_URI.indexOf('@') + 1)}...`);
    
    // Create a temporary script to test MongoDB connection
    const tempScriptPath = path.join(__dirname, 'temp-mongo-test.js');
    
    fs.writeFileSync(tempScriptPath, `
      const mongoose = require('mongoose');
      
      async function testConnection() {
        try {
          await mongoose.connect('${process.env.MONGO_URI}', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log('MongoDB connection successful');
          process.exit(0);
        } catch (error) {
          console.error('MongoDB connection failed:', error.message);
          process.exit(1);
        }
      }
      
      testConnection();
    `);
    
    execSync(`node ${tempScriptPath}`, { stdio: 'inherit' });
    fs.unlinkSync(tempScriptPath);
    
    log.success('MongoDB connection test passed');
    return true;
  } catch (error) {
    log.error('MongoDB connection test failed');
    return false;
  }
}

// Test M-Pesa API credentials
async function testMpesaCredentials() {
  log.header('Testing M-Pesa API Credentials');
  
  try {
    log.info('Testing M-Pesa API credentials...');
    
    // Create a temporary script to test M-Pesa credentials
    const tempScriptPath = path.join(__dirname, 'temp-mpesa-test.js');
    
    fs.writeFileSync(tempScriptPath, `
      const axios = require('axios');
      
      async function testMpesaAuth() {
        try {
          const consumerKey = '${process.env.MPESA_CONSUMER_KEY}';
          const consumerSecret = '${process.env.MPESA_CONSUMER_SECRET}';
          
          const auth = Buffer.from(\`\${consumerKey}:\${consumerSecret}\`).toString('base64');
          
          const response = await axios.get(
            'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
              headers: {
                Authorization: \`Basic \${auth}\`
              }
            }
          );
          
          if (response.data && response.data.access_token) {
            console.log('M-Pesa API authentication successful');
            process.exit(0);
          } else {
            console.error('M-Pesa API authentication failed: No access token received');
            process.exit(1);
          }
        } catch (error) {
          console.error('M-Pesa API authentication failed:', error.message);
          process.exit(1);
        }
      }
      
      testMpesaAuth();
    `);
    
    execSync(`node ${tempScriptPath}`, { stdio: 'inherit' });
    fs.unlinkSync(tempScriptPath);
    
    log.success('M-Pesa API credentials test passed');
    return true;
  } catch (error) {
    log.error('M-Pesa API credentials test failed');
    return false;
  }
}

// Test starting the production server
async function testProductionServer() {
  log.header('Testing Production Server');
  
  try {
    log.info('Starting production server...');
    
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    // Start the server in a separate process
    const serverProcess = require('child_process').spawn('node', ['server/index.js'], {
      env: process.env,
      stdio: 'pipe'
    });
    
    // Promise to wait for server to start
    return new Promise((resolve) => {
      let serverOutput = '';
      let serverStarted = false;
      
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        process.stdout.write(output);
        
        // Check if server has started
        if (output.includes('Server running at') && !serverStarted) {
          serverStarted = true;
          log.success('Server started successfully');
          
          // Test server response
          setTimeout(() => {
            const req = http.get('http://localhost:5000/api/products', (res) => {
              let data = '';
              
              res.on('data', (chunk) => {
                data += chunk;
              });
              
              res.on('end', () => {
                try {
                  const products = JSON.parse(data);
                  if (Array.isArray(products)) {
                    log.success(`Server API test passed: ${products.length} products retrieved`);
                    serverProcess.kill();
                    resolve(true);
                  } else {
                    log.error('Server API test failed: Invalid response format');
                    serverProcess.kill();
                    resolve(false);
                  }
                } catch (error) {
                  log.error(`Server API test failed: ${error.message}`);
                  serverProcess.kill();
                  resolve(false);
                }
              });
            });
            
            req.on('error', (error) => {
              log.error(`Server API test failed: ${error.message}`);
              serverProcess.kill();
              resolve(false);
            });
          }, 5000); // Wait 5 seconds for server to fully initialize
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      
      serverProcess.on('error', (error) => {
        log.error(`Failed to start server: ${error.message}`);
        resolve(false);
      });
      
      // Timeout if server doesn't start within 30 seconds
      setTimeout(() => {
        if (!serverStarted) {
          log.error('Server failed to start within timeout period');
          serverProcess.kill();
          resolve(false);
        }
      }, 30000);
    });
  } catch (error) {
    log.error(`Production server test failed: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  log.header('PRODUCTION BUILD TEST');
  console.log('This script will test your production build to ensure it\'s ready for deployment.\n');
  
  // Run all tests
  const envVarsOk = checkEnvironmentVariables();
  if (!envVarsOk) {
    log.error('Environment variables check failed. Please fix the issues before continuing.');
    process.exit(1);
  }
  
  const frontendBuildOk = buildFrontend();
  if (!frontendBuildOk) {
    log.error('Frontend build failed. Please fix the issues before continuing.');
    process.exit(1);
  }
  
  const mongoDbOk = await testMongoDBConnection();
  if (!mongoDbOk) {
    log.warning('MongoDB connection test failed. This may cause issues in production.');
    // Continue anyway, as this might be fixed during actual deployment
  }
  
  const mpesaOk = await testMpesaCredentials();
  if (!mpesaOk) {
    log.warning('M-Pesa API credentials test failed. This may cause payment issues in production.');
    // Continue anyway, as this might be fixed during actual deployment
  }
  
  const serverOk = await testProductionServer();
  if (!serverOk) {
    log.error('Production server test failed. Please fix the issues before continuing.');
    process.exit(1);
  }
  
  // Final summary
  log.header('TEST SUMMARY');
  
  console.log(`Environment Variables: ${envVarsOk ? colors.green + 'PASSED' : colors.red + 'FAILED'}`);
  console.log(`Frontend Build: ${frontendBuildOk ? colors.green + 'PASSED' : colors.red + 'FAILED'}`);
  console.log(`MongoDB Connection: ${mongoDbOk ? colors.green + 'PASSED' : colors.yellow + 'WARNING'}`);
  console.log(`M-Pesa API: ${mpesaOk ? colors.green + 'PASSED' : colors.yellow + 'WARNING'}`);
  console.log(`Production Server: ${serverOk ? colors.green + 'PASSED' : colors.red + 'FAILED'}`);
  console.log(colors.reset);
  
  if (envVarsOk && frontendBuildOk && serverOk) {
    log.success('Your application is ready for deployment!');
    
    if (!mongoDbOk || !mpesaOk) {
      log.warning('Some tests had warnings. Make sure to address these before going live.');
    }
    
    console.log('\nNext steps:');
    console.log('1. Run `npm run deploy` to create the deployment package');
    console.log('2. Follow the instructions in DEPLOYMENT_GUIDE.md to deploy to your chosen platform');
  } else {
    log.error('Your application is not ready for deployment. Please fix the issues and try again.');
  }
}

// Run the script
main().catch(error => {
  log.error(`Test script failed: ${error.message}`);
  process.exit(1);
});
