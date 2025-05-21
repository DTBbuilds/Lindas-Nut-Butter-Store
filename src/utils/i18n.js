import { useState, useEffect, useCallback } from 'react';

// Default language (English)
const DEFAULT_LANGUAGE = 'en';

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  // Add more languages as needed
};

// Default translations (English)
const defaultTranslations = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      confirm: 'Are you sure?',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      noAccount: 'Don\'t have an account?',
      hasAccount: 'Already have an account?',
    },
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email',
      minLength: 'Must be at least {{min}} characters',
      maxLength: 'Must be at most {{max}} characters',
      passwordMismatch: 'Passwords do not match',
    },
    // Add more namespaces as needed
  },
  // Add more language translations as needed
};

// Load translations for a specific language
const loadTranslations = async (language) => {
  try {
    // In a real app, you would load translations from an API or separate files
    // For now, we'll use the default translations
    return defaultTranslations[language] || defaultTranslations[DEFAULT_LANGUAGE];
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
    return defaultTranslations[DEFAULT_LANGUAGE];
  }
};

// Create i18n instance
const createI18n = () => {
  let currentLanguage = DEFAULT_LANGUAGE;
  let translations = { ...defaultTranslations[DEFAULT_LANGUAGE] };
  let subscribers = [];

  // Notify all subscribers when language changes
  const notifySubscribers = () => {
    subscribers.forEach(callback => callback(currentLanguage));
  };

  // Get current language
  const getLanguage = () => currentLanguage;

  // Get list of supported languages
  const getSupportedLanguages = () => ({ ...SUPPORTED_LANGUAGES });

  // Set current language
  const setLanguage = async (language) => {
    if (!SUPPORTED_LANGUAGES[language]) {
      console.warn(`Language '${language}' is not supported`);
      return false;
    }

    if (language !== currentLanguage) {
      const newTranslations = await loadTranslations(language);
      if (newTranslations) {
        currentLanguage = language;
        translations = newTranslations;
        localStorage.setItem('userLanguage', language);
        notifySubscribers();
        return true;
      }
    }
    return false;
  };

  // Translate a key with optional parameters
  const t = (key, params = {}) => {
    if (!key) return '';

    // Split the key into namespace and path (e.g., 'common.loading')
    const [namespace, ...path] = key.split('.');
    
    // Get the translation
    let translation = translations[namespace];
    
    // Traverse the path (e.g., ['common', 'loading'])
    for (const part of path) {
      if (!translation || typeof translation !== 'object') {
        console.warn(`Translation not found for key: ${key}`);
        return key; // Return the key if translation not found
      }
      translation = translation[part];
    }

    // If translation is still an object, return the key
    if (typeof translation === 'object') {
      console.warn(`Translation for '${key}' is an object, expected string`);
      return key;
    }

    // Replace placeholders with params (e.g., 'Hello {{name}}' with { name: 'John' })
    if (translation && params) {
      return Object.entries(params).reduce(
        (result, [param, value]) => 
          result.replace(new RegExp(`{{${param}}}`, 'g'), String(value)),
        translation
      );
    }

    return translation || key;
  };

  // Format a number according to the current locale
  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(currentLanguage, options).format(number);
  };

  // Format a date according to the current locale
  const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Default options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return new Intl.DateTimeFormat(
      currentLanguage, 
      { ...defaultOptions, ...options }
    ).format(dateObj);
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD', options = {}) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  };

  // Subscribe to language changes
  const subscribe = (callback) => {
    subscribers.push(callback);
    return () => {
      subscribers = subscribers.filter(cb => cb !== callback);
    };
  };

  // Initialize
  const init = async () => {
    // Try to get language from localStorage or browser
    const savedLanguage = localStorage.getItem('userLanguage');
    const browserLanguage = navigator.language.split('-')[0];
    
    const languageToSet = 
      savedLanguage || 
      (SUPPORTED_LANGUAGES[browserLanguage] ? browserLanguage : DEFAULT_LANGUAGE);
    
    await setLanguage(languageToSet);
  };

  return {
    t,
    getLanguage,
    getSupportedLanguages,
    setLanguage,
    formatNumber,
    formatDate,
    formatCurrency,
    subscribe,
    init,
  };
};

// Create a single instance
const i18n = createI18n();

// React hook for using i18n
const useTranslation = (namespace) => {
  const [language, setLanguage] = useState(i18n.getLanguage());
  
  // Subscribe to language changes
  useEffect(() => {
    return i18n.subscribe((lang) => {
      setLanguage(lang);
    });
  }, []);
  
  // Create namespaced t function
  const t = useCallback((key, params) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return i18n.t(fullKey, params);
  }, [namespace]);
  
  return {
    t,
    i18n: {
      ...i18n,
      language,
    },
  };
};

// Initialize i18n
i18n.init();

export { i18n as default, useTranslation };
