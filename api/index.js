// Vercel API handler for serverless deployment
const app = require('../server/vercel-server');

// Export the Express app as a serverless function
module.exports = app;
