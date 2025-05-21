/**
 * M-Pesa Setup Checker
 * 
 * Utility script to verify all M-Pesa integration components are properly configured
 */
const axios = require('axios');
const config = require('../config');
const mpesaClient = require('./darajaApi');

console.log('\n🔍 CHECKING M-PESA INTEGRATION SETUP');
console.log('==================================================');

// Check configuration
console.log('\n📋 M-PESA CONFIGURATION:');
console.log(`- Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`- API Base URL: ${config.mpesa.baseUrl}`);
console.log(`- Paybill Number: ${config.mpesa.paybillNumber}`);
console.log(`- Account Number: ${config.mpesa.accountNumber}`);
console.log(`- Consumer Key Present: ${config.mpesa.consumerKey ? '✅' : '❌'}`);
console.log(`- Consumer Secret Present: ${config.mpesa.consumerSecret ? '✅' : '❌'}`);
console.log(`- Passkey Present: ${config.mpesa.passkey ? '✅' : '❌'}`);

// Check callback URLs
console.log('\n🔗 CALLBACK URLS:');
console.log(`- Callback URL: ${config.mpesa.callbackUrl}`);
console.log(`- Validation URL: ${config.mpesa.validationUrl}`);
console.log(`- Confirmation URL: ${config.mpesa.confirmationUrl}`);

// Check if callback URLs are using localhost
const usingLocalhost = [
  config.mpesa.callbackUrl,
  config.mpesa.validationUrl,
  config.mpesa.confirmationUrl
].some(url => url.includes('localhost'));

if (usingLocalhost) {
  console.log('\n⚠️ WARNING: Using localhost for callbacks!');
  console.log('Safaricom cannot reach your local server directly.');
  console.log('Run the following to update callback URLs with ngrok:');
  console.log('  npm run mpesa:callbacks');
}

// Check ngrok status
async function checkNgrok() {
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels', { timeout: 2000 });
    
    if (response.data && response.data.tunnels && response.data.tunnels.length > 0) {
      const secureUrl = response.data.tunnels.find(t => t.proto === 'https')?.public_url;
      if (secureUrl) {
        console.log('\n✅ Ngrok is running:', secureUrl);
        
        // Check if callbacks are using ngrok
        const usingNgrok = [
          config.mpesa.callbackUrl,
          config.mpesa.validationUrl,
          config.mpesa.confirmationUrl
        ].some(url => url.includes(secureUrl) || secureUrl.includes(new URL(url).hostname));
        
        if (!usingNgrok) {
          console.log('⚠️ WARNING: Callbacks are not using the active ngrok URL!');
          console.log('Run the following to update callback URLs:');
          console.log('  npm run mpesa:callbacks');
        } else {
          console.log('✅ Callbacks are correctly using ngrok');
        }
        
        return true;
      }
    }
    
    console.log('\n❌ Ngrok is not running or no tunnels found');
    console.log('Run the following to start ngrok:');
    console.log('  npm run tunnel');
    return false;
  } catch (error) {
    console.log('\n❌ Ngrok is not running');
    console.log('Run the following to start ngrok:');
    console.log('  npm run tunnel');
    return false;
  }
}

// Check OAuth token generation
async function checkOAuth() {
  try {
    console.log('\n🔑 Testing OAuth token generation...');
    const token = await mpesaClient.getAccessToken();
    console.log('✅ OAuth token generation successful');
    console.log(`Token: ${token.substring(0, 10)}...`);
    return true;
  } catch (error) {
    console.log('❌ OAuth token generation failed');
    console.log('Error:', error.message);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Check timestamp generation
function checkTimestamp() {
  console.log('\n🕒 Testing timestamp generation...');
  const { timestamp } = mpesaClient.generateStkPassword();
  console.log(`Generated timestamp: ${timestamp}`);
  console.log(`Timestamp length: ${timestamp.length} characters`);
  
  if (timestamp.length === 14) {
    console.log('✅ Timestamp format is correct (14 characters)');
    return true;
  } else {
    console.log('❌ Timestamp format is incorrect!');
    console.log('Required format: YYYYMMDDHHmmss (14 characters)');
    return false;
  }
}

// Run all checks
async function runChecks() {
  const ngrokRunning = await checkNgrok();
  const oauthWorking = await checkOAuth();
  const timestampCorrect = checkTimestamp();
  
  console.log('\n==================================================');
  console.log('📊 SETUP CHECK COMPLETE');
  console.log('==================================================');
  
  if (ngrokRunning && oauthWorking && timestampCorrect && !usingLocalhost) {
    console.log('\n✅ All checks passed! Your M-Pesa integration should be working correctly.');
    console.log('You can now test with: npm run mpesa:test');
  } else {
    console.log('\n⚠️ Some checks failed. Fix the issues before testing.');
    
    if (!ngrokRunning) {
      console.log('- Start ngrok with: npm run tunnel');
    }
    
    if (usingLocalhost) {
      console.log('- Update callback URLs with: npm run mpesa:callbacks');
    }
    
    if (!oauthWorking) {
      console.log('- Check your Daraja API credentials in config.js');
    }
    
    if (!timestampCorrect) {
      console.log('- Fix the timestamp format in darajaApi.js');
    }
  }
}

// Run checks
runChecks().catch(error => {
  console.error('Error running checks:', error);
});
