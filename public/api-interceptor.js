/**
 * API Interceptor for Linda's Nut Butter Store
 * This script forcefully redirects all localhost API calls to the production URL
 */

(function() {
  // Production URL - must match the latest Vercel deployment
  const PRODUCTION_URL = 'https://lindas-nut-butter-6jdk8jepi-dtbbuilds-projects.vercel.app';
  
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
