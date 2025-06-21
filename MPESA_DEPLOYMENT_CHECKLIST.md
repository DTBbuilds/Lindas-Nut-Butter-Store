# M-Pesa Integration Production Deployment Checklist

This checklist ensures that your Linda's Nut Butter Store M-Pesa integration is secure and ready for production deployment.

## 1. Environment Variables Setup

- [ ] Create a `.env` file based on the `.env.example` template
- [ ] Set all M-Pesa production credentials in environment variables:
  - [ ] `MPESA_CONSUMER_KEY` - Your production consumer key from Safaricom
  - [ ] `MPESA_CONSUMER_SECRET` - Your production consumer secret
  - [ ] `MPESA_PAYBILL_NUMBER` - Your business paybill number
  - [ ] `MPESA_TILL_NUMBER` - Your business till number (if applicable)
  - [ ] `MPESA_ACCOUNT_NUMBER` - Your business account number
  - [ ] `MPESA_PASSKEY` - Your production passkey
  - [ ] `MPESA_INITIATOR_NAME` - Production initiator name (for B2B/B2C)
  - [ ] `MPESA_SECURITY_CREDENTIAL` - Production security credential

## 2. Callback URLs Configuration

- [ ] Update callback URLs to use your production domain:
  - [ ] `CALLBACK_URL=https://your-domain.com/api/mpesa/callback`
  - [ ] `VALIDATION_URL=https://your-domain.com/api/mpesa/validation`
  - [ ] `CONFIRMATION_URL=https://your-domain.com/api/mpesa/confirmation`
- [ ] Ensure your production server has these routes properly configured
- [ ] Verify the callbacks are accessible from the internet (not behind a firewall)

## 3. Security Measures

- [ ] **CRITICAL**: Remove all hardcoded credentials from the codebase
- [ ] Implement HTTPS for all production endpoints
- [ ] Add rate limiting to prevent abuse of payment endpoints
- [ ] Implement IP whitelisting for Safaricom callback URLs if possible
- [ ] Review server logs to ensure sensitive data is properly masked
- [ ] Ensure all transactions are recorded in the database with proper encryption for sensitive fields

## 4. Testing in Production

- [ ] Perform an initial small-amount test transaction with your production credentials
- [ ] Verify the transaction is correctly recorded in your database
- [ ] Verify callbacks are correctly received and processed
- [ ] Test the error handling for various scenarios
- [ ] Monitor server logs for any unexpected behavior

## 5. Monitoring and Logging

- [ ] Set up alerts for failed payment attempts
- [ ] Implement monitoring for callback endpoint availability
- [ ] Create a dashboard for transaction statistics
- [ ] Configure log rotation and storage for M-Pesa transaction logs
- [ ] Set up error tracking and notifications for critical payment failures

## 6. Backup and Recovery

- [ ] Implement regular database backups
- [ ] Create a recovery plan for failed transactions
- [ ] Document procedures for handling payment reconciliation issues
- [ ] Have a fallback payment method in case M-Pesa service is unavailable

## 7. Documentation

- [ ] Document the M-Pesa integration for developers
- [ ] Create user-facing payment instructions
- [ ] Document troubleshooting procedures for common issues
- [ ] Record contact information for Safaricom support

## 8. Go-Live Procedures

- [ ] Conduct a final security review
- [ ] Update the Node.js environment to production (`NODE_ENV=production`)
- [ ] Perform a phased rollout if possible
- [ ] Monitor initial transactions closely
- [ ] Have a rollback plan in case of major issues

---

## Appendix: M-Pesa API Error Codes

Common error codes and their meanings:

- `400.002.02`: Invalid Request - Check timestamp format, callback URL, or phone number
- `401.002.01`: Invalid Access Token
- `403.001.01`: Access Denied - API Key doesn't match allowed applications
- `404.001.01`: API resource endpoint not found
- `405.001.01`: Method not allowed
- `409.001.01`: Conflict - Transaction already in process
- `500.001.01`: Internal Server Error
- `500.002.01`: Service unavailable - Try again later
- `503.001.01`: Service unavailable - Try again later
