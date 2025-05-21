import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faMapMarkerAlt, faHome, faBuilding, faLandmark, faInfoCircle, faArrowLeft, faArrowRight, faClock, faTruck, faStore } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { formatKES } from '../../utils/currencyUtils';

const API_BASE = '/api';

/**
 * Delivery Information Form for Kenya
 * Collects all necessary delivery details with Kenya-specific address elements
 */
const DeliveryInfoForm = ({ initialValues, onSubmit, onBack, deliveryFee }) => {
  const [formData, setFormData] = useState(initialValues || {
    recipient: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    county: 'Nairobi',
    subCounty: '',
    ward: '',
    estate: '',
    buildingName: '',
    houseNumber: '',
    nearestLandmark: '',
    deliveryInstructions: '',
    preferredDeliveryTime: 'ANY_TIME',
    deliveryMethod: 'STANDARD',
    pickupLocation: ''
  });

  const [errors, setErrors] = useState({});
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState({
    standard: { available: true, fee: 0 },
    express: { available: false, fee: 0 },
    pickup: { available: true, locations: [] }
  });

  // Time slot options
  const timeSlots = [
    { value: 'MORNING', label: 'Morning (8:00 AM - 12:00 PM)' },
    { value: 'AFTERNOON', label: 'Afternoon (12:00 PM - 4:00 PM)' },
    { value: 'EVENING', label: 'Evening (4:00 PM - 8:00 PM)' },
    { value: 'ANY_TIME', label: 'Any time (8:00 AM - 8:00 PM)' }
  ];

  // Load counties and locations when component mounts
  useEffect(() => {
    fetchLocations();
    fetchPickupLocations();
  }, []);

  // Load sub-counties when county changes
  useEffect(() => {
    if (formData.county) {
      fetchSubCounties(formData.county);
      fetchDeliveryOptions(formData.county, formData.subCounty);
    }
  }, [formData.county]);

  // Load delivery options when sub-county changes
  useEffect(() => {
    if (formData.county && formData.subCounty) {
      fetchDeliveryOptions(formData.county, formData.subCounty);
    }
  }, [formData.subCounty]);

  // Fetch counties and locations from API
  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/delivery/locations`);
      if (response.data && response.data.success) {
        setCounties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch sub-counties for selected county
  const fetchSubCounties = (county) => {
    const selectedCounty = counties.find(c => c.county === county);
    if (selectedCounty && selectedCounty.subCounties) {
      setSubCounties(selectedCounty.subCounties);
    } else {
      setSubCounties([]);
    }
  };

  // Fetch pickup locations
  const fetchPickupLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/delivery/pickup-locations`);
      if (response.data && response.data.success) {
        setPickupLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
    }
  };

  // Fetch delivery options for county and sub-county
  const fetchDeliveryOptions = async (county, subCounty) => {
    if (!county || !subCounty) return;

    try {
      const response = await axios.get(`${API_BASE}/delivery/options?county=${county}&subCounty=${subCounty}`);
      if (response.data && response.data.success) {
        setDeliveryOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching delivery options:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Reset pickup location if delivery method changes away from PICKUP
    if (name === 'deliveryMethod' && value !== 'PICKUP') {
      setFormData(prev => ({
        ...prev,
        pickupLocation: ''
      }));
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

    // Common validations for all delivery methods
    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(?:\+254|0)[17]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Kenyan phone number';
    }

    // Different validations based on delivery method
    if (formData.deliveryMethod === 'PICKUP') {
      if (!formData.pickupLocation) {
        newErrors.pickupLocation = 'Please select a pickup location';
      }
    } else {
      // Validations for standard and express delivery
      if (!formData.county) {
        newErrors.county = 'County is required';
      }

      if (!formData.subCounty) {
        newErrors.subCounty = 'Sub-county is required';
      }

      if (!formData.estate.trim()) {
        newErrors.estate = 'Estate/Area is required';
      }
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

  // Filter pickup locations based on selected county
  const filteredPickupLocations = formData.county
    ? pickupLocations.filter(location => location.county === formData.county)
    : pickupLocations;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Delivery Options</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Method Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Delivery Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Delivery Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all 
                ${formData.deliveryMethod === 'STANDARD' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => handleChange({ target: { name: 'deliveryMethod', value: 'STANDARD' }})}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="STANDARD"
                  checked={formData.deliveryMethod === 'STANDARD'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faTruck} className="text-gray-600 mr-2" />
                    <span className="font-medium">Standard Delivery</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {deliveryOptions.standard.available 
                      ? `${formatKES(deliveryOptions.standard.fee)} • ${deliveryOptions.standard.estimatedDays} days` 
                      : 'Not available for this location'}
                  </p>
                </div>
              </div>
            </div>

            {/* Express Delivery Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all 
                ${!deliveryOptions.express.available ? 'opacity-50 cursor-not-allowed' : ''}
                ${formData.deliveryMethod === 'EXPRESS' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => deliveryOptions.express.available && handleChange({ target: { name: 'deliveryMethod', value: 'EXPRESS' }})}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="EXPRESS"
                  disabled={!deliveryOptions.express.available}
                  checked={formData.deliveryMethod === 'EXPRESS'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faTruck} className="text-red-500 mr-2" />
                    <span className="font-medium">Express Delivery</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {deliveryOptions.express.available 
                      ? `${formatKES(deliveryOptions.express.fee)} • ${deliveryOptions.express.estimatedDays} day(s)` 
                      : 'Not available for this location'}
                  </p>
                </div>
              </div>
            </div>

            {/* Self Pickup Option */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all 
                ${formData.deliveryMethod === 'PICKUP' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => handleChange({ target: { name: 'deliveryMethod', value: 'PICKUP' }})}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="PICKUP"
                  checked={formData.deliveryMethod === 'PICKUP'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faStore} className="text-gray-600 mr-2" />
                    <span className="font-medium">Self Pickup</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Free • Pick up from our stores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Information Section */}
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recipient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recipient Name */}
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.recipient ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                  placeholder="Person receiving the delivery"
                />
              </div>
              {errors.recipient && (
                <p className="mt-1 text-sm text-red-600">{errors.recipient}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full pl-3 pr-3 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="0712345678"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Alternate Phone Number */}
            <div>
              <label htmlFor="alternatePhoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Alternate Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="alternatePhoneNumber"
                name="alternatePhoneNumber"
                value={formData.alternatePhoneNumber}
                onChange={handleChange}
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0712345678"
              />
            </div>

            {/* Preferred Delivery Time */}
            <div>
              <label htmlFor="preferredDeliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Delivery Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                </div>
                <select
                  id="preferredDeliveryTime"
                  name="preferredDeliveryTime"
                  value={formData.preferredDeliveryTime}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {timeSlots.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Location Section */}
        {formData.deliveryMethod === 'PICKUP' && (
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Pickup Location</h3>
            
            {/* County Filter */}
            <div className="mb-4">
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by County
              </label>
              <select
                id="county"
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Counties</option>
                {counties.map(county => (
                  <option key={county.county} value={county.county}>
                    {county.county}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Pickup Locations Display */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select a Pickup Location
              </label>
              
              {filteredPickupLocations.length === 0 ? (
                <p className="text-gray-500">No pickup locations available in the selected county</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredPickupLocations.map(location => (
                    <div 
                      key={location.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all 
                        ${formData.pickupLocation === location.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => handleChange({ target: { name: 'pickupLocation', value: location.id }})}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="pickupLocation"
                          value={location.id}
                          checked={formData.pickupLocation === location.id}
                          onChange={handleChange}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <div className="font-medium">{location.name}</div>
                          <p className="text-sm text-gray-500">{location.address}</p>
                          <p className="text-sm text-gray-500">{location.operatingHours}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.pickupLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.pickupLocation}</p>
              )}
            </div>
          </div>
        )}

        {/* Delivery Location Section */}
        {formData.deliveryMethod !== 'PICKUP' && (
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Delivery Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* County */}
              <div>
                <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                  County
                </label>
                <select
                  id="county"
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className={`w-full pl-3 pr-3 py-2 border ${errors.county ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                >
                  <option value="">Select County</option>
                  {counties.map(county => (
                    <option key={county.county} value={county.county}>
                      {county.county}
                    </option>
                  ))}
                </select>
                {errors.county && (
                  <p className="mt-1 text-sm text-red-600">{errors.county}</p>
                )}
              </div>
              
              {/* Sub-County */}
              <div>
                <label htmlFor="subCounty" className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-County
                </label>
                <select
                  id="subCounty"
                  name="subCounty"
                  value={formData.subCounty}
                  onChange={handleChange}
                  disabled={!formData.county || subCounties.length === 0}
                  className={`w-full pl-3 pr-3 py-2 border ${errors.subCounty ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${!formData.county || subCounties.length === 0 ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select Sub-County</option>
                  {subCounties.map(subCounty => (
                    <option key={subCounty} value={subCounty}>
                      {subCounty}
                    </option>
                  ))}
                </select>
                {errors.subCounty && (
                  <p className="mt-1 text-sm text-red-600">{errors.subCounty}</p>
                )}
              </div>
              
              {/* Ward (Optional) */}
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
                  Ward (Optional)
                </label>
                <input
                  type="text"
                  id="ward"
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Westlands Ward"
                />
              </div>
              
              {/* Estate/Area */}
              <div>
                <label htmlFor="estate" className="block text-sm font-medium text-gray-700 mb-1">
                  Estate/Area
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faHome} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="estate"
                    name="estate"
                    value={formData.estate}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2 border ${errors.estate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                    placeholder="e.g., Kileleshwa Estate"
                  />
                </div>
                {errors.estate && (
                  <p className="mt-1 text-sm text-red-600">{errors.estate}</p>
                )}
              </div>
              
              {/* Building Name */}
              <div>
                <label htmlFor="buildingName" className="block text-sm font-medium text-gray-700 mb-1">
                  Building Name (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faBuilding} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="buildingName"
                    name="buildingName"
                    value={formData.buildingName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Sunshine Apartments"
                  />
                </div>
              </div>
              
              {/* House/Apartment Number */}
              <div>
                <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  House/Apartment Number (Optional)
                </label>
                <input
                  type="text"
                  id="houseNumber"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Apt 3B"
                />
              </div>
              
              {/* Nearest Landmark */}
              <div>
                <label htmlFor="nearestLandmark" className="block text-sm font-medium text-gray-700 mb-1">
                  Nearest Landmark (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLandmark} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="nearestLandmark"
                    name="nearestLandmark"
                    value={formData.nearestLandmark}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Near Westgate Mall"
                  />
                </div>
              </div>
            </div>
            
            {/* Delivery Instructions */}
            <div className="mt-4">
              <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Instructions (Optional)
              </label>
              <textarea
                id="deliveryInstructions"
                name="deliveryInstructions"
                value={formData.deliveryInstructions}
                onChange={handleChange}
                rows="3"
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Any special instructions for the delivery driver"
              ></textarea>
            </div>
          </div>
        )}
        
        {/* Delivery Fee Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faInfoCircle} className="text-green-600 mt-1 mr-3" />
            <div>
              <h4 className="font-medium text-green-800">Delivery Fee</h4>
              <p className="text-green-700">
                {formData.deliveryMethod === 'PICKUP' ? (
                  'Free pickup at our store'
                ) : (
                  <>
                    {formData.county && formData.subCounty ? (
                      <>
                        <span className="font-semibold">{formatKES(deliveryFee)}</span> 
                        {' '}for{' '}
                        {formData.deliveryMethod === 'EXPRESS' ? 'express' : 'standard'} 
                        {' '}delivery to {formData.county}, {formData.subCounty}
                      </>
                    ) : (
                      'Select your location to see delivery fees'
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back
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

export default DeliveryInfoForm;
