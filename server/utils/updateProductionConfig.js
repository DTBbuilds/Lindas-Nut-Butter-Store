/**
 * Production Configuration Update Script for M-Pesa
 * 
 * This script helps update M-Pesa configuration for production deployment.
 * It securely stores credentials and validates the configuration.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const config = require('../config');
const { updateMpesaConfig, validateMpesaConfig } = require('./configManager');

// Check if running in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Update production M-Pesa configuration from environment variables
 * @returns {Object} Updated configuration
 */
const updateProductionConfigFromEnv = () => {
  // Only proceed in production environment
  if (!isProduction) {
    console.log('⚠️ This script is intended for production environment only.');
    console.log('Current environment:', process.env.NODE_ENV || 'development');
    return null;
  }
  
  console.log('Updating M-Pesa configuration from environment variables...');
  
  // Load environment variables if not already loaded
  const dotenvPath = path.resolve(process.cwd(), '.env.production');
  if (fs.existsSync(dotenvPath)) {
    console.log(`Loading environment variables from ${dotenvPath}`);
    dotenv.config({ path: dotenvPath });
  }
  
  // Extract environment variables
  const mpesaConfig = {
    baseUrl: 'https://api.safaricom.co.ke', // Production API URL
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    paybillNumber: process.env.MPESA_PAYBILL_NUMBER,
    passkey: process.env.MPESA_PASSKEY,
    initiatorName: process.env.MPESA_INITIATOR_NAME,
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    // Production should use the actual server URLs, not localhost
    callbackUrl: process.env.MPESA_CALLBACK_URL || `${process.env.PRODUCTION_BASE_URL}/api/mpesa/callback`,
    validationUrl: process.env.MPESA_VALIDATION_URL || `${process.env.PRODUCTION_BASE_URL}/api/mpesa/validation`,
    confirmationUrl: process.env.MPESA_CONFIRMATION_URL || `${process.env.PRODUCTION_BASE_URL}/api/mpesa/confirmation`,
  };
  
  // Validate environment variables
  const missingVars = Object.entries(mpesaConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env.production file or deployment environment.');
    return null;
  }
  
  // Update configuration
  const updatedConfig = updateMpesaConfig(mpesaConfig);
  
  // Validate the updated configuration
  const validation = validateMpesaConfig();
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    validation.issues.forEach(issue => console.error(`   - ${issue}`));
    return null;
  }
  
  console.log('✅ Production M-Pesa configuration updated successfully');
  console.log('   Callback URL:', updatedConfig.callbackUrl);
  
  return updatedConfig;
};

// Run if executed directly
if (require.main === module) {
  updateProductionConfigFromEnv();
} else {
  // Export for use in other modules
  module.exports = {
    updateProductionConfigFromEnv
  };
}
