/**
 * Feedback Service
 * Handles feedback submission and retrieval from the API
 */
import { api } from '../utils/api';

class FeedbackService {
  /**
   * Submit feedback for an order
   * @param {object} feedbackData - Feedback data to submit
   * @returns {Promise<object>} Submission response
   */
  async submitFeedback(feedbackData) {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Check if feedback already exists for an order
   * @param {string} orderId - Order ID to check
   * @returns {Promise<boolean>} Whether feedback exists
   */
  async checkFeedbackExists(orderId) {
    try {
      const response = await api.get(`/feedback/order/${orderId}`);
      return !!response?.data;
    } catch (error) {
      // 404 means no feedback exists, which is not an error for this method
      if (error.response && error.response.status === 404) {
        return false;
      }
      console.error('Error checking feedback existence:', error);
      throw error;
    }
  }

  /**
   * Get feedback for an order
   * @param {string} orderId - Order ID to get feedback for
   * @returns {Promise<object>} Feedback data
   */
  async getOrderFeedback(orderId) {
    try {
      const response = await api.get(`/feedback/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting order feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   * @param {object} params - Query parameters (startDate, endDate)
   * @returns {Promise<object>} Feedback statistics
   */
  async getFeedbackStats(params = {}) {
    try {
      const response = await api.get('/feedback/stats/summary', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting feedback statistics:', error);
      throw error;
    }
  }

  /**
   * Get a paginated list of feedback
   * @param {object} params - Query parameters (page, limit, status, minRating, etc.)
   * @returns {Promise<object>} Paginated feedback list
   */
  async getFeedbackList(params = {}) {
    try {
      const response = await api.get('/feedback', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting feedback list:', error);
      throw error;
    }
  }
}

export default new FeedbackService();
