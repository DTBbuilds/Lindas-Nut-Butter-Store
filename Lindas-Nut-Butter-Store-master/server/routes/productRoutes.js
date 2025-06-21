/**
 * Product Routes
 * 
 * API endpoints for product management with inventory status and file uploads
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { Product } = require('../models');
const inventoryManager = require('../utils/inventoryManager');
const { authMiddleware, adminMiddleware } = require('../authMiddleware');
const rateLimit = require('express-rate-limit');
const { processProductImages } = require('../services/fileUploadService');

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to all product routes
router.use(apiLimiter);

// Fields to include in product listings
const PRODUCT_LIST_FIELDS = 'name description price category inventoryStatus images stockQuantity sku';
const PRODUCT_DETAIL_FIELDS = 'name description price category inventoryStatus images stockQuantity lowStockThreshold sku';

// Cache control middleware
const cacheControl = (req, res, next) => {
  // Cache for 5 minutes (300 seconds)
  res.set('Cache-Control', 'public, max-age=300');
  next();
};

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IN_STOCK, LOW_STOCK, OUT_OF_STOCK]
 *         description: Filter by inventory status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, description, or SKU
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 100
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: List of products with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', cacheControl, async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 12 } = req.query;
    
    // Build query with only active products
    const query = { isActive: true };
    
    // Add filters if provided
    if (category) query.category = category;
    if (status) query.inventoryStatus = status;
    
    // Add text search if provided
    if (search) {
      // Check if text index exists using a safer approach
      const hasTextIndex = Product.schema.indexes().some(idx => {
        try {
          // Check if this is a text index definition
          return JSON.stringify(idx[0]).includes('"$**":"text"') || 
                 (typeof idx[0] === 'object' && Object.values(idx[0]).some(v => v === 'text'));
        } catch (e) {
          return false;
        }
      });
      
      if (hasTextIndex) {
        query.$text = { $search: search };
      } else {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ];
      }
    }

    console.log('[DEBUG] MongoDB Product Query:', JSON.stringify(query, null, 2));
    
    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    
    // Execute count and find in parallel for better performance
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select(PRODUCT_LIST_FIELDS)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
        .exec()
    ]);

    console.log('[DEBUG] Products fetched from DB:', JSON.stringify(products, null, 2));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;
    
    // Set cache headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    
    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: totalPages,
          hasNextPage,
          hasPreviousPage
        }
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', cacheControl, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    const product = await Product.findById(id)
      .select(PRODUCT_DETAIL_FIELDS)
      .lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Set cache headers
    res.set('Cache-Control', 'public, max-age=300');
    
    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(`Error getting product ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/products/{id}/inventory:
 *   patch:
 *     summary: Update product inventory
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockQuantity:
 *                 type: number
 *                 description: New stock quantity
 *               changeAmount:
 *                 type: number
 *                 description: Amount to adjust inventory by (positive or negative)
 *               changeType:
 *                 type: string
 *                 enum: [PURCHASE, SALE, RETURN, ADJUSTMENT, RESTOCK]
 *               notes:
 *                 type: string
 *                 description: Optional notes about the inventory change
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.patch('/:id/inventory', authMiddleware, adminMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { id } = req.params;
    const { 
      stockQuantity, 
      lowStockThreshold, 
      notifyOnLowStock,
      changeAmount,
      changeType,
      notes
    } = req.body;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Validate at least one update parameter is provided
    if (stockQuantity === undefined && 
        lowStockThreshold === undefined && 
        notifyOnLowStock === undefined &&
        changeAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No inventory update parameters provided. Please provide at least one field to update.'
      });
    }
    
    // Validate change type if changeAmount is provided
    if (changeAmount !== undefined && !changeType) {
      return res.status(400).json({
        success: false,
        message: 'changeType is required when changeAmount is provided'
      });
    }
    
    // Start transaction
    session.startTransaction();
    
    // Find the product with session for transaction
    const product = await Product.findById(id).session(session);
    
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let updated = false;
    
    // Direct updates to inventory fields
    if (stockQuantity !== undefined) {
      // Direct stock quantity update
      const previousQuantity = product.stockQuantity;
      const newQuantity = parseInt(stockQuantity);
      
      // Validate stock quantity
      if (isNaN(newQuantity) || newQuantity < 0) {
        throw new Error('Invalid stock quantity');
      }
      
      product.stockQuantity = newQuantity;
      inventoryManager.updateInventoryStatus(product, newQuantity);
      updated = true;
      
      // Create inventory log entry
      await inventoryManager.updateInventory(
        id,
        newQuantity - previousQuantity,
        'ADJUSTMENT',
        null,
        null,
        notes || 'Direct stock update',
        'admin',
        { session }
      );
    } else if (changeAmount !== undefined && changeType) {
      // Incremental inventory update
      await inventoryManager.updateInventory(
        id,
        parseInt(changeAmount),
        changeType,
        null,
        null,
        notes || `${changeType} adjustment`,
        'admin',
        { session }
      );
      updated = true;
    }
    
    // Update threshold settings if provided
    if (lowStockThreshold !== undefined) {
      const newThreshold = parseInt(lowStockThreshold);
      if (isNaN(newThreshold) || newThreshold < 0) {
        throw new Error('Invalid low stock threshold');
      }
      product.lowStockThreshold = newThreshold;
      updated = true;
    }
    
    if (notifyOnLowStock !== undefined) {
      product.notifyOnLowStock = Boolean(notifyOnLowStock);
      updated = true;
    }
    
    // Save if any updates were made
    if (updated) {
      await product.save({ session });
    }
    
    // Commit the transaction
    await session.commitTransaction();
    
    // Invalidate cache for this product
    res.set('Cache-Control', 'no-cache');
    
    // Get the updated product with all fields
    const updatedProduct = await Product.findById(id).select(PRODUCT_DETAIL_FIELDS).lean();
    
    return res.status(200).json({
      success: true,
      message: 'Product inventory updated successfully',
      data: updatedProduct
    });
    
  } catch (error) {
    // If we're in a transaction, abort it
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    console.error(`Error updating product inventory ${req.params.id}:`, error);
    
    // Determine appropriate status code
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update product inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Always end the session
    await session.endSession();
  }
});

/**
 * Get inventory status statistics
 * GET /api/products/stats/inventory
 */
