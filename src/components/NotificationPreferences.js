import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faEnvelope, 
  faMobile, 
  faTag, 
  faTruck, 
  faPercent,
  faSave,
  faSpinner,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const NotificationPreferences = ({ initialPreferences = {}, onSave }) => {
  // Default preferences if none provided
  const defaultPreferences = {
    email: {
      orderUpdates: true,
      promotions: true,
      newProducts: false,
      newsletter: false
    },
    sms: {
      orderUpdates: false,
      promotions: false,
      deliveryAlerts: true
    }
  };

  const [preferences, setPreferences] = useState(
    initialPreferences.email || initialPreferences.sms 
      ? initialPreferences 
      : defaultPreferences
  );
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggle = (channel, type) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success animation
      setSaveSuccess(true);
      
      // Show success message
      toast.success('Notification preferences updated!');
      
      // Call the onSave callback with updated preferences
      if (onSave) {
        onSave(preferences);
      }
      
      // Reset success state after animation completes
      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 animate-fadeIn">
      <div className="flex items-center mb-6">
        <FontAwesomeIcon icon={faBell} className="text-soft-green text-xl mr-3" />
        <h3 className="text-xl font-bold text-gray-800">Notification Preferences</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 animate-slideIn">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-600 mr-2" />
              <h4 className="font-medium text-gray-800">Email Notifications</h4>
            </div>
            
            <div className="space-y-3 pl-2">
              <div className="flex items-center justify-between">
                <label htmlFor="email-orders" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faTruck} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">Order Updates</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="email-orders" 
                    checked={preferences.email.orderUpdates} 
                    onChange={() => handleToggle('email', 'orderUpdates')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="email-orders" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.email.orderUpdates ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="email-promotions" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faPercent} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">Promotions & Discounts</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="email-promotions" 
                    checked={preferences.email.promotions} 
                    onChange={() => handleToggle('email', 'promotions')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="email-promotions" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.email.promotions ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="email-products" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faTag} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">New Product Announcements</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="email-products" 
                    checked={preferences.email.newProducts} 
                    onChange={() => handleToggle('email', 'newProducts')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="email-products" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.email.newProducts ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="email-newsletter" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">Monthly Newsletter</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="email-newsletter" 
                    checked={preferences.email.newsletter} 
                    onChange={() => handleToggle('email', 'newsletter')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="email-newsletter" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.email.newsletter ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
            </div>
          </div>
          
          {/* SMS Notifications */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 animate-slideIn" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center mb-4">
              <FontAwesomeIcon icon={faMobile} className="text-gray-600 mr-2" />
              <h4 className="font-medium text-gray-800">SMS Notifications</h4>
            </div>
            
            <div className="space-y-3 pl-2">
              <div className="flex items-center justify-between">
                <label htmlFor="sms-orders" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faTruck} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">Order Updates</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="sms-orders" 
                    checked={preferences.sms.orderUpdates} 
                    onChange={() => handleToggle('sms', 'orderUpdates')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="sms-orders" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.sms.orderUpdates ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="sms-promotions" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faPercent} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">Promotions & Discounts</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="sms-promotions" 
                    checked={preferences.sms.promotions} 
                    onChange={() => handleToggle('sms', 'promotions')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="sms-promotions" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.sms.promotions ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="sms-delivery" className="flex items-center cursor-pointer">
                  <FontAwesomeIcon icon={faTruck} className="text-gray-500 mr-2 w-5" />
                  <span className="text-sm">Delivery Alerts</span>
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input 
                    type="checkbox" 
                    id="sms-delivery" 
                    checked={preferences.sms.deliveryAlerts} 
                    onChange={() => handleToggle('sms', 'deliveryAlerts')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out"
                  />
                  <label 
                    htmlFor="sms-delivery" 
                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${preferences.sms.deliveryAlerts ? 'bg-soft-green' : 'bg-gray-300'}`}
                  ></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 animate-slideIn" style={{ animationDelay: '0.2s' }}>
          <button
            type="submit"
            className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green transition-all duration-300 flex items-center ${
              saveSuccess 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-soft-green hover:bg-rich-brown'
            }`}
            disabled={saving}
          >
            {saving ? (
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
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;
