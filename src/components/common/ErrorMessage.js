import React from 'react';
import PropTypes from 'prop-types';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

/**
 * ErrorMessage component for displaying API errors
 * @param {Object} props - Component props
 * @param {Error|string} props.error - The error object or message
 * @param {string} [props.title='Error'] - The title of the error message
 * @param {boolean} [props.showRetry=false] - Whether to show a retry button
 * @param {Function} [props.onRetry] - Callback for the retry button
 * @param {boolean} [props.showDetails=false] - Whether to show error details
 * @param {string} [props.severity='error'] - The severity of the error ('error', 'warning', 'info', 'success')
 * @returns {JSX.Element} The ErrorMessage component
 */
const ErrorMessage = ({
  error,
  title = 'Error',
  showRetry = false,
  onRetry,
  showDetails = false,
  severity = 'error',
  ...props
}) => {
  if (!error) return null;

  // Extract error message and details
  const errorMessage = typeof error === 'string' ? error : error.message || 'An unknown error occurred';
  const errorDetails = error?.response?.data || error?.data;
  const status = error?.status || error?.response?.status;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <Alert 
      severity={severity}
      sx={{ mb: 2, textAlign: 'left' }}
      {...props}
    >
      <AlertTitle>{title} {status && `(${status})`}</AlertTitle>
      <Box sx={{ mb: 1 }}>{errorMessage}</Box>
      
      {showDetails && errorDetails && (
        <Box 
          component="pre" 
          sx={{ 
            mt: 1, 
            p: 1, 
            bgcolor: 'background.paper', 
            borderRadius: 1, 
            fontSize: '0.75rem',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {JSON.stringify(errorDetails, null, 2)}
        </Box>
      )}
      
      {showRetry && (
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="outlined" 
            color={severity}
            size="small"
            onClick={handleRetry}
          >
            Retry
          </Button>
        </Box>
      )}
    </Alert>
  );
};

ErrorMessage.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.instanceOf(Error),
    PropTypes.string,
    PropTypes.shape({
      message: PropTypes.string,
      status: PropTypes.number,
      data: PropTypes.any,
      response: PropTypes.shape({
        status: PropTypes.number,
        data: PropTypes.any
      })
    })
  ]),
  title: PropTypes.string,
  showRetry: PropTypes.bool,
  onRetry: PropTypes.func,
  showDetails: PropTypes.bool,
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success'])
};

export default ErrorMessage;