router.get('/stats/inventory', async (req, res) => {
  try {
    // Update all inventory statuses to ensure they're current
    const statusResults = await inventoryManager.updateAllInventoryStatuses();
    
    return res.status(200).json({
      success: true,
      data: statusResults
    });
  } catch (error) {
    console.error('Error getting inventory statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get inventory statistics',
      error: error.message
    });
  }
});

/**
 * Create a new product with initial inventory and image uploads
 * POST /api/products
 */
router.post('/', authMiddleware, adminMiddleware, processProductImages, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stockQuantity = 20,
      lowStockThreshold = 5,
      sku
    } = req.body;
    
    // Get uploaded image paths from the file upload middleware
    const images = req.uploadedImages || [];
    
    // Validate required fields
    if (!name || !description || !price || !category || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Missing required product information'
      });
    }
    
    // Check if product exists with same SKU or name
    const existingProduct = await Product.findOne({
      $or: [{ sku }, { name }]
    });
    
    if (existingProduct) {
      // Clean up uploaded images if product creation fails
      if (images.length > 0) {
        images.forEach(imagePath => {
          const fullPath = path.join(__dirname, '../public', imagePath);
          fs.unlink(fullPath, err => {
            if (err) console.error(`Failed to delete image: ${fullPath}`, err);
          });
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Product with same ${existingProduct.name === name ? 'name' : 'SKU'} already exists`
      });
    }
    
    // Determine initial inventory status
    let inventoryStatus = 'IN_STOCK';
    if (stockQuantity <= 0) {
      inventoryStatus = 'OUT_OF_STOCK';
    } else if (stockQuantity <= lowStockThreshold) {
      inventoryStatus = 'LOW_STOCK';
    }
    
    // Create new product
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      stockQuantity: parseInt(stockQuantity),
      lowStockThreshold: parseInt(lowStockThreshold),
      inventoryStatus,
      sku,
      images
    });
    
    // Create initial inventory log entry
    if (stockQuantity > 0) {
      await inventoryManager.updateInventory(
        product._id,
        parseInt(stockQuantity),
        'ADJUSTMENT',
        null,
        null,
        'Initial inventory',
        'admin'
      );
    }
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Clean up uploaded images if product creation fails
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      req.uploadedImages.forEach(imagePath => {
        const fullPath = path.join(__dirname, '../public', imagePath);
        fs.unlink(fullPath, err => {
          if (err) console.error(`Failed to delete image: ${fullPath}`, err);
        });
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

/**
 * Delete a product by ID and its associated images
 * DELETE /api/products/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the product to find its images
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Delete any associated images
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        try {
          const fullPath = path.join(__dirname, '../public', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted product image: ${fullPath}`);
          }
        } catch (err) {
          console.error(`Failed to delete image: ${imagePath}`, err);
          // Continue with deletion even if image deletion fails
        }
      });
    }
    
    // Now delete the product
    await Product.findByIdAndDelete(id);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product', 
      error: error.message 
    });
  }
});

