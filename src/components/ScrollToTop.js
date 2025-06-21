import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Scrolls to top of the page when route changes
 * 
 * Handles special cases like hash links (#) and provides cross-browser compatibility
 */
function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // If there's a hash in the URL (like #section), don't scroll to top
    if (hash) {
      // Let the browser handle the hash scroll
      return;
    }

    // Multi-browser compatible scroll to top
    const scrollOptions = {
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' instead of 'smooth' for better UX during navigation
    };

    try {
      // Main scrolling method
      window.scrollTo(scrollOptions);
      
      // Fallbacks for older browsers
      setTimeout(() => {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0; // For Safari
        
        // Specific fix for iOS Safari
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          window.scrollTo(0, 0);
        }
      }, 0);
    } catch (error) {
      // Final fallback if all else fails
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key]); // Also react to location key changes for same-path navigations

  return null; // This component doesn't render anything
}

export default ScrollToTop;
