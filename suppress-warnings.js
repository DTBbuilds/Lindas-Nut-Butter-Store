/**
 * Suppress Node.js deprecation warnings
 * 
 * This script suppresses specific Node.js deprecation warnings that come from dependencies
 * and cannot be fixed directly. It should be required at the start of the application.
 */

// Store original process.emitWarning function
const originalEmitWarning = process.emitWarning;

// Override process.emitWarning to filter out specific warnings
process.emitWarning = function(warning, type, code, ...args) {
  // List of warning codes to suppress
  const suppressedWarnings = [
    'DEP0060', // util._extend deprecation
  ];
  
  // Check if this is a deprecation warning we want to suppress
  if (type === 'DeprecationWarning' && 
      suppressedWarnings.some(suppressedCode => code === suppressedCode)) {
    // Don't emit this warning
    return;
  }
  
  // For all other warnings, use the original function
  return originalEmitWarning.call(this, warning, type, code, ...args);
};

console.log('Node.js deprecation warnings suppressed for development');
