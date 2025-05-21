/**
 * Handles image loading errors by providing a fallback image
 * @param {Event} event - The error event from the image
 * @param {string} fallbackSrc - The fallback image source
 * @param {string} [altText] - Alt text for the image (for better error reporting)
 */
export const handleImageError = (event, fallbackSrc, altText = '') => {
  const img = event.target;
  
  // Avoid infinite loop if fallback also fails
  if (img.src === fallbackSrc) {
    console.warn(`Could not load image: ${altText || 'Unknown image'}`);
    return;
  }
  
  console.warn(`Image failed to load: ${img.src}, using fallback`);
  img.src = fallbackSrc;
};

/**
 * Creates a responsive image URL with width parameter for dynamic resizing
 * @param {string} imageUrl - The original image URL
 * @param {number} [width] - The desired width in pixels
 * @returns {string} The processed image URL
 */
export const getResponsiveImageUrl = (imageUrl, width) => {
  if (!imageUrl) return '';
  
  // If no width specified or the URL is already from a CDN with size params, return as is
  if (!width || /[?&](width=|w=)/i.test(imageUrl)) {
    return imageUrl;
  }
  
  // If the URL is from a known CDN that supports resizing, add the width parameter
  if (imageUrl.includes('cloudinary.com')) {
    // Cloudinary URL format
    const parts = imageUrl.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1) {
      parts.splice(uploadIndex + 1, 0, `w_${width}`);
      return parts.join('/');
    }
  } else if (imageUrl.includes('imgix.net') || imageUrl.includes('images.unsplash.com')) {
    // Imgix or Unsplash URL format
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}w=${width}`;
  }
  
  // For other URLs, just return as is
  return imageUrl;
};

/**
 * Preloads an image and returns a promise that resolves when loaded
 * @param {string} src - The image source URL
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the image element
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error(`Failed to load image: ${src}`, error);
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
};

/**
 * Extracts the dominant color from an image
 * @param {string} imageUrl - The image URL
 * @returns {Promise<string>} A promise that resolves with the dominant color in hex format
 */
export const getDominantColor = async (imageUrl) => {
  // This is a simplified implementation
  // In a real app, you might want to use a library like 'fast-average-color'
  // or implement a more sophisticated color extraction algorithm
  
  try {
    // Default fallback color (a warm beige)
    return '#F5F5DC';
  } catch (error) {
    console.error('Error extracting dominant color:', error);
    return '#F5F5DC'; // Return default color on error
  }
};

/**
 * Creates a blurred image placeholder
 * @param {string} imageUrl - The image URL
 * @param {number} [width=20] - The width of the placeholder
 * @returns {string} A base64 encoded low-res placeholder
 */
export const createBlurredPlaceholder = (imageUrl, width = 20) => {
  // In a real implementation, you would:
  // 1. Load the image
  // 2. Create a canvas
  // 3. Draw a scaled-down version of the image
  // 4. Apply a blur effect
  // 5. Convert to base64
  
  // For now, return a very small placeholder
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
};
