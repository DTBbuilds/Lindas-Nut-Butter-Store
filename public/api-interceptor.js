/**
 * API Interceptor for Linda's Nut Butter Store
 * This script forcefully redirects all localhost API calls to the production URL
 */

(function() {
  // Get current hostname to avoid CORS issues
  const currentHostname = window.location.origin;
  // Production URL - use current hostname to avoid CORS issues
  const PRODUCTION_URL = currentHostname;
  
  // Store original XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  
  // Override XMLHttpRequest to intercept localhost calls
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    
    // Override the open method
    xhr.open = function(method, url, async, user, password) {
      // Check if this is a localhost API call
      if (typeof url === 'string' && url.includes('localhost:5000')) {
        // Replace with production URL
        const newUrl = url.replace('http://localhost:5000', PRODUCTION_URL);
        console.log(`[XHR Redirect] ${url} → ${newUrl}`);
        return originalOpen.call(this, method, newUrl, async, user, password);
      }
      
      return originalOpen.call(this, method, url, async, user, password);
    };
    
    return xhr;
  };
  
  console.log('[API Interceptor] Successfully initialized');
})();
