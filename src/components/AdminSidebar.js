import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, 
  faUsers, 
  faShoppingBag, 
  faMoneyBillAlt, 
  faChartLine, 
  faCog, 
  faSignOutAlt,
  faBars,
  faTimes,
  faCaretDown,
  faStore,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    customers: false,
    orders: false,
    reports: false,
    settings: false
  });

  // Check if the current path is active
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  // Toggle submenu
  const toggleSubmenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Mobile menu button - only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-green-600 text-white p-3 rounded-lg shadow-lg"
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {/* Sidebar */}
      <div 
        className={`lg:block fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out h-full overflow-y-auto`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/admin" className="flex items-center">
            <span className="text-2xl font-bold text-green-600">Linda's Admin</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {/* Dashboard */}
            <li>
              <Link
                to="/admin"
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  isActive('/admin') && !location.pathname.includes('/admin/')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <FontAwesomeIcon icon={faTachometerAlt} className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </Link>
            </li>

            {/* Customers */}
            <li>
              <div className="relative">
                <button
                  onClick={() => toggleSubmenu('customers')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isActive('/admin/customers')
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="w-5 h-5 mr-3" />
                    <span>Customers</span>
                  </div>
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`transition-transform duration-200 ${
                      expandedMenus.customers ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Customers Submenu */}
                <div
                  className={`mt-2 ml-6 space-y-2 overflow-hidden transition-all duration-300 ${
                    expandedMenus.customers ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <Link
                    to="/admin/customers"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/customers'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    All Customers
                  </Link>
                </div>
              </div>
            </li>

            {/* Orders */}
            <li>
              <div className="relative">
                <button
                  onClick={() => toggleSubmenu('orders')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isActive('/admin/orders')
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faShoppingBag} className="w-5 h-5 mr-3" />
                    <span>Orders</span>
                  </div>
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`transition-transform duration-200 ${
                      expandedMenus.orders ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Orders Submenu */}
                <div
                  className={`mt-2 ml-6 space-y-2 overflow-hidden transition-all duration-300 ${
                    expandedMenus.orders ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <Link
                    to="/admin/orders"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/orders'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    All Orders
                  </Link>
                  <Link
                    to="/admin/orders/pending"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/orders/pending'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Pending Orders
                  </Link>
                </div>
              </div>
            </li>

            {/* Transactions */}
            <li>
              <Link
                to="/admin/transactions"
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  isActive('/admin/transactions')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <FontAwesomeIcon icon={faMoneyBillAlt} className="w-5 h-5 mr-3" />
                <span>Transactions</span>
              </Link>
            </li>

            {/* Reports */}
            <li>
              <div className="relative">
                <button
                  onClick={() => toggleSubmenu('reports')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isActive('/admin/reports')
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 mr-3" />
                    <span>Reports</span>
                  </div>
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`transition-transform duration-200 ${
                      expandedMenus.reports ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Reports Submenu */}
                <div
                  className={`mt-2 ml-6 space-y-2 overflow-hidden transition-all duration-300 ${
                    expandedMenus.reports ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <Link
                    to="/admin/reports/sales"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/reports/sales'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Sales Reports
                  </Link>
                  <Link
                    to="/admin/reports/customers"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/reports/customers'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Customer Analytics
                  </Link>
                </div>
              </div>
            </li>

            {/* Settings */}
            <li>
              <div className="relative">
                <button
                  onClick={() => toggleSubmenu('settings')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isActive('/admin/settings')
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCog} className="w-5 h-5 mr-3" />
                    <span>Settings</span>
                  </div>
                  <FontAwesomeIcon
                    icon={faCaretDown}
                    className={`transition-transform duration-200 ${
                      expandedMenus.settings ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Settings Submenu */}
                <div
                  className={`mt-2 ml-6 space-y-2 overflow-hidden transition-all duration-300 ${
                    expandedMenus.settings ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <Link
                    to="/admin/settings/profile"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/settings/profile'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/admin/settings/store"
                    className={`block p-2 rounded-lg transition-colors duration-200 ${
                      location.pathname === '/admin/settings/store'
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    Store Settings
                  </Link>
                </div>
              </div>
            </li>
          </ul>
        </nav>

        {/* Back to Store and Logout */}
        <div className="px-4 mt-8 border-t border-gray-200 pt-4 space-y-3">
          {/* Back to Store */}
          <Link
            to="/"
            className="w-full flex items-center p-3 rounded-lg text-green-600 hover:bg-green-50 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faStore} className="w-5 h-5 mr-3" />
            <span>Back to Store</span>
          </Link>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
