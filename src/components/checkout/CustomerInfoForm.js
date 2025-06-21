import React, { useState, memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faArrowLeft, faArrowRight, faLocationDot, faCity } from '@fortawesome/free-solid-svg-icons';
import LocationPicker from './LocationPicker';

/**
 * Customer Information Form Component
 * 
 * Handles collection of customer's personal information
 */
const CustomerInfoForm = ({ customerInfo: formData = {}, onSubmit, onBack, onChange }) => {
  const [errors, setErrors] = useState({});

  // This component is now fully controlled by the parent.
  // It receives form data and change handlers via props.

  const handleChange = (e) => {
    // Propagate the change to the parent component.
    if (onChange) {
      onChange(e);
    }

    // Clear the error for the field being edited.
    const { name } = e.target;
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };
  
  const handleLocationSelect = (location, address) => {
    onChange({ target: { name: 'deliveryAddress', value: address } });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(?:\+254|0)[17]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Kenyan phone number';
    }
    
    if (!formData.deliveryAddress || formData.deliveryAddress.trim() === '') {
      newErrors.deliveryAddress = 'Please select a delivery address from the map.';
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
    <div className="bg-[#fbf9f4] p-4 sm:p-8 rounded-2xl shadow-lg border border-black/5">
      <h2 className="text-3xl font-bold text-rich-brown mb-8 text-center">Your Delivery Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Personal Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="relative">
            <label htmlFor="name" className="block text-sm font-semibold text-rich-brown mb-2">Full Name</label>
            <div className="relative">
              <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 text-rich-brown/60" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 bg-white rounded-full border-2 ${errors.name ? 'border-red-400' : 'border-gray-200'} focus:border-rich-brown focus:ring-0 transition-all duration-300 shadow-sm placeholder-gray-500/70`}
                placeholder="e.g., J. Doe"
              />
            </div>
            {errors.name && <p className="mt-2 text-sm text-red-600 font-medium">{errors.name}</p>}
          </div>

          {/* Phone Number Field */}
          <div className="relative">
            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-rich-brown mb-2">Phone Number</label>
            <div className="relative">
              <FontAwesomeIcon icon={faPhone} className="absolute left-4 top-1/2 -translate-y-1/2 text-rich-brown/60" />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 bg-white rounded-full border-2 ${errors.phoneNumber ? 'border-red-400' : 'border-gray-200'} focus:border-rich-brown focus:ring-0 transition-all duration-300 shadow-sm placeholder-gray-500/70`}
                placeholder="0712 345 678"
              />
            </div>
            {errors.phoneNumber && <p className="mt-2 text-sm text-red-600 font-medium">{errors.phoneNumber}</p>}
          </div>
        </div>

        {/* Email Field */}
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-semibold text-rich-brown mb-2">Email Address</label>
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 -translate-y-1/2 text-rich-brown/60" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 bg-white rounded-full border-2 ${errors.email ? 'border-red-400' : 'border-gray-200'} focus:border-rich-brown focus:ring-0 transition-all duration-300 shadow-sm placeholder-gray-500/70`}
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>}
        </div>

        {/* Location Section */}
        <div className="space-y-6 pt-4 border-t border-rich-brown/10">
          <div>
            <label className="block text-sm font-semibold text-rich-brown mb-2">Find Your Delivery Location</label>
            <p className="text-xs text-gray-600 mb-3">Use the search bar or click on the map to pinpoint your address.</p>
            <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 focus-within:border-rich-brown transition-all duration-300">
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Address Display */}
            <div className="relative">
              <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-rich-brown mb-2">Selected Delivery Address</label>
              <div className="relative">
                <FontAwesomeIcon icon={faLocationDot} className="absolute left-4 top-1/2 -translate-y-1/2 text-rich-brown/60" />
                <input
                  type="text"
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={formData.deliveryAddress || ''}
                  readOnly
                  className={`w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full border-2 ${errors.deliveryAddress ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-colors shadow-inner`}
                  placeholder="Address will appear here"
                />
              </div>
              {errors.deliveryAddress && <p className="mt-2 text-sm text-red-600 font-medium">{errors.deliveryAddress}</p>}
            </div>

            {/* City Field */}
            <div className="relative">
              <label htmlFor="city" className="block text-sm font-semibold text-rich-brown mb-2">City</label>
              <div className="relative">
                <FontAwesomeIcon icon={faCity} className="absolute left-4 top-1/2 -translate-y-1/2 text-rich-brown/60" />
                <input
                  type="text"
                  id="city"
                  name="city"
                  value="Nairobi"
                  readOnly
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full border-2 border-gray-200 focus:outline-none transition-colors shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center pt-6 border-t border-rich-brown/10">
          <button 
            type="button" 
            onClick={onBack}
            className="inline-flex items-center text-rich-brown font-medium hover:underline transition-colors duration-300 group mt-4 sm:mt-0"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Login
          </button>
          <button 
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-rich-brown text-white font-bold rounded-full hover:bg-soft-green transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            Continue to Payment
            <FontAwesomeIcon icon={faArrowRight} className="ml-3" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default memo(CustomerInfoForm);
