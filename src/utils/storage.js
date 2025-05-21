/**
 * Storage utility with support for different storage backends and features
 */

// Storage types
const STORAGE_TYPES = {
  LOCAL: 'local',
  SESSION: 'session',
  MEMORY: 'memory',
};

// In-memory storage fallback
const memoryStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

/**
 * Get storage based on type
 * @param {string} type - Storage type (local, session, memory)
 * @returns {Object} - Storage implementation
 */
const getStorage = (type = STORAGE_TYPES.LOCAL) => {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }

  try {
    switch (type) {
      case STORAGE_TYPES.SESSION:
        return window.sessionStorage;
      case STORAGE_TYPES.MEMORY:
        return memoryStorage;
      case STORAGE_TYPES.LOCAL:
      default:
        return window.localStorage;
    }
  } catch (error) {
    console.warn(`Failed to access ${type} storage:`, error);
    return memoryStorage;
  }
};

/**
 * Creates a storage instance with additional features
 * @param {Object} options - Storage options
 * @param {string} options.type - Storage type (local, session, memory)
 * @param {string} options.prefix - Key prefix for namespacing
 * @param {number} options.expires - Default expiration time in milliseconds
 * @param {Function} options.encrypt - Encryption function (optional)
 * @param {Function} options.decrypt - Decryption function (optional)
 * @returns {Object} - Storage instance with enhanced methods
 */
const createStorage = (options = {}) => {
  const {
    type = STORAGE_TYPES.LOCAL,
    prefix = '',
    expires = 0,
    encrypt = null,
    decrypt = null,
  } = options;

  const storage = getStorage(type);
  
  // Add prefix to key
  const prefixKey = (key) => (prefix ? `${prefix}:${key}` : key);
  
  // Encrypt value if encrypt function is provided
  const maybeEncrypt = (value) => {
    if (typeof encrypt === 'function') {
      try {
        return encrypt(value);
      } catch (error) {
        console.error('Encryption failed:', error);
        return value;
      }
    }
    return value;
  };
  
  // Decrypt value if decrypt function is provided
  const maybeDecrypt = (value) => {
    if (typeof decrypt === 'function' && value !== null) {
      try {
        return decrypt(value);
      } catch (error) {
        console.error('Decryption failed:', error);
        return null;
      }
    }
    return value;
  };
  
  // Stringify value with expiration
  const stringify = (value, customExpires) => {
    const expiresAt = customExpires || expires;
    const data = {
      value,
      ...(expiresAt ? { _expires: Date.now() + expiresAt } : {}),
    };
    return JSON.stringify(data);
  };
  
  // Parse stored value and check expiration
  const parse = (value) => {
    if (value === null) return null;
    
    try {
      const data = JSON.parse(value);
      
      // Check if the item has expired
      if (data._expires && Date.now() > data._expires) {
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Failed to parse stored value:', error);
      return null;
    }
  };
  
  return {
    /**
     * Get an item from storage
     * @param {string} key - Item key
     * @param {*} defaultValue - Default value if item doesn't exist or is expired
     * @returns {*} - Stored value or defaultValue
     */
    get: (key, defaultValue = null) => {
      try {
        const fullKey = prefixKey(key);
        const encryptedValue = storage.getItem(fullKey);
        const decryptedValue = maybeDecrypt(encryptedValue);
        const value = parse(decryptedValue);
        
        // Remove if expired
        if (value === null) {
          storage.removeItem(fullKey);
          return defaultValue;
        }
        
        return value;
      } catch (error) {
        console.error(`Error getting item '${key}':`, error);
        return defaultValue;
      }
    },
    
    /**
     * Set an item in storage
     * @param {string} key - Item key
     * @param {*} value - Item value
     * @param {number} customExpires - Custom expiration time in milliseconds
     * @returns {boolean} - True if successful
     */
    set: (key, value, customExpires) => {
      try {
        const fullKey = prefixKey(key);
        const stringValue = stringify(value, customExpires);
        const encryptedValue = maybeEncrypt(stringValue);
        storage.setItem(fullKey, encryptedValue);
        return true;
      } catch (error) {
        console.error(`Error setting item '${key}':`, error);
        return false;
      }
    },
    
    /**
     * Remove an item from storage
     * @param {string} key - Item key
     * @returns {boolean} - True if successful
     */
    remove: (key) => {
      try {
        storage.removeItem(prefixKey(key));
        return true;
      } catch (error) {
        console.error(`Error removing item '${key}':`, error);
        return false;
      }
    },
    
    /**
     * Clear all items with the current prefix
     * @returns {boolean} - True if successful
     */
    clear: () => {
      try {
        if (!prefix) {
          storage.clear();
          return true;
        }
        
        // Only remove items with the current prefix
        const keysToRemove = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => storage.removeItem(key));
        return true;
      } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
      }
    },
    
    /**
     * Get all keys with the current prefix
     * @returns {string[]} - Array of keys
     */
    keys: () => {
      try {
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (!prefix || key.startsWith(prefix)) {
            keys.push(prefix ? key.substring(prefix.length + 1) : key);
          }
        }
        return keys;
      } catch (error) {
        console.error('Error getting storage keys:', error);
        return [];
      }
    },
    
    /**
     * Get the number of items with the current prefix
     * @returns {number} - Number of items
     */
    length: () => {
      try {
        if (!prefix) return storage.length;
        return this.keys().length;
      } catch (error) {
        console.error('Error getting storage length:', error);
        return 0;
      }
    },
    
    /**
     * Check if a key exists in storage
     * @param {string} key - Item key
     * @returns {boolean} - True if key exists
     */
    has: (key) => {
      return this.get(key) !== null;
    },
  };
};

// Default storage instance (localStorage)
const storage = createStorage();

// Export storage types and createStorage function
export {
  STORAGE_TYPES,
  createStorage,
  storage as default,
};
