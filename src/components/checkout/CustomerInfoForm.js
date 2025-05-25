import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faArrowLeft, faArrowRight, faLocationDot, faBuilding } from '@fortawesome/free-solid-svg-icons';

/**
 * Customer Information Form Component
 * 
 * Handles collection of customer's personal information
 */
const CustomerInfoForm = ({ initialValues, onSubmit, onBack, onChange }) => {
  const [formData, setFormData] = useState(initialValues || {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    apartment: '',
    city: 'Nairobi'
  });
  
  // Update form data when initialValues change
  useEffect(() => {
    if (initialValues) {
      setFormData(prevData => ({
        ...prevData,
        ...initialValues
      }));
      console.log('Customer info form initialized with values:', initialValues);
    }
  }, [initialValues]);
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    
    // Call onChange prop if provided (for parent components to stay in sync)
    if (onChange) {
      onChange(e);
    }
    
    // Clear error when field is being edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone number (Kenyan format)
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(?:\+254|0)[17]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Kenyan phone number';
    }
    
    // Validate delivery address
    if (!formData.address || formData.address.trim() === '') {
      newErrors.address = 'Delivery address is required';
    }
    
    // Validate city (should always be Nairobi)
    if (!formData.city || formData.city !== 'Nairobi') {
      newErrors.city = 'Currently we only deliver within Nairobi City';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customer Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label 
            htmlFor="name" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUser} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors`}
              placeholder="Your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        {/* Phone Number Field */}
        <div>
          <label 
            htmlFor="phoneNumber" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
            </div>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full pl-10 pr-3 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors`}
              placeholder="0712345678 or +254712345678"
            />
          </div>
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            For order updates and M-Pesa payment
          </p>
        </div>

        {/* Email Field */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            We'll email your order confirmation and updates here
          </p>
        </div>

        {/* Delivery Address */}
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLocationDot} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full pl-10 pr-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors`}
              placeholder="Street address, neighborhood, etc."
            />
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        {/* Apartment/Suite/Floor (Optional) */}
        <div className="mb-4">
          <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">
            Apartment/Suite/Floor (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faBuilding} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="apartment"
              name="apartment"
              value={formData.apartment}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              placeholder="Apt, Suite, Floor, etc. (optional)"
            />
          </div>
        </div>

        {/* City - Fixed to Nairobi */}
        <div className="mb-4">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors bg-gray-100"
            disabled
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Currently we only deliver within Nairobi City. Fixed shipping fee: KES 300
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Delivery takes up to 48 hours from order confirmation
          </p>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Cart
          </button>
          
          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Continue to Payment
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerInfoForm;
