import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * Reusable spinner component for loading states
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color of the spinner
 * @param {string} props.className - Additional CSS classes
 */
export const Spinner = ({ 
  size = 'md', 
  color = 'current',
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  // Color classes
  const colorClasses = {
    current: 'text-current',
    white: 'text-white',
    green: 'text-green-600',
    yellow: 'text-yellow-500',
    blue: 'text-blue-500'
  };
  
  return (
    <span className={`inline-block ${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.current} ${className}`}>
      <FontAwesomeIcon 
        icon={faSpinner} 
        spin 
        className="animate-spin" 
      />
    </span>
  );
};

export default Spinner;
