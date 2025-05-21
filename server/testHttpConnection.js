/**
 * Basic HTTP connectivity test for Safaricom Daraja API
 * This script tests if we can reach the Safaricom API endpoints
 */
const axios = require('axios');
const https = require('https');

console.log(`
🌟 ===================================================== 🌟
     SAFARICOM DARAJA API HTTP CONNECTIVITY TEST
🌟 ===================================================== 🌟
`);

// Create an axios instance with extended timeout and SSL configuration
const testAxios = axios.create({
  timeout: 30000, // 30 seconds
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
  })
});

/**
 * Test basic HTTP connectivity to various endpoints
 */
async function testHttpConnectivity() {
  // List of URLs to test
  const urlsToTest = [
    {
      name: 'Safaricom Daraja API Base URL',
      url: 'https://sandbox.safaricom.co.ke'
    },
    {
      name: 'Safaricom Daraja API OAuth Endpoint',
      url: 'https://sandbox.safaricom.co.ke/oauth/v1/generate'
    },
    {
      name: 'Safaricom Daraja API STK Push Endpoint',
      url: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    },
    {
      name: 'Google (Control Test)',
      url: 'https://www.google.com'
    }
  ];
  
  console.log('Testing HTTP connectivity to various endpoints...\n');
  
  for (const endpoint of urlsToTest) {
    console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
    
    try {
      // We're just testing if we can reach the endpoint, not if the API call succeeds
      // So we use HEAD request which only checks if the endpoint exists
      const startTime = Date.now();
      const response = await testAxios.head(endpoint.url);
      const endTime = Date.now();
      
      console.log('✅ SUCCESS!');
      console.log(`Status: ${response.status}`);
      console.log(`Response time: ${endTime - startTime}ms`);
      // Don't print all headers as they can be too verbose
      console.log('Headers received successfully');
      console.log('-----------------------------------------\n');
    } catch (error) {
      if (error.response) {
        // Even a 404 or other error status means we can reach the endpoint
        console.log('✅ REACHABLE (with error response)');
        console.log(`Status: ${error.response.status}`);
        console.log(`Error: ${error.message}\n`);
      } else {
        console.error('❌ FAILED: Cannot reach endpoint');
        console.error(`Error: ${error.message}\n`);
      }
    }
  }
}

// Run the test
testHttpConnectivity();
