import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { fixImagePath } from '../utils/imagePathFixer';

/**
 * Generate a seed based on the current date
 * This ensures randomization is consistent within a single day
 * but changes daily for a fresh experience
 * @returns {number} A numeric seed
 */
const generateDailySeed = () => {
  const now = new Date();
  // Use year, month, and day to create a daily seed
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
};

/**
 * Shuffle an array using a seeded random number generator
 * Fisher-Yates algorithm with seeded randomization
 * @param {Array} array - The array to shuffle
 * @param {number} [seed] - Optional seed for the random number generator
 * @returns {Array} A new shuffled array
 */
const seededShuffle = (array, seed = generateDailySeed()) => {
  // Create a copy to avoid mutating the original
  const result = [...array];
  let currentSeed = seed;
  
  // Simple seeded random function
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  // Fisher-Yates shuffle with seeded random
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
};

/**
 * Standardized product fetching service
 * Handles consistent processing of product data from the API
 */
class ProductService {
  /**
   * Fetch all products with optional filtering
   * @param {Object} params - Query parameters for filtering/sorting
   * @returns {Promise<Array>} - Standardized product objects
   */
  async fetchProducts(params = {}) {
    try {
      const defaultParams = {
        limit: 100,
        sort: 'name'
      };
      
      // Extract randomize flag and remove it from params to avoid API issues
      const { randomize, randomizeSeed, ...restParams } = params;
      const queryParams = { ...defaultParams, ...restParams };
      
      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: queryParams,
        timeout: 10000 // 10 second timeout
      });
      
      // Handle different response formats
      const productsData = Array.isArray(response.data) ? response.data : 
        (response.data.data?.products || response.data.products || []);
      
      // Process and standardize all products
      const standardizedProducts = this.standardizeProducts(productsData);
      
      // Randomize products if requested
      if (randomize) {
        return this.randomizeProducts(standardizedProducts, randomizeSeed);
      }
      
      return standardizedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }
  
  /**
   * Fetch a single product by ID
   * @param {String|Number} productId - The product ID
   * @returns {Promise<Object>} - Standardized product object
   */
  async fetchProductById(productId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      
      // Handle different response formats
      const productData = response.data.data || response.data;
      
      // Process and return a single standardized product
      return this.standardizeProduct(productData);
    } catch (error) {
      console.error(`Error fetching product with ID ${productId}:`, error);
      throw error;
    }
  }
  
  /**
   * Standardize a single product object from API to consistent format
   * @param {Object} product - Raw product data from API
   * @returns {Object} - Standardized product object
   */
  standardizeProduct(product) {
    if (!product) return null;
    
    // Ensure all images are properly formatted by running them through the fixer.
    const processedImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images.map(img => fixImagePath(img))
      : ['/images/placeholder.png'];

    // Add a main image property, ensuring it's also fixed.
    const mainImage = fixImagePath(product.image || (processedImages.length > 0 ? processedImages[0] : '/images/placeholder.png'));
    
    // Always ensure all required product fields exist with consistent types
    return {
      id: product._id || product.id || '',                        // String ID (MongoDB _id)
      numericId: typeof product.id === 'number' ? product.id :    // Numeric ID for database
        (parseInt(product.id, 10) || 0),
      name: product.name || 'Unnamed Product',
      description: product.description || '',
      price: Number(product.price) || 0,
      category: product.category || 'Uncategorized',
      images: processedImages,
      image: mainImage,
      inStock: product.inStock === false ? false : true,          // Default to true if not explicitly false
      stockQuantity: Number(product.stockQuantity) || 999,        // Default to high stock if not specified
      sku: product.sku || `SKU-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      variants: Array.isArray(product.variants) ? product.variants : [],
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString()
    };
  }
  
  /**
   * Standardize an array of product objects from API
   * @param {Array} products - Raw product data array from API
   * @returns {Array} - Standardized product objects
   */
  standardizeProducts(products) {
    if (!Array.isArray(products)) return [];
    return products.map(product => this.standardizeProduct(product));
  }
  
  /**
   * Randomize an array of products
   * @param {Array} products - Products to randomize
   * @param {boolean} [useTimeSeed=false] - Whether to use current timestamp as seed for true randomness
   * @returns {Array} - Randomized products array
   */
  randomizeProducts(products, useTimeSeed = false) {
    if (!Array.isArray(products) || products.length === 0) return [];
    
    // Generate seed - either based on daily seed or current timestamp
    const seed = useTimeSeed ? Date.now() : generateDailySeed();
    console.log(`Randomizing ${products.length} products with seed: ${seed}`);
    
    // Shuffle the products using our seeded shuffle function
    return seededShuffle(products, seed);
  }
  
  /**
   * Fetch products by category
   * @param {String} category - Category name
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} - Standardized product objects
   */
  async fetchProductsByCategory(category, params = {}) {
    return this.fetchProducts({ ...params, category });
  }
  
  /**
   * Fetch related products based on a given product's category
   * @param {String} category - Category to find related products for
   * @param {String|Number} excludeProductId - Product ID to exclude
   * @param {Number} limit - Maximum number of related products to return
   * @returns {Promise<Array>} - Standardized product objects
   */
  async fetchRelatedProducts(category, excludeProductId, limit = 4) {
    const products = await this.fetchProductsByCategory(category, { limit: limit + 1 });
    
    // Filter out the current product and limit the results
    return products
      .filter(product => 
        product.id !== excludeProductId && 
        product.numericId !== excludeProductId)
      .slice(0, limit);
  }
}

// Create singleton instance
const productService = new ProductService();
export default productService;
