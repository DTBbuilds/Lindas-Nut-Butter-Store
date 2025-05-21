import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing modal state and behavior
 * @param {Object} options - Configuration options
 * @param {boolean} options.initialOpen - Whether the modal should be open initially (default: false)
 * @param {boolean} options.closeOnEscape - Whether to close the modal when pressing Escape (default: true)
 * @param {boolean} options.closeOnOutsideClick - Whether to close when clicking outside the modal (default: true)
 * @param {Function} options.onOpen - Callback when the modal opens
 * @param {Function} options.onClose - Callback when the modal closes
 * @param {number} options.animationDuration - Duration of open/close animations in ms (default: 300)
 * @returns {Object} - Modal state and methods
 */
const useModal = ({
  initialOpen = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  onOpen,
  onClose,
  animationDuration = 300,
} = {}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const isMounted = useRef(true);
  const openTimeout = useRef(null);
  const closeTimeout = useRef(null);

  // Clean up timeouts when unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (openTimeout.current) clearTimeout(openTimeout.current);
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  // Handle outside click
  const handleOutsideClick = useCallback((e) => {
    if (
      closeOnOutsideClick &&
      modalRef.current &&
      !modalRef.current.contains(e.target)
    ) {
      close();
    }
  }, [closeOnOutsideClick]);

  // Add/remove click listener based on modal state
  useEffect(() => {
    if (isOpen && closeOnOutsideClick) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, closeOnOutsideClick, handleOutsideClick]);

  /**
   * Open the modal
   */
  const open = useCallback(() => {
    if (isOpen) return;
    
    if (openTimeout.current) clearTimeout(openTimeout.current);
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    
    setIsOpen(true);
    setIsAnimating(true);
    
    // Call onOpen callback after animation starts
    openTimeout.current = setTimeout(() => {
      if (isMounted.current) {
        setIsAnimating(false);
        if (typeof onOpen === 'function') {
          onOpen();
        }
      }
    }, 10); // Small delay to allow CSS transitions to work
  }, [isOpen, onOpen]);

  /**
   * Close the modal
   */
  const close = useCallback(() => {
    if (!isOpen) return;
    
    if (openTimeout.current) clearTimeout(openTimeout.current);
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    
    setIsAnimating(true);
    
    // Start close animation
    closeTimeout.current = setTimeout(() => {
      if (isMounted.current) {
        setIsOpen(false);
        setIsAnimating(false);
        
        // Call onClose callback after animation completes
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    }, animationDuration);
  }, [isOpen, onClose, animationDuration]);

  /**
   * Toggle the modal open/close state
   */
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    isAnimating,
    modalRef,
    open,
    close,
    toggle,
    animationDuration,
  };
};

export default useModal;
