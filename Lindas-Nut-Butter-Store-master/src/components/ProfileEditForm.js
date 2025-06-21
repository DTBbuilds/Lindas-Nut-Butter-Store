import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faSave, 
  faTimes, 
  faSpinner,
  faCamera,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import axios from 'axios';
import { toast } from 'react-toastify';

// Use the correct API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    window.location.hostname === 'localhost' && window.location.port === '3000' ? 
      'http://localhost:5000' : 
      `http://${window.location.hostname}:5000` 
    : 
    ''
  );

const ProfileEditForm = ({ userData, onCancel, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        profileImage: userData.profileImage || null
      });
      
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      }
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Update form data
    setFormData(prev => ({
      ...prev,
      profileImage: file
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone validation (optional)
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/[^0-9+]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      if (formData.phone) submitData.append('phone', formData.phone);
      if (formData.address) submitData.append('address', formData.address);
      if (formData.profileImage && formData.profileImage instanceof File) {
        submitData.append('profileImage', formData.profileImage);
      }
      
      // Use apiService to send the update request. The service handles the token.
      const response = await apiService.put('/api/customers/profile', submitData);

      if (response.data && response.data.success) {
        // Show success animation
        setSaveSuccess(true);
        
        // Update local storage with new name from the response
        localStorage.setItem('customerName', response.data.customer.name);
        
        // Show success message
        toast.success('Profile updated successfully!');
        
        // Reset success state after animation completes
        setTimeout(() => {
          setSaveSuccess(false);
          
          // Call the onUpdate callback with the updated data from the server response
          onUpdate(response.data.customer);
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Failed to update profile.');
      }
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 animate-fadeIn profile-card hover-lift">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-6 animate-slideIn">
          <div className="relative group profile-image-container">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${imagePreview ? 'border-soft-green' : 'border-gray-200'} bg-gray-100 flex items-center justify-center transition-all duration-300 ${saveSuccess ? 'animate-success' : ''}`}>
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="text-gray-400 text-4xl" />
              )}
              <div className="profile-image-upload">
                <FontAwesomeIcon icon={faCamera} className="text-white text-xl" />
              </div>
            </div>
            <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-soft-green hover:bg-rich-brown text-white p-2 rounded-full cursor-pointer shadow-md transition-all duration-300 transform group-hover:scale-110">
              <FontAwesomeIcon icon={faCamera} size="sm" />
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">Click to upload a profile picture</p>
        </div>
        
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
            Full Name <span className="text-red-500">*</span>
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
              className={`w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all duration-300 form-field`}
              placeholder="Your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>
        
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email Address <span className="text-red-500">*</span>
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
              className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all duration-300 form-field`}
              placeholder="your@email.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        
        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
            Phone Number <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full pl-10 pr-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all duration-300 form-field`}
              placeholder="+1 (234) 567-8900"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
        
        {/* Address Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
            Default Address <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
            </div>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent transition-all duration-300 form-field"
              placeholder="Your default shipping address"
            />
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100 animate-slideIn" style={{ animationDelay: '0.3s' }}>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green transition-all duration-300 flex items-center"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green transition-all duration-300 flex items-center ${saveSuccess ? 'animate-pulse' : ''} ${
              saveSuccess 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-soft-green hover:bg-rich-brown'
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Saved!
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditForm;
