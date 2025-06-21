/**
 * Update M-Pesa configuration to use ngrok URLs
 * 
 * This script updates the M-Pesa callback URLs to use the active ngrok tunnel.
 */
const config = require('./config');
const { getNgrokUrl } = require('./utils/ngrokHelper');
const { updateCallbackUrls } = require('./utils/darajaApi');

async function updateConfig() {
  console.log('Updating M-Pesa configuration to use ngrok URLs...');
  
  try {
    // Get the active ngrok URL
    const ngrokUrl = await getNgrokUrl();
    
    if (!ngrokUrl) {
      console.error('❌ No active ngrok tunnel found!');
      console.error('Please start ngrok with: npm run tunnel');
      return false;
    }
    
    console.log('✅ Found active ngrok tunnel:', ngrokUrl);
    
    // Update the callback URLs
    const updatedUrls = updateCallbackUrls(ngrokUrl);
    
    console.log('\n✅ M-Pesa callback URLs updated successfully:');
    console.log('  - Callback URL:', updatedUrls.callbackUrl);
    console.log('  - Validation URL:', updatedUrls.validationUrl);
    console.log('  - Confirmation URL:', updatedUrls.confirmationUrl);
    
    // Show current M-Pesa configuration
    console.log('\nCurrent M-Pesa Configuration:');
    console.log('  - Environment:', config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION');
    console.log('  - Paybill Number:', config.mpesa.paybillNumber);
    console.log('  - Consumer Key:', maskString(config.mpesa.consumerKey));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating M-Pesa configuration:', error.message);
    return false;
  }
}

// Mask a string for secure logging
function maskString(str, visibleChars = 4) {
  if (!str) return '';
  if (str.length <= visibleChars * 2) return '*'.repeat(str.length);
  
  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  const masked = '*'.repeat(Math.max(0, str.length - (visibleChars * 2)));
  
  return `${start}${masked}${end}`;
}

// Run the update
updateConfig().then(success => {
  if (success) {
    console.log('\n✅ Configuration updated successfully.');
  } else {
    console.error('\n❌ Failed to update configuration.');
  }
});
