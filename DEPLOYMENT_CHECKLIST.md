# Linda's Nut Butter Store - Production Deployment Checklist

Use this checklist to track your progress through the production deployment process.

## Local Preparation

- [ ] Update all environment variables in `.env.production`
- [ ] Test the application locally with production settings: `npm run test:production`
- [ ] Build the React frontend: `npm run build`
- [ ] Create a deployment package: `npm run deploy`
- [ ] Commit all changes to version control (excluding sensitive files)

## Server Setup

- [ ] Provision a server (Digital Ocean, AWS, etc.)
- [ ] Set up SSH access to your server
- [ ] Upload the `server-setup.sh` script to your server
- [ ] Make the script executable: `chmod +x server-setup.sh`
- [ ] Run the setup script: `sudo ./server-setup.sh`
- [ ] Follow the prompts to configure your server

## Database Setup

- [ ] Create a MongoDB Atlas account
- [ ] Set up a new cluster (follow `MONGODB_ATLAS_SETUP.md`)
- [ ] Create a database user with appropriate permissions
- [ ] Configure network access (whitelist your server IP)
- [ ] Get your MongoDB connection string
- [ ] Update your `.env` file with the connection string
- [ ] Test the database connection

## SSL Configuration

- [ ] Register a domain name if you don't have one
- [ ] Point your domain to your server's IP address
- [ ] Set up SSL certificates with Let's Encrypt
- [ ] Test HTTPS access to your domain

## M-Pesa Integration

- [ ] Register for a Safaricom Developer account
- [ ] Create a production app (follow `MPESA_PRODUCTION_SETUP.md`)
- [ ] Get your production credentials
- [ ] Register your callback URLs
- [ ] Update your `.env` file with M-Pesa credentials
- [ ] Test M-Pesa integration with a small transaction

## Application Deployment

- [ ] Upload your application files to the server
- [ ] Install production dependencies: `npm install --production`
- [ ] Start the application with PM2: `pm2 start ecosystem.config.js --env production`
- [ ] Set up PM2 to start on boot: `pm2 save && pm2 startup`
- [ ] Test the application in the browser

## Monitoring and Maintenance

- [ ] Set up log rotation
- [ ] Configure database backups
- [ ] Set up basic monitoring
- [ ] Create a maintenance plan

## Final Checks

- [ ] Test user registration and login
- [ ] Test product browsing and cart functionality
- [ ] Test checkout process with M-Pesa payment
- [ ] Test admin dashboard
- [ ] Test feedback submission and viewing
- [ ] Verify email notifications are working

## Post-Deployment

- [ ] Document your production setup
- [ ] Create backup and recovery procedures
- [ ] Set up a staging environment for future updates
- [ ] Create a deployment pipeline for continuous integration

## Notes

Use this section to track any issues or special configurations specific to your deployment:

```
- 
- 
- 
```
