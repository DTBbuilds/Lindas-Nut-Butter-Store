import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * Loading overlay component
 * Displays a fullscreen overlay with loading spinner and message
 */
const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <FontAwesomeIcon 
            icon={faSpinner} 
            spin 
            className="text-5xl text-green-600 mb-4" 
          />
          <p className="text-gray-700 text-lg text-center">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
