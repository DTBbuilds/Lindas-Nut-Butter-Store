const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../../server/models/Product');
const { AppError, catchAsync } = require('../utils/errorHandlers');

// Get all products
router.get('/', catchAsync(async (req, res) => {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      throw new AppError('Database not connected', 503, 'LINDA_DB_NOT_CONNECTED');
    }

    // Check if there are any products in the database
    let count;
    try {
      count = await Product.countDocuments();
    } catch (dbError) {
      console.error('Database count error:', dbError);
      throw new Error('Error checking product count');
    }
    
    // If no products exist, initialize with default products
    if (count === 0) {
      console.log('No products found, initializing default products...');
      try {
        await initializeDefaultProducts();
      } catch (initError) {
        console.error('Error initializing default products. Message:', initError.message);
        console.error('Stack trace for default product initialization error:', initError.stack);
        throw new Error('Failed to initialize products');
      }
    }

    const { 
      limit = 1000, 
      category, 
      minPrice, 
      maxPrice, 
      features, 
      sort = 'name:1' // Default sort by name ascending
    } = req.query;
    
    // Parse sort parameter
    let sortObject = { name: 1 }; // Default sort
    let sortField = null;
    let sortOrder = null;
    
    if (sort) {
      const sortParts = sort.split(':');
      sortField = sortParts[0] || 'name';
      sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
      
      // Create the sort object for MongoDB
      sortObject = {};
      sortObject[sortField] = sortOrder === 'desc' ? -1 : 1;
      
      console.log(`Sorting by ${sortField} in ${sortOrder} order`);
    }
    
    let query = {};
    
    // Apply filters if provided
    if (category) {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(Number(maxPrice))) query.price.$lte = Number(maxPrice);
    }
    
    if (features) {
      const featuresList = Array.isArray(features) ? features : [features];
      query.features = { $in: featuresList };
    }

    // Build query
    let productsQuery = Product.find(query)
      .select('id name description price images image secondaryImage category inStock inventoryStatus stockQuantity sku variants features rating reviews size')
      .limit(Math.min(Number(limit), 1000)) // Cap limit at 1000 for safety
      .sort(sortObject);
    
    // Apply sorting - always sort using the sortObject
    productsQuery = productsQuery.sort(sortObject);
    
    // Execute query
    const products = await productsQuery.lean();
    
    // Format products with consistent structure and ensure inStock is set
    const formattedProducts = (products || []).map(product => {
      // Log the raw product for debugging
      console.log('Raw product from database:', {
        id: product.id,
        _id: product._id?.toString(),
        name: product.name,
        inStock: product.inStock
      });
      
      // Ensure product.images is an array and has at least one image
      const images = Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : [];
      
      // If no images array but has image property, use that
      if (images.length === 0 && product.image) {
        images.push(product.image);
      }
      
      // Format image URLs
      const formattedImages = images.map(img => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `${process.env.BASE_URL || 'http://localhost:5000'}${img.startsWith('/') ? '' : '/'}${img}`;
      });
      
      // Format single image URLs too
      let mainImage = product.image || (images.length > 0 ? images[0] : '');
      if (mainImage && !mainImage.startsWith('http')) {
        mainImage = `${process.env.BASE_URL || 'http://localhost:5000'}${mainImage.startsWith('/') ? '' : '/'}${mainImage}`;
      }
      
      // Ensure inStock is explicitly set (default to true if not specified)
      const inStock = product.inStock === false ? false : true;
      
      // Get numeric ID, ensuring it's a number (required by database schema)
      const numericId = typeof product.id === 'number' ? product.id : Number(product.id) || 0;
      
      // Get string version of MongoDB _id
      const mongoId = product._id?.toString() || '';
      
      // Create a consistently structured product with all ID formats
      const formattedProduct = {
        ...product,
        _id: mongoId,                    // MongoDB ID as string
        id: numericId,                   // Numeric ID as used in database schema
        productId: String(numericId),    // String version of the numeric ID for frontend
        inStock: inStock,                // Explicitly set inStock
        images: formattedImages,
        image: mainImage,
        stockQuantity: product.stockQuantity || 999 // Ensure stock quantity is set
      };
      
      console.log('Formatted product for response:', {
        id: formattedProduct.id,
        _id: formattedProduct._id,
        productId: formattedProduct.productId,
        name: formattedProduct.name
      });
      
      return formattedProduct;
    });
    
    // Return products directly as the frontend expects an array
    // Note: Previously we tried to standardize with a wrapper, but the frontend expects a direct array
    res.json(formattedProducts);
    // Using catchAsync, no try-catch needed here
}));

