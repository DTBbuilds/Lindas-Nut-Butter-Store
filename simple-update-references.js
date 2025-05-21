/**
 * Simple Database Reference Update Script
 * 
 * This script updates references to the old database name in key configuration files.
 */

const fs = require('fs');
const path = require('path');

// Key files to update
const FILES_TO_UPDATE = [
  'server/config.js',
  'server/createSimpleAdmin.js',
  'server/scripts/adminSetup.js',
  '.env'
];

// Old and new database names
const OLD_DB_NAME = 'lindas-nut-butter';
const NEW_DB_NAME = 'lindas-nut-butter-store';

// Update files
function updateFiles() {
  const projectRoot = path.resolve(__dirname);
  let updatedCount = 0;
  
  FILES_TO_UPDATE.forEach(relativeFilePath => {
    const filePath = path.join(projectRoot, relativeFilePath);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes(OLD_DB_NAME)) {
          const newContent = content.replace(new RegExp(OLD_DB_NAME, 'g'), NEW_DB_NAME);
          fs.writeFileSync(filePath, newContent);
          console.log(`✅ Updated: ${relativeFilePath}`);
          updatedCount++;
        } else {
          console.log(`ℹ️ No changes needed: ${relativeFilePath}`);
        }
      } else {
        console.log(`⚠️ File not found: ${relativeFilePath}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${relativeFilePath}:`, error.message);
    }
  });
  
  return updatedCount;
}

// Main function
function main() {
  console.log('🔄 Updating database references in key files...');
  const updatedCount = updateFiles();
  console.log(`\n✅ Successfully updated ${updatedCount} files.`);
}

// Start the script
main();
