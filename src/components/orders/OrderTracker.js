import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleCheck, 
  faBox, 
  faTruck, 
  faHandHoldingHeart, 
  faSpinner, 
  faLocationDot 
} from '@fortawesome/free-solid-svg-icons';
import { formatOrderDate, getStatusColor } from '../../utils/orderUtils';

/**
 * Order Tracker Component
 * Displays a visual timeline of an order's status
 */
const OrderTracker = ({ order }) => {
  // Define the order stages and their corresponding icons
  const stages = [
    { key: 'PENDING', label: 'Order Placed', icon: faCircleCheck, description: 'Your order has been received and is awaiting processing.' },
    { key: 'PROCESSING', label: 'Processing', icon: faBox, description: 'Your order is being prepared and packaged at our store.' },
    { key: 'SHIPPED', label: 'Out for Delivery', icon: faTruck, description: 'Your order is on its way to your location.' },
    { key: 'DELIVERED', label: 'Delivered', icon: faHandHoldingHeart, description: 'Your order has been delivered successfully.' }
  ];

  // Determine the current stage index
  const getCurrentStageIndex = (status) => {
    const statusMap = {
      'PENDING': 0,
      'PROCESSING': 1,
      'SHIPPED': 2,
      'DELIVERED': 3,
      'CANCELLED': -1 // Special case
    };
    
    return statusMap[status] !== undefined ? statusMap[status] : 0;
  };

  const currentStageIndex = getCurrentStageIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  
  // Get the estimated delivery date (48 hours after order date)
  const getEstimatedDelivery = () => {
    if (!order.orderDate) return null;
    
    const orderDate = new Date(order.orderDate);
    const estimatedDate = new Date(orderDate);
    estimatedDate.setHours(orderDate.getHours() + 48); // 48 hours processing time
    
    return estimatedDate;
  };
  
  const estimatedDelivery = getEstimatedDelivery();
  const statusColors = getStatusColor(order.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fadeIn">
      {/* Order Status Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Order Status
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
          {order.status}
        </span>
      </div>
      
      {/* Cancelled Order Message */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                This order has been cancelled
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {order.cancellationReason || 'No reason provided for cancellation.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delivery Estimate */}
      {!isCancelled && estimatedDelivery && (
        <div className="mb-6 bg-gray-50 rounded-md p-4 border border-gray-200">
          <div className="flex items-start">
            <FontAwesomeIcon icon={faLocationDot} className="text-soft-green mt-1 mr-3" />
            <div>
              <p className="text-gray-700">
                <span className="font-medium">Estimated Delivery:</span> {formatOrderDate(estimatedDelivery, true)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Delivering to: {order.deliveryAddress}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Timeline */}
      {!isCancelled && (
        <div className="relative">
          {/* Timeline Track */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Timeline Stages */}
          <div className="space-y-8">
            {stages.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isActive = index === currentStageIndex;
              
              return (
                <div key={stage.key} className="relative flex items-start">
                  {/* Timeline Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-soft-green border-soft-green text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isActive && !isCompleted ? (
                      <FontAwesomeIcon icon={faSpinner} spin className="text-soft-green text-lg" />
                    ) : (
                      <FontAwesomeIcon icon={stage.icon} className={`${isCompleted ? 'text-white' : 'text-gray-400'} text-lg`} />
                    )}
                  </div>
                  
                  {/* Stage Content */}
                  <div className="ml-4 min-w-0 flex-1 pt-1.5">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {stage.label}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {stage.description}
                    </p>
                    
                    {/* Timestamp for completed stages */}
                    {isCompleted && order[`${stage.key.toLowerCase()}Date`] && (
                      <p className="mt-1 text-xs text-gray-400">
                        {formatOrderDate(order[`${stage.key.toLowerCase()}Date`], true)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

OrderTracker.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    orderNumber: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    orderDate: PropTypes.string,
    processingDate: PropTypes.string,
    shippedDate: PropTypes.string,
    deliveredDate: PropTypes.string,
    deliveryAddress: PropTypes.string,
    cancellationReason: PropTypes.string
  }).isRequired
};

export default OrderTracker;
