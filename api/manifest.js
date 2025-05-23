// Vercel API route for serving manifest.json
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple manifest data
  const manifest = {
    "short_name": "NutButter",
    "name": "Linda's Nut Butter Store",
    "icons": [
      {
        "src": "/favicon.ico",
        "sizes": "64x64 32x32 24x24 16x16",
        "type": "image/x-icon"
      }
    ],
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#F5E8C7",
    "background_color": "#F5E8C7"
  };

  // Return manifest
  return res.status(200).json(manifest);
};
