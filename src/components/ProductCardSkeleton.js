import React from 'react';

/**
 * ProductCardSkeleton component
 * Displays an animated placeholder while product cards are loading
 */
const ProductCardSkeleton = ({ index = 0 }) => {
  // Calculate delay class for staggered animation
  const delayClass = `stagger-delay-${index % 16}`; // Cycle through 16 delay classes
  
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden h-full shimmer-effect staggered-fade-in ${delayClass}`}>
      {/* Image placeholder */}
      <div className="relative">
        <div className="skeleton-loader pt-[100%]"></div>
      </div>
      
      {/* Content placeholders */}
      <div className="p-3 sm:p-4">
        {/* Title placeholder */}
        <div className="skeleton-loader h-5 w-4/5 mb-2"></div>
        
        {/* Size info placeholder */}
        <div className="skeleton-loader h-3 w-1/4 mb-3"></div>
        
        {/* Rating placeholder */}
        <div className="flex items-center mb-3">
          <div className="skeleton-loader h-3 w-1/3"></div>
        </div>
        
        {/* Price and button placeholder */}
        <div className="flex items-center justify-between mt-2">
          <div className="skeleton-loader h-5 w-1/3"></div>
          <div className="skeleton-loader h-6 w-6 rounded-full"></div>
        </div>
        
        {/* Description placeholder */}
        <div className="mt-3">
          <div className="skeleton-loader h-3 w-full mb-1"></div>
          <div className="skeleton-loader h-3 w-5/6 mb-1"></div>
          <div className="skeleton-loader h-3 w-4/5"></div>
        </div>
        
        {/* Button placeholder (for desktop) */}
        <div className="skeleton-loader h-9 w-full mt-3 rounded-md"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
