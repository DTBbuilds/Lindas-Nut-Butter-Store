# Linda's Nut Butter Store - Deployment Guide

This guide provides step-by-step instructions for deploying Linda's Nut Butter Store to a production environment. Follow these instructions carefully to ensure a successful deployment.

## Prerequisites

Before deploying, ensure you have:

1. A Digital Ocean account (or another hosting provider)
2. MongoDB Atlas account for database hosting
3. Safaricom M-Pesa production credentials
4. A domain name (optional but recommended)
5. Node.js v14+ and npm installed on your local machine

## Preparation Steps

### 1. Install Deployment Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env.production`
2. Update all placeholders in `.env.production` with your actual production values:
   - MongoDB Atlas connection string
   - M-Pesa production credentials
   - Production domain URLs
   - Email configuration
   - JWT secret

### 3. Build the Deployment Package

```bash
npm run deploy
```

This will:
- Build the React frontend
- Package server files
- Create a production-ready structure in the `dist` directory

## Deployment Options

### Option 1: Digital Ocean App Platform

1. Create a new app on Digital Ocean App Platform
2. Connect your GitHub repository or upload the `dist` directory
3. Configure environment variables from your `.env.production` file
4. Deploy the application

### Option 2: Digital Ocean Droplet

1. Create a new Ubuntu droplet
2. SSH into your droplet
3. Install Node.js and npm
4. Upload the `dist` directory to your droplet
5. Install PM2 for process management: `npm install -g pm2`
6. Start the application: `pm2 start server/index.js --name lindas-nut-butter`
7. Configure Nginx as a reverse proxy

### Option 3: Other Hosting Providers

The application can be deployed to any hosting provider that supports Node.js applications. The `Procfile` is included for platforms like Heroku.

## M-Pesa Production Configuration

After deployment, you'll need to:

1. Register your production callback URLs with Safaricom
   - Update the callback URLs in your M-Pesa dashboard to point to your production domain
   - Example: `https://your-domain.com/api/mpesa/callback`

2. Test the M-Pesa integration in production
   - Make a small test purchase
   - Verify that callbacks are being received
   - Check that payment confirmations are working

## Database Configuration

1. Create a MongoDB Atlas cluster
2. Configure network access to allow connections from your hosting provider
3. Create a database user with appropriate permissions
4. Update your `.env.production` file with the connection string

## SSL Configuration

For payment security, SSL is required:

1. If using Digital Ocean App Platform, SSL is provided automatically
2. If using a Droplet, install Certbot for Let's Encrypt certificates:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Post-Deployment Checklist

After deployment, verify:

- [ ] Frontend loads correctly
- [ ] User registration and login work
- [ ] Products display correctly
- [ ] Shopping cart functionality works
- [ ] Checkout process completes successfully
- [ ] M-Pesa payments are processed correctly
- [ ] Admin dashboard is accessible
- [ ] Feedback submission works
- [ ] Email notifications are sent

## Monitoring and Maintenance

1. Set up monitoring using Digital Ocean's built-in monitoring or a service like New Relic
2. Configure regular database backups
3. Set up error logging with a service like Sentry

## Troubleshooting

If you encounter issues:

1. Check application logs
2. Verify environment variables are set correctly
3. Ensure MongoDB connection is working
4. Check M-Pesa callback URLs are registered correctly
5. Verify SSL certificates are valid

## Support

For additional support, contact the development team.
