/**
 * Video Path Fixer
 * 
 * This utility helps handle and fix problematic video paths in the frontend
 * It maps problematic video paths to their correct versions and provides
 * fallback mechanisms for missing videos
 */

// Map of problematic video paths to their fixed versions
const videoPathMappings = {
  // Old naming convention (vedio → video)
  '/videos/recipe-vedio-0.mp4': '/videos/recipe-video-0.mp4',
  '/videos/recipe-vedio-1.mp4': '/videos/recipe-video-1.mp4',
  '/videos/recipe-vedio-2.mp4': '/videos/recipe-video-2.mp4',
  '/videos/recipe-vedio-3.mp4': '/videos/recipe-video-3.mp4',
  
  // Paths with URL encoding
  '/videos/recipe%20vedio%200.mp4': '/videos/recipe-video-0.mp4',
  '/videos/recipe%20vedio%201.mp4': '/videos/recipe-video-1.mp4',
  '/videos/recipe%20vedio%202.mp4': '/videos/recipe-video-2.mp4',
  '/videos/recipe%20vedio%203.mp4': '/videos/recipe-video-3.mp4',
  
  // Paths with literal spaces
  '/videos/recipe vedio 0.mp4': '/videos/recipe-video-0.mp4',
  '/videos/recipe vedio 1.mp4': '/videos/recipe-video-1.mp4',
  '/videos/recipe vedio 2.mp4': '/videos/recipe-video-2.mp4',
  '/videos/recipe vedio 3.mp4': '/videos/recipe-video-3.mp4'
};

// List of available videos (to check if a video exists)
const availableVideos = [
  '/videos/recipe-video-0.mp4',
  '/videos/recipe-video-2.mp4'
];

/**
 * Fixes problematic video paths by replacing them with valid ones
 * @param {string} videoPath - The original video path
 * @returns {string} The fixed video path
 */
export const fixVideoPath = (videoPath) => {
  // Handle null or undefined paths
  if (!videoPath) {
    return null;
  }
  
  // If the path is in our mappings, return the fixed version
  if (videoPathMappings[videoPath]) {
    console.log(`Fixing video path: ${videoPath} → ${videoPathMappings[videoPath]}`);
    return videoPathMappings[videoPath];
  }
  
  // Check if the video contains spaces and replace with hyphens
  if (videoPath.includes(' ')) {
    const fixedPath = videoPath.replace(/ /g, '-');
    console.log(`Fixing video path with spaces: ${videoPath} → ${fixedPath}`);
    return fixedPath;
  }
  
  // Check if the video exists in our list of available videos
  if (!availableVideos.includes(videoPath)) {
    console.log(`Video not available: ${videoPath}`);
    return null;
  }
  
  // Otherwise return the original path
  return videoPath;
};

/**
 * Verify if a video exists in the public directory
 * @param {string} videoPath - The video path to verify
 * @returns {boolean} - True if video exists in our list, false otherwise
 */
export const videoExists = (videoPath) => {
  return availableVideos.includes(videoPath);
};

export default fixVideoPath;
