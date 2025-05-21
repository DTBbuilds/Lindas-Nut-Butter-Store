import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingSpinner component
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - The message to display below the spinner
 * @param {string} [props.size='4rem'] - The size of the spinner
 * @param {string} [props.color='primary'] - The color of the spinner
 * @param {boolean} [props.fullPage=false] - Whether to take up the full page
 * @returns {JSX.Element} The LoadingSpinner component
 */
const LoadingSpinner = ({
  message = 'Loading...',
  size = '4rem',
  color = 'primary',
  fullPage = false
}) => {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...(fullPage && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 1300,
    })
  };

  return (
    <Box sx={containerStyles}>
      <CircularProgress 
        size={size} 
        color={color} 
        sx={{ mb: 2 }}
      />
      {message && (
        <Typography 
          variant="body1" 
          color="textSecondary"
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
