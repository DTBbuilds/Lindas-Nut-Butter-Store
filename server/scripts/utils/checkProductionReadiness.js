/**
 * M-Pesa Production Readiness Checker
 * This script validates that your environment is correctly set up for production
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

console.log('🔍 Checking M-Pesa Production Readiness');
console.log('======================================');

// Create results object
const results = {
  environmentVariables: { status: 'pending', issues: [] },
  callbackUrls: { status: 'pending', issues: [] },
  security: { status: 'pending', issues: [] },
  deployment: { status: 'pending', issues: [] }
};

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n📋 Checking Environment Variables...');
  
  const requiredVars = [
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_PAYBILL_NUMBER',
    'MPESA_PASSKEY',
    'CALLBACK_URL',
    'VALIDATION_URL',
    'CONFIRMATION_URL'
  ];
  
  const productionVars = [
    'NODE_ENV'
  ];
  
  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      results.environmentVariables.issues.push(`Missing ${varName} environment variable`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }
  
  // Check production specific variables
  for (const varName of productionVars) {
    if (process.env[varName] !== 'production') {
      results.environmentVariables.issues.push(`${varName} is not set to 'production'`);
      console.log(`⚠️ ${varName} is set to '${process.env[varName]}' instead of 'production'`);
    } else {
      console.log(`✅ ${varName} is set to 'production'`);
    }
  }
  
  // Check config values
  if (!config.mpesa.baseUrl.includes('api.safaricom.co.ke')) {
    results.environmentVariables.issues.push('M-Pesa base URL is not set to production URL');
    console.log(`⚠️ M-Pesa base URL is set to ${config.mpesa.baseUrl} instead of https://api.safaricom.co.ke`);
  } else {
    console.log(`✅ M-Pesa base URL is set to production`);
  }
  
  // Update status
  results.environmentVariables.status = results.environmentVariables.issues.length === 0 ? 'pass' : 'fail';
}

// Check callback URLs
async function checkCallbackUrls() {
  console.log('\n🔗 Checking Callback URLs...');
  
  const urls = [
    { name: 'Callback URL', url: config.mpesa.callbackUrl },
    { name: 'Validation URL', url: config.mpesa.validationUrl },
    { name: 'Confirmation URL', url: config.mpesa.confirmationUrl }
  ];
  
  // Check URL format
  for (const { name, url } of urls) {
    if (!url.startsWith('https://')) {
      results.callbackUrls.issues.push(`${name} does not use HTTPS`);
      console.log(`❌ ${name} (${url}) does not use HTTPS`);
    } else if (url.includes('localhost') || url.includes('ngrok')) {
      results.callbackUrls.issues.push(`${name} appears to be a development URL`);
      console.log(`❌ ${name} (${url}) appears to be a development URL`);
    } else {
      console.log(`✅ ${name} format looks good: ${url}`);
    }
  }
  
  // Update status
  results.callbackUrls.status = results.callbackUrls.issues.length === 0 ? 'pass' : 'fail';
}

// Check security measures
function checkSecurity() {
  console.log('\n🔒 Checking Security Measures...');
  
  // Check for hardcoded credentials in config.js
  const configPath = path.join(__dirname, 'config.js');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const sensitivePatterns = [
    { pattern: /consumerKey:.*?['"](.*?)['"]/, name: 'Consumer Key' },
    { pattern: /consumerSecret:.*?['"](.*?)['"]/, name: 'Consumer Secret' },
    { pattern: /passkey:.*?['"](.*?)['"]/, name: 'Passkey' }
  ];
  
  for (const { pattern, name } of sensitivePatterns) {
    const match = configContent.match(pattern);
    if (match && match[1] && match[1].length > 10 && !match[1].includes('process.env')) {
      results.security.issues.push(`Possible hardcoded ${name} in config.js`);
      console.log(`❌ Possible hardcoded ${name} in config.js`);
    }
  }
  
  // Check HTTPS for callbacks
  if (!config.mpesa.callbackUrl.startsWith('https://')) {
    results.security.issues.push('Callback URL is not using HTTPS');
  }
  
  // Check .env.example doesn't contain real credentials
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    
    for (const { pattern, name } of sensitivePatterns) {
      const match = envExampleContent.match(pattern);
      if (match && match[1] && match[1].length > 10 && !match[1].includes('your_')) {
        results.security.issues.push(`Possible real ${name} in .env.example`);
        console.log(`❌ Possible real ${name} in .env.example`);
      }
    }
  }
  
  // Check .gitignore contains .env
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      results.security.issues.push('.env is not included in .gitignore');
      console.log(`❌ .env is not included in .gitignore`);
    } else {
      console.log(`✅ .env is properly included in .gitignore`);
    }
  }
  
  if (results.security.issues.length === 0) {
    console.log(`✅ No security issues detected`);
  }
  
  // Update status
  results.security.status = results.security.issues.length === 0 ? 'pass' : 'fail';
}

// Check deployment settings
function checkDeployment() {
  console.log('\n🚀 Checking Deployment Settings...');
  
  // Check for production npm scripts
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    
    if (!packageJson.scripts || !packageJson.scripts.start) {
      results.deployment.issues.push('Missing start script in package.json');
      console.log(`❌ Missing start script in package.json`);
    } else {
      console.log(`✅ Start script found in package.json`);
    }
    
    // Look for production-specific scripts
    const hasProductionScript = Object.keys(packageJson.scripts || {}).some(
      script => script.includes('prod') || script.includes('production')
    );
    
    if (!hasProductionScript) {
      console.log(`⚠️ No production-specific scripts found in package.json`);
    } else {
      console.log(`✅ Production scripts found in package.json`);
    }
  }
  
  // Check for error logging in production
  const hasErrorHandling = fs.existsSync(path.join(__dirname, 'utils', 'mpesaLogger.js')) &&
                           fs.existsSync(path.join(__dirname, 'utils', 'mpesaErrorHandler.js'));
  
  if (!hasErrorHandling) {
    results.deployment.issues.push('Missing error handling utilities');
    console.log(`❌ Missing error handling utilities`);
  } else {
    console.log(`✅ Error handling utilities found`);
  }
  
  if (results.deployment.issues.length === 0) {
    console.log(`✅ Deployment settings look good`);
  }
  
  // Update status
  results.deployment.status = results.deployment.issues.length === 0 ? 'pass' : 'fail';
}

// Run all checks
async function runChecks() {
  try {
    checkEnvironmentVariables();
    await checkCallbackUrls();
    checkSecurity();
    checkDeployment();
    
    // Print summary
    console.log('\n📊 Production Readiness Summary');
    console.log('============================');
    
    for (const [category, result] of Object.entries(results)) {
      const icon = result.status === 'pass' ? '✅' : '❌';
      console.log(`${icon} ${category}: ${result.status.toUpperCase()}`);
      
      if (result.issues.length > 0) {
        console.log('   Issues:');
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    }
    
    // Overall assessment
    const allPassed = Object.values(results).every(result => result.status === 'pass');
    if (allPassed) {
      console.log('\n🎉 All checks passed! Your M-Pesa integration is ready for production.');
    } else {
      console.log('\n⚠️ Some checks failed. Please address the issues before deploying to production.');
    }
  } catch (error) {
    console.error('Error running checks:', error);
  }
}

// Run the checks
runChecks();
