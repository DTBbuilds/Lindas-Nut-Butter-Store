# Linda's Nut Butter Store - Production Deployment Checklist

This document provides a comprehensive checklist for deploying the M-Pesa integration to production.

## Prerequisites

- [ ] Production Daraja API credentials from Safaricom
- [ ] Production M-Pesa Paybill number (currently set to 247247 for testing)
- [ ] Valid SSL certificate for your production domain (required for M-Pesa API integration)
- [ ] MongoDB production database (properly secured with authentication)
- [ ] SMTP server credentials for email notifications

## Environment Setup

- [ ] Run the environment setup script: `node server/setupEnv.js` and select "production"
- [ ] Update the `.env` file with your actual production credentials:
  - [ ] `MPESA_CONSUMER_KEY` (from Safaricom Daraja portal)
  - [ ] `MPESA_CONSUMER_SECRET` (from Safaricom Daraja portal)
  - [ ] `MPESA_PASSKEY` (from Safaricom Daraja portal)
  - [ ] `MPESA_PAYBILL_NUMBER` (your business paybill number)
  - [ ] `MPESA_ACCOUNT_NUMBER` (your business account number)
  - [ ] `MONGO_URI` (production MongoDB connection string with auth)
  - [ ] `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` (SMTP credentials)

## Security Checklist

- [ ] Ensure `.env` file is excluded from version control (check `.gitignore`)
- [ ] Set appropriate rate limits on API endpoints
- [ ] Implement proper CORS configuration for production
- [ ] Validate all user inputs on backend
- [ ] Use HTTPS for all API communication
- [ ] Implement proper authentication for admin endpoints
- [ ] Store production keys securely

## M-Pesa API Integration

- [ ] Register production callback URLs in Safaricom Daraja portal:
  - [ ] `https://your-domain.com/api/mpesa/callback` (STK Push)
  - [ ] `https://your-domain.com/api/mpesa/validation` (C2B validation)
  - [ ] `https://your-domain.com/api/mpesa/confirmation` (C2B confirmation)
- [ ] Test integration with actual M-Pesa credentials in Safaricom sandbox
- [ ] Perform end-to-end transaction flow testing
- [ ] Verify callback handling works correctly
- [ ] Ensure transaction timeout and error handling work as expected

## Database Configuration

- [ ] Configure proper MongoDB indexes for performance
- [ ] Set up regular database backups
- [ ] Implement database connection pooling
- [ ] Add proper error handling for database operations

## Monitoring and Logging

- [ ] Implement proper logging for production (consider using Winston or similar)
- [ ] Set up transaction monitoring
- [ ] Configure error alerting (email or SMS notifications)
- [ ] Monitor API rate limits and quotas
- [ ] Set up uptime monitoring

## Performance Optimization

- [ ] Enable compression for API responses
- [ ] Optimize database queries
- [ ] Implement caching where appropriate
- [ ] Configure connection pooling

## Deployment Steps

1. Create production environment file:
   ```bash
   node server/setupEnv.js
   # Choose "production" when prompted
   ```

2. Update environment variables with real production values

3. Build and start in production mode:
   ```bash
   npm run build:deploy
   ```

4. Monitor server logs for any issues:
   ```bash
   pm2 logs # If using PM2 for process management
   ```

5. Verify all callbacks are working properly:
   - Make a test purchase
   - Confirm webhooks are received
   - Check transaction status updates

## Troubleshooting Production Issues

### Common Issues:

1. **Callback URL not receiving notifications:**
   - Verify URL is registered correctly in Safaricom portal
   - Ensure server is accessible from outside (no firewall blocking)
   - Check SSL certificate is valid

2. **Transaction timeout issues:**
   - Check network latency between your server and Safaricom API
   - Ensure your server's clock is synchronized (NTP)
   - Verify timeout values are set appropriately

3. **Authentication failures:**
   - Confirm API credentials are correct
   - Check if token expiration is handled properly
   - Verify security credential format

4. **Database connection issues:**
   - Check MongoDB connection string
   - Verify network access to database
   - Ensure proper authentication credentials

## Contact and Support

- **M-Pesa API Support:** api.support@safaricom.co.ke
- **MongoDB Support:** support@mongodb.com

---

*This checklist was last updated on 2025-05-11*
