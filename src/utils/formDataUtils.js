/**
 * Converts a JavaScript object to FormData, handling nested objects and file uploads
 * @param {Object} data - The data to convert to FormData
 * @param {FormData} [formData=new FormData()] - Existing FormData instance (for recursion)
 * @param {string} [parentKey=''] - Parent key for nested objects (for recursion)
 * @returns {FormData} - The FormData instance
 */
export const objectToFormData = (data, formData = new FormData(), parentKey = '') => {
  if (data === null || data === undefined) {
    return formData;
  }

  // Handle FormData directly
  if (data instanceof FormData) {
    return data;
  }

  // Handle Date objects
  if (data instanceof Date) {
    formData.append(parentKey, data.toISOString());
    return formData;
  }

  // Handle File objects (must come before object check)
  if (data instanceof File) {
    formData.append(parentKey, data);
    return formData;
  }

  // Handle arrays and array-like objects
  if (Array.isArray(data) || (typeof data[Symbol.iterator] === 'function' && !(data instanceof File))) {
    // Handle file arrays specially
    if (data.length > 0 && (data[0] instanceof File || data[0] instanceof Blob)) {
      // Append each file with the same key (server will receive an array)
      data.forEach((file, index) => {
        if (file instanceof File || file instanceof Blob) {
          formData.append(parentKey, file, file.name || `file-${index}`);
        }
      });
    } else {
      // Handle regular arrays
      data.forEach((value, index) => {
        const key = parentKey ? `${parentKey}[${index}]` : String(index);
        if (value !== null && value !== undefined) {
          objectToFormData(value, formData, key);
        }
      });
    }
    return formData;
  }

  // Handle plain objects
  if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return; // Skip null/undefined values
      }
      
      const formKey = parentKey ? `${parentKey}[${key}]` : key;
      
      // Handle nested objects and arrays
      if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
        objectToFormData(value, formData, formKey);
      } else {
        // Handle primitive values and files
        if (value instanceof File || value instanceof Blob) {
          formData.append(formKey, value, value.name || key);
        } else if (typeof value === 'boolean') {
          formData.append(formKey, value ? '1' : '0');
        } else {
          formData.append(formKey, String(value));
        }
      }
    });
    return formData;
  }

  // Handle primitive values
  if (parentKey) {
    formData.append(parentKey, String(data));
  }
  
  return formData;
};

/**
 * Checks if a value is a file input element or contains files
 * @param {*} value - The value to check
 * @returns {boolean} - True if the value is a file input or contains files
 */
export const isFileInput = (value) => {
  if (!value) return false;
  
  // Check for FileList
  if (typeof FileList !== 'undefined' && value instanceof FileList) {
    return value.length > 0;
  }
  
  // Check for File or Blob
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  
  // Check for file input element
  if (typeof HTMLInputElement !== 'undefined' && 
      value instanceof HTMLInputElement && 
      value.type === 'file') {
    return value.files.length > 0;
  }
  
  return false;
};

/**
 * Gets files from a file input or file list
 * @param {HTMLInputElement|FileList|File|File[]} input - The file input or file list
 * @returns {File[]} - Array of files
 */
export const getFiles = (input) => {
  if (!input) return [];
  
  // Handle FileList
  if (typeof FileList !== 'undefined' && input instanceof FileList) {
    return Array.from(input);
  }
  
  // Handle single File
  if (typeof File !== 'undefined' && input instanceof File) {
    return [input];
  }
  
  // Handle file input element
  if (typeof HTMLInputElement !== 'undefined' && 
      input instanceof HTMLInputElement && 
      input.type === 'file') {
    return Array.from(input.files);
  }
  
  // Handle array of files
  if (Array.isArray(input) && input.every(item => item instanceof File)) {
    return [...input];
  }
  
  return [];
};

/**
 * Validates file input based on constraints
 * @param {File|File[]|FileList} files - The files to validate
 * @param {Object} [constraints] - Validation constraints
 * @param {string[]} [constraints.accept] - Allowed file types (e.g., ['image/*', '.pdf'])
 * @param {number} [constraints.maxSize] - Maximum file size in bytes
 * @param {number} [constraints.minFiles] - Minimum number of files
 * @param {number} [constraints.maxFiles] - Maximum number of files
 * @returns {{ isValid: boolean, errors: string[] }} - Validation result
 */
export const validateFiles = (files, constraints = {}) => {
  const fileList = getFiles(files);
  const errors = [];
  
  // Check minimum number of files
  if (constraints.minFiles !== undefined && fileList.length < constraints.minFiles) {
    errors.push(`At least ${constraints.minFiles} file(s) are required`);
  }
  
  // Check maximum number of files
  if (constraints.maxFiles !== undefined && fileList.length > constraints.maxFiles) {
    errors.push(`Maximum ${constraints.maxFiles} file(s) allowed`);
  }
  
  // Validate each file
  fileList.forEach((file, index) => {
    // Check file type
    if (constraints.accept && constraints.accept.length > 0) {
      const isTypeValid = constraints.accept.some(accept => {
        if (accept.startsWith('.')) {
          // Check file extension
          const ext = accept.toLowerCase();
          return file.name.toLowerCase().endsWith(ext);
        } else if (accept.includes('/')) {
          // Check MIME type
          if (accept.endsWith('/*')) {
            // Check type group (e.g., 'image/*')
            const typeGroup = accept.split('/')[0];
            return file.type.startsWith(`${typeGroup}/`);
          }
          // Check exact MIME type
          return file.type === accept;
        }
        return false;
      });
      
      if (!isTypeValid) {
        errors.push(`File '${file.name}' has an invalid type`);
      }
    }
    
    // Check file size
    if (constraints.maxSize !== undefined && file.size > constraints.maxSize) {
      const maxSizeMB = (constraints.maxSize / (1024 * 1024)).toFixed(2);
      errors.push(`File '${file.name}' exceeds the maximum size of ${maxSizeMB}MB`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Creates a file reader that returns a promise
 * @param {File} file - The file to read
 * @param {string} [method='readAsDataURL'] - The read method to use
 * @returns {Promise<string|ArrayBuffer>} - A promise that resolves with the file content
 */
export const readFile = (file, method = 'readAsDataURL') => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Call the appropriate read method
    if (method === 'readAsDataURL') {
      reader.readAsDataURL(file);
    } else if (method === 'readAsText') {
      reader.readAsText(file);
    } else if (method === 'readAsArrayBuffer') {
      reader.readAsArrayBuffer(file);
    } else if (method === 'readAsBinaryString') {
      reader.readAsBinaryString(file);
    } else {
      reject(new Error(`Unsupported read method: ${method}`));
    }
  });
};

/**
 * Creates an image preview for a file
 * @param {File} file - The image file
 * @param {Object} [options] - Preview options
 * @param {number} [options.maxWidth] - Maximum width of the preview
 * @param {number} [options.maxHeight] - Maximum height of the preview
 * @param {number} [options.quality=0.8] - Image quality (0-1)
 * @returns {Promise<string>} - A promise that resolves with the preview data URL
 */
export const createImagePreview = async (file, options = {}) => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  // Check if the file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
  
  const { maxWidth, maxHeight, quality = 0.8 } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (maxWidth && width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      if (maxHeight && height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL(file.type, quality);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
};

export default {
  objectToFormData,
  isFileInput,
  getFiles,
  validateFiles,
  readFile,
  createImagePreview,
};
