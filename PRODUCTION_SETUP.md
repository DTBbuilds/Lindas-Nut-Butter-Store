# Production Setup Guide for Linda's Nut Butter Store

This guide provides instructions for setting up the Linda's Nut Butter Store application in a production environment.

## MongoDB Atlas Configuration

The application has been configured to use MongoDB Atlas as the database in production. The connection string is already set up in the `server/config.js` file:

```javascript
mongodb: {
  uri: process.env.MONGO_URI || 
    (process.env.NODE_ENV === 'production'
      ? 'mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0'
      : 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store-store')
}
```

### MongoDB Atlas Connection Details

- **Connection String**: `mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0`
- **Database Name**: `lindas-nut-butter`
- **Username**: `dtbbuilds`

### Security Considerations

For better security in a production environment, it's recommended to:

1. Use environment variables instead of hardcoding the connection string
2. Create a `.env.production` file with the following content:

```
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Configuration
MONGO_URI=mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0

# Production URLs
PRODUCTION_BASE_URL=https://your-production-domain.com/api
PRODUCTION_FRONTEND_URL=https://your-production-domain.com

# M-Pesa API Configuration (Production)
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PAYBILL_NUMBER=your_production_paybill_number
MPESA_TILL_NUMBER=your_production_till_number
MPESA_ACCOUNT_NUMBER=your_production_account_number
MPESA_PASSKEY=your_production_passkey
MPESA_INITIATOR_NAME=your_production_initiator_name
MPESA_SECURITY_CREDENTIAL=your_production_security_credential

# M-Pesa Callback URLs (Production)
CALLBACK_URL=https://your-production-domain.com/api/mpesa/callback
VALIDATION_URL=https://your-production-domain.com/api/mpesa/validation
CONFIRMATION_URL=https://your-production-domain.com/api/mpesa/confirmation

# Email Configuration (Production)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="Linda's Nut Butter <noreply@linda-nut-butter.com>"
```

## Data Migration

A data migration script has been created to help migrate data from your local MongoDB to MongoDB Atlas. Run the script with:

```bash
node migrate-to-atlas.js
```

This script will:
1. Connect to both your local MongoDB and MongoDB Atlas
2. Retrieve all documents from each collection in your local database
3. Insert those documents into the corresponding collections in MongoDB Atlas
4. Provide a summary of the migration results

## Running in Production Mode

To run the application in production mode using MongoDB Atlas:

```bash
# Windows PowerShell
$env:NODE_ENV="production"; node server/index.js

# Windows Command Prompt
set NODE_ENV=production && node server/index.js

# Linux/Mac
NODE_ENV=production node server/index.js
```

## Deployment Scripts

The application includes several deployment scripts in the `package.json` file:

```json
"scripts": {
  "build": "react-scripts build",
  "server:prod": "NODE_ENV=production node server/index.js",
  "build:deploy": "npm run build && npm run server:prod",
  "deploy": "node deploy.js",
  "deploy:prepare": "npm install --no-dev && npm run build",
  "deploy:production": "NODE_ENV=production node server/index.js",
  "deploy:digital-ocean": "npm run deploy && npm run deploy:prepare"
}
```

Use these scripts to build and deploy the application to your production server.

## Additional Resources

For more detailed information on setting up specific components, refer to:
- [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)
- [M-Pesa Production Setup](./MPESA_PRODUCTION_SETUP.md)
