/**
 * File Renamer Utility
 * 
 * Renames files with spaces and special characters to web-friendly filenames
 */

const fs = require('fs');
const path = require('path');

/**
 * Renames files in the specified directory to replace spaces with hyphens
 * @param {string} directory - Directory containing files to rename
 * @returns {Object} - Result of renaming operation
 */
const renameFilesInDirectory = (directory) => {
  const result = {
    total: 0,
    renamed: 0,
    skipped: 0,
    errors: 0,
    mapping: {}
  };
  
  if (!fs.existsSync(directory)) {
    console.error(`Directory does not exist: ${directory}`);
    return { ...result, error: 'Directory not found' };
  }
  
  try {
    // Read all files in the directory
    const files = fs.readdirSync(directory);
    result.total = files.length;
    
    // Process each file
    files.forEach(filename => {
      // Skip if file doesn't have spaces or special characters
      if (!/[\s%]/.test(filename)) {
        result.skipped++;
        return;
      }
      
      // Create new filename by replacing spaces with hyphens
      const newFilename = filename
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/%20/g, '-')           // Replace %20 with hyphens
        .replace(/[^a-zA-Z0-9\-_.]/g, '') // Remove other special characters
        .toLowerCase();                  // Convert to lowercase
      
      // Skip if new filename is the same as old
      if (newFilename === filename) {
        result.skipped++;
        return;
      }
      
      try {
        // Full paths
        const oldPath = path.join(directory, filename);
        const newPath = path.join(directory, newFilename);
        
        // Rename the file
        fs.renameSync(oldPath, newPath);
        result.renamed++;
        
        // Add to mapping
        result.mapping[filename] = newFilename;
        console.log(`Renamed: ${filename} → ${newFilename}`);
      } catch (err) {
        console.error(`Error renaming ${filename}:`, err);
        result.errors++;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error processing directory:', error);
    return { ...result, error: error.message };
  }
};

/**
 * Rename all files in images and videos directories
 */
const renameAllMediaFiles = () => {
  const results = {
    images: renameFilesInDirectory(path.join(__dirname, '../../public/images')),
    videos: renameFilesInDirectory(path.join(__dirname, '../../public/videos'))
  };
  
  console.log('File renaming complete:');
  console.log(`Images: ${results.images.renamed} renamed, ${results.images.skipped} skipped, ${results.images.errors} errors`);
  console.log(`Videos: ${results.videos.renamed} renamed, ${results.videos.skipped} skipped, ${results.videos.errors} errors`);
  
  return results;
};

module.exports = {
  renameFilesInDirectory,
  renameAllMediaFiles
};
