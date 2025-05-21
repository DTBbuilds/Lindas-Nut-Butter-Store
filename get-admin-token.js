const axios = require('axios');

const API_URL = 'http://localhost:5000';
const email = 'dtbinfotech@gmail.com';
const password = 'dtbinfo@2025';

async function getAdminToken() {
  try {
    console.log(`Attempting to login as ${email}...`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      console.log('Login successful!');
      console.log(`Your admin token is: ${response.data.token}`);
      console.log('\nTo use this token with the product import script, run:');
      console.log(`ADMIN_TOKEN=${response.data.token} node add-products.js`);
      
      // Save token to a file for convenience
      const fs = require('fs');
      fs.writeFileSync('admin-token.txt', response.data.token);
      console.log('\nToken has also been saved to admin-token.txt');
    } else {
      console.error('Login failed:', response.data.message);
    }
  } catch (error) {
    console.error('Error logging in:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

getAdminToken();
