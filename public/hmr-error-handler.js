/**
 * Hot Module Replacement (HMR) Error Handler
 * 
 * This script intercepts and suppresses 404 errors related to HMR in development.
 * It prevents the console from being flooded with errors for missing hot-update files.
 */

(function() {
  // Store the original fetch method
  const originalFetch = window.fetch;
  
  // Override fetch to intercept HMR-related requests
  window.fetch = function(resource, options) {
    // Check if this is an HMR-related request
    if (typeof resource === 'string' && 
        (resource.includes('.hot-update.') || resource === '/service-worker.js')) {
      
      // Return the original fetch, but catch 404 errors silently
      return originalFetch(resource, options).catch(error => {
        if (error.message && error.message.includes('Failed to fetch')) {
          // Return an empty response instead of throwing an error
          return new Response('', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      });
    }
    
    // For all other requests, use the original fetch
    return originalFetch(resource, options);
  };
  
  console.log('HMR error handler initialized');
})();
