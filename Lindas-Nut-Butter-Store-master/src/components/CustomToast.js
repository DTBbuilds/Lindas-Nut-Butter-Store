import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

/**
 * CustomToast - Slim modern notification component
 * @param {Object} props
 * @param {'success'|'error'|'info'|'warning'} props.type
 * @param {string} props.message
 * @param {string} [props.title]
 * @returns {JSX.Element}
 */
const iconMap = {
  success: faCheckCircle,
  error: faTimesCircle,
  info: faInfoCircle,
  warning: faExclamationTriangle,
};

// More subtle color scheme for a modern look
const bgMap = {
  success: 'bg-green-50 border-green-400 text-green-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-blue-50 border-blue-400 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
};

// Icon colors for better visual hierarchy
const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

const CustomToast = ({ type = 'info', message, title }) => (
  <div 
    className={`flex items-center gap-2 px-3 py-2 rounded-md shadow border-l-2 backdrop-blur-sm bg-opacity-95 ${bgMap[type] || bgMap.info}`}
    style={{
      maxWidth: '320px',
      transition: 'all 0.2s ease',
    }}
  >
    <FontAwesomeIcon 
      icon={iconMap[type] || faInfoCircle} 
      className={`text-lg ${iconColorMap[type]}`}
    />
    <div className="flex-1 overflow-hidden">
      {title && <div className="font-medium text-sm">{title}</div>}
      <div className="text-xs text-opacity-90 leading-snug line-clamp-3">{message}</div>
    </div>
  </div>
);

export default CustomToast;
