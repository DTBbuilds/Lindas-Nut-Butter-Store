import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import feedbackService from '../../services/feedbackService';

/**
 * Order Feedback Form Component
 * Allows customers to provide feedback after their order
 */
const FeedbackForm = ({ order, onFeedbackSubmitted, isComplete = false }) => {
  // Form state
  const [ratings, setRatings] = useState({
    overall: 0,
    productQuality: 0,
    deliveryExperience: 0,
    customerService: 0
  });
  const [recommendationScore, setRecommendationScore] = useState(0);
  const [comments, setComments] = useState('');
  const [allowFollowUp, setAllowFollowUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState(false);
  
  // Check if feedback already exists for this order
  useEffect(() => {
    const checkExisting = async () => {
      if (order && order.orderId) {
        try {
          const exists = await feedbackService.checkFeedbackExists(order.orderId);
          setFeedbackExists(exists);
          
          if (exists) {
            toast.info('You have already submitted feedback for this order.', {
              position: 'top-center',
              containerId: 'main-toast-container'
            });
          }
        } catch (error) {
          console.error('Error checking feedback existence:', error);
        }
      }
    };
    
    if (order) {
      checkExisting();
    }
  }, [order]);
  
  // Handle rating change
  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (ratings.overall === 0) {
      toast.error('Please provide an overall rating.', {
        position: 'top-center',
        containerId: 'main-toast-container'
      });
      return;
    }
    
    if (recommendationScore === 0) {
      toast.error('Please provide a recommendation score.', {
        position: 'top-center',
        containerId: 'main-toast-container'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        ratings,
        recommendationScore,
        comments,
        allowFollowUp
      };
      
      const response = await feedbackService.submitFeedback(feedbackData);
      
      if (response && response.success) {
        toast.success('Thank you for your feedback!', {
          position: 'top-center',
          autoClose: 3000,
          containerId: 'main-toast-container'
        });
        
        setFeedbackExists(true);
        
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      } else {
        throw new Error('Failed to submit feedback.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again later.', {
        position: 'top-center',
        containerId: 'main-toast-container'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render star rating component
  const StarRating = ({ rating, onRatingChange, disabled = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`text-xl focus:outline-none ${
              disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:text-yellow-500'
            } ${
              star <= rating
                ? 'text-yellow-500'
                : 'text-gray-300'
            }`}
            onClick={() => !disabled && onRatingChange(star)}
            disabled={disabled}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <FontAwesomeIcon icon={faStar} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? rating : ''} {rating === 1 ? 'star' : rating > 1 ? 'stars' : ''}
        </span>
      </div>
    );
  };
  
  // Render NPS score selector
  const NPSSelector = ({ value, onChange, disabled = false }) => {
    return (
      <div className="mt-2">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-red-500">Not likely</span>
          <span className="text-sm text-green-500">Very likely</span>
        </div>
        <div className="flex justify-between">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
            <button
              key={score}
              type="button"
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'
              } ${
                value === score
                  ? score >= 9
                    ? 'bg-green-500 text-white'
                    : score >= 7
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => !disabled && onChange(score)}
              disabled={disabled}
              aria-label={`Score ${score}`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">0</span>
          <span className="text-xs text-gray-500">5</span>
          <span className="text-xs text-gray-500">10</span>
        </div>
      </div>
    );
  };
  
  // If order is not defined or the feedback already exists, don't render form
  if (!order || (isComplete && feedbackExists)) {
    return null;
  }
  
  if (feedbackExists) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-700 mb-2">
          Thank You for Your Feedback!
        </h3>
        <p className="text-green-600">
          We appreciate you taking the time to share your thoughts about your order.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-green-600 text-white px-6 py-4">
        <h2 className="text-xl font-semibold">How was your experience?</h2>
        <p className="text-sm text-green-100">
          Your feedback helps us improve our products and service.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Overall Rating */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            Overall Experience <span className="text-red-500">*</span>
          </label>
          <StarRating 
            rating={ratings.overall} 
            onRatingChange={(value) => handleRatingChange('overall', value)}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Product Quality */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            Product Quality <span className="text-red-500">*</span>
          </label>
          <StarRating 
            rating={ratings.productQuality} 
            onRatingChange={(value) => handleRatingChange('productQuality', value)}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Delivery Experience */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            Delivery Experience <span className="text-red-500">*</span>
          </label>
          <StarRating 
            rating={ratings.deliveryExperience} 
            onRatingChange={(value) => handleRatingChange('deliveryExperience', value)}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Customer Service */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            Customer Service <span className="text-red-500">*</span>
          </label>
          <StarRating 
            rating={ratings.customerService} 
            onRatingChange={(value) => handleRatingChange('customerService', value)}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Recommendation Score */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            How likely are you to recommend us to a friend? <span className="text-red-500">*</span>
          </label>
          <NPSSelector 
            value={recommendationScore} 
            onChange={setRecommendationScore}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Comments */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">
            Additional Comments
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="4"
            placeholder="Tell us more about your experience..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Follow up */}
        <div className="mb-5">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              checked={allowFollowUp}
              onChange={(e) => setAllowFollowUp(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="ml-2 text-gray-700">
              I would like Linda's team to follow up with me about my feedback
            </span>
          </label>
        </div>
        
        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className={`w-full py-3 px-4 flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
