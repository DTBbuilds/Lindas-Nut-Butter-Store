/**
 * Script to restore Linda's original M-Pesa configuration
 */
const fs = require('fs');
const path = require('path');

console.log('Restoring Linda\'s original M-Pesa configuration...');

const configFilePath = path.join(__dirname, 'config.js');
const configBackupPath = path.join(__dirname, 'config.linda.backup.js');

if (fs.existsSync(configBackupPath)) {
  // Read the backup config
  const backupContent = fs.readFileSync(configBackupPath, 'utf8');
  
  // Restore the original config
  fs.writeFileSync(configFilePath, backupContent, 'utf8');
  
  console.log('✅ Linda\'s original configuration restored successfully!');
  console.log('Paybill Number: 247247');
  console.log('Account Number: 0725317864');
  console.log('Restart your server with: npm run dev');
} else {
  console.error('❌ Backup configuration file not found!');
}
