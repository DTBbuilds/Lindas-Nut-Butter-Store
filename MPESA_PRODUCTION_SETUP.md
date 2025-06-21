# M-Pesa Production Integration Guide

This guide will help you set up M-Pesa integration in a production environment for Linda's Nut Butter Store.

## 1. Register for Safaricom Developer Account

1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account if you don't have one
3. Log in to your account

## 2. Create a Production App

1. Navigate to "My Apps" in the developer portal
2. Click "Add a New App"
3. Fill in the required details:
   - App Name: "Linda's Nut Butter Store"
   - Product: Select "M-Pesa"
   - Business Short Code: Enter your business paybill number
   - App Description: Brief description of your application
4. Click "Create App"

## 3. Get Production Credentials

After your app is approved for production:

1. Go to "My Apps" and select your app
2. Navigate to the "Keys" tab
3. Note down your:
   - Consumer Key
   - Consumer Secret
   - Production Endpoint URLs

## 4. Register Your Callback URLs

1. Go to "My Apps" and select your app
2. Navigate to the "Webhooks" tab
3. Register the following URLs:
   - Confirmation URL: `https://your-domain.com/api/mpesa/confirmation`
   - Validation URL: `https://your-domain.com/api/mpesa/validation`
   - Callback URL: `https://your-domain.com/api/mpesa/callback`
4. Make sure your server is publicly accessible and these endpoints are working

## 5. Update Your Environment Variables

Update your `.env.production` file with the production credentials:

```
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PAYBILL_NUMBER=your_production_paybill_number
MPESA_TILL_NUMBER=your_production_till_number
MPESA_ACCOUNT_NUMBER=your_production_account_number
MPESA_PASSKEY=your_production_passkey
MPESA_INITIATOR_NAME=your_production_initiator_name
MPESA_SECURITY_CREDENTIAL=your_production_security_credential

CALLBACK_URL=https://your-domain.com/api/mpesa/callback
VALIDATION_URL=https://your-domain.com/api/mpesa/validation
CONFIRMATION_URL=https://your-domain.com/api/mpesa/confirmation
```

## 6. Generate Security Credential

For B2B and B2C transactions, you need to generate a security credential:

1. Get your organization certificate from Safaricom
2. Use the certificate to encrypt your initiator password
3. Use the encrypted password as your security credential

## 7. Test Production Integration

Before going live, test your integration with real transactions:

1. Make a small test payment (e.g., KES 10)
2. Verify that callbacks are being received
3. Check that payment confirmations are working
4. Verify that the transaction is recorded in your database

## 8. Go Live Checklist

Before going fully live, ensure:

- [ ] All M-Pesa API endpoints are working
- [ ] Callbacks are being received and processed
- [ ] Error handling is robust
- [ ] Transactions are being recorded in your database
- [ ] Payment confirmations are being sent to customers
- [ ] Your server has proper SSL/TLS configuration
- [ ] Your server is stable and can handle the expected load

## 9. Monitoring and Troubleshooting

1. **Monitor Transactions**:
   - Set up logging for all M-Pesa API calls
   - Log all callbacks received
   - Track success and failure rates

2. **Common Issues**:
   - Callback URLs not accessible (check firewall settings)
   - Invalid credentials (verify your consumer key and secret)
   - Timeout errors (check your server performance)
   - Transaction failures (check the response codes)

3. **Safaricom Support**:
   - For production issues, contact Safaricom support
   - Have your app details and transaction IDs ready

## 10. Security Best Practices

1. **Never hardcode credentials** in your application code
2. **Use HTTPS** for all API calls and callbacks
3. **Validate all incoming requests** from M-Pesa
4. **Implement rate limiting** to prevent abuse
5. **Regularly rotate your credentials**
6. **Monitor for unusual transaction patterns**
7. **Keep your API keys secure** and never share them

By following these steps, you'll have a secure and reliable M-Pesa integration in your production environment.
