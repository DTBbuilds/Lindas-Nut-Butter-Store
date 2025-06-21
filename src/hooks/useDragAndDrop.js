import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for implementing drag and drop functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.onDragStart - Callback when dragging starts
 * @param {Function} options.onDragOver - Callback when dragging over a drop target
 * @param {Function} options.onDrop - Callback when an item is dropped
 * @param {Function} options.onDragEnd - Callback when dragging ends (regardless of drop)
 * @param {boolean} options.enabled - Whether the drag and drop is enabled (default: true)
 * @param {string} options.acceptType - The data type to accept for drops (default: 'text/plain')
 * @returns {Object} - Drag and drop state and refs
 */
const useDragAndDrop = ({
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  enabled = true,
  acceptType = 'text/plain',
} = {}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragData, setDragData] = useState(null);
  const dragRef = useRef(null);
  const dropRef = useRef(null);
  const isMounted = useRef(true);

  // Set isMounted to false when the component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e) => {
    if (!enabled) return;
    
    try {
      // Set drag data
      if (dragData !== null) {
        e.dataTransfer.setData(acceptType, JSON.stringify(dragData));
      }
      
      // Set drag image if element is provided
      if (dragRef.current) {
        const rect = dragRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create a drag image if the browser supports it
        if (e.dataTransfer.setDragImage) {
          e.dataTransfer.setDragImage(dragRef.current, x, y);
        }
      }
      
      // Set drag effect
      e.dataTransfer.effectAllowed = 'move';
      
      // Update state
      if (isMounted.current) {
        setIsDragging(true);
      }
      
      // Call user callback
      if (typeof onDragStart === 'function') {
        onDragStart(e, dragData);
      }
    } catch (error) {
      console.error('Error in drag start handler:', error);
    }
  }, [dragData, enabled, onDragStart, acceptType]);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    if (!enabled) return;
    
    try {
      // Prevent default to allow drop
      e.preventDefault();
      
      // Set drop effect
      e.dataTransfer.dropEffect = 'move';
      
      // Update state
      if (isMounted.current) {
        setDragOver(true);
      }
      
      // Call user callback
      if (typeof onDragOver === 'function') {
        onDragOver(e, dragData);
      }
    } catch (error) {
      console.error('Error in drag over handler:', error);
    }
  }, [enabled, onDragOver, dragData]);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    if (!enabled) return;
    
    try {
      // Update state
      if (isMounted.current) {
        setDragOver(false);
      }
    } catch (error) {
      console.error('Error in drag leave handler:', error);
    }
  }, [enabled]);

  // Handle drop
  const handleDrop = useCallback((e) => {
    if (!enabled) return;
    
    try {
      // Prevent default behavior (open as link for some elements)
      e.preventDefault();
      e.stopPropagation();
      
      // Get the data
      const data = e.dataTransfer.getData(acceptType);
      let parsedData = null;
      
      // Parse the data if it exists
      if (data) {
        try {
          parsedData = JSON.parse(data);
        } catch (error) {
          console.error('Error parsing drop data:', error);
        }
      }
      
      // Update state
      if (isMounted.current) {
        setDragOver(false);
      }
      
      // Call user callback
      if (typeof onDrop === 'function') {
        onDrop(e, parsedData);
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error in drop handler:', error);
      return null;
    }
  }, [enabled, onDrop, acceptType]);

  // Handle drag end
  const handleDragEnd = useCallback((e) => {
    if (!enabled) return;
    
    try {
      // Update state
      if (isMounted.current) {
        setIsDragging(false);
        setDragOver(false);
      }
      
      // Call user callback
      if (typeof onDragEnd === 'function') {
        onDragEnd(e);
      }
    } catch (error) {
      console.error('Error in drag end handler:', error);
    }
  }, [enabled, onDragEnd]);

  // Set up event listeners for drag source
  useEffect(() => {
    const dragElement = dragRef.current;
    
    if (!dragElement || !enabled) return;
    
    dragElement.setAttribute('draggable', 'true');
    dragElement.addEventListener('dragstart', handleDragStart);
    dragElement.addEventListener('dragend', handleDragEnd);
    
    return () => {
      if (dragElement) {
        dragElement.removeEventListener('dragstart', handleDragStart);
        dragElement.removeEventListener('dragend', handleDragEnd);
      }
    };
  }, [handleDragStart, handleDragEnd, enabled]);

  // Set up event listeners for drop target
  useEffect(() => {
    const dropElement = dropRef.current || dragRef.current;
    
    if (!dropElement || !enabled) return;
    
    dropElement.addEventListener('dragover', handleDragOver);
    dropElement.addEventListener('dragleave', handleDragLeave);
    dropElement.addEventListener('drop', handleDrop);
    
    return () => {
      if (dropElement) {
        dropElement.removeEventListener('dragover', handleDragOver);
        dropElement.removeEventListener('dragleave', handleDragLeave);
        dropElement.removeEventListener('drop', handleDrop);
      }
    };
  }, [handleDragOver, handleDragLeave, handleDrop, enabled]);

  /**
   * Set the drag data
   * @param {*} data - The data to be transferred during drag and drop
   */
  const setData = useCallback((data) => {
    setDragData(data);
  }, []);

  return {
    // Refs
    dragRef,
    dropRef: dropRef || dragRef, // Use dragRef as fallback for dropRef
    
    // State
    isDragging,
    dragOver,
    
    // Methods
    setData,
    
    // Event handlers (for manual attachment)
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
  };
};

export default useDragAndDrop;
