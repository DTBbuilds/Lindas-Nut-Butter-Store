import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'green' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  // Color classes
  const colorClasses = {
    green: 'border-green-600',
    blue: 'border-blue-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className={`animate-spin rounded-full border-t-transparent border-solid border-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
