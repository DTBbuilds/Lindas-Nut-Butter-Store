import { useState, useEffect, useCallback } from 'react';

// Default breakpoints (can be overridden)
const defaultBreakpoints = {
  xs: 0,    // Extra small devices (portrait phones)
  sm: 576,  // Small devices (landscape phones)
  md: 768,  // Medium devices (tablets)
  lg: 992,  // Large devices (desktops)
  xl: 1200, // Extra large devices (large desktops)
  xxl: 1400 // Extra extra large devices
};

/**
 * Custom hook for responsive design
 * @param {Object} options - Configuration options
 * @param {Object} options.breakpoints - Custom breakpoints object
 * @param {boolean} options.ssr - Whether to use server-side rendering (default: false)
 * @returns {Object} - Responsive utilities and breakpoint matches
 */
const useResponsive = ({
  breakpoints: customBreakpoints,
  ssr = false,
} = {}) => {
  // Use custom breakpoints if provided, otherwise use defaults
  const breakpoints = customBreakpoints || defaultBreakpoints;
  
  // Sort breakpoints by size (smallest to largest)
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort(([, a], [, b]) => a - b);
  
  // Get the current breakpoint based on window width
  const getCurrentBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') {
      return ssr ? 'ssr' : 'xs'; // Default to 'xs' for SSR if not specified
    }
    
    const width = window.innerWidth;
    
    // Find the largest breakpoint that matches the current width
    let currentBreakpoint = 'xs';
    
    for (const [breakpoint, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        currentBreakpoint = breakpoint;
      } else {
        break;
      }
    }
    
    return currentBreakpoint;
  }, [sortedBreakpoints, ssr]);
  
  // State for current breakpoint
  const [currentBreakpoint, setCurrentBreakpoint] = useState(getCurrentBreakpoint());
  
  // Update breakpoint on window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const newBreakpoint = getCurrentBreakpoint();
      if (newBreakpoint !== currentBreakpoint) {
        setCurrentBreakpoint(newBreakpoint);
      }
    };
    
    // Set up event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentBreakpoint, getCurrentBreakpoint]);
  
  /**
   * Check if current viewport matches a breakpoint or range of breakpoints
   * @param {string|Object} query - Breakpoint query (e.g., 'md', '>sm', { min: 'sm', max: 'lg' })
   * @returns {boolean} - Whether the query matches
   */
  const isMatch = useCallback((query) => {
    if (typeof query === 'string') {
      // Handle string queries like '>sm', '<md', '>=lg', '<=xl', '=md'
      const match = query.match(/^(>=?|<=?|=)?(\w+)$/);
      
      if (!match) return false;
      
      const [, operator = '=', breakpointKey] = match;
      const breakpointValue = breakpoints[breakpointKey];
      const currentValue = breakpoints[currentBreakpoint];
      
      if (breakpointValue === undefined) return false;
      
      switch (operator) {
        case '>':
          return currentValue > breakpointValue;
        case '>=':
          return currentValue >= breakpointValue;
        case '<':
          return currentValue < breakpointValue;
        case '<=':
          return currentValue <= breakpointValue;
        case '=':
        default:
          return currentBreakpoint === breakpointKey;
      }
    } else if (typeof query === 'object' && query !== null) {
      // Handle object queries like { min: 'sm', max: 'lg' }
      const { min, max } = query;
      const currentValue = breakpoints[currentBreakpoint];
      
      let matches = true;
      
      if (min !== undefined) {
        const minValue = breakpoints[min];
        if (minValue !== undefined) {
          matches = matches && currentValue >= minValue;
        }
      }
      
      if (max !== undefined) {
        const maxValue = breakpoints[max];
        if (maxValue !== undefined) {
          matches = matches && currentValue <= maxValue;
        }
      }
      
      return matches;
    }
    
    return false;
  }, [breakpoints, currentBreakpoint]);
  
  /**
   * Get the current breakpoint value in pixels
   * @returns {number} - The current breakpoint value in pixels
   */
  const getBreakpointValue = useCallback((breakpoint) => {
    return breakpoints[breakpoint] || 0;
  }, [breakpoints]);
  
  // Generate responsive helpers (e.g., isXs, isSm, isMd, etc.)
  const responsiveHelpers = Object.keys(breakpoints).reduce((acc, breakpoint) => {
    acc[`is${breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)}`] = 
      currentBreakpoint === breakpoint;
    return acc;
  }, {});
  
  return {
    // Current breakpoint
    breakpoint: currentBreakpoint,
    
    // Breakpoint matching
    isMatch,
    
    // Breakpoint values
    breakpoints: {
      ...breakpoints,
      getValue: getBreakpointValue,
    },
    
    // Responsive helpers (e.g., isSm, isMd, etc.)
    ...responsiveHelpers,
    
    // Common responsive helpers
    isMobile: isMatch('<md'),
    isTablet: isMatch({ min: 'sm', max: 'lg' }),
    isDesktop: isMatch('>=lg'),
    
    // Current width (for SSR compatibility)
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    
    // Current height (for SSR compatibility)
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  };
};

export default useResponsive;
