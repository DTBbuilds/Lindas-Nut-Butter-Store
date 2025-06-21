/**
 * M-Pesa Setup and Testing Utility
 * 
 * This script helps set up and test the M-Pesa integration with Safaricom Daraja API.
 * It validates the configuration, tests API connectivity, and registers callback URLs.
 */
const axios = require('axios');
const readline = require('readline');
const { 
  updateMpesaConfig, 
  validateMpesaConfig, 
  loadConfigPreset 
} = require('./configManager');
const config = require('../config');
const darajaApi = require('./darajaApi');
const ngrokHelper = require('./ngrokHelper');

// Create readline interface for interactive console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Run a comprehensive test of M-Pesa integration
 */
const testMpesaIntegration = async () => {
  console.log('\n======================================================');
  console.log('🚀 M-Pesa Integration Testing Utility');
  console.log('======================================================\n');
  
  // Step 1: Validate configuration
  console.log('Step 1: Validating M-Pesa configuration...');
  const validation = validateMpesaConfig();
  
  if (!validation.isValid) {
    console.log('❌ Configuration validation failed:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('\nPlease fix these issues before continuing.');
    return false;
  }
  
  console.log('✅ Configuration validation passed');
  console.log(`   - Environment: ${validation.config.environment}`);
  console.log(`   - Paybill Number: ${validation.config.paybillNumber}`);
  console.log(`   - Callback URL: ${validation.config.callbackUrl}`);
  console.log(`   - Validation URL: ${validation.config.validationUrl}`);
  console.log(`   - Confirmation URL: ${validation.config.confirmationUrl}`);
  
  // Step 2: Check if we have public URLs (required for callbacks)
  console.log('\nStep 2: Checking for public callback URLs...');
  
  if (config.mpesa.callbackUrl.includes('localhost') || 
      config.mpesa.callbackUrl.includes('127.0.0.1')) {
    console.log('⚠️ Warning: Using localhost for callbacks');
    console.log('M-Pesa requires publicly accessible URLs for callbacks.');
    
    // Try to detect ngrok
    console.log('Checking for active ngrok tunnel...');
    const ngrokUrl = await ngrokHelper.getNgrokUrl();
    
    if (ngrokUrl) {
      console.log(`✅ Detected ngrok tunnel: ${ngrokUrl}`);
      console.log('Updating callback URLs to use ngrok...');
      
      // Update callback URLs
      const updatedUrls = ngrokHelper.configureNgrokCallbacks();
      console.log('✅ Callback URLs updated successfully');
    } else {
      console.log('❌ No active ngrok tunnel detected');
      console.log('You need to start ngrok to use M-Pesa in development:');
      console.log('  npm run tunnel   (or)   npx ngrok http 5000');
      return false;
    }
  } else {
    console.log('✅ Using public URLs for callbacks');
  }
  
  // Step 3: Test OAuth token generation
  console.log('\nStep 3: Testing OAuth token generation...');
  try {
    const token = await darajaApi.getAccessToken();
    console.log('✅ Successfully obtained OAuth token');
  } catch (error) {
    console.log('❌ Failed to obtain OAuth token');
    console.log(`   Error: ${error.response?.data?.errorMessage || error.message}`);
    console.log('\nPossible issues:');
    console.log('1. Invalid consumer key or secret');
    console.log('2. Network connectivity issues');
    console.log('3. Safaricom API may be down');
    return false;
  }
  
  // Step 4: Register C2B URLs
  console.log('\nStep 4: Registering C2B URLs...');
  try {
    const response = await darajaApi.registerC2BUrls();
    
    if (response.ResponseCode === '0') {
      console.log('✅ Successfully registered C2B URLs');
    } else {
      console.log(`⚠️ C2B URL registration returned code: ${response.ResponseCode}`);
      console.log(`   Description: ${response.ResponseDescription}`);
    }
  } catch (error) {
    console.log('❌ Failed to register C2B URLs');
    console.log(`   Error: ${error.response?.data?.errorMessage || error.message}`);
    console.log('\nThis is not critical - payments can still work without C2B registration');
  }
  
  // Final status
  console.log('\n======================================================');
  console.log('✅ M-Pesa integration test completed successfully!');
  console.log('======================================================');
  console.log('\nYour system is ready for M-Pesa payments.');
  console.log('\nTest phone numbers for sandbox:');
  console.log(`- Success: ${config.test.phoneNumbers.success}`);
  console.log(`- Insufficient funds: ${config.test.phoneNumbers.insufficient}`);
  console.log(`- Timeout: ${config.test.phoneNumbers.timeout}`);
  console.log(`- Reject: ${config.test.phoneNumbers.reject}`);
  
  return true;
};

/**
 * Configure M-Pesa integration interactively
 */
const configureMpesaInteractive = () => {
  console.log('\n======================================================');
  console.log('🛠️ M-Pesa Configuration Utility');
  console.log('======================================================\n');
  
  console.log('Select environment:');
  console.log('1. Sandbox (Testing)');
  console.log('2. Production');
  
  rl.question('\nEnter selection (1/2): ', (envChoice) => {
    const environment = envChoice === '1' ? 'sandbox' : 'production';
    
    if (environment === 'sandbox') {
      // Load sandbox preset
      const preset = loadConfigPreset('sandbox');
      
      console.log('\nUsing Safaricom Sandbox environment');
      console.log('Default sandbox credentials:');
      console.log('- Paybill Number: 174379');
      console.log('- Passkey: [Standard sandbox passkey]');
      
      rl.question('\nDo you want to use custom sandbox credentials? (y/n): ', (customChoice) => {
        if (customChoice.toLowerCase() === 'y') {
          // Get custom credentials
          getCustomCredentials(environment);
        } else {
          // Use default sandbox credentials
          console.log('\nUsing default sandbox credentials');
          updateMpesaConfig(preset);
          runTests();
        }
      });
    } else {
      // Production needs custom credentials
      console.log('\nProduction environment requires actual credentials from Safaricom');
      getCustomCredentials(environment);
    }
  });
};

/**
 * Get custom credentials from user input
 */
const getCustomCredentials = (environment) => {
  const preset = loadConfigPreset(environment);
  
  rl.question('\nConsumer Key: ', (consumerKey) => {
    rl.question('Consumer Secret: ', (consumerSecret) => {
      rl.question(`Paybill/Till Number [${preset.paybillNumber}]: `, (paybillNumber) => {
        rl.question('Passkey: ', (passkey) => {
          // Update configuration with custom values
          updateMpesaConfig({
            baseUrl: preset.baseUrl,
            consumerKey: consumerKey || preset.consumerKey,
            consumerSecret: consumerSecret || preset.consumerSecret,
            paybillNumber: paybillNumber || preset.paybillNumber,
            passkey: passkey || preset.passkey
          });
          
          runTests();
        });
      });
    });
  });
};

/**
 * Run tests after configuration
 */
const runTests = async () => {
  console.log('\nRunning M-Pesa integration tests...');
  const success = await testMpesaIntegration();
  
  if (success) {
    console.log('\nConfiguration and tests completed successfully!');
  } else {
    console.log('\nTests failed. Please check the configuration and try again.');
  }
  
  rl.close();
};

// Run interactively if script is executed directly
if (require.main === module) {
  configureMpesaInteractive();
} else {
  // Export functions for use in other modules
  module.exports = {
    testMpesaIntegration,
    configureMpesaInteractive
  };
}
