// server/utils/validateEnv.js

/**
 * Verifies that all critical environment variables are set.
 * If any are missing, it logs a fatal error and exits the process.
 */
function verifyEnvironmentVariables() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'ADMIN_JWT_SECRET',
    'CUSTOMER_JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'ADMIN_REFRESH_TOKEN_SECRET',
    'MONGO_URI',
    'MPESA_CONSUMER_KEY',
    'MPESA_CONSUMER_SECRET',
    'MPESA_PASSKEY',
    'SERVER_PORT', // Corrected from PORT to SERVER_PORT
    'PUBLIC_URL'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('❌ FATAL ERROR: Missing critical environment variables:');
    missingVars.forEach(v => console.error(`  - ${v}`));
    console.error('\nPlease ensure all required variables are set in your .env file before starting the server.');
    process.exit(1); // Exit with a failure code
  }

  console.log('✅ All critical environment variables are present.');
}

// Execute the verification
verifyEnvironmentVariables();
