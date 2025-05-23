// Production deployment script with MongoDB Atlas integration
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://dtbbuilds:dtbbuilds2025@cluster0.qnwgmty.mongodb.net/lindas-nut-butter?retryWrites=true&w=majority&appName=Cluster0';

// Production environment variables
const productionEnv = `
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas Configuration
MONGO_URI=${ATLAS_URI}

# M-Pesa API Configuration
# Replace these with your actual Safaricom production credentials
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PAYBILL_NUMBER=your_production_paybill_number
MPESA_TILL_NUMBER=your_production_till_number
MPESA_ACCOUNT_NUMBER=your_production_account_number
MPESA_PASSKEY=your_production_passkey
MPESA_INITIATOR_NAME=your_production_initiator_name
MPESA_SECURITY_CREDENTIAL=your_production_security_credential

# M-Pesa Callback URLs
CALLBACK_URL=https://your-production-domain.com/api/mpesa/callback
VALIDATION_URL=https://your-production-domain.com/api/mpesa/validation
CONFIRMATION_URL=https://your-production-domain.com/api/mpesa/confirmation

# Production URLs
PRODUCTION_BASE_URL=https://your-production-domain.com/api
PRODUCTION_FRONTEND_URL=https://your-production-domain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM="Linda's Nut Butter <your_email@gmail.com>"
`;

// Log with timestamps
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: chalk.blue('INFO'),
    success: chalk.green('SUCCESS'),
    error: chalk.red('ERROR'),
    warning: chalk.yellow('WARNING')
  }[type];
  
  console.log(`[${timestamp}] ${prefix}: ${message}`);
}

// Execute command and log output
function execute(command, cwd = __dirname) {
  try {
    log(`Executing: ${command}`);
    const output = execSync(command, { 
      cwd, 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    log(output.trim());
    return true;
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error');
    if (error.stdout) log(`Output: ${error.stdout}`);
    if (error.stderr) log(`Error: ${error.stderr}`, 'error');
    return false;
  }
}

// Create production environment file
function createProductionEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.production');
    fs.writeFileSync(envPath, productionEnv.trim());
    log(`Created .env.production file`, 'success');
    return true;
  } catch (error) {
    log(`Failed to create .env.production file: ${error.message}`, 'error');
    return false;
  }
}

// Main deployment function
async function deploy() {
  log('Starting deployment with MongoDB Atlas integration');
  
  // 1. Create production environment file
  if (!createProductionEnvFile()) {
    log('Failed to create production environment file. Deployment aborted.', 'error');
    return;
  }
  
  // 2. Install production dependencies
  log('Installing production dependencies...');
  if (!execute('npm install --production')) {
    log('Failed to install dependencies. Deployment aborted.', 'error');
    return;
  }
  
  // 3. Build React frontend
  log('Building React frontend...');
  if (!execute('npm run build')) {
    log('Failed to build React frontend. Deployment aborted.', 'error');
    return;
  }
  
  // 4. Test MongoDB Atlas connection
  log('Testing MongoDB Atlas connection...');
  try {
    const testScript = `
    const mongoose = require('mongoose');
    
    mongoose.connect('${ATLAS_URI}', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log('MongoDB Atlas connection successful!');
      mongoose.disconnect();
    })
    .catch(err => {
      console.error('MongoDB Atlas connection error:', err);
      process.exit(1);
    });
    `;
    
    fs.writeFileSync('test-atlas-connection-temp.js', testScript);
    execute('node test-atlas-connection-temp.js');
    fs.unlinkSync('test-atlas-connection-temp.js');
  } catch (error) {
    log(`MongoDB Atlas connection test failed: ${error.message}`, 'error');
    log('Deployment will continue, but please check your MongoDB Atlas configuration.', 'warning');
  }
  
  // 5. Update configurations for production
  log('Application is ready for production deployment!', 'success');
  log(`
=========== DEPLOYMENT INSTRUCTIONS ===========
1. Copy the entire application folder to your production server
2. Make sure Node.js (v14+) is installed on your server
3. On your server, navigate to the application directory
4. Run the following commands:
   - npm install --production
   - NODE_ENV=production node server/index.js
   
   For Windows servers:
   - npm install --production
   - set NODE_ENV=production && node server/index.js
   
5. Your application will be running with MongoDB Atlas integration

For PM2 deployment (recommended for production):
   - npm install -g pm2
   - pm2 start ecosystem.config.js --env production
   
The application will use MongoDB Atlas as the database in production.
===============================================
  `, 'info');
}

// Run the deployment
deploy().catch(error => {
  log(`Deployment failed: ${error.message}`, 'error');
});
