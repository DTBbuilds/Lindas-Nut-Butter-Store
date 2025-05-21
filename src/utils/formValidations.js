/**
 * Common validation rules for form fields
 */

/**
 * Required field validation
 * @param {string} fieldName - The name of the field (for error message)
 * @param {string} [customMessage] - Custom error message
 * @returns {Function} - Validation function
 */
export const required = (fieldName, customMessage) => (value) => {
  if (value === undefined || value === null || value === '') {
    return customMessage || `${fieldName} is required`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return customMessage || `At least one ${fieldName.toLowerCase()} is required`;
  }
  return undefined;
};

/**
 * Minimum length validation
 * @param {number} min - Minimum length
 * @param {string} fieldName - The name of the field (for error message)
 * @returns {Function} - Validation function
 */
export const minLength = (min, fieldName) => (value) => {
  if (!value) return undefined;
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return undefined;
};

/**
 * Maximum length validation
 * @param {number} max - Maximum length
 * @param {string} fieldName - The name of the field (for error message)
 * @returns {Function} - Validation function
 */
export const maxLength = (max, fieldName) => (value) => {
  if (!value) return undefined;
  if (value.length > max) {
    return `${fieldName} must be at most ${max} characters`;
  }
  return undefined;
};

/**
 * Email validation
 * @returns {Function} - Validation function
 */
export const email = () => (value) => {
  if (!value) return undefined;
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(value) ? undefined : 'Please enter a valid email address';
};

/**
 * URL validation
 * @returns {Function} - Validation function
 */
export const url = () => (value) => {
  if (!value) return undefined;
  try {
    new URL(value);
    return undefined;
  } catch (e) {
    return 'Please enter a valid URL';
  }
};

/**
 * Numeric validation
 * @returns {Function} - Validation function
 */
export const numeric = () => (value) => {
  if (!value) return undefined;
  return !isNaN(Number(value)) ? undefined : 'Must be a number';
};

/**
 * Positive number validation
 * @returns {Function} - Validation function
 */
export const positive = () => (value) => {
  if (!value) return undefined;
  return Number(value) > 0 ? undefined : 'Must be a positive number';
};

/**
 * Minimum value validation
 * @param {number} min - Minimum value
 * @returns {Function} - Validation function
 */
export const minValue = (min) => (value) => {
  if (!value) return undefined;
  return Number(value) >= min ? undefined : `Must be at least ${min}`;
};

/**
 * Maximum value validation
 * @param {number} max - Maximum value
 * @returns {Function} - Validation function
 */
export const maxValue = (max) => (value) => {
  if (!value) return undefined;
  return Number(value) <= max ? undefined : `Must be at most ${max}`;
};

/**
 * Password strength validation
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum password length
 * @param {boolean} options.requireUppercase - Require uppercase letter
 * @param {boolean} options.requireLowercase - Require lowercase letter
 * @param {boolean} options.requireNumber - Require number
 * @param {boolean} options.requireSpecialChar - Require special character
 * @returns {Function} - Validation function
 */
export const passwordStrength = ({
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumber = true,
  requireSpecialChar = true,
} = {}) => (value) => {
  if (!value) return undefined;
  
  const errors = [];
  
  if (value.length < minLength) {
    errors.push(`at least ${minLength} characters`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(value)) {
    errors.push('one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(value)) {
    errors.push('one lowercase letter');
  }
  
  if (requireNumber && !/\d/.test(value)) {
    errors.push('one number');
  }
  
  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    errors.push('one special character');
  }
  
  return errors.length > 0 
    ? `Password must contain ${errors.join(', ')}` 
    : undefined;
};

/**
 * Match field validation
 * @param {string} matchValue - The value to match against
 * @param {string} fieldName - The name of the field to match
 * @returns {Function} - Validation function
 */
export const matchField = (matchValue, fieldName) => (value) => {
  if (!value) return undefined;
  return value === matchValue ? undefined : `Must match ${fieldName}`;
};

/**
 * Compose multiple validators into a single validator
 * @param {...Function} validators - Validation functions
 * @returns {Function} - Composed validation function
 */
export const composeValidators = (...validators) => (value, allValues) => {
  return validators.reduce((error, validator) => {
    return error || validator(value, allValues);
  }, undefined);
};

/**
 * Create a validation function for a field with multiple rules
 * @param {string} fieldName - The name of the field (for error messages)
 * @param {Array<Function>} rules - Array of validation rules
 * @returns {Function} - Validation function
 */
export const createFieldValidator = (fieldName, rules = []) => (value, allValues) => {
  for (const rule of rules) {
    const error = rule(value, allValues);
    if (error) {
      return typeof error === 'string' ? error : `Invalid ${fieldName.toLowerCase()}`;
    }
  }
  return undefined;
};

// Common validation schemas
export const validationSchemas = {
  email: [
    required('Email'),
    email(),
    maxLength(254, 'Email'),
  ],
  password: [
    required('Password'),
    minLength(8, 'Password'),
    maxLength(100, 'Password'),
  ],
  name: [
    required('Name'),
    minLength(2, 'Name'),
    maxLength(100, 'Name'),
  ],
  phone: [
    (value) => {
      if (!value) return undefined;
      const phoneRegex = /^[\+\d\s\-\(\)]{10,20}$/;
      return phoneRegex.test(value) ? undefined : 'Please enter a valid phone number';
    },
  ],
  url: [
    url(),
  ],
  positiveNumber: [
    required('Number'),
    numeric(),
    positive(),
  ],
};

// Helper to create a validation schema
export const createValidationSchema = (schema) => {
  const validators = {};
  
  Object.entries(schema).forEach(([field, rules]) => {
    validators[field] = createFieldValidator(field, Array.isArray(rules) ? rules : [rules]);
  });
  
  return (values) => {
    const errors = {};
    
    Object.entries(validators).forEach(([field, validate]) => {
      const error = validate(values[field], values);
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  };
};
