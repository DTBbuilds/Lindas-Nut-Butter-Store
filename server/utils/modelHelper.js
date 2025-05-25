/**
 * Model Helper Utility
 * 
 * Resolves circular dependency issues between models by providing a central access point
 * This allows controllers to safely access models without running into import cycles
 */

const mongoose = require('mongoose');

// Cache for models
let models = {};

/**
 * Get a model by name
 * If the model is not already cached, it will attempt to load it
 * @param {string} modelName - The name of the model to get
 * @returns {mongoose.Model} The requested model
 */
function getModel(modelName) {
  console.log(`Attempting to get model: ${modelName}`);
  
  // If the model is already cached, return it
  if (models[modelName]) {
    console.log(`Returning cached ${modelName} model`);
    return models[modelName];
  }
  
  // Otherwise, try to load it
  try {
    // First, try to get the model if it's already registered with mongoose
    if (mongoose.models[modelName]) {
      console.log(`Found registered model ${modelName} in mongoose.models`);
      models[modelName] = mongoose.models[modelName];
      return models[modelName];
    }
    
    console.log(`Model ${modelName} not found in mongoose.models, attempting to load models.js`);
    
    // If the model is not registered, try to load it directly
    try {
      // Try direct model load first
      const directModelPath = `../models/${modelName.toLowerCase()}.model.js`;
      try {
        console.log(`Attempting to load model directly from: ${directModelPath}`);
        const loadedModel = require(directModelPath);
        if (loadedModel) {
          console.log(`Successfully loaded ${modelName} directly`);
          models[modelName] = loadedModel;
          return loadedModel;
        }
      } catch (directLoadError) {
        console.log(`Could not load model directly: ${directLoadError.message}`);
      }
      
      // If direct load fails, try the central models file
      // Load the models if not already loaded
      console.log('Attempting to load all models from central models.js file');
      if (Object.keys(models).length === 0) {
        // Only require models.js once
        require('../models'); // This registers all models with mongoose
        console.log('Loaded models.js file');
      }
      
      // Now the model should be registered with mongoose
      if (mongoose.models[modelName]) {
        console.log(`Model ${modelName} is now registered after loading models.js`);
        models[modelName] = mongoose.models[modelName];
        return models[modelName];
      }
    } catch (modelLoadError) {
      console.error('Error loading models:', modelLoadError);
    }
    
    // Last resort: try to define the model on the fly for Admin
    if (modelName === 'Admin' && !mongoose.models.Admin) {
      console.log('Attempting to define Admin model schema on the fly');
      try {
        const adminSchema = new mongoose.Schema({
          email: { type: String, required: true, unique: true },
          password: { type: String, required: true },
          name: { type: String, required: true },
          role: { type: String, default: 'admin' },
          active: { type: Boolean, default: true },
          lastLogin: { type: Date, default: Date.now }
        }, { timestamps: true });
        
        const Admin = mongoose.model('Admin', adminSchema);
        models.Admin = Admin;
        console.log('Successfully defined Admin model on the fly');
        return Admin;
      } catch (schemaError) {
        console.error('Error defining Admin schema on the fly:', schemaError);
      }
    }
    
    // If we still don't have the model, report the error
    console.error(`Model ${modelName} is not registered with mongoose and could not be loaded`);
    return null;
  } catch (error) {
    console.error(`Error getting model ${modelName}:`, error);
    return null; // Return null instead of throwing to prevent cascade failures
  }
}

// Convenience methods for common models
const getCustomer = () => {
  const model = getModel('Customer');
  if (!model) {
    console.warn('Customer model not available');
    return mongoose.models.Customer || null;
  }
  return model;
};

const getOrder = () => {
  const model = getModel('Order');
  if (!model) {
    console.warn('Order model not available');
    return mongoose.models.Order || null;
  }
  return model;
};

const getFeedback = () => {
  const model = getModel('Feedback');
  if (!model) {
    console.warn('Feedback model not available');
    return mongoose.models.Feedback || null;
  }
  return model;
};

const getTransaction = () => {
  const model = getModel('Transaction');
  if (!model) {
    console.warn('Transaction model not available');
    return mongoose.models.Transaction || null;
  }
  return model;
};

const getProduct = () => {
  const model = getModel('Product');
  if (!model) {
    console.warn('Product model not available');
    return mongoose.models.Product || null;
  }
  return model;
};

const getAdmin = () => {
  console.log('Getting Admin model...');
  
  // First check if it's already in mongoose models
  if (mongoose.models.Admin) {
    console.log('Found Admin model in mongoose.models');
    models.Admin = mongoose.models.Admin;
    return mongoose.models.Admin;
  }
  
  // Try to get it through our getModel function
  const model = getModel('Admin');
  if (model) {
    console.log('Successfully got Admin model through getModel');
    return model;
  }
  
  // If we still don't have it, try a direct require
  console.log('Admin model not available through normal channels, trying direct require');
  try {
    require('../models/admin.model.js');
    if (mongoose.models.Admin) {
      console.log('Successfully loaded Admin model through direct require');
      models.Admin = mongoose.models.Admin;
      return mongoose.models.Admin;
    }
  } catch (err) {
    console.warn('Failed to load Admin model through direct require:', err.message);
  }
  
  console.error('ADMIN MODEL NOT AVAILABLE - Authentication will fail');
  return null;
};

module.exports = {
  getModel,
  getCustomer,
  getOrder,
  getFeedback,
  getTransaction,
  getProduct,
  getAdmin
};