// Helper function to initialize default products
async function initializeDefaultProducts() {
  console.log('--- ENTERING initializeDefaultProducts ---');
  // First, clear existing products to avoid duplicates
  await Product.deleteMany({});

  const defaultProductsData = [
    // Almond Butters (4 varieties)
    {
      id: 1,
      name: 'Almond Butter - Creamy',
      price: 1200, // Confirmed price
      image: '/images/almond-butter.jpg',
      secondaryImage: '/images/almond-butter.jpg',
      images: ['/images/almond-butter.jpg'],
      description: 'Our signature smooth almond butter made from premium organic almonds.',
      features: ['Organic', 'Vegan', 'Gluten-Free'],
      rating: 4.9,
      reviews: 128,
      inStock: true,
      size: '16oz',
      category: 'Almond',
      variants: [
        { mass: 370, price: 1200, stock: 30 } // Ensure variant price matches base price
      ]
    },
    {
      id: 2,
      name: 'Almond Butter - Crunchy',
      price: 1200, // Confirmed price
      image: '/images/plain-almond.jpg',
      secondaryImage: '/images/plain-almond.jpg',
      images: ['/images/plain-almond.jpg'],
      description: 'Crunchy almond pieces in our premium almond butter.',
      features: ['Crunchy', 'Organic', 'Vegan'],
      rating: 4.7,
      reviews: 98,
      inStock: true,
      size: '16oz',
      category: 'Almond',
      variants: [
        { mass: 370, price: 1200, stock: 24 }
      ]
    },
    {
      id: 3,
      name: 'Almond Butter - Chocolate',
      price: 1400, // Confirmed price
      image: '/images/chocolate-almond-butter.jpg',
      secondaryImage: '/images/chocolate-almond-butter.jpg',
      images: ['/images/chocolate-almond-butter.jpg'],
      description: 'Rich chocolate blended with our premium almond butter.',
      features: ['Chocolate', 'Organic', 'Vegan'],
      rating: 4.8,
      reviews: 95,
      inStock: true,
      size: '16oz',
      category: 'Almond',
      variants: [
        { mass: 370, price: 1400, stock: 33 } // Ensure variant price matches base price
      ]
    },
    {
      id: 4,
      name: 'Almond Butter - Chocolate Orange',
      price: 1400, // Confirmed price
      image: '/images/chocolate-orange-almond.jpg',
      secondaryImage: '/images/chocolate-orange-almond.jpg',
      images: ['/images/chocolate-orange-almond.jpg'],
      description: 'A delightful blend of orange-infused chocolate and creamy almond butter.',
      features: ['Chocolate', 'Orange', 'Vegan'],
      rating: 4.7,
      reviews: 65,
      inStock: true,
      size: '16oz',
      category: 'Almond',
      variants: [
        { mass: 370, price: 1400, stock: 22 } // Ensure variant price matches base price
      ]
    },
    
    // Cashew Butters (5 varieties)
    {
      id: 5,
      name: 'Cashew Butter - Plain',
      price: 900, // Confirmed price
      image: '/images/cashew-butter.jpg',
      secondaryImage: '/images/cashew-butter.jpg',
      images: ['/images/cashew-butter.jpg'],
      description: 'Premium cashew butter with a smooth, creamy texture.',
      features: ['Creamy', 'Organic', 'Vegan'],
      rating: 4.7,
      reviews: 82,
      inStock: true,
      size: '16oz',
      category: 'Cashew',
      variants: [
        { mass: 370, price: 900, stock: 33 } // Ensure variant price matches base price
      ]
    },
    {
      id: 6,
      name: 'Cashew Butter - Spicy Chili',
      price: 1050, // Confirmed price as Cashew Butter- Chilli
      image: '/images/chilli-choco-cashew.jpg',
      secondaryImage: '/images/chilli-choco-cashew.jpg',
      images: ['/images/chilli-choco-cashew.jpg'],
      description: 'A spicy twist on our classic cashew butter with chili pepper infusion.',
      features: ['Spicy', 'Savory', 'Vegan'],
      rating: 4.5,
      reviews: 62,
      inStock: true,
      size: '16oz',
      category: 'Cashew',
      variants: [
        { mass: 370, price: 1050, stock: 26 } // Ensure variant price matches base price
      ]
    },
    {
      id: 7,
      name: 'Cashew Butter - Chocolate',
      price: 1050, // Confirmed price
      image: '/images/chocolate-cashew.jpg',
      secondaryImage: '/images/chocolate-cashew.jpg',
      images: ['/images/chocolate-cashew.jpg'],
      description: 'Decadent chocolate blended with our premium cashew butter.',
      features: ['Chocolate', 'Creamy', 'Vegan'],
      rating: 4.8,
      reviews: 68,
      inStock: true,
      size: '16oz',
      category: 'Cashew',
      variants: [
        { mass: 370, price: 1050, stock: 27 } // Ensure variant price matches base price
      ]
    },
    {
      id: 8,
      name: 'Cashew Butter - Chocolate Orange',
      price: 1200, // Confirmed price
      image: '/images/chocolate-orange-cashew.jpg',
      secondaryImage: '/images/chocolate-orange-cashew.jpg',
      images: ['/images/chocolate-orange-cashew.jpg'],
      description: 'Vibrant orange and rich chocolate infused with creamy cashew butter.',
      features: ['Chocolate', 'Orange', 'Vegan'],
      rating: 4.6,
      reviews: 42,
      inStock: true,
      size: '16oz',
      category: 'Cashew',
      variants: [
        { mass: 370, price: 1200, stock: 20 } // Ensure variant price matches base price
      ]
    },
    {
      id: 9,
      name: 'Cashew Butter - Coconut',
      price: 1050, // Confirmed price
      image: '/images/coconut-cashew-butter.jpg',
      secondaryImage: '/images/coconut-cashew-butter.jpg',
      images: ['/images/coconut-cashew-butter.jpg'],
      description: 'Tropical blend of coconut and premium cashew butter.',
      features: ['Coconut', 'Creamy', 'Vegan'],
      rating: 4.7,
      reviews: 58,
      inStock: true,
      size: '16oz',
      category: 'Cashew',
      variants: [
        { mass: 370, price: 1050, stock: 24 } // Ensure variant price matches base price
      ]
    },
    
    // Hazelnut Butter (1 variety)
    {
      id: 10,
      name: 'Hazelnut Butter - Chocolate',
      price: 2600, // Confirmed price
      image: '/images/chocolate-hazelnut-butter.jpg',
      secondaryImage: '/images/chocolate-hezelnut.jpg',
      images: ['/images/chocolate-hazelnut-butter.jpg'],
      description: 'Luxurious chocolate hazelnut butter, smooth and indulgent.',
      features: ['Chocolate', 'Premium', 'Vegan'],
      rating: 4.9,
      reviews: 112,
      inStock: true,
      size: '12oz',
      category: 'Hazelnut',
      variants: [
        { mass: 370, price: 2600, stock: 18 } // Ensure variant price matches base price
      ]
    },
    
    // Macadamia Butter (2 varieties)
    {
      id: 11,
      name: 'Macadamia Butter - Plain',
      price: 1050, // Confirmed price as Macadamia Nut Butter
      image: '/images/macadamia-butter.jpg',
      secondaryImage: '/images/macadamia-butter.jpg',
      images: ['/images/macadamia-butter.jpg'],
      description: 'Luxurious and rare macadamia nut butter with a rich, buttery flavor.',
      features: ['Premium', 'Creamy', 'Vegan'],
      rating: 4.9,
      reviews: 36,
      inStock: true,
      size: '12oz',
      category: 'Macadamia',
      variants: [
        { mass: 370, price: 1050, stock: 13 } // Ensure variant price matches base price
      ]
    },
    {
      id: 12,
      name: 'Macadamia Butter - Chocolate',
      price: 1200, // Confirmed price
      image: '/images/chocolate-macadamia.jpg',
      secondaryImage: '/images/chocolate-macadamia.jpg',
      images: ['/images/chocolate-macadamia.jpg'],
      description: 'Smooth macadamia butter blended with premium chocolate.',
      features: ['Chocolate', 'Premium', 'Vegan'],
      rating: 4.8,
      reviews: 28,
      inStock: true,
      size: '12oz',
      category: 'Macadamia',
      variants: [
        { mass: 370, price: 1200, stock: 10 } // Ensure variant price matches base price
      ]
    },
    
    // Peanut Butter (4 varieties)
    {
      id: 13,
      name: 'Peanut Butter - Creamy',
      price: 500, // Confirmed price
      image: '/images/creamy-peanut-butter.jpg',
      secondaryImage: '/images/creamy-peanut-butter.jpg',
      images: ['/images/creamy-peanut-butter.jpg'],
      description: 'Smooth and creamy peanut butter that spreads easily.',
      features: ['Creamy', 'High Protein', 'Natural'],
      rating: 4.9,
      reviews: 148,
      inStock: true,
      size: '16oz',
      category: 'Peanut',
      variants: [
        { mass: 370, price: 500, stock: 40 } // Ensure variant price matches base price
      ]
    },
    {
      id: 14,
      name: 'Peanut Butter - Crunchy',
      price: 500, // Confirmed price
      image: '/images/crunchy-peanut-butter.jpg',
      secondaryImage: '/images/crunchy-peanut-butter.jpg',
      images: ['/images/crunchy-peanut-butter.jpg'],
      description: 'Classic crunchy peanut butter with delicious peanut chunks.',
      features: ['Crunchy', 'High Protein', 'Natural'],
      rating: 4.8,
      reviews: 112,
      inStock: true,
      size: '16oz',
      category: 'Peanut',
      variants: [
        { mass: 370, price: 500, stock: 35 } // Ensure variant price matches base price
      ]
    },
    {
      id: 15,
      name: 'Peanut Butter - Chocolate',
      price: 800, // Confirmed price
      image: '/images/chocolate-peanut-butter.jpg',
      secondaryImage: '/images/chocolate-peanut-butter.jpg',
      images: ['/images/chocolate-peanut-butter.jpg'],
      description: 'Delicious blend of chocolate and creamy peanut butter.',
      features: ['Chocolate', 'Creamy', 'Natural'],
      rating: 4.8,
      reviews: 96,
      inStock: true,
      size: '16oz',
      category: 'Peanut',
      variants: [
        { mass: 370, price: 800, stock: 27 } // Ensure variant price matches base price
      ]
    },
    {
      id: 16,
      name: 'Peanut Butter - Chocolate Mint',
      price: 600, // Confirmed price (on order only)
      image: '/images/mint-chocolate-peanut.jpg',
      secondaryImage: '/images/mint-chocolate-peanut.jpg',
      images: ['/images/mint-chocolate-peanut.jpg'],
      description: 'Refreshing mint chocolate peanut butter - special order only.',
      features: ['Chocolate', 'Mint', 'Special Order'],
      rating: 4.7,
      reviews: 42,
      inStock: false, // Only available on order
      isAvailableOnOrder: true,
      size: '16oz',
      category: 'Peanut',
      variants: [
        { mass: 370, price: 600, stock: 0 } // Ensure variant price matches base price
      ]
    },
    
    // Seed Butter (1 variety)
    {
      id: 17,
      name: 'Seed Butter - Pumpkin Seed',
      price: 1000, // Confirmed price as Pumpkin Seed Butter
      image: '/images/pumpkin-seed-butter.jpg',
      secondaryImage: '/images/pumpkin-seed-butter.jpg',
      images: ['/images/pumpkin-seed-butter.jpg'],
      description: 'Nutritious pumpkin seed butter with a unique flavor profile.',
      features: ['High Protein', 'Omega-3', 'Vegan'],
      rating: 4.6,
      reviews: 34,
      inStock: true,
      size: '12oz',
      category: 'Seed',
      variants: [
        { mass: 370, price: 1000, stock: 18 } // Ensure variant price matches base price
      ]
    },
    
    // Honey (1 variety)
    {
      id: 18,
      name: 'Pure Natural Honey',
      price: 600, // Confirmed price as Honey
      image: '/images/pure-honey.jpg',
      secondaryImage: '/images/pure-honey.jpg',
      images: ['/images/pure-honey.jpg'],
      description: 'Raw, unfiltered local honey with natural sweetness and health benefits.',
      features: ['Raw', 'Unfiltered', 'Local', 'Natural'],
      rating: 4.8,
      reviews: 78,
      inStock: true,
      size: '16oz',
      category: 'Honey',
      variants: [
        { mass: 370, price: 600, stock: 35 } // Ensure variant price matches base price
      ]
    }
  ];

  const productsWithSku = defaultProductsData.map(product => ({
    ...product,
    sku: `SKU-${product.id}`
  }));

  console.log('Attempting to insert products. Count:', productsWithSku.length);
  if (productsWithSku.length > 0) console.log('First product SKU:', productsWithSku[0].sku);
  if (productsWithSku.length > 1) console.log('Second product SKU:', productsWithSku[1].sku);
  await Product.insertMany(productsWithSku);
}

