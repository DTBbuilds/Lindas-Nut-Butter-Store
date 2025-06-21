import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// import axios from 'axios'; // Replaced by apiService for authenticated calls
import apiService from '../services/apiService'; // For making API calls through the service layer
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingBag, 
  faAddressCard, 
  faCreditCard, 
  faHeart, 
  faSignOutAlt,
  faSpinner,
  faEdit,
  faEye,
  faEyeSlash,
  faLock,
  faShield,
  faBell,
  faBoxOpen,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import ProfileEditForm from '../components/ProfileEditForm';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import NotificationPreferences from '../components/NotificationPreferences';
import OrderList from '../components/orders/OrderList';
import OrderDetails from '../components/orders/OrderDetails';
import { generateOrderNumber } from '../utils/orderUtils';
import { getUser, clearAuth } from '../utils/authUtils';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { API_ENDPOINTS } from '../config/api';

// Use the correct API URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    window.location.hostname === 'localhost' && window.location.port === '3000' ? 
      'http://localhost:5000' : 
      `http://${window.location.hostname}:5000` 
    : 
    ''
  );

const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationPreferences, setNotificationPreferences] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();
  const { user: contextUser, loading: contextLoading, initialCheckComplete } = useAuth();

  // Function to fetch customer orders from the API
  const fetchCustomerOrders = async (customerId) => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      // Token is now handled by apiService's request interceptor
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER_ORDERS(customerId), {
        params: {
          limit: 100 // Get up to 100 orders
        }
      });
      
      if (response && response.data && response.data.success) { // Added checks for response and response.data
        setOrders(response.data.data.orders || []); // Ensure orders is an array
      } else {
        const errorMsg = response && response.data ? response.data.message : 'Failed to load orders due to unexpected response';
        setOrderError(errorMsg);
        setOrders([]);
        toast.error(errorMsg, { containerId: 'main-toast-container' });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load orders. Please try again later.';
      setOrderError(errorMsg);
      setOrders([]);
      toast.error(errorMsg, { containerId: 'main-toast-container' });
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    // Page-level loading is true until AuthContext has resolved and we've acted on it.
    setLoading(true);
    if (!contextLoading && initialCheckComplete) {
      if (!contextUser) {
        toast.info('Please log in to access your account.', { containerId: 'main-toast-container' });
        navigate('/account/login');
        // setLoading(false) will be handled if navigate causes unmount or if not, it's already true.
      } else {
        setUserData(contextUser);
        if (contextUser._id) {
          fetchCustomerOrders(contextUser._id);
        }
        setLoading(false); // Auth resolved, user data set, page content can now be determined.
      }
    } else if (contextLoading) {
      // If context is still loading, keep the page loading spinner active.
      setLoading(true);
    }
    // If !contextLoading && !initialCheckComplete, AuthContext hasn't started its check yet or is in an unusual state.
    // In this case, we wait. The page remains loading.

  }, [contextUser, contextLoading, initialCheckComplete, navigate]);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully', { containerId: 'main-toast-container' });
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-soft-green" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Account</h1>
        
        {/* Back to Shop Button */}
        <Link to="/" className="bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center">
          <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
          Back to Shop
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-soft-green rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
              </div>
              <h2 className="font-bold text-xl">{userData?.name}</h2>
              <p className="text-gray-600 text-sm">{userData?.email}</p>
            </div>
            
            <nav>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'profile' 
                        ? 'bg-soft-green text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faUser} className="mr-3" />
                    Profile
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'orders' 
                        ? 'bg-soft-green text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faShoppingBag} className="mr-3" />
                    Orders
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'addresses' 
                        ? 'bg-soft-green text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faAddressCard} className="mr-3" />
                    Addresses
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('payment')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'payment' 
                        ? 'bg-soft-green text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCreditCard} className="mr-3" />
                    Payment Methods
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('wishlist')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'wishlist' 
                        ? 'bg-soft-green text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faHeart} className="mr-3" />
                    Wishlist
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'notifications' 
                        ? 'bg-soft-green text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <FontAwesomeIcon icon={faBell} className="mr-3" />
                    Notifications
                  </button>
                </li>
                <li className="border-t border-gray-200 mt-4 pt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 rounded-md flex items-center text-red-500 hover:bg-red-50"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-lg shadow-md p-6">
            {activeTab === 'profile' && (
              <div>
                {editMode ? (
                  <ProfileEditForm 
                    userData={userData} 
                    onCancel={() => setEditMode(false)} 
                    onUpdate={(updatedData) => {
                      setUserData(updatedData);
                      setEditMode(false);
                    }} 
                  />
                ) : (
                  <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                      <button 
                        onClick={() => setEditMode(true)}
                        className="flex items-center bg-soft-green hover:bg-rich-brown text-white font-medium py-2 px-4 rounded-md transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 hover-lift"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit Profile
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Profile Information Card */}
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 profile-card">
                        <div className="flex items-center mb-6">
                          <div className="w-20 h-20 bg-soft-green rounded-full flex items-center justify-center mr-4 shadow-md profile-image-container">
                            {userData?.profileImage ? (
                              <img 
                                src={userData.profileImage} 
                                alt={userData.name} 
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <FontAwesomeIcon icon={faUser} className="text-white text-2xl" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{userData?.name}</h3>
                            <p className="text-gray-600">{userData?.email}</p>
                            {userData?.phone && (
                              <p className="text-gray-500 text-sm mt-1">{userData.phone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Account Details</h4>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                              <div className="grid grid-cols-1 gap-3 stagger-item animate-slideIn">
                                <div>
                                  <span className="text-xs text-gray-500">Full Name</span>
                                  <p className="font-medium">{userData?.name}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Email Address</span>
                                  <p className="font-medium">{userData?.email}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Phone Number</span>
                                  <p className="font-medium">{userData?.phone || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {userData?.address && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Default Address</h4>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <p className="whitespace-pre-line">{userData.address}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Security Section */}
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 profile-card">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <FontAwesomeIcon icon={faShield} className="text-soft-green mr-2" />
                            Security Settings
                          </h3>
                          <button 
                            onClick={() => setShowSecuritySection(!showSecuritySection)}
                            className="text-soft-green hover:text-rich-brown transition-colors duration-300"
                          >
                            {showSecuritySection ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        
                        {showSecuritySection ? (
                          <div className="animate-fadeIn">
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              // Password change logic would go here
                              toast.info('Password change functionality will be implemented soon!');
                            }}>
                              <div className="space-y-4">
                                {/* Current Password */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currentPassword">
                                    Current Password
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                    </div>
                                    <input
                                      type={showPasswords.current ? 'text' : 'password'}
                                      id="currentPassword"
                                      value={passwordData.currentPassword}
                                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                                      placeholder="Enter current password"
                                    />
                                    <button
                                      type="button"
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                                    >
                                      <FontAwesomeIcon 
                                        icon={showPasswords.current ? faEyeSlash : faEye} 
                                        className="text-gray-400 hover:text-gray-600" 
                                      />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* New Password */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">
                                    New Password
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                    </div>
                                    <input
                                      type={showPasswords.new ? 'text' : 'password'}
                                      id="newPassword"
                                      value={passwordData.newPassword}
                                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                                      placeholder="Enter new password"
                                    />
                                    <button
                                      type="button"
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                    >
                                      <FontAwesomeIcon 
                                        icon={showPasswords.new ? faEyeSlash : faEye} 
                                        className="text-gray-400 hover:text-gray-600" 
                                      />
                                    </button>
                                  </div>
                                  
                                  {/* Password Strength Meter */}
                                  {passwordData.newPassword && (
                                    <PasswordStrengthMeter password={passwordData.newPassword} />
                                  )}
                                </div>
                                
                                {/* Confirm Password */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                                    Confirm New Password
                                  </label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                    </div>
                                    <input
                                      type={showPasswords.confirm ? 'text' : 'password'}
                                      id="confirmPassword"
                                      value={passwordData.confirmPassword}
                                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
                                      placeholder="Confirm new password"
                                    />
                                    <button
                                      type="button"
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                    >
                                      <FontAwesomeIcon 
                                        icon={showPasswords.confirm ? faEyeSlash : faEye} 
                                        className="text-gray-400 hover:text-gray-600" 
                                      />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="pt-2">
                                  <button
                                    type="submit"
                                    className="w-full bg-soft-green hover:bg-rich-brown text-white font-medium py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center hover-lift"
                                    disabled={changingPassword}
                                  >
                                    {changingPassword ? (
                                      <>
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                        Updating Password...
                                      </>
                                    ) : (
                                      'Change Password'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </form>
                            
                            <div className="mt-6 pt-4 border-t border-gray-100">
                              <Link 
                                to="/account/forgot-password" 
                                className="text-soft-green hover:text-rich-brown transition-colors duration-300 text-sm"
                              >
                                Forgot your password?
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-600 mb-4">Manage your account password and security settings</p>
                            <button
                              onClick={() => setShowSecuritySection(true)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-all duration-300 hover-lift"
                            >
                              Show Security Settings
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Order History</h2>
                
                {selectedOrderId ? (
                  // Show selected order details
                  <OrderDetails 
                    order={orders.find(order => order.id === selectedOrderId)}
                    onBack={() => setSelectedOrderId(null)}
                  />
                ) : (
                  // Show order list
                  <OrderList 
                    orders={orders}
                    isLoading={loadingOrders}
                    error={orderError}
                    onViewOrder={(orderId) => setSelectedOrderId(orderId)}
                  />
                )}
              </div>
            )}
            
            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Saved Addresses</h2>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No addresses saved yet.</p>
                  <button className="bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300">
                    Add New Address
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'payment' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Payment Methods</h2>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No payment methods saved.</p>
                  <button className="bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300">
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
                  <Link 
                    to="/shop" 
                    className="bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300"
                  >
                    Explore Products
                  </Link>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                {notificationPreferences ? (
                  <NotificationPreferences 
                    initialPreferences={notificationPreferences}
                    onSave={(updatedPreferences) => {
                      setNotificationPreferences(updatedPreferences);
                      // In a real app, this would be saved to the backend
                    }}
                  />
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-soft-green" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
