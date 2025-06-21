import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faCheckCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  // Get resetPassword function from AuthContext
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is too weak',
    color: 'text-red-500'
  });

  // Check if token is valid on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // This is optional - you can verify the token validity before showing the form
        // await axios.get(`/api/customers/verify-reset-token/${token}`);
      } catch (err) {
        setTokenValid(false);
        setError('This password reset link is invalid or has expired. Please request a new one.');
        toast.error('Invalid or expired reset link');
      }
    };

    if (token) {
      verifyToken();
    } else {
      setTokenValid(false);
      setError('No reset token provided. Please request a new password reset link.');
    }
  }, [token]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        message: 'Password is too weak',
        color: 'text-red-500'
      });
      return;
    }

    // Simple password strength check
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[^A-Za-z0-9]/)) score += 1;

    let message, color;
    
    switch (score) {
      case 0:
      case 1:
        message = 'Password is too weak';
        color = 'text-red-500';
        break;
      case 2:
        message = 'Password strength: moderate';
        color = 'text-yellow-500';
        break;
      case 3:
        message = 'Password strength: good';
        color = 'text-blue-500';
        break;
      case 4:
        message = 'Password strength: excellent';
        color = 'text-green-500';
        break;
      default:
        message = 'Password is too weak';
        color = 'text-red-500';
    }

    setPasswordStrength({ score, message, color });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Please choose a stronger password');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Use resetPassword function from AuthContext
      await resetPassword(token, password);
      
      setIsSuccess(true);
      toast.success('Your password has been reset successfully!');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/account/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(
        err.message || 
        'Failed to reset password. This link may have expired.'
      );
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-beige py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-soft-green py-6 px-8">
          <h2 className="text-2xl font-bold text-white text-center">Set New Password</h2>
        </div>
        
        <div className="p-8">
          {!tokenValid ? (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <FontAwesomeIcon icon={faLock} className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Invalid Reset Link</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                to="/account/forgot-password"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-soft-green hover:bg-rich-brown focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green transition-colors duration-300"
              >
                Request New Link
              </Link>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Password Reset Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. You will be redirected to the login page shortly.
              </p>
              <Link
                to="/account/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-soft-green hover:bg-rich-brown focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green transition-colors duration-300"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6 text-center">
                Please enter your new password below.
              </p>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-soft-green focus:border-soft-green"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <FontAwesomeIcon 
                        icon={showPassword ? faEyeSlash : faEye} 
                        className="text-gray-400 hover:text-gray-600" 
                      />
                    </button>
                  </div>
                  {password && (
                    <p className={`mt-1 text-sm ${passwordStrength.color}`}>
                      {passwordStrength.message}
                    </p>
                  )}
                  <div className="mt-2 flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-full rounded-full ${
                          i < passwordStrength.score 
                            ? i === 0 
                              ? 'bg-red-500' 
                              : i === 1 
                                ? 'bg-yellow-500' 
                                : i === 2 
                                  ? 'bg-blue-500' 
                                  : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-soft-green focus:border-soft-green"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <FontAwesomeIcon 
                        icon={showConfirmPassword ? faEyeSlash : faEye} 
                        className="text-gray-400 hover:text-gray-600" 
                      />
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-soft-green hover:bg-rich-brown focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green transition-colors duration-300 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
          
          <div className="mt-6 text-center">
            <Link
              to="/account/login"
              className="flex items-center justify-center text-sm text-soft-green hover:text-rich-brown transition-colors duration-300"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
