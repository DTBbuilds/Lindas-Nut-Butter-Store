/**
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
