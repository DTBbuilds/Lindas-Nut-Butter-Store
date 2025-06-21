/**
 * Script to start ngrok and update configuration with the new URL
 * This makes M-PESA callbacks work by exposing the local server to the internet
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration files to update
const SERVER_CONFIG_PATH = path.join(__dirname, '..', 'config.js');
const FRONTEND_CONFIG_PATH = path.join(__dirname, '..', '..', 'src', 'config', 'apiConfig.js');

/**
 * Start ngrok and get the public URL
 */
function startNgrok(port = 5000) {
  console.log(`\n🚀 Starting ngrok on port ${port}...`);
  
  // Command to start ngrok
  const ngrokCommand = `ngrok http ${port}`;
  
  // Execute ngrok command
  const ngrokProcess = exec(ngrokCommand);
  
  // Handle ngrok output
  ngrokProcess.stdout.on('data', (data) => {
    console.log(`ngrok: ${data}`);
    
    // Extract the ngrok URL from the output
    const match = data.toString().match(/Forwarding\s+(https:\/\/[\w-]+\.ngrok-free\.app)/);
    if (match && match[1]) {
      const ngrokUrl = match[1];
      console.log(`\n✅ ngrok URL: ${ngrokUrl}`);
      
      // Automatically update configuration files without prompting
      updateConfigFiles(ngrokUrl);
    }
  });
  
  // Handle ngrok errors
  ngrokProcess.stderr.on('data', (data) => {
    console.error(`ngrok error: ${data}`);
  });
  
  // Handle ngrok exit
  ngrokProcess.on('close', (code) => {
    console.log(`ngrok exited with code ${code}`);
  });
  
  // Handle process exit
  process.on('SIGINT', () => {
    console.log('\nStopping ngrok...');
    ngrokProcess.kill();
    process.exit();
  });
}

/**
 * Update configuration files with the new ngrok URL
 */
function updateConfigFiles(ngrokUrl) {
  console.log('\n🔄 Updating configuration files...');
  
  // Update server config.js
  try {
    let serverConfig = fs.readFileSync(SERVER_CONFIG_PATH, 'utf8');
    
    // Update publicUrl
    serverConfig = serverConfig.replace(
      /(publicUrl: process\.env\.PUBLIC_URL \|\| ')[^']*(')/,
      `$1${ngrokUrl}$2`
    );
    
    // Update callback URLs
    serverConfig = serverConfig.replace(
      /(callbackUrl: process\.env\.CALLBACK_URL \|\| ')[^']*(')/,
      `$1${ngrokUrl}/api/mpesa/callback$2`
    );
    
    serverConfig = serverConfig.replace(
      /(validationUrl: process\.env\.VALIDATION_URL \|\| ')[^']*(')/,
      `$1${ngrokUrl}/api/mpesa/validation$2`
    );
    
    serverConfig = serverConfig.replace(
      /(confirmationUrl: process\.env\.CONFIRMATION_URL \|\| ')[^']*(')/,
      `$1${ngrokUrl}/api/mpesa/confirmation$2`
    );
    
    // Write updated config
    fs.writeFileSync(SERVER_CONFIG_PATH, serverConfig);
    console.log(`✅ Updated server config at ${SERVER_CONFIG_PATH}`);
  } catch (error) {
    console.error(`❌ Error updating server config: ${error.message}`);
  }
  
  // Update frontend apiConfig.js
  try {
    let frontendConfig = fs.readFileSync(FRONTEND_CONFIG_PATH, 'utf8');
    
    // Update publicUrl
    frontendConfig = frontendConfig.replace(
      /(publicUrl: process\.env\.REACT_APP_PUBLIC_URL \|\| ')[^']*(')/,
      `$1${ngrokUrl}/api$2`
    );
    
    // Write updated config
    fs.writeFileSync(FRONTEND_CONFIG_PATH, frontendConfig);
    console.log(`✅ Updated frontend config at ${FRONTEND_CONFIG_PATH}`);
  } catch (error) {
    console.error(`❌ Error updating frontend config: ${error.message}`);
  }
  
  console.log('\n✅ Configuration updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your server');
  console.log('   2. Restart your frontend');
  console.log('   3. Test M-PESA payment in the checkout flow');
  
  rl.close();
}

// Start ngrok
const port = process.argv[2] || 5000;
startNgrok(port);

console.log('\n⚠️ Press Ctrl+C to stop ngrok');
