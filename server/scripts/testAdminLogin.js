/**
 * Script to test admin login API directly
 * Run with: node server/scripts/testAdminLogin.js
 */

const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    const response = await axios({
      method: 'post',
      url: 'http://localhost:5000/api/auth/admin/login',
      data: {
        email: 'admin@lindas.com',
        password: 'admin123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.response?.data || error.message);
  }
}

testAdminLogin();
