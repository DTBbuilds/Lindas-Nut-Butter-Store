import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faShoppingBag, 
  faAddressCard, 
  faCreditCard, 
  faHeart, 
  faSignOutAlt,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    
    if (!token) {
      navigate('/account/login');
      return;
    }
    
    // Load user data
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/customers/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Session expired. Please log in again.', { containerId: 'main-toast-container' });
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerEmail');
        localStorage.removeItem('customerName');
        navigate('/account/login');
      } finally {
        setLoading(false);
      }
    };
    
    // For now, use placeholder data since API isn't implemented yet
    setTimeout(() => {
      setUserData({
        name: localStorage.getItem('customerName') || 'Customer',
        email: localStorage.getItem('customerEmail') || 'customer@example.com',
        orders: [],
        addresses: [],
        paymentMethods: []
      });
      setLoading(false);
    }, 1000);
    
    // Uncomment when API is ready
    // fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
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
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">My Account</h1>
      
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
                <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userData?.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userData?.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div className="pt-4">
                    <button className="bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Order History</h2>
                {userData?.orders?.length > 0 ? (
                  <div className="space-y-4">
                    {userData.orders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-md p-4">
                        <p>Order #{order.id}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                    <Link 
                      to="/shop" 
                      className="bg-soft-green hover:bg-soft-green-dark text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                      Start Shopping
                    </Link>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
