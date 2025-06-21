/**
 * Reset M-Pesa configuration to default sandbox credentials
 * 
 * This script resets the M-Pesa configuration to use the standard Safaricom
 * sandbox credentials and paybill number.
 */
const config = require('./config');
const { getNgrokUrl } = require('./utils/ngrokHelper');
const { updateCallbackUrls } = require('./utils/darajaApi');

// Default sandbox credentials from Safaricom
const DEFAULT_SANDBOX_CONFIG = {
  baseUrl: 'https://sandbox.safaricom.co.ke',
  consumerKey: 'GvzjNnYgNJtwgwfLBkZh65VPwfuKvs0V',
  consumerSecret: 'oUs2ibY9pzL1A0Az',
  paybillNumber: '174379',
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  initiatorName: 'testapi',
  securityCredential: 'Safaricom999!*!'
};

async function resetToDefaultSandbox() {
  console.log('Resetting M-Pesa configuration to default sandbox credentials...');
  
  try {
    // Update configuration with default sandbox values
    Object.assign(config.mpesa, DEFAULT_SANDBOX_CONFIG);
    
    console.log('✅ M-Pesa configuration reset to default sandbox values:');
    console.log('  - Environment: SANDBOX');
    console.log('  - Base URL:', config.mpesa.baseUrl);
    console.log('  - Consumer Key:', config.mpesa.consumerKey);
    console.log('  - Paybill Number:', config.mpesa.paybillNumber);
    
    // Get the active ngrok URL
    const ngrokUrl = await getNgrokUrl();
    
    if (ngrokUrl) {
      console.log('\n✅ Found active ngrok tunnel:', ngrokUrl);
      
      // Update the callback URLs
      const updatedUrls = updateCallbackUrls(ngrokUrl);
      
      console.log('\n✅ M-Pesa callback URLs updated successfully:');
      console.log('  - Callback URL:', updatedUrls.callbackUrl);
      console.log('  - Validation URL:', updatedUrls.validationUrl);
      console.log('  - Confirmation URL:', updatedUrls.confirmationUrl);
    } else {
      console.warn('\n⚠️ No active ngrok tunnel found. Using localhost URLs:');
      console.warn('  - Callback URL:', config.mpesa.callbackUrl);
      console.warn('  - Validation URL:', config.mpesa.validationUrl);
      console.warn('  - Confirmation URL:', config.mpesa.confirmationUrl);
      console.warn('\nM-Pesa callbacks may not work without public URLs.');
    }
    
    console.log('\n✅ Configuration reset successfully.');
    console.log('\nTest phone numbers for sandbox:');
    console.log('  - Success: 254708374149');
    console.log('  - Insufficient funds: 254708374150');
    console.log('  - Timeout: 254708374151');
    console.log('  - User rejects: 254708374152');
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting M-Pesa configuration:', error.message);
    return false;
  }
}

// Run the reset
resetToDefaultSandbox().then(success => {
  if (!success) {
    console.error('\n❌ Failed to reset configuration.');
  }
});
