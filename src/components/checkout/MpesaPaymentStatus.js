import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faSpinner, faMobile, faRedoAlt, faClock, faTimes, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import notificationService from '../../services/notificationService';

/**
 * MpesaPaymentStatus Component
 * Displays detailed real-time status updates during M-Pesa payment processing
 */
const MpesaPaymentStatus = ({ 
  status, 
  transactionDetails,
  elapsedTime,
  onRetry,
  onCancel,
  timeoutSeconds = 60
}) => {
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min(Math.floor((elapsedTime / timeoutSeconds) * 100), 100);
  
  // Keep track of previous status to show notifications only on status change
  const prevStatusRef = useRef(null);
  
  // Show a notification when payment status changes
  useEffect(() => {
    // Only show notification if status changed (not on first render)
    if (prevStatusRef.current && prevStatusRef.current !== status) {
      const currentContent = statusContent[status] || statusContent['processing'];
      
      // Show appropriate notification based on payment status
      switch(status) {
        case 'completed':
          notificationService.showPaymentNotification(
            'Payment Successful', 
            `Your payment of KES ${transactionDetails?.amount || ''} has been confirmed.`,
            'COMPLETED'
          );
          break;
        case 'failed':
          // Extract more detailed error info if available
          const errorMessage = transactionDetails?.errorMessage || 
                               transactionDetails?.resultDesc ||
                               'Your payment could not be processed.';
            
          // Show more descriptive error notification
          notificationService.showPaymentNotification(
            'Payment Failed', 
            errorMessage,
            'FAILED'
          );
            
          // Log the full error details for debugging
          console.error('Payment failure details:', transactionDetails);
          break;
        case 'timeout':
          notificationService.showPaymentNotification(
            'Payment Timed Out', 
            'We did not receive a response from M-Pesa.',
            'TIMEOUT'
          );
          break;
        case 'cancelled':
          notificationService.showPaymentNotification(
            'Payment Cancelled', 
            'You cancelled the M-Pesa payment request.',
            'CANCELLED'
          );
          break;
        case 'processing':
          notificationService.showPaymentNotification(
            'Processing Payment', 
            'Your payment is being processed.',
            'PROCESSING'
          );
          break;
        case 'initiated':
          notificationService.showPaymentNotification(
            'Payment Initiated', 
            'Please check your phone for the M-Pesa prompt.',
            'INITIATED'
          );
          break;
        default:
          break;
      }
    }
    
    // Update previous status reference
    prevStatusRef.current = status;
  }, [status, transactionDetails]);
  
  // Define status-specific content
  const statusContent = {
    'initiated': {
      title: 'Payment Initiated',
      icon: faMobile,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      description: 'Please check your phone for the M-Pesa payment prompt and enter your PIN.'
    },
    'processing': {
      title: 'Processing Payment',
      icon: faSpinner,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      description: 'Your payment is being processed. This usually takes a few seconds.'
    },
    'completed': {
      title: 'Payment Successful',
      icon: faCheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      description: 'Your payment has been confirmed! Your order is now being processed.'
    },
    'failed': {
      title: 'Payment Failed',
      icon: faExclamationTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      description: (transactionDetails?.errorMessage || transactionDetails?.resultDesc) ? 
        `Error: ${transactionDetails?.errorMessage || transactionDetails?.resultDesc}. Please try again or choose a different payment method.` : 
        'Your payment could not be processed. This could be due to insufficient funds, incorrect phone number, or a technical issue.'
    },
    'timeout': {
      title: 'Payment Timed Out',
      icon: faClock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      description: 'We didn\'t receive a response from M-Pesa. This could be because the request was cancelled or due to network issues.'
    },
    'cancelled': {
      title: 'Payment Cancelled',
      icon: faTimes,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: 'You cancelled this payment request. You can try again or select a different payment method.'
    }
  };
  
  // Get content for current status
  const currentStatus = statusContent[status] || statusContent['processing'];
  
  return (
    <div className={`rounded-lg p-4 border ${currentStatus.borderColor} ${currentStatus.bgColor} mb-6`}>
      <div className="flex items-center mb-3">
        <FontAwesomeIcon 
          icon={currentStatus.icon} 
          className={`${currentStatus.color} h-6 w-6 mr-3 ${status === 'processing' ? 'fa-spin' : ''}`} 
        />
        <h3 className={`text-lg font-medium ${currentStatus.color}`}>{currentStatus.title}</h3>
      </div>
      
      {/* Progress bar for initiated and processing statuses */}
      {(status === 'initiated' || status === 'processing') && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}
      
      {/* Cancel button for initiated and processing statuses */}
      {(status === 'initiated' || status === 'processing') && onCancel && (
        <div className="flex justify-end mb-3">
          <button
            onClick={onCancel}
            className="flex items-center px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
            aria-label="Cancel payment"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-1" />
            Cancel Payment
          </button>
        </div>
      )}
      
      <p className="text-gray-700 mb-3">{currentStatus.description}</p>
      
      {/* Transaction details for completed payments */}
      {status === 'completed' && transactionDetails && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <h4 className="font-medium text-green-700 mb-2">Transaction Details:</h4>
          <ul className="text-sm space-y-1 text-gray-600">
            {transactionDetails.checkoutRequestId && (
              <li><span className="font-medium">Transaction ID:</span> {transactionDetails.checkoutRequestId}</li>
            )}
            {transactionDetails.amount && (
              <li><span className="font-medium">Amount:</span> KES {transactionDetails.amount}</li>
            )}
            {transactionDetails.timestamp && (
              <li><span className="font-medium">Time:</span> {new Date(transactionDetails.timestamp).toLocaleString()}</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Enhanced error details for failed payments */}
      {status === 'failed' && transactionDetails && (
        <div className="mt-3 pt-2 border-t border-red-200">
          <h4 className="font-medium text-red-700 mb-2">Error Details:</h4>
          <div className="bg-white p-3 rounded border border-red-200 text-sm">
            <p className="font-medium text-gray-800">{transactionDetails.resultDesc || transactionDetails.errorMessage || 'Payment could not be processed'}</p>
            {transactionDetails.resultCode && (
              <p className="text-gray-600 mt-1">Error code: {transactionDetails.resultCode}</p>
            )}
          </div>
        </div>
      )}

      {/* Retry option for failed and timeout statuses with enhanced UI */}
      {(status === 'failed' || status === 'timeout') && (
        <div className="mt-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <button
              onClick={onRetry}
              className="flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faRedoAlt} className="mr-2" />
              Try Again
            </button>
            
            <a href="/checkout" className="flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors text-center">
              <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
              Choose Another Payment Method
            </a>
          </div>
          
          {/* Help text for common issues with more detailed troubleshooting */}
          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
            <p className="font-medium mb-2">Troubleshooting Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure you have sufficient funds in your M-Pesa account</li>
              <li>Check that you entered the correct M-Pesa PIN</li>
              <li>Make sure your phone has network coverage</li>
              <li>Verify that you haven't exceeded your daily transaction limit</li>
            </ul>
            <p className="mt-2">If you continue to experience issues, please contact our support team.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MpesaPaymentStatus;