// Get a single product by ID
router.get('/:id', catchAsync(async (req, res) => {
    // Try to parse the ID as a number first (matching schema)
    let query = {};
    const numericId = !isNaN(Number(req.params.id)) ? Number(req.params.id) : null;
    
    if (numericId !== null) {
      // If ID is numeric, search by id field
      query.id = numericId;
      console.log(`Searching for product with numeric ID: ${numericId}`);
    } else if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // If ID looks like MongoDB ObjectId, search by _id
      query._id = req.params.id;
      console.log(`Searching for product with MongoDB ID: ${req.params.id}`);
    } else {
      // Fallback to string ID search
      query.id = req.params.id;
      console.log(`Searching for product with string ID: ${req.params.id}`);
    }
    
    const product = await Product.findOne(query);
    
    if (!product) {
      console.log(`Product not found with query:`, query);
      throw new AppError('Product not found', 404, 'LINDA_PRODUCT_NOT_FOUND');
    }
    
    console.log(`Found product: ${product.name} with ID=${product.id}, _id=${product._id}`);
    
    // Format product with consistent IDs
    const formattedProduct = {
      ...product.toObject(),
      _id: product._id.toString(),
      id: Number(product.id),
      productId: String(product.id),
      inStock: product.inStock === false ? false : true,
      stockQuantity: product.stockQuantity || 999
    };
    
    // Return the product directly as the frontend expects
    res.json(formattedProduct);
    // Using catchAsync, no try-catch needed here
}));

