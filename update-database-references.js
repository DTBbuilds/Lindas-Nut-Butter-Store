/**
 * Database Reference Update Script for Linda's Nut Butter Store
 * 
 * This script scans the codebase for references to the old database name
 * (lindas-nut-butter) and updates them to use the new database name
 * (lindas-nut-butter-store).
 * 
 * Run with: node update-database-references.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Directories to scan (relative to project root)
const DIRECTORIES_TO_SCAN = [
  'server',
  'scripts',
  'src'
];

// Files to exclude from scanning
const EXCLUDED_FILES = [
  'node_modules',
  '.git',
  'package-lock.json',
  'migrate-missing-products.js',
  'update-database-references.js',
  'transferMissingUsers.js',
  'transferAndDeleteDatabase.js',
  'dropUnusedDatabase.js',
  'dropSourceDatabase.js'
];

// Old and new database names
const OLD_DB_NAME = 'lindas-nut-butter';
const NEW_DB_NAME = 'lindas-nut-butter-store';

// Track files that will be modified
const filesToModify = [];

// Function to scan a file for the old database name
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains the old database name
    if (content.includes(OLD_DB_NAME)) {
      // Don't modify files that are specifically about database migration
      const fileName = path.basename(filePath);
      if (EXCLUDED_FILES.includes(fileName)) {
        return false;
      }
      
      filesToModify.push({
        path: filePath,
        content,
        newContent: content.replace(new RegExp(OLD_DB_NAME, 'g'), NEW_DB_NAME)
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively scan directories
function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip excluded files and directories
      if (EXCLUDED_FILES.some(excluded => fullPath.includes(excluded))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (
          fullPath.endsWith('.js') || 
          fullPath.endsWith('.jsx') || 
          fullPath.endsWith('.json') || 
          fullPath.endsWith('.md') ||
          fullPath.endsWith('.env')
        )) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

// Function to update files with the new database name
function updateFiles() {
  let updatedCount = 0;
  
  for (const file of filesToModify) {
    try {
      fs.writeFileSync(file.path, file.newContent);
      updatedCount++;
      console.log(`✅ Updated: ${file.path}`);
    } catch (error) {
      console.error(`❌ Error updating ${file.path}:`, error.message);
    }
  }
  
  return updatedCount;
}

// Main function
async function main() {
  console.log('🔍 Scanning codebase for references to the old database name...');
  
  // Get the project root directory
  const projectRoot = path.resolve(__dirname);
  
  // Scan directories
  for (const dir of DIRECTORIES_TO_SCAN) {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath);
    }
  }
  
  // Also scan root directory for config files
  scanDirectory(projectRoot);
  
  if (filesToModify.length === 0) {
    console.log('✅ No files found with references to the old database name.');
    rl.close();
    return;
  }
  
  console.log(`\n🔍 Found ${filesToModify.length} files with references to the old database name:`);
  // Use a more controlled output format to avoid console formatting issues
  for (let i = 0; i < filesToModify.length; i++) {
    const file = filesToModify[i];
    const relativePath = file.path.replace(projectRoot, '').replace(/\\/g, '/');
    console.log(` - ${i+1}. ${relativePath}`);
  }
  
  rl.question('\n⚠️ Do you want to update these files? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      const updatedCount = updateFiles();
      console.log(`\n✅ Successfully updated ${updatedCount} files.`);
    } else {
      console.log('❌ Update cancelled.');
    }
    rl.close();
  });
}

// Start the script
main();
