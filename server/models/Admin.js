/**
 * REDIRECTOR FILE for Admin model
 * This file ensures that all imports of './models/Admin' point to the unified admin.model.js
 * 
 * Having multiple Admin model definitions was causing schema validation conflicts
 * All Admin model functionality is now consolidated in admin.model.js
 */

// Simply re-export the unified Admin model
module.exports = require('./admin.model.js');
