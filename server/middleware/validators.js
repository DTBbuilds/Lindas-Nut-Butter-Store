const { body, param, validationResult } = require('express-validator');

// Common validation rules
const commonRules = {
  id: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
    
  phoneNumber: body('phoneNumber')
    .matches(/^(?:\+?254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number (e.g., 0712345678 or +254712345678)'),
    
  amount: body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number')
};

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  // Format errors for response
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors
  });
};

// Specific validation chains
const authValidation = {
  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate
  ],
  
  register: [
    body('name').notEmpty().withMessage('Name is required'),
    commonRules.email,
    commonRules.password,
    body('phoneNumber').custom(value => {
      if (!value) return true; // Optional
      return /^(?:\+?254|0)[17]\d{8}$/.test(value);
    }).withMessage('Please provide a valid Kenyan phone number'),
    validate
  ]
};

const paymentValidation = {
  initiatePayment: [
    commonRules.phoneNumber,
    commonRules.amount,
    body('orderId').notEmpty().withMessage('Order ID is required'),
    validate
  ],
  
  queryPayment: [
    body('checkoutRequestId').notEmpty().withMessage('Checkout Request ID is required'),
    validate
  ]
};

const productValidation = {
  createProduct: [
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stockQuantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
    validate
  ],
  
  updateProduct: [
    commonRules.id,
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
    validate
  ]
};

module.exports = {
  commonRules,
  validate,
  authValidation,
  paymentValidation,
  productValidation
};
