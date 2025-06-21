import { useEffect, useCallback, useRef } from 'react';

/**
 * Parse a keyboard shortcut string into a normalized format
 * @param {string} shortcut - The keyboard shortcut string (e.g., "ctrl+s", "shift+alt+1")
 * @returns {Object} - Normalized shortcut object
 */
const parseShortcut = (shortcut) => {
  if (!shortcut) return null;
  
  const keys = shortcut.toLowerCase().split('+').map(key => key.trim());
  
  return {
    ctrl: keys.includes('ctrl') || keys.includes('control') || keys.includes('meta') || keys.includes('cmd'),
    shift: keys.includes('shift'),
    alt: keys.includes('alt') || keys.includes('option'),
    key: keys.find(key => !['ctrl', 'control', 'shift', 'alt', 'option', 'meta', 'cmd'].includes(key)) || null,
    original: shortcut,
  };
};

/**
 * Check if a keyboard event matches a shortcut
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} shortcut - The normalized shortcut object
 * @returns {boolean} - Whether the event matches the shortcut
 */
const eventMatchesShortcut = (event, shortcut) => {
  if (!shortcut) return false;
  
  // Check modifier keys
  if (shortcut.ctrl !== (event.ctrlKey || event.metaKey)) return false;
  if (shortcut.shift !== event.shiftKey) return false;
  if (shortcut.alt !== event.altKey) return false;
  
  // Check the main key
  if (!shortcut.key) return false;
  
  // Handle special keys
  switch (shortcut.key) {
    case 'esc':
      return event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27;
    case 'enter':
      return event.key === 'Enter' || event.keyCode === 13;
    case 'tab':
      return event.key === 'Tab' || event.keyCode === 9;
    case 'space':
      return event.key === ' ' || event.key === 'Spacebar' || event.keyCode === 32;
    case 'up':
      return event.key === 'ArrowUp' || event.keyCode === 38;
    case 'down':
      return event.key === 'ArrowDown' || event.keyCode === 40;
    case 'left':
      return event.key === 'ArrowLeft' || event.keyCode === 37;
    case 'right':
      return event.key === 'ArrowRight' || event.keyCode === 39;
    case 'backspace':
      return event.key === 'Backspace' || event.keyCode === 8;
    case 'delete':
      return event.key === 'Delete' || event.keyCode === 46;
    case 'home':
      return event.key === 'Home' || event.keyCode === 36;
    case 'end':
      return event.key === 'End' || event.keyCode === 35;
    case 'pageup':
      return event.key === 'PageUp' || event.keyCode === 33;
    case 'pagedown':
      return event.key === 'PageDown' || event.keyCode === 34;
    default:
      // Handle single character keys
      if (shortcut.key.length === 1) {
        return event.key.toLowerCase() === shortcut.key.toLowerCase();
      }
      return false;
  }
};

/**
 * Custom hook for handling keyboard shortcuts
 * @param {string|string[]} shortcuts - The keyboard shortcut(s) to listen for
 * @param {Function} callback - The callback function to execute when the shortcut is pressed
 * @param {Object} options - Additional options
 * @param {boolean} options.enabled - Whether the shortcut is enabled (default: true)
 * @param {string} options.eventType - The event type to listen for ('keydown' | 'keyup' | 'keypress', default: 'keydown')
 * @param {HTMLElement|Window} options.target - The target element to attach the event listener to (default: window)
 * @param {boolean} options.preventDefault - Whether to prevent default behavior (default: true)
 * @param {boolean} options.stopPropagation - Whether to stop event propagation (default: true)
 */
const useKeyboardShortcut = (
  shortcuts,
  callback,
  {
    enabled = true,
    eventType = 'keydown',
    target = typeof window !== 'undefined' ? window : null,
    preventDefault = true,
    stopPropagation = true,
  } = {}
) => {
  const callbackRef = useRef(callback);
  const shortcutsRef = useRef(Array.isArray(shortcuts) ? shortcuts.map(parseShortcut) : [parseShortcut(shortcuts)]);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = Array.isArray(shortcuts) 
      ? shortcuts.map(parseShortcut) 
      : [parseShortcut(shortcuts)];
  }, [shortcuts]);
  
  // Handle keyboard events
  const handleKeyEvent = useCallback((event) => {
    if (!enabled || !callbackRef.current) return;
    
    // Check if any of the shortcuts match the current event
    const matchingShortcut = shortcutsRef.current.find(shortcut => 
      eventMatchesShortcut(event, shortcut)
    );
    
    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      // Execute the callback with the event and matching shortcut
      callbackRef.current(event, matchingShortcut.original);
    }
  }, [enabled, preventDefault, stopPropagation]);
  
  // Set up event listener
  useEffect(() => {
    if (!target || !enabled) return;
    
    // Add event listener
    target.addEventListener(eventType, handleKeyEvent);
    
    // Clean up
    return () => {
      target.removeEventListener(eventType, handleKeyEvent);
    };
  }, [target, eventType, handleKeyEvent, enabled]);
};

export default useKeyboardShortcut;