/**
 * Upload product images - separate endpoint for adding images to existing products
 * POST /api/products/:id/images
 */
router.post('/:id/images', authMiddleware, adminMiddleware, processProductImages, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the product exists
    const product = await Product.findById(id);
    if (!product) {
      // Clean up uploaded images if product doesn't exist
      if (req.uploadedImages && req.uploadedImages.length > 0) {
        req.uploadedImages.forEach(imagePath => {
          const fullPath = path.join(__dirname, '../public', imagePath);
          fs.unlink(fullPath, err => {
            if (err) console.error(`Failed to delete image: ${fullPath}`, err);
          });
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // If no images were uploaded, return an error
    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }
    
    // Add new images to the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $push: { images: { $each: req.uploadedImages } } },
      { new: true } // Return the updated document
    );
    
    return res.status(200).json({
      success: true,
      message: `${req.uploadedImages.length} image(s) added successfully`,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error uploading product images:', error);
    
    // Clean up uploaded images if there's an error
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      req.uploadedImages.forEach(imagePath => {
        const fullPath = path.join(__dirname, '../public', imagePath);
        fs.unlink(fullPath, err => {
          if (err) console.error(`Failed to delete image: ${fullPath}`, err);
        });
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to upload product images',
      error: error.message
    });
  }
});

/**
 * Delete a specific image from a product
 * DELETE /api/products/:id/images/:imageIndex
 */
router.delete('/:id/images/:imageIndex', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const index = parseInt(imageIndex);
    
    // Validate the index
    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }
    
    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if the image exists
    if (!product.images || !product.images[index]) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Get the image path
    const imagePath = product.images[index];
    
    // Remove the image from the array
    product.images.splice(index, 1);
    await product.save();
    
    // Delete the image file
    try {
      const fullPath = path.join(__dirname, '../public', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted product image: ${fullPath}`);
      }
    } catch (err) {
      console.error(`Failed to delete image file: ${imagePath}`, err);
      // Continue even if file deletion fails
    }
    
    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Error deleting product image:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product image',
      error: error.message
    });
  }
});

const { updateProduct, deleteProduct, createProductReview } = require('../controllers/productController');
router.route('/:id').put(updateProduct);
router.route('/:id').delete(deleteProduct);

router.route('/:id/reviews').post(authMiddleware, createProductReview);

module.exports = router;
