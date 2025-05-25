import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminHeader = ({ title }) => {
  const { admin } = useAdminAuth();

  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors duration-200">
              <FontAwesomeIcon icon={faBell} />
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                3
              </span>
            </button>
          </div>
          
          {/* Admin Profile */}
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 rounded-full p-2">
              <FontAwesomeIcon icon={faUser} className="text-green-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{admin?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
