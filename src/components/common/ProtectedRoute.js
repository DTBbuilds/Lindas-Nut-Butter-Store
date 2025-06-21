import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * ProtectedRoute component that handles authentication and authorization
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {string[]} [props.allowedRoles] - Array of allowed user roles (e.g., ['admin', 'editor'])
 * @param {string} [props.redirectPath] - Custom redirect path when access is denied
 * @param {string} [props.loadingMessage] - Custom loading message
 * @param {boolean} [props.requireEmailVerification] - Whether to require email verification
 * @returns {JSX.Element} The rendered component
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectPath = '/unauthorized',
  loadingMessage = 'Loading...',
  requireEmailVerification = false,
}) => {
  const { 
    user, 
    loading, 
    initialCheckComplete,
    isAuthenticated 
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user has required role
  const hasRequiredRole = () => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return user?.roles?.some(role => allowedRoles.includes(role));
  };

  // Check if email is verified if required
  const isEmailVerified = () => {
    if (!requireEmailVerification) return true;
    return user?.emailVerified === true;
  };

  // Handle redirect after authentication check is complete
  useEffect(() => {
    if (!initialCheckComplete) return;
    
    if (!isAuthenticated) {
      // Not authenticated, redirect to login
      navigate('/account/login', { 
        state: { from: location },
        replace: true 
      });
    } else if (!isEmailVerified() && location.pathname !== '/verify-email') {
      // Email not verified, redirect to verification page
      navigate('/verify-email', { 
        state: { from: location },
        replace: true 
      });
    } else if (!hasRequiredRole()) {
      // Role not authorized, redirect to unauthorized page
      navigate(redirectPath, { 
        state: { from: location },
        replace: true 
      });
    }
  }, [
    initialCheckComplete, 
    isAuthenticated, 
    location, 
    navigate, 
    redirectPath, 
    user
  ]);

  // Show loading state while checking auth status
  if (loading || !initialCheckComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/account/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check email verification if required
  if (requireEmailVerification && !isEmailVerified()) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (!hasRequiredRole()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ErrorMessage 
          error={{
            message: 'You do not have permission to access this page.',
            status: 403
          }}
          showRetry={false}
        />
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // If all checks pass, render the children
  return children;
};

export default ProtectedRoute;
