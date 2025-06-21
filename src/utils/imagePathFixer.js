/**
 * Image Path Fixer
 * 
 * This utility helps handle and fix problematic image paths in the frontend
 * It maps problematic image paths to their correct versions
 * and ensures all product images are correctly referenced
 */

// Map of problematic image paths to their fixed versions
const imagePathMappings = {
  // Comprehensive mappings for all 18 products
  // Almond Butters
  '/images/almond-butter-creamy.jpg': '/images/almond-butter.jpg',
  '/images/almond-butter-crunchy.jpg': '/images/plain-almond.jpg',
  '/images/crunchy-almond-butter.jpg': '/images/plain-almond.jpg',
  '/images/almond-butter-chocolate.jpg': '/images/chocolate-almond-butter.jpg',
  '/images/chocolate-almond.jpg': '/images/chocolate-almond-butter.jpg',
  '/images/almond-butter-chocolate-orange.jpg': '/images/chocolate-orange-almond.jpg',
  
  // Cashew Butters
  '/images/cashew-butter-plain.jpg': '/images/cashew-butter.jpg',
  '/images/plain-cashew.jpg': '/images/cashew-butter.jpg',
  '/images/cashew-butter-spicy.jpg': '/images/chilli-choco-cashew.jpg',
  '/images/spicy-cashew.jpg': '/images/chilli-choco-cashew.jpg',
  '/images/cashew-butter-chocolate.jpg': '/images/chocolate-cashew-butter.jpg',
  '/images/chocolate-cashew.jpg': '/images/chocolate-cashew-butter.jpg',
  '/images/cashew-butter-chocolate-orange.jpg': '/images/chocolate-orange-cashew.jpg',
  '/images/cashew-butter-coconut.jpg': '/images/coconut-cashew-butter.jpg',
  '/images/coconut-cashew.jpg': '/images/coconut-cashew-butter.jpg',
  
  // Hazelnut Butter
  '/images/hazelnut-butter-chocolate.jpg': '/images/chocolate-hazelnut-butter.jpg',
  '/images/chocolate-hazelnut.jpg': '/images/chocolate-hazelnut-butter.jpg',
  
  // Macadamia Butters
  '/images/macadamia-butter-plain.jpg': '/images/macadamia-butter.jpg',
  '/images/macadamia-butter-chocolate.jpg': '/images/chocolate-macadamia-butter.jpg',
  '/images/chocolate-macadamia.jpg': '/images/chocolate-macadamia-butter.jpg',
  
  // Peanut Butters
  '/images/peanut-butter-creamy.jpg': '/images/creamy-peanut-butter.jpg',
  '/images/peanut-butter-crunchy.jpg': '/images/crunchy-peanut-butter.jpg',
  '/images/peanut-butter-chocolate.jpg': '/images/chocolate-peanut-butter.jpg',
  '/images/chocolate-peanut.jpg': '/images/chocolate-peanut-butter.jpg',
  '/images/peanut-butter-chocolate-mint.jpg': '/images/mint-chocolate-peanut.jpg',
  '/images/chocolate-mint-peanut.jpg': '/images/mint-chocolate-peanut.jpg',
  
  // Seed Butter
  '/images/seed-butter-pumpkin.jpg': '/images/pumpkin-seed-butter.jpg',
  '/images/pumpkin-seed.jpg': '/images/pumpkin-seed-butter.jpg',
  
  // Honey
  '/images/honey-pure.jpg': '/images/pure-honey.jpg',
  
  // Paths with URL encoding
  '/images/crunchy%20Peanut%20butter.jpg': '/images/crunchy-peanut-butter.jpg',
  '/images/Pure%20Honey.jpg': '/images/pure-honey.jpg',
  '/images/Plain%20Almond.jpg': '/images/almond-butter.jpg',
  '/images/plain%20cashew.jpg': '/images/cashew-butter.jpg',
  
  // Paths with literal spaces
  '/images/crunchy Peanut butter.jpg': '/images/crunchy-peanut-butter.jpg',
  '/images/Pure Honey.jpg': '/images/pure-honey.jpg',
  '/images/Plain Almond.jpg': '/images/almond-butter.jpg',
  '/images/plain cashew.jpg': '/images/cashew-butter.jpg',
  
  // Fix incorrect image references
  '/images/chocolate hezelnut.jpg': '/images/chocolate-hazelnut-butter.jpg',
  '/images/chocolate-hezelnut.jpg': '/images/chocolate-hazelnut-butter.jpg',
  '/images/chilli-choco-cashew-.jpg': '/images/chilli-choco-cashew.jpg',
  
  // Standardize naming for similar products
  '/images/chocolate-almond.jpg': '/images/chocolate-almond-butter.jpg',
  '/images/chocolate-cashew.jpg': '/images/chocolate-cashew-butter.jpg',
  '/images/chocolate-macadamia.jpg': '/images/chocolate-macadamia-butter.jpg',
  '/images/chocolate-peanut.jpg': '/images/chocolate-peanut-butter.jpg',
  '/images/plain-almond.jpg': '/images/almond-butter.jpg',
  '/images/plain-cashew.jpg': '/images/cashew-butter.jpg'
};

const fixedPathsCache = new Map();

/**
 * Utility function to fix image paths
 * Handles both relative and absolute paths with fallbacks
 */
export const fixImagePath = (path) => {
  if (!path || typeof path !== 'string') {
    return '/images/placeholder.png'; // Return a default placeholder for invalid paths
  }

  // The image paths in the database are now correct and relative (e.g., /images/foo.jpg).
  // The React development server will serve these correctly from the `public` folder.
  // We just need to ensure the path is returned as is.
  // No need to prepend the API URL.

  // Check if the path is already a full URL (e.g., from an external source)
  if (path.startsWith('http')) {
    return path;
  }

  // Ensure the path starts with a forward slash for consistency
  if (!path.startsWith('/')) {
    return `/${path}`;
  }

  return path;
};

/**
 * Verify if an image exists in the public directory
 * This is a client-side function that attempts to load the image
 * @param {string} imagePath - The image path to verify
 * @returns {Promise<boolean>} - Promise resolving to true if image exists, false otherwise
 */
export const verifyImageExists = (imagePath) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imagePath;
  });
};

export default fixImagePath;
