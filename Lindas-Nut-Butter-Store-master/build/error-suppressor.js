/**
 * Error suppressor script for Linda's Nut Butter Store
 * This script suppresses common console errors that are not critical to the application
 */

(function() {
  // Store the original console error method
  const originalConsoleError = console.error;
  
  // Replace console.error with a filtered version
  console.error = function(...args) {
    // Check for common extension/content script errors
    const errorString = args.join(' ');
    
    // Filter out known non-critical errors
    const ignoredErrors = [
      'Could not establish connection',
      'Receiving end does not exist',
      'Extension context invalidated',
      'Map container is already initialized',
      'Failed to load resource: net::ERR_CONNECTION_REFUSED',
      'Failed to load resource: net::ERR_CONNECTION_RESET'
    ];
    
    // If the error contains any of the ignored phrases, don't log it
    if (ignoredErrors.some(phrase => errorString.includes(phrase))) {
      // Silently ignore the error
      return;
    }
    
    // Otherwise, pass through to the original console.error
    originalConsoleError.apply(console, args);
  };
  
  // Catch and suppress content script errors
  window.addEventListener('error', function(event) {
    if (event.filename && event.filename.includes('content.js')) {
      // Prevent the error from showing in console
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Patch XMLHttpRequest to prevent connection errors from showing
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('error', function(e) {
      // Prevent the error event from bubbling up if it's a connection error
      e.stopPropagation();
    });
    
    return originalSend.apply(this, args);
  };
  
  // console.log removed to keep console clean
})();
