import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for implementing infinite scroll functionality
 * @param {Object} options - Configuration options
 * @param {boolean} options.hasMore - Whether there are more items to load
 * @param {boolean} options.isLoading - Whether data is currently being loaded
 * @param {Function} options.onLoadMore - Callback function to load more items
 * @param {number} options.threshold - Pixels from the bottom to trigger loading more (default: 200)
 * @param {number} options.debounce - Debounce time in milliseconds (default: 100)
 * @param {boolean} options.initialLoad - Whether to trigger initial load (default: true)
 * @returns {Object} - Refs and state for infinite scroll
 */
const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  debounce = 100,
  initialLoad = true,
}) => {
  const [isInitialLoad, setIsInitialLoad] = useState(initialLoad);
  const [isFetching, setIsFetching] = useState(false);
  const containerRef = useRef(null);
  const debounceTimeout = useRef(null);
  const isMounted = useRef(true);
  
  // Set isMounted to false when the component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);
  
  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!isMounted.current || !containerRef.current || isLoading || isFetching || !hasMore) {
      return;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPosition = scrollTop + clientHeight;
    const isNearBottom = scrollPosition >= scrollHeight - threshold;
    
    if (isNearBottom) {
      // Use debounce to prevent multiple rapid triggers
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      debounceTimeout.current = setTimeout(() => {
        if (isMounted.current) {
          setIsFetching(true);
          Promise.resolve(onLoadMore())
            .finally(() => {
              if (isMounted.current) {
                setIsFetching(false);
              }
            });
        }
      }, debounce);
    }
  }, [hasMore, isLoading, isFetching, onLoadMore, threshold, debounce]);
  
  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Initial load
    if (isInitialLoad && hasMore && !isLoading && !isFetching) {
      setIsInitialLoad(false);
      setIsFetching(true);
      Promise.resolve(onLoadMore())
        .finally(() => {
          if (isMounted.current) {
            setIsFetching(false);
          }
        });
    }
    
    // Add scroll event listener
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [handleScroll, hasMore, isInitialLoad, isLoading, isFetching, onLoadMore]);
  
  // Reset the scroll state
  const reset = useCallback(() => {
    if (isMounted.current) {
      setIsInitialLoad(initialLoad);
      setIsFetching(false);
    }
  }, [initialLoad]);
  
  return {
    containerRef,
    isFetching: isFetching || isLoading,
    reset,
  };
};

export default useInfiniteScroll;
