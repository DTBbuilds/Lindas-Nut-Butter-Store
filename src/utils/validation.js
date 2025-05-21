/**
 * Validates a value against a validation rule
 * @param {*} value - The value to validate
 * @param {string} rule - The validation rule
 * @param {*} [ruleValue] - Optional value for the validation rule
 * @returns {string|null} - Error message or null if valid
 */
const validateRule = (value, rule, ruleValue) => {
  // Handle empty values (except for required check)
  if (value === null || value === undefined || value === '') {
    return rule === 'required' ? 'This field is required' : null;
  }

  switch (rule) {
    case 'required':
      if (Array.isArray(value) && value.length === 0) return 'At least one item is required';
      return value ? null : 'This field is required';
      
    case 'min':
      if (typeof value === 'number') {
        return value >= ruleValue ? null : `Must be at least ${ruleValue}`;
      } else if (typeof value === 'string') {
        return value.length >= ruleValue ? null : `Must be at least ${ruleValue} characters`;
      }
      break;
      
    case 'max':
      if (typeof value === 'number') {
        return value <= ruleValue ? null : `Must be at most ${ruleValue}`;
      } else if (typeof value === 'string') {
        return value.length <= ruleValue ? null : `Must be at most ${ruleValue} characters`;
      }
      break;
      
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
        ? null 
        : 'Please enter a valid email address';
        
    case 'url':
      try {
        new URL(value);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
      
    case 'match':
      return value === ruleValue ? null : 'Values do not match';
      
    case 'pattern':
      return new RegExp(ruleValue).test(value) 
        ? null 
        : 'Invalid format';
        
    case 'minLength':
      return value.length >= ruleValue 
        ? null 
        : `Must be at least ${ruleValue} characters long`;
        
    case 'maxLength':
      return value.length <= ruleValue 
        ? null 
        : `Must be at most ${ruleValue} characters long`;
        
    case 'number':
      return !isNaN(Number(value)) ? null : 'Must be a number';
      
    case 'integer':
      return Number.isInteger(Number(value)) ? null : 'Must be a whole number';
      
    case 'positive':
      return Number(value) > 0 ? null : 'Must be a positive number';
      
    case 'negative':
      return Number(value) < 0 ? null : 'Must be a negative number';
      
    case 'oneOf':
      return ruleValue.includes(value) 
        ? null 
        : `Must be one of: ${ruleValue.join(', ')}`;
        
    case 'custom':
      return typeof ruleValue === 'function' 
        ? ruleValue(value) 
        : 'Invalid validation function';
        
    default:
      return null;
  }
  
  return null;
};

/**
 * Creates a validation function based on a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} - Validation function
 */
const createValidator = (schema) => {
  return (values = {}) => {
    const errors = {};
    
    // Validate each field in the schema
    Object.keys(schema).forEach(field => {
      const fieldRules = schema[field];
      
      // Skip if no rules are defined for this field
      if (!fieldRules || Object.keys(fieldRules).length === 0) return;
      
      const value = values[field];
      let error = null;
      
      // Check each rule for the field
      for (const [rule, ruleValue] of Object.entries(fieldRules)) {
        // Skip if error already found
        if (error) break;
        
        // Special handling for required fields with empty values
        if (rule !== 'required' && (value === null || value === undefined || value === '')) {
          continue;
        }
        
        error = validateRule(value, rule, ruleValue);
      }
      
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  };
};

// Common validation schemas
export const validationSchemas = {
  email: {
    required: true,
    email: true,
    maxLength: 254,
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 100,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  phone: {
    pattern: '^[\+\d\s\-\(\)]{10,20}$',
  },
  url: {
    url: true,
  },
  positiveNumber: {
    required: true,
    number: true,
    positive: true,
  },
};

// Helper function to create a validation schema
export const createSchema = (schema) => schema;

export default createValidator;
