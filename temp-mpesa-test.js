
      const axios = require('axios');
      
      async function testMpesaAuth() {
        try {
          const consumerKey = '<your_production_consumer_key>';
          const consumerSecret = '<your_production_consumer_secret>';
          
          const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
          
          const response = await axios.get(
            'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
              headers: {
                Authorization: `Basic ${auth}`
              }
            }
          );
          
          if (response.data && response.data.access_token) {
            console.log('M-Pesa API authentication successful');
            process.exit(0);
          } else {
            console.error('M-Pesa API authentication failed: No access token received');
            process.exit(1);
          }
        } catch (error) {
          console.error('M-Pesa API authentication failed:', error.message);
          process.exit(1);
        }
      }
      
      testMpesaAuth();
    