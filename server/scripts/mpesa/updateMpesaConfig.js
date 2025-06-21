/**
 * Script to update M-Pesa configuration to use standard Safaricom sandbox test credentials
 * This will temporarily modify the config to use the standard test credentials for debugging
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

console.log(`
🌟 ===================================================== 🌟
     UPDATE M-PESA CONFIGURATION FOR TESTING
🌟 ===================================================== 🌟
`);

// Current configuration
console.log('Current M-Pesa Configuration:');
console.log(`- Environment: ${config.mpesa.baseUrl.includes('sandbox') ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`- Paybill Number: ${config.mpesa.paybillNumber}`);
console.log(`- Account Number: ${config.mpesa.accountNumber}`);
console.log(`- Consumer Key: ${config.mpesa.consumerKey.substring(0, 10)}...`);
console.log(`- Consumer Secret: ${config.mpesa.consumerSecret.substring(0, 10)}...`);
console.log(`- Passkey: ${config.mpesa.passkey.substring(0, 10)}...`);

// Standard Safaricom test credentials
const standardTestConfig = {
  paybillNumber: '174379', // Standard Safaricom test shortcode
  passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Standard test passkey
  consumerKey: 'GvzjNnYgNJtwgwfLBkZh65VPwfuKvs0V', // Standard test consumer key
  consumerSecret: 'oUs2ibY9pzL1A0Az' // Standard test consumer secret
};

// Backup the current config
const configFilePath = path.join(__dirname, 'config.js');
const configBackupPath = path.join(__dirname, 'config.backup.js');

// Read the current config file
const configContent = fs.readFileSync(configFilePath, 'utf8');

// Create a backup
fs.writeFileSync(configBackupPath, configContent, 'utf8');
console.log(`\n✅ Created backup of current config at: ${configBackupPath}`);

// Update the config file with standard test credentials
let updatedConfig = configContent;

// Replace the paybill number
updatedConfig = updatedConfig.replace(
  /paybillNumber: process\.env\.MPESA_PAYBILL_NUMBER \|\| ['"]([^'"]+)['"]/,
  `paybillNumber: process.env.MPESA_PAYBILL_NUMBER || '${standardTestConfig.paybillNumber}'`
);

// Replace the passkey
updatedConfig = updatedConfig.replace(
  /passkey: process\.env\.MPESA_PASSKEY \|\| ['"]([^'"]+)['"]/,
  `passkey: process.env.MPESA_PASSKEY || '${standardTestConfig.passkey}'`
);

// Replace the consumer key
updatedConfig = updatedConfig.replace(
  /consumerKey: process\.env\.MPESA_CONSUMER_KEY \|\| ['"]([^'"]+)['"]/,
  `consumerKey: process.env.MPESA_CONSUMER_KEY || '${standardTestConfig.consumerKey}'`
);

// Replace the consumer secret
updatedConfig = updatedConfig.replace(
  /consumerSecret: process\.env\.MPESA_CONSUMER_SECRET \|\| ['"]([^'"]+)['"]/,
  `consumerSecret: process.env.MPESA_CONSUMER_SECRET || '${standardTestConfig.consumerSecret}'`
);

// Write the updated config back to the file
fs.writeFileSync(configFilePath, updatedConfig, 'utf8');

console.log('\n✅ Updated config with standard Safaricom test credentials:');
console.log(`- Paybill Number: ${standardTestConfig.paybillNumber}`);
console.log(`- Consumer Key: ${standardTestConfig.consumerKey}`);
console.log(`- Consumer Secret: ${standardTestConfig.consumerSecret}`);
console.log(`- Passkey: ${standardTestConfig.passkey.substring(0, 10)}...`);

console.log(`
🌟 ===================================================== 🌟
                   NEXT STEPS
🌟 ===================================================== 🌟
`);

console.log('1. Restart your server with: npm run dev');
console.log('2. Run the test script again with: node server/testMpesaConnection.js');
console.log('3. To restore your original configuration, run: node server/restoreConfig.js');

// Create a restore script
const restoreScript = `/**
 * Script to restore the original M-Pesa configuration
 */
const fs = require('fs');
const path = require('path');

console.log('Restoring original M-Pesa configuration...');

const configFilePath = path.join(__dirname, 'config.js');
const configBackupPath = path.join(__dirname, 'config.backup.js');

if (fs.existsSync(configBackupPath)) {
  // Read the backup config
  const backupContent = fs.readFileSync(configBackupPath, 'utf8');
  
  // Restore the original config
  fs.writeFileSync(configFilePath, backupContent, 'utf8');
  
  console.log('✅ Original configuration restored successfully!');
  console.log('Restart your server with: npm run dev');
} else {
  console.error('❌ Backup configuration file not found!');
}
`;

// Write the restore script
fs.writeFileSync(path.join(__dirname, 'restoreConfig.js'), restoreScript, 'utf8');
console.log('\n✅ Created restore script at: server/restoreConfig.js');

console.log(`
Note: This update is temporary for testing purposes only. 
The standard test credentials will allow you to verify that the Safaricom Daraja API
is working correctly. After testing, you should restore your original configuration
or update it with your actual production credentials.
`);