// Initialize products from static data
router.post('/init', catchAsync(async (req, res) => {
    const products = [
      {
        id: 1,
        name: 'Creamy Almond Butter',
        price: 1690,
        image: '/images/almond-butter.jpg',
        secondaryImage: '/images/chocolate-almond.jpg',
        description: 'Our signature smooth almond butter made from premium organic almonds.',
        features: ['Organic', 'Vegan', 'Gluten-Free'],
        rating: 4.9,
        reviews: 128,
        inStock: true,
        size: '16oz',
        category: 'Almond',
        variants: [
          { mass: 212, price: 1290, stock: 15 },
          { mass: 370, price: 1690, stock: 12 },
        ]
      },
      {
        id: 2,
        name: 'Chocolate Almond Butter',
        price: 1890,
        image: '/images/chocolate-almond-butter.jpg',
        secondaryImage: '/images/chocolate-almond-butter.jpg',
        description: 'Rich chocolate blended with our premium almond butter.',
        features: ['Chocolate', 'Organic', 'Vegan'],
        rating: 4.8,
        reviews: 95,
        inStock: true,
        size: '16oz',
        category: 'Almond',
        variants: [
          { mass: 212, price: 1490, stock: 18 },
          { mass: 370, price: 1890, stock: 15 },
        ]
      },
      {
        id: 3,
        name: 'Creamy Cashew Butter',
        price: 1790,
        image: '/images/cashew-butter.jpg',
        secondaryImage: '/images/cashew-butter.jpg',
        description: 'Smooth and creamy cashew butter made from premium cashews.',
        features: ['Creamy', 'Organic', 'Vegan'],
        rating: 4.7,
        reviews: 82,
        inStock: true,
        size: '16oz',
        category: 'Cashew',
        variants: [
          { mass: 212, price: 1390, stock: 20 },
          { mass: 370, price: 1790, stock: 16 },
        ]
      },
      {
        id: 4,
        name: 'Chocolate Cashew Butter',
        price: 1990,
        image: '/images/chocolate-cashew.jpg',
        secondaryImage: '/images/chocolate-cashew.jpg',
        description: 'Decadent chocolate blended with creamy cashew butter.',
        features: ['Chocolate', 'Organic', 'Vegan'],
        rating: 4.9,
        reviews: 76,
        inStock: true,
        size: '16oz',
        category: 'Cashew',
        variants: [
          { mass: 212, price: 1590, stock: 12 },
          { mass: 370, price: 1990, stock: 10 },
        ]
      },
      {
        id: 5,
        name: 'Coconut Cashew Butter',
        price: 1890,
        image: '/images/coconut-cashew.jpg',
        secondaryImage: '/images/coconut-cashew.jpg',
        description: 'A tropical blend of coconut and premium cashews.',
        features: ['Coconut', 'Organic', 'Vegan'],
        rating: 4.8,
        reviews: 64,
        inStock: true,
        size: '16oz',
        category: 'Cashew',
        variants: [
          { mass: 212, price: 1490, stock: 14 },
          { mass: 370, price: 1890, stock: 11 },
        ]
      }
    ];

    await Product.deleteMany({}); // Clear existing products
    await Product.insertMany(products);
    
    res.status(201).json({ message: 'Products initialized successfully' });
    // Using catchAsync, no try-catch needed here
}));

module.exports = {
  router,
  initializeDefaultProducts
};
