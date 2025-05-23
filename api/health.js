// Health check endpoint for Vercel deployment
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return health status
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    deployment: 'vercel',
    environment: process.env.NODE_ENV || 'production',
    apiVersion: '1.0.0'
  });
};
