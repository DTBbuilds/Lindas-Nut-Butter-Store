/**
 * Notification Service
 * 
 * A centralized service for managing toast notifications across the application.
 * Uses react-toastify under the hood with enhancements for payment statuses
 * and other application-specific notifications.
 */

import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle, 
  faExclamationTriangle,
  faCreditCard,
  faSpinner,
  faBan,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';

const DEFAULT_OPTIONS = {
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  position: 'top-left',
};

/**
 * Create a toast notification with custom styling based on type
 * @param {string} message - Notification message
 * @param {string} type - Type of notification (success, error, info, warning)
 * @param {object} options - Additional options for the toast
 */
const showNotification = (message, type = 'info', options = {}) => {
  // Merge default options with provided options
  const toastOptions = { ...DEFAULT_OPTIONS, ...options };

  // Different icons for different notification types
  let icon;
  switch (type) {
    case 'success':
      icon = <FontAwesomeIcon icon={faCheckCircle} />;
      break;
    case 'error':
      icon = <FontAwesomeIcon icon={faExclamationCircle} />;
      break;
    case 'warning':
      icon = <FontAwesomeIcon icon={faExclamationTriangle} />;
      break;
    case 'info':
    default:
      icon = <FontAwesomeIcon icon={faInfoCircle} />;
      break;
  }

  toast[type](
    <div className="notification-content">
      {message}
    </div>,
    {
      ...toastOptions,
      icon: options.icon || icon
    }
  );
};

/**
 * Show a success notification
 * @param {string} message - Success message
 * @param {object} options - Additional options for the toast
 */
const showSuccess = (message, options = {}) => {
  showNotification(message, 'success', options);
};

/**
 * Show an error notification
 * @param {string} message - Error message
 * @param {object} options - Additional options for the toast
 */
const showError = (message, options = {}) => {
  showNotification(message, 'error', { autoClose: 5000, ...options });
};

/**
 * Show an info notification
 * @param {string} message - Info message
 * @param {object} options - Additional options for the toast
 */
const showInfo = (message, options = {}) => {
  showNotification(message, 'info', options);
};

/**
 * Show a warning notification
 * @param {string} message - Warning message
 * @param {object} options - Additional options for the toast
 */
const showWarning = (message, options = {}) => {
  showNotification(message, 'warning', { autoClose: 4000, ...options });
};

/**
 * Show a payment status notification
 * @param {string} title - Short payment status title
 * @param {string} message - Detailed payment message
 * @param {string} status - Payment status (INITIATED, PROCESSING, COMPLETED, FAILED, TIMEOUT)
 * @param {object} options - Additional options
 */
const showPaymentNotification = (title, message, status = 'PROCESSING', options = {}) => {
  let type = 'info';
  let icon;
  let autoClose = 3000;
  
  // Configure based on payment status
  switch (status) {
    case 'COMPLETED':
      type = 'success';
      icon = <FontAwesomeIcon icon={faCheckCircle} />;
      break;
    case 'FAILED':
      type = 'error';
      icon = <FontAwesomeIcon icon={faTimesCircle} />;
      autoClose = 5000;
      break;
    case 'TIMEOUT':
      type = 'warning';
      icon = <FontAwesomeIcon icon={faBan} />;
      autoClose = 4000;
      break;
    case 'INITIATED':
      icon = <FontAwesomeIcon icon={faCreditCard} />;
      break;
    case 'PROCESSING':
    default:
      icon = <FontAwesomeIcon icon={faSpinner} spin />;
      break;
  }

  const content = (
    <div className="notification-content">
      <div className="notification-title">{title}</div>
      <div className="notification-message">{message}</div>
    </div>
  );

  toast[type](content, {
    ...DEFAULT_OPTIONS,
    className: `toast-enhanced payment-notification payment-${status.toLowerCase()}`,
    autoClose,
    icon,
    ...options
  });
};

/**
 * Dismiss all active notifications
 */
const dismissAll = () => {
  toast.dismiss();
};

const notificationService = {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showPaymentNotification,
  dismissAll
};

export default notificationService;
