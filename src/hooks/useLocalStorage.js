import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing local storage with type safety and expiration
 * @param {string} key - The key under which to store the value in local storage
 * @param {*} initialValue - The initial value to use if no value exists in local storage
 * @param {Object} options - Additional options
 * @param {number} options.expiresIn - Time in milliseconds after which the value should expire
 * @param {Function} options.serializer - Custom serializer function (default: JSON.stringify)
 * @param {Function} options.deserializer - Custom deserializer function (default: JSON.parse)
 * @returns {Array} - [storedValue, setValue, removeValue]
 */
const useLocalStorage = (
  key,
  initialValue = null,
  {
    expiresIn,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = {}
) => {
  // Get stored value from localStorage or use initial value
  const getStoredValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      
      // If no item exists, return initial value
      if (item === null) {
        return initialValue;
      }
      
      // Parse the stored JSON
      const parsed = deserializer(item);
      
      // Check for expiration
      if (expiresIn && parsed?.expiresAt) {
        const now = new Date().getTime();
        if (now > parsed.expiresAt) {
          // Value has expired, remove it
          window.localStorage.removeItem(key);
          return initialValue;
        }
      }
      
      // Return the parsed value (or the value itself if no wrapper object)
      return parsed?.value !== undefined ? parsed.value : parsed;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserializer, expiresIn]);
  
  // State to store our value
  const [storedValue, setStoredValue] = useState(getStoredValue);
  
  // Update state if the key changes
  useEffect(() => {
    setStoredValue(getStoredValue());
  }, [key, getStoredValue]);
  
  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Create the object to store (with expiration if needed)
      const valueToStoreObj = expiresIn
        ? {
            value: valueToStore,
            expiresAt: new Date().getTime() + expiresIn,
          }
        : valueToStore;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, serializer(valueToStoreObj));
      }
      
      // Return the stored value for consistency with useState
      return valueToStore;
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      return storedValue;
    }
  }, [key, storedValue, serializer, expiresIn]);
  
  // Remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      return initialValue;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return storedValue;
    }
  }, [key, initialValue, storedValue]);
  
  // Listen for storage events to keep multiple tabs in sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.storageArea === window.localStorage) {
        setStoredValue(getStoredValue());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, getStoredValue]);
  
  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
