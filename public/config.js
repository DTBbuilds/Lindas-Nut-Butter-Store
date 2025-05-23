// Runtime configuration for Linda's Nut Butter Store
(function() {
  // Get current hostname to avoid CORS issues
  const currentHostname = window.location.origin;
  // Define our production URLs - use current hostname to avoid CORS issues
  const PRODUCTION_API_URL = currentHostname;
  
  // Set environment variables available to the app
  window.ENV = {
    API_URL: PRODUCTION_API_URL,
    BASE_URL: PRODUCTION_API_URL,
    IS_PRODUCTION: true
  };
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to intercept localhost calls
  window.fetch = function(url, options) {
    // Check if this is a localhost API call
    if (typeof url === 'string' && url.includes('localhost:5000')) {
      // Replace with production URL
      const newUrl = url.replace('http://localhost:5000', PRODUCTION_API_URL);
      console.log(`[API Redirect] ${url} → ${newUrl}`);
      return originalFetch(newUrl, options);
    }
    
    // Regular fetch for all other requests
    return originalFetch(url, options);
  };
  
  // Override axios base URL if it exists
  if (window.axios) {
    window.axios.defaults.baseURL = PRODUCTION_API_URL + '/api';
  }
  
  console.log('[Config] Runtime configuration loaded successfully');
})();
