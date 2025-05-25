import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faUserPlus, faChartBar, faUser, 
  faArrowRight, faUserCog
} from '@fortawesome/free-solid-svg-icons';

const CustomerManagementWidget = ({ customerStats, recentCustomers }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Customer Management</h2>
        <Link 
          to="/admin/customers" 
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-300"
        >
          <span>View All Customers</span>
          <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Quick Customer Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              to="/admin/customers" 
              className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-colors duration-200"
            >
              <div className="p-2 bg-green-600 text-white rounded-full mr-3">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <span>Manage Customers</span>
            </Link>
            
            <Link 
              to="/admin/customers?filter=new" 
              className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors duration-200"
            >
              <div className="p-2 bg-blue-600 text-white rounded-full mr-3">
                <FontAwesomeIcon icon={faUserPlus} />
              </div>
              <span>New Customers</span>
              <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {customerStats?.newCustomers || 0}
              </span>
            </Link>
            
            <Link 
              to="/admin/reports/customers" 
              className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 transition-colors duration-200"
            >
              <div className="p-2 bg-purple-600 text-white rounded-full mr-3">
                <FontAwesomeIcon icon={faChartBar} />
              </div>
              <span>Customer Analytics</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Customers */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex justify-between items-center">
            <span>Recent Customers</span>
            <span className="text-sm text-gray-500 font-normal">Last 5 registrations</span>
          </h3>
          
          {recentCustomers && recentCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/admin/customers/${customer._id}`} 
                          className="text-green-600 hover:text-green-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No recent customers found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagementWidget;
