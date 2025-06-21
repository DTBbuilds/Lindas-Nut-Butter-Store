import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for form handling with validation
 * @param {Object} options - Configuration options
 * @param {Function} options.onSubmit - Form submission handler
 * @param {Object} options.initialValues - Initial form values
 * @param {Function} options.validate - Validation function (returns errors object)
 * @param {boolean} options.validateOnChange - Whether to validate on change (default: true)
 * @param {boolean} options.validateOnBlur - Whether to validate on blur (default: true)
 * @param {boolean} options.resetOnSubmit - Whether to reset form after successful submission (default: false)
 * @returns {Object} - Form state and methods
 */
const useForm = ({
  onSubmit,
  initialValues = {},
  validate,
  validateOnChange = true,
  validateOnBlur = true,
  resetOnSubmit = false,
} = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const isMounted = useRef(true);
  
  // Set isMounted to false when the component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  /**
   * Run validation on values change if validateOnChange is true
   */
  useEffect(() => {
    if (validateOnChange && typeof validate === 'function') {
      const validationErrors = validate(values);
      if (isMounted.current) {
        setErrors(validationErrors || {});
      }
    }
  }, [values, validate, validateOnChange]);
  
  /**
   * Reset the form to initial values
   */
  const resetForm = useCallback((newInitialValues) => {
    if (isMounted.current) {
      const valuesToSet = newInitialValues !== undefined ? newInitialValues : initialValues;
      setValues(valuesToSet);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setSubmitCount(0);
    }
  }, [initialValues]);
  
  /**
   * Set form field value
   */
  const setFieldValue = useCallback((name, value) => {
    if (isMounted.current) {
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);
  
  /**
   * Set form field error
   */
  const setFieldError = useCallback((name, error) => {
    if (isMounted.current) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, []);
  
  /**
   * Set form field touched state
   */
  const setFieldTouched = useCallback((name, isTouched = true) => {
    if (isMounted.current) {
      setTouched(prev => ({
        ...prev,
        [name]: isTouched
      }));
      
      // Run validation on blur if validateOnBlur is true
      if (validateOnBlur && typeof validate === 'function') {
        const validationErrors = validate(values);
        if (isMounted.current) {
          setErrors(prev => ({
            ...prev,
            [name]: validationErrors?.[name] || null
          }));
        }
      }
    }
  }, [validate, validateOnBlur, values]);
  
  /**
   * Handle input change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    
    let finalValue;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'file') {
      finalValue = files[0];
    } else if (type === 'number' || type === 'range') {
      finalValue = value === '' ? '' : Number(value);
    } else {
      finalValue = value;
    }
    
    setFieldValue(name, finalValue);
  }, [setFieldValue]);
  
  /**
   * Handle input blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name, true);
  }, [setFieldTouched]);
  
  /**
   * Validate the form
   */
  const validateForm = useCallback(() => {
    if (typeof validate === 'function') {
      const validationErrors = validate(values) || {};
      if (isMounted.current) {
        setErrors(validationErrors);
      }
      return Object.keys(validationErrors).length === 0;
    }
    return true;
  }, [validate, values]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    // Mark all fields as touched
    const newTouched = {};
    Object.keys(values).forEach(key => {
      newTouched[key] = true;
    });
    
    if (isMounted.current) {
      setTouched(newTouched);
      setSubmitCount(prev => prev + 1);
    }
    
    // Validate form
    const isValid = validateForm();
    
    if (!isValid) {
      return false;
    }
    
    // Call onSubmit if provided
    if (typeof onSubmit === 'function') {
      if (isMounted.current) {
        setIsSubmitting(true);
      }
      
      try {
        await onSubmit(values, { setErrors, setFieldError, resetForm });
        
        // Reset form after successful submission if resetOnSubmit is true
        if (resetOnSubmit && isMounted.current) {
          resetForm();
        }
      } finally {
        if (isMounted.current) {
          setIsSubmitting(false);
        }
      }
    }
    
    return true;
  }, [onSubmit, resetForm, resetOnSubmit, validateForm, values]);
  
  // Helper to create input props
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
  }), [handleBlur, handleChange, values]);
  
  // Helper to check if form has errors
  const hasErrors = Object.keys(errors).some(key => errors[key]);
  
  // Helper to check if a field has an error
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : null;
  }, [errors, touched]);
  
  // Helper to check if a field is valid
  const isFieldValid = useCallback((name) => {
    return !errors[name];
  }, [errors]);
  
  // Helper to check if a field has been touched
  const isFieldTouched = useCallback((name) => {
    return !!touched[name];
  }, [touched]);
  
  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    
    // Form methods
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    setTouched,
    resetForm,
    validate: validateForm,
    
    // Field helpers
    getFieldProps,
    getFieldError,
    isFieldValid,
    isFieldTouched,
    
    // Form status
    isValid: !hasErrors,
    isDirty: submitCount > 0,
  };
};

export default useForm;
