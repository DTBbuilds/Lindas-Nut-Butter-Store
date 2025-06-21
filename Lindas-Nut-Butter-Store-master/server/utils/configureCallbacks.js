/**
 * M-Pesa Callback URLs Configuration Utility
 * This script helps set up and validate callback URLs for production
 */
require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 * @param {string} question 
 * @returns {Promise<string>}
 */
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

/**
 * Check if a URL is valid and accessible
 * @param {string} url 
 * @param {string} name 
 * @returns {Promise<boolean>}
 */
async function validateUrl(url, name) {
  console.log(`🔍 Validating ${name}: ${url}`);
  
  if (!url.startsWith('http')) {
    console.log(`❌ ${name} must start with http:// or https://`);
    return false;
  }
  
  if (url.includes('localhost') || url.includes('ngrok')) {
    console.log(`⚠️ ${name} contains localhost or ngrok, which won't work in production`);
  }
  
  try {
    // Just check if the domain resolves, don't actually make a request
    const domain = new URL(url).hostname;
    console.log(`🌐 Checking if domain ${domain} is valid...`);
    
    // Try to resolve the domain
    const dnsPromise = new Promise((resolve, reject) => {
      const dns = require('dns');
      dns.lookup(domain, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    
    const ip = await dnsPromise;
    console.log(`✅ Domain ${domain} resolved to ${ip}`);
    return true;
  } catch (error) {
    console.log(`❌ Error validating URL: ${error.message}`);
    return false;
  }
}

/**
 * Update environment file with new callback URLs
 * @param {string} callbackUrl 
 * @param {string} validationUrl 
 * @param {string} confirmationUrl 
 */
function updateEnvFile(callbackUrl, validationUrl, confirmationUrl) {
  const envFile = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '..', '..', '.env.production')
    : path.join(__dirname, '..', '..', '.env');
  
  if (!fs.existsSync(envFile)) {
    console.log(`❌ ${envFile} does not exist. Creating it now.`);
    fs.writeFileSync(envFile, '# M-Pesa Configuration\n');
  }
  
  let content = fs.readFileSync(envFile, 'utf8');
  
  // Update or add callback URLs
  const updateEnvVar = (name, value) => {
    const regex = new RegExp(`^${name}=.*$`, 'm');
    if (content.match(regex)) {
      content = content.replace(regex, `${name}=${value}`);
    } else {
      content += `\n${name}=${value}`;
    }
  };
  
  updateEnvVar('CALLBACK_URL', callbackUrl);
  updateEnvVar('VALIDATION_URL', validationUrl);
  updateEnvVar('CONFIRMATION_URL', confirmationUrl);
  
  // Write back to file
  fs.writeFileSync(envFile, content);
  console.log(`✅ Updated ${envFile} with new callback URLs`);
}

/**
 * Register callbacks with Safaricom
 * This is a placeholder - actual implementation depends on Safaricom's API for registering callbacks
 */
async function registerWithSafaricom(callbackUrl, validationUrl, confirmationUrl) {
  console.log('\n🔄 Simulating registration with Safaricom...');
  console.log('Note: In a real production environment, you may need to:');
  console.log('1. Log into your Safaricom developer portal');
  console.log('2. Update your application settings with these URLs');
  console.log('3. Or use Safaricom\'s API to register these URLs');
  
  // This is where you would make the API call to Safaricom to register the callbacks
  // For now, we'll just simulate it
  console.log('\n✅ Callback URLs ready for registration with Safaricom');
  console.log(`Callback URL: ${callbackUrl}`);
  console.log(`Validation URL: ${validationUrl}`);
  console.log(`Confirmation URL: ${confirmationUrl}`);
}

/**
 * Main function to configure callbacks
 */
async function configureCallbacks() {
  console.log('🔗 M-Pesa Callback URLs Configuration');
  console.log('=====================================');
  
  console.log('\nCurrent callback URLs:');
  console.log(`Callback URL: ${config.mpesa.callbackUrl}`);
  console.log(`Validation URL: ${config.mpesa.validationUrl}`);
  console.log(`Confirmation URL: ${config.mpesa.confirmationUrl}`);
  
  const useExisting = await prompt('\nDo you want to use these existing URLs? (y/n): ');
  
  let callbackUrl, validationUrl, confirmationUrl;
  
  if (useExisting.toLowerCase() === 'y') {
    callbackUrl = config.mpesa.callbackUrl;
    validationUrl = config.mpesa.validationUrl;
    confirmationUrl = config.mpesa.confirmationUrl;
  } else {
    const domainBase = await prompt('\nEnter your production domain (e.g., https://www.lindas-nut-butter.com): ');
    
    callbackUrl = `${domainBase}/api/mpesa/callback`;
    validationUrl = `${domainBase}/api/mpesa/validation`;
    confirmationUrl = `${domainBase}/api/mpesa/confirmation`;
    
    console.log('\nGenerated URLs:');
    console.log(`Callback URL: ${callbackUrl}`);
    console.log(`Validation URL: ${validationUrl}`);
    console.log(`Confirmation URL: ${confirmationUrl}`);
    
    const customize = await prompt('\nDo you want to customize these URLs? (y/n): ');
    
    if (customize.toLowerCase() === 'y') {
      callbackUrl = await prompt(`Enter callback URL [${callbackUrl}]: `) || callbackUrl;
      validationUrl = await prompt(`Enter validation URL [${validationUrl}]: `) || validationUrl;
      confirmationUrl = await prompt(`Enter confirmation URL [${confirmationUrl}]: `) || confirmationUrl;
    }
  }
  
  // Validate URLs
  const callbackValid = await validateUrl(callbackUrl, 'Callback URL');
  const validationValid = await validateUrl(validationUrl, 'Validation URL');
  const confirmationValid = await validateUrl(confirmationUrl, 'Confirmation URL');
  
  if (callbackValid && validationValid && confirmationValid) {
    console.log('\n✅ All URLs are valid');
    
    const saveToEnv = await prompt('\nDo you want to save these URLs to your environment file? (y/n): ');
    
    if (saveToEnv.toLowerCase() === 'y') {
      updateEnvFile(callbackUrl, validationUrl, confirmationUrl);
    }
    
    const registerUrls = await prompt('\nDo you want to simulate registering these URLs with Safaricom? (y/n): ');
    
    if (registerUrls.toLowerCase() === 'y') {
      await registerWithSafaricom(callbackUrl, validationUrl, confirmationUrl);
    }
    
    console.log('\n🎉 Callback URLs configuration completed successfully!');
  } else {
    console.log('\n❌ Some URLs are invalid. Please fix them and try again.');
  }
  
  rl.close();
}

// Run the configuration
configureCallbacks();
