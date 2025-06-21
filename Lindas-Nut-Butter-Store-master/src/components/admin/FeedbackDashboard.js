import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faThumbsUp, faThumbsDown, faUser, faComment, faSpinner } from '@fortawesome/free-solid-svg-icons';
import feedbackService from '../../services/feedbackService';

/**
 * Admin Feedback Dashboard
 * Shows feedback statistics and customer feedback
 */
const FeedbackDashboard = () => {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Fetch feedback statistics
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch statistics with retry logic
        const fetchStatsWithRetry = async (retries = 2) => {
          try {
            const response = await feedbackService.getFeedbackStats(dateRange);
            return response.data;
          } catch (error) {
            if (retries > 0) {
              console.log(`Retrying stats fetch, ${retries} attempts left`);
              return await fetchStatsWithRetry(retries - 1);
            }
            throw error;
          }
        };
        
        // Fetch feedback list with retry logic
        const fetchFeedbackWithRetry = async (retries = 2) => {
          try {
            const response = await feedbackService.getFeedbackList({
              page: 1,
              limit: 10,
              ...dateRange
            });
            return response.data.feedback || [];
          } catch (error) {
            if (retries > 0) {
              console.log(`Retrying feedback fetch, ${retries} attempts left`);
              return await fetchFeedbackWithRetry(retries - 1);
            }
            return []; // Return empty array on final failure
          }
        };
        
        // Execute both requests in parallel
        const [statsData, feedbackData] = await Promise.all([
          fetchStatsWithRetry(),
          fetchFeedbackWithRetry()
        ]);
        
        setStats(statsData);
        setFeedback(feedbackData);
      } catch (error) {
        console.error('Error fetching feedback data:', error);
        setError('Failed to load feedback data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [dateRange]);
  
  // Handle date range change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FontAwesomeIcon icon={faSpinner} className="text-green-600 text-4xl animate-spin mb-4" />
        <p className="text-gray-600">Loading feedback data...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // If no stats available yet
  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No feedback data available.</p>
      </div>
    );
  }
  
  // Calculate ratings color based on score
  const getRatingColor = (score) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Calculate NPS category colors
  const getNpsColor = (score) => {
    if (score >= 50) return 'bg-green-600';
    if (score >= 0) return 'bg-yellow-600';
    return 'bg-red-600';
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Customer Feedback Dashboard</h2>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Feedback */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Total Feedback</h3>
            <FontAwesomeIcon icon={faComment} className="text-blue-600 text-2xl" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalFeedback}</p>
          <p className="text-sm text-gray-500 mt-2">
            From {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
          </p>
        </div>
        
        {/* Overall Rating */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Average Rating</h3>
            <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-2xl" />
          </div>
          <p className={`text-3xl font-bold ${getRatingColor(stats.averageRatings.overall)}`}>
            {stats.averageRatings.overall}
            <span className="text-gray-500 text-sm font-normal"> / 5</span>
          </p>
          <div className="flex items-center mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <FontAwesomeIcon 
                key={star} 
                icon={faStar} 
                className={`text-sm ${star <= Math.round(stats.averageRatings.overall) ? 'text-yellow-500' : 'text-gray-300'}`} 
              />
            ))}
          </div>
        </div>
        
        {/* NPS Score */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">NPS Score</h3>
            <div className="flex space-x-2">
              <FontAwesomeIcon icon={faThumbsUp} className="text-green-600 text-xl" />
              <FontAwesomeIcon icon={faThumbsDown} className="text-red-600 text-xl" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${stats.nps.score >= 50 ? 'text-green-600' : stats.nps.score >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.nps.score}
          </p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getNpsColor(stats.nps.score)}`}
              style={{ width: `${Math.max(0, Math.min(100, stats.nps.score + 100) / 2)}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
            <div>
              <span className="text-red-600 font-medium">{stats.nps.detractors}</span> Detractors
            </div>
            <div className="text-center">
              <span className="text-yellow-600 font-medium">{stats.nps.passives}</span> Passives
            </div>
            <div className="text-right">
              <span className="text-green-600 font-medium">{stats.nps.promoters}</span> Promoters
            </div>
          </div>
        </div>
        
        {/* Product Quality */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Product Quality</h3>
            <FontAwesomeIcon icon={faUser} className="text-purple-600 text-2xl" />
          </div>
          <p className={`text-3xl font-bold ${getRatingColor(stats.averageRatings.productQuality)}`}>
            {stats.averageRatings.productQuality}
            <span className="text-gray-500 text-sm font-normal"> / 5</span>
          </p>
          <div className="flex items-center mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <FontAwesomeIcon 
                key={star} 
                icon={faStar} 
                className={`text-sm ${star <= Math.round(stats.averageRatings.productQuality) ? 'text-yellow-500' : 'text-gray-300'}`} 
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Category Ratings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-medium text-gray-800 mb-4">Category Ratings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Delivery Experience */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-gray-700 font-medium">Delivery Experience</h4>
              <p className={`font-bold ${getRatingColor(stats.averageRatings.deliveryExperience)}`}>
                {stats.averageRatings.deliveryExperience} / 5
              </p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  parseFloat(stats.averageRatings.deliveryExperience) >= 4.5 
                    ? 'bg-green-600' 
                    : parseFloat(stats.averageRatings.deliveryExperience) >= 3.5 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${(parseFloat(stats.averageRatings.deliveryExperience) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Customer Service */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-gray-700 font-medium">Customer Service</h4>
              <p className={`font-bold ${getRatingColor(stats.averageRatings.customerService)}`}>
                {stats.averageRatings.customerService} / 5
              </p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  parseFloat(stats.averageRatings.customerService) >= 4.5 
                    ? 'bg-green-600' 
                    : parseFloat(stats.averageRatings.customerService) >= 3.5 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${(parseFloat(stats.averageRatings.customerService) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Overall Experience */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-gray-700 font-medium">Overall Experience</h4>
              <p className={`font-bold ${getRatingColor(stats.averageRatings.overall)}`}>
                {stats.averageRatings.overall} / 5
              </p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  parseFloat(stats.averageRatings.overall) >= 4.5 
                    ? 'bg-green-600' 
                    : parseFloat(stats.averageRatings.overall) >= 3.5 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${(parseFloat(stats.averageRatings.overall) / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-medium text-gray-800 mb-4">Recent Feedback</h3>
        
        {feedback.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No feedback received in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NPS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedback.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getRatingColor(item.ratings.overall)}`}>
                          {item.ratings.overall}/5
                        </span>
                        <FontAwesomeIcon 
                          icon={faStar}
                          className={`ml-1 ${getRatingColor(item.ratings.overall)}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.recommendationScore >= 9
                            ? 'bg-green-100 text-green-800'
                            : item.recommendationScore >= 7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.recommendationScore}/10
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {item.comments || 'No comments provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboard;
