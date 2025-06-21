/**
 * Temporary Production Environment Setup
 * This script temporarily sets NODE_ENV to production for testing
 */

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

console.log('✅ Environment set to PRODUCTION mode');
console.log('✅ Using Equity paybill: 247247');
console.log('✅ Using account number: 0725317864');
console.log('⚠️ Remember to use a small amount (1 KES) for testing');

// Export the environment for other modules
module.exports = process.env;
