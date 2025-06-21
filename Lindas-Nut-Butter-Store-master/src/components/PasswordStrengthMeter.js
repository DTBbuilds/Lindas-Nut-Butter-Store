import React from 'react';
import PropTypes from 'prop-types';

const PasswordStrengthMeter = ({ password }) => {
  // Function to calculate password strength
  const calculateStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
    if (/[a-z]/.test(password)) strength += 1; // Has lowercase
    if (/[0-9]/.test(password)) strength += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special character
    
    return Math.min(strength, 5); // Max strength of 5
  };
  
  const strength = calculateStrength(password);
  
  // Determine label and color based on strength
  const getLabel = () => {
    switch (strength) {
      case 0: return { text: 'Very Weak', color: 'bg-red-500' };
      case 1: return { text: 'Weak', color: 'bg-red-400' };
      case 2: return { text: 'Fair', color: 'bg-yellow-500' };
      case 3: return { text: 'Good', color: 'bg-yellow-400' };
      case 4: return { text: 'Strong', color: 'bg-green-400' };
      case 5: return { text: 'Very Strong', color: 'bg-green-500' };
      default: return { text: '', color: 'bg-gray-200' };
    }
  };
  
  const { text, color } = getLabel();
  
  // Calculate width percentage based on strength
  const widthPercentage = (strength / 5) * 100;
  
  return (
    <div className="mt-2 mb-4 animate-fadeIn">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out`} 
          style={{ width: `${widthPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">Strength:</span>
        <span className={`text-xs font-medium ${
          strength <= 1 ? 'text-red-500' : 
          strength <= 3 ? 'text-yellow-500' : 
          'text-green-500'
        }`}>
          {text}
        </span>
      </div>
      
      {strength < 3 && password && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-200">
          <p className="font-medium mb-1">Password tips:</p>
          <ul className="list-disc pl-4 space-y-1">
            {password.length < 8 && <li>Use at least 8 characters</li>}
            {!/[A-Z]/.test(password) && <li>Include uppercase letters (A-Z)</li>}
            {!/[a-z]/.test(password) && <li>Include lowercase letters (a-z)</li>}
            {!/[0-9]/.test(password) && <li>Include numbers (0-9)</li>}
            {!/[^A-Za-z0-9]/.test(password) && <li>Include special characters (!@#$%^&*)</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

PasswordStrengthMeter.propTypes = {
  password: PropTypes.string.isRequired
};

export default PasswordStrengthMeter;
