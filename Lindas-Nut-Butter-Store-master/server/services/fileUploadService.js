/**
 * File Upload Service
 * 
 * Handles file uploads for product images and other media
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const productsDir = path.join(__dirname, '../../public/uploads/products');

// Uploader initialization function
const initUploadsDir = () => {
  try {
    if (!fs.existsSync(productsDir)) {
      console.log(`[DEBUG] Uploads directory not found. Creating at: ${productsDir}`);
      fs.mkdirSync(productsDir, { recursive: true });
    }
  } catch (error) {
    console.error(`[FATAL] Could not create upload directory: ${productsDir}`, error);
    process.exit(1);
  }
};

// Configure storage for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExtension = path.extname(file.originalname);
    const fileName = `product-${uuidv4()}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter to allow only images
const imageFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create multer upload instance with size limits
const uploadProductImage = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
  fileFilter: imageFilter
}).array('images', 5); // Allow up to 5 images per product

// Process uploaded files and return file paths
const processProductImages = (req, res, next) => {
  uploadProductImage(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error processing file upload'
      });
    }

    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }

    // If no files were uploaded, continue without adding image paths
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Add uploaded file paths to request for use in product creation/update
    req.uploadedImages = req.files.map(file => {
      // Return the public URL path for the image
      return `/uploads/products/${file.filename}`;
    });

    next();
  });
};

module.exports = {
  processProductImages,
  initUploadsDir,
};
