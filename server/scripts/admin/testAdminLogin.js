/**
 * Test script for admin login
 * This will help diagnose the 500 Internal Server Error
 */

const axios = require('axios');

async function testAdminLogin() {
  console.log('Testing admin login with our created credentials...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
      email: 'btbbuildsadmin@gmail.com',
      password: 'dtbadmin2025'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login failed with error:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testAdminLogin();
