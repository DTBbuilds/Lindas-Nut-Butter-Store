/**
 * Inventory Routes
 * 
 * API endpoints for inventory management
 */

const express = require('express');
const router = express.Router();
const { Product, InventoryLog } = require('../models');
const inventoryManager = require('../utils/inventoryManager');

/**
 * Get inventory status for all products
 * GET /api/inventory/status
 * Query params: category, belowThreshold, outOfStock
 */
router.get('/status', async (req, res) => {
  try {
    const { category, belowThreshold, outOfStock } = req.query;
    
    // Get inventory status with optional filters
    const inventoryStatus = await inventoryManager.getInventoryStatus({
      category,
      belowThreshold: belowThreshold === 'true',
      outOfStock: outOfStock === 'true'
    });
    
    return res.status(200).json({
      success: true,
      data: inventoryStatus
    });
  } catch (error) {
    console.error('Error getting inventory status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get inventory status',
      error: error.message
    });
  }
});

/**
 * Get inventory history for a specific product
 * GET /api/inventory/history/:productId
 * Query params: limit, skip
 */
router.get('/history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    // Get inventory history for the product
    const history = await inventoryManager.getInventoryHistory(productId, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error(`Error getting inventory history for product ${req.params.productId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get inventory history',
      error: error.message
    });
  }
});

/**
 * Update product inventory
 * POST /api/inventory/update
 */
router.post('/update', async (req, res) => {
  try {
    const { 
      productId, 
      changeAmount, 
      changeType, 
      notes, 
      createdBy 
    } = req.body;
    
    // Validate required fields
    if (!productId || changeAmount === undefined || !changeType) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, change amount, and change type are required'
      });
    }
    
    // Update inventory through inventory manager
    const result = await inventoryManager.updateInventory(
      productId,
      parseInt(changeAmount),
      changeType,
      null, // No reference ID for manual updates
      null, // No reference model for manual updates
      notes || '',
      createdBy || 'admin'
    );
    
    return res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        product: {
          id: result.product._id,
          name: result.product.name,
          sku: result.product.sku,
          newQuantity: result.product.stockQuantity
        },
        log: result.log
      }
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
});

/**
 * Add a new product
 * POST /api/inventory/products
 */
router.post('/products', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      images,
      category,
      stockQuantity,
      lowStockThreshold,
      sku,
      isActive
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, category, and SKU are required'
      });
    }
    
    // Check if product with same SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }
    
    // Create new product
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      images: images || [],
      category,
      stockQuantity: parseInt(stockQuantity || 0),
      lowStockThreshold: parseInt(lowStockThreshold || 5),
      sku,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Create inventory log entry for initial stock
    if (stockQuantity && stockQuantity > 0) {
      await InventoryLog.create({
        product: product._id,
        previousQuantity: 0,
        newQuantity: parseInt(stockQuantity),
        changeAmount: parseInt(stockQuantity),
        changeType: 'ADJUSTMENT',
        notes: 'Initial inventory',
        createdBy: 'admin',
        timestamp: new Date()
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

/**
 * Update a product
 * PUT /api/inventory/products/:id
 */
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if we need to log inventory change
    const oldStockQuantity = product.stockQuantity;
    const newStockQuantity = updateData.stockQuantity !== undefined 
      ? parseInt(updateData.stockQuantity) 
      : oldStockQuantity;
    
    // Update product fields
    Object.keys(updateData).forEach(key => {
      if (key === 'price') {
        product[key] = parseFloat(updateData[key]);
      } else if (key === 'stockQuantity' || key === 'lowStockThreshold') {
        product[key] = parseInt(updateData[key]);
      } else {
        product[key] = updateData[key];
      }
    });
    
    // Save updated product
    await product.save();
    
    // Create inventory log if quantity changed
    if (newStockQuantity !== oldStockQuantity) {
      await InventoryLog.create({
        product: product._id,
        previousQuantity: oldStockQuantity,
        newQuantity: newStockQuantity,
        changeAmount: newStockQuantity - oldStockQuantity,
        changeType: 'ADJUSTMENT',
        notes: updateData.notes || 'Inventory adjustment',
        createdBy: updateData.createdBy || 'admin',
        timestamp: new Date()
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error(`Error updating product ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

/**
 * Get all products or filtered products
 * GET /api/inventory/products
 * Query params: category, search, isActive
 */
router.get('/products', async (req, res) => {
  try {
    const { category, search, isActive, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Count total matching products
    const total = await Product.countDocuments(query);
    
    // Get paginated products
    const products = await Product.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message
    });
  }
});

/**
 * Get a product by ID
 * GET /api/inventory/products/:id
 */
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error(`Error getting product ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message
    });
  }
});

module.exports = router;
