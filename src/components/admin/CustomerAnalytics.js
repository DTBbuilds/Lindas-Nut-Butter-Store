import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserPlus, 
  faShoppingCart, 
  faMoneyBillWave,
  faChartLine,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../LoadingSpinner';

const CustomerAnalytics = ({ customerStats }) => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  // Sample calculation for demonstration (in a real app, this would come from API)
  const growthPercentage = customerStats?.newCustomersPercentage || 0;
  const isPositiveGrowth = growthPercentage >= 0;

  // Check if customerStats data is available
  const isDataAvailable = customerStats && Object.keys(customerStats).length > 0;

  // Card components for metrics
  const MetricCard = ({ title, value, icon, subtext, subvalue, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 font-medium">{title}</h3>
        <span className={`text-${color}-500 bg-${color}-100 p-2 rounded-full`}>
          <FontAwesomeIcon icon={icon} />
        </span>
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      {subtext && (
        <div className="flex items-center mt-2 text-sm">
          <span className={`mr-1 ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`}>
            <FontAwesomeIcon icon={isPositiveGrowth ? faArrowUp : faArrowDown} />
          </span>
          <span className={`font-medium ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`}>
            {Math.abs(subvalue)}%
          </span>
          <span className="text-gray-500 ml-1">{subtext}</span>
        </div>
      )}
    </div>
  );

  // Render top customers table
  const renderTopCustomers = () => {
    if (!isDataAvailable || !customerStats.topCustomers || customerStats.topCustomers.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No customer data available for this period
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left font-medium text-gray-600">Customer</th>
              <th className="py-3 px-4 text-left font-medium text-gray-600">Orders</th>
              <th className="py-3 px-4 text-left font-medium text-gray-600">Total Spent</th>
              <th className="py-3 px-4 text-left font-medium text-gray-600">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customerStats.topCustomers.map((customer, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mr-3">
                      {customer.firstName?.[0]}{customer.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">{customer.orderCount || 0}</td>
                <td className="py-3 px-4">KES {customer.totalSpent?.toLocaleString() || 0}</td>
                <td className="py-3 px-4">{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    // In a real app, this would trigger a new data fetch
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Customer Analytics</h2>
        <div className="flex bg-gray-100 rounded-lg overflow-hidden">
          <button 
            className={`px-4 py-2 text-sm ${timeRange === 'week' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            onClick={() => handleTimeRangeChange('week')}
          >
            Weekly
          </button>
          <button 
            className={`px-4 py-2 text-sm ${timeRange === 'month' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            onClick={() => handleTimeRangeChange('month')}
          >
            Monthly
          </button>
          <button 
            className={`px-4 py-2 text-sm ${timeRange === 'year' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
            onClick={() => handleTimeRangeChange('year')}
          >
            Yearly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Customers" 
              value={isDataAvailable ? (customerStats.totalCustomers || 0) : 'N/A'}
              icon={faUsers}
              color="blue"
            />
            <MetricCard 
              title="New Customers" 
              value={isDataAvailable ? (customerStats.newCustomers || 0) : 'N/A'}
              subtext={`from last ${timeRange}`}
              subvalue={growthPercentage}
              icon={faUserPlus}
              color="green"
            />
            <MetricCard 
              title="Orders per Customer" 
              value={isDataAvailable ? (customerStats.ordersPerCustomer || 0).toFixed(1) : 'N/A'}
              icon={faShoppingCart}
              color="yellow"
            />
            <MetricCard 
              title="Average Order Value" 
              value={isDataAvailable ? `KES ${(customerStats.averageOrderValue || 0).toLocaleString()}` : 'N/A'}
              icon={faMoneyBillWave}
              color="purple"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg">Top Customers by Revenue</h3>
            </div>
            {renderTopCustomers()}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerAnalytics;
