import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { fixImagePath } from '../utils/imagePathFixer';

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
      
      const queryParams = { ...defaultParams, ...params };
      
      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: queryParams,
        timeout: 10000 // 10 second timeout
      });
      
      // Handle different response formats
      const productsData = Array.isArray(response.data) ? response.data : 
        (response.data.data?.products || response.data.products || []);
      
      // Process and standardize all products
      return this.standardizeProducts(productsData);
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
    
    // Ensure images are properly formatted
    const processedImages = Array.isArray(product.images) && product.images.length > 0 ? 
      product.images.map(img => img.startsWith('http') ? img : fixImagePath(img)) : 
      ['/images/placeholder.png'];
    
    // Add a main image property if not already present
    const mainImage = product.image || (processedImages.length > 0 ? processedImages[0] : '/images/placeholder.png');
    
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
      image: mainImage.startsWith('http') ? mainImage : fixImagePath(mainImage),
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
