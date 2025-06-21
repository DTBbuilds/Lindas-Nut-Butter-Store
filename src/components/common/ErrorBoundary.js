import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Container, Typography, Box } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    
    // Log the error to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
          <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
            <Typography variant="h4" color="error" gutterBottom>
              Something went wrong
            </Typography>
            
            {this.props.showDetails && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left', overflowX: 'auto' }}>
                <Typography variant="subtitle1" color="textSecondary">
                  {this.state.error?.toString()}
                </Typography>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleReset}
                sx={{ mr: 2 }}
              >
                Try again
              </Button>
              
              {this.props.onHome && (
                <Button
                  variant="outlined"
                  onClick={this.props.onHome}
                >
                  Go to Home
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
  onHome: PropTypes.func,
  showDetails: PropTypes.bool,
};

export default ErrorBoundary;
