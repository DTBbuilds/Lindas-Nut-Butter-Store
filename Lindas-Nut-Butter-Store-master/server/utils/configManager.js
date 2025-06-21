/**
 * Configuration Manager for M-Pesa Integration
 * 
 * This utility helps manage configurations for different environments
 * and provides utilities to update and validate the configuration.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Update M-Pesa configuration with new values
 * @param {Object} mpesaConfig - New M-Pesa configuration values
 * @returns {Object} - Updated configuration
 */
const updateMpesaConfig = (mpesaConfig) => {
  // Validate required fields
  const requiredFields = ['consumerKey', 'consumerSecret', 'paybillNumber', 'passkey'];
  const missingFields = requiredFields.filter(field => !mpesaConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required M-Pesa configuration fields: ${missingFields.join(', ')}`);
  }

  // Update configuration
  Object.assign(config.mpesa, mpesaConfig);
  
  console.log('M-Pesa configuration updated:');
  console.log('- Consumer Key:', maskString(config.mpesa.consumerKey));
  console.log('- Paybill Number:', config.mpesa.paybillNumber);
  console.log('- Environment:', config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION');
  
  return config.mpesa;
};

/**
 * Save current configuration to a backup file
 * @returns {string} - Path to the backup file
 */
const backupConfiguration = () => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
  const backupDir = path.join(__dirname, '../config-backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFilePath = path.join(backupDir, `config-backup-${timestamp}.json`);
  
  // Save current configuration
  fs.writeFileSync(
    backupFilePath, 
    JSON.stringify({
      mpesa: {
        ...config.mpesa,
        consumerKey: maskString(config.mpesa.consumerKey),
        consumerSecret: maskString(config.mpesa.consumerSecret),
        passkey: maskString(config.mpesa.passkey)
      }
    }, null, 2)
  );
  
  console.log(`Configuration backed up to: ${backupFilePath}`);
  return backupFilePath;
};

/**
 * Validate M-Pesa configuration
 * @returns {Object} - Validation results
 */
const validateMpesaConfig = () => {
  const issues = [];
  
  // Check required fields
  const requiredFields = [
    'consumerKey', 
    'consumerSecret', 
    'paybillNumber', 
    'passkey',
    'callbackUrl',
    'validationUrl',
    'confirmationUrl'
  ];
  
  const missingFields = requiredFields.filter(field => !config.mpesa[field]);
  if (missingFields.length > 0) {
    issues.push(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Check for localhost in callback URLs in production
  if (process.env.NODE_ENV === 'production') {
    const callbackUrls = [
      config.mpesa.callbackUrl,
      config.mpesa.validationUrl,
      config.mpesa.confirmationUrl
    ];
    
    const localUrls = callbackUrls.filter(url => 
      url.includes('localhost') || url.includes('127.0.0.1')
    );
    
    if (localUrls.length > 0) {
      issues.push('Production environment has localhost URLs, which will not work for callbacks');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    config: {
      environment: config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION',
      paybillNumber: config.mpesa.paybillNumber,
      callbackUrl: config.mpesa.callbackUrl,
      validationUrl: config.mpesa.validationUrl,
      confirmationUrl: config.mpesa.confirmationUrl
    }
  };
};

/**
 * Mask a string for secure logging (shows only first and last characters)
 * @param {string} str - String to mask
 * @param {number} visibleChars - Number of characters to show at start and end
 * @returns {string} - Masked string
 */
const maskString = (str, visibleChars = 4) => {
  if (!str) return '';
  if (str.length <= visibleChars * 2) return '*'.repeat(str.length);
  
  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  const masked = '*'.repeat(Math.max(0, str.length - (visibleChars * 2)));
  
  return `${start}${masked}${end}`;
};

/**
 * Load a configuration preset (sandbox or production)
 * @param {string} preset - Preset name ('sandbox' or 'production')
 * @returns {Object} - Loaded configuration
 */
const loadConfigPreset = (preset) => {
  if (preset === 'sandbox') {
    return updateMpesaConfig({
      baseUrl: 'https://sandbox.safaricom.co.ke',
      consumerKey: config.mpesa.consumerKey,
      consumerSecret: config.mpesa.consumerSecret,
      paybillNumber: '174379',  // Default sandbox paybill
      passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',  // Default sandbox passkey
      initiatorName: 'testapi',
      securityCredential: 'Safaricom999!*!'
    });
  } else if (preset === 'production') {
    // Production preset requires actual credentials - this is just a template
    return {
      baseUrl: 'https://api.safaricom.co.ke',
      consumerKey: '[REQUIRED]',
      consumerSecret: '[REQUIRED]',
      paybillNumber: '[REQUIRED]',
      passkey: '[REQUIRED]',
      initiatorName: '[REQUIRED]',
      securityCredential: '[REQUIRED]'
    };
  } else {
    throw new Error(`Unknown preset: ${preset}`);
  }
};

module.exports = {
  updateMpesaConfig,
  backupConfiguration,
  validateMpesaConfig,
  loadConfigPreset
};
