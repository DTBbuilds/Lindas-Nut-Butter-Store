/**
 * Environment Setup Script for Linda's Nut Butter Store
 * 
 * This script assists with setting up the proper environment configuration
 * for the M-Pesa integration in both development and production modes.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { updateCallbackUrls } = require('./utils/darajaApi');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Environment templates
const envTemplates = {
  development: `# Linda's Nut Butter Store - Development Environment
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/lindas-nut-butter-store-store-store-store

# M-Pesa API Configuration (Sandbox)
MPESA_CONSUMER_KEY=YOUR_SANDBOX_CONSUMER_KEY
MPESA_CONSUMER_SECRET=YOUR_SANDBOX_CONSUMER_SECRET
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_PAYBILL_NUMBER=247247
MPESA_ACCOUNT_NUMBER=0725317864
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=Safaricom999!*!

# URLs
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
NGROK_URL=

# Email Configuration (for payment confirmations)
SEND_EMAILS=false
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@example.com
# EMAIL_PASS=your_email_password
# EMAIL_FROM=noreply@linda-nut-butter.com
`,
  production: `# Linda's Nut Butter Store - Production Environment
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/lindas-nut-butter-store-store-store-store

# M-Pesa API Configuration (Production)
MPESA_CONSUMER_KEY=YOUR_PRODUCTION_CONSUMER_KEY
MPESA_CONSUMER_SECRET=YOUR_PRODUCTION_CONSUMER_SECRET
MPESA_PASSKEY=YOUR_PRODUCTION_PASSKEY
MPESA_PAYBILL_NUMBER=247247
MPESA_ACCOUNT_NUMBER=0725317864
MPESA_INITIATOR_NAME=lindanut
MPESA_SECURITY_CREDENTIAL=YOUR_PRODUCTION_SECURITY_CREDENTIAL

# URLs
BASE_URL=https://api.linda-nut-butter.com
FRONTEND_URL=https://linda-nut-butter.com
PRODUCTION_BASE_URL=https://api.linda-nut-butter.com

# Email Configuration (for payment confirmations)
SEND_EMAILS=true
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@linda-nut-butter.com
`
};

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const hasExistingEnv = fs.existsSync(envPath);

// Create or update .env file
const setupEnvironment = (mode) => {
  if (mode !== 'development' && mode !== 'production') {
    console.error('Invalid environment mode. Must be "development" or "production".');
    process.exit(1);
  }
  
  try {
    const template = envTemplates[mode];
    fs.writeFileSync(envPath, template);
    console.log(`\n✅ Successfully created .env file for ${mode} environment!`);
    
    // If in development mode and ngrok is needed, prompt for ngrok URL
    if (mode === 'development') {
      rl.question('\nDo you want to use ngrok for webhook testing? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          rl.question('Enter your ngrok URL (e.g., https://abc123.ngrok.io): ', (ngrokUrl) => {
            if (ngrokUrl) {
              const envContent = fs.readFileSync(envPath, 'utf8');
              const updatedContent = envContent.replace('NGROK_URL=', `NGROK_URL=${ngrokUrl}`);
              fs.writeFileSync(envPath, updatedContent);
              console.log('✅ Updated .env file with ngrok URL');
              
              // Update callback URLs based on ngrok URL
              updateCallbackUrls(ngrokUrl);
              console.log('✅ Updated M-Pesa callback URLs to use ngrok');
              
              console.log('\n🚀 Your environment is ready for testing with ngrok!');
              console.log('\nReminder: When using ngrok, make sure to:');
              console.log('1. Keep the ngrok tunnel running while testing');
              console.log('2. Update the .env file with a new URL if you restart ngrok');
              rl.close();
            } else {
              console.log('❌ No ngrok URL provided. You can update the .env file manually later.');
              rl.close();
            }
          });
        } else {
          console.log('\n✅ Environment setup complete! No ngrok configuration needed.');
          rl.close();
        }
      });
    } else {
      console.log('\n🚀 Production environment setup complete!');
      console.log('\nImportant: Before deploying to production:');
      console.log('1. Update the .env file with your actual production credentials');
      console.log('2. Make sure your MongoDB setup is properly secured');
      console.log('3. Ensure all callback URLs are correctly configured with your production domain');
      rl.close();
    }
  } catch (error) {
    console.error('Error creating environment file:', error);
    process.exit(1);
  }
};

// Main script
console.log('🥜 Linda\'s Nut Butter Store - Environment Setup 🥜');
console.log('=================================================');

if (hasExistingEnv) {
  console.log('⚠️ An existing .env file was found!');
  rl.question('Do you want to overwrite it? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      rl.question('Which environment do you want to set up? (development/production): ', (mode) => {
        setupEnvironment(mode.toLowerCase());
      });
    } else {
      console.log('Operation cancelled. Existing .env file was not modified.');
      rl.close();
    }
  });
} else {
  rl.question('Which environment do you want to set up? (development/production): ', (mode) => {
    setupEnvironment(mode.toLowerCase());
  });
}
