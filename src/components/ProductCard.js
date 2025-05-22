import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faCartPlus, faHeart, faEye } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { formatKES } from '../utils/currencyUtils';
import { useCart } from '../contexts/CartContext';
import fixImagePath from '../utils/imagePathFixer';

const ProductCard = ({ product: propProduct, addToCart, isMobile = false }) => {
  // Ensure product has all required fields with defaults
  const product = {
    _id: propProduct?._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
    name: propProduct?.name || 'Product Name',
    description: propProduct?.description || 'No description available',
    price: Number(propProduct?.price) || 0,
    images: Array.isArray(propProduct?.images) && propProduct.images.length > 0 
      ? propProduct.images 
      : ['/images/placeholder.jpg'],
    category: propProduct?.category || 'Uncategorized',
    inventoryStatus: propProduct?.inventoryStatus || 'IN_STOCK',
    stockQuantity: Number(propProduct?.stockQuantity) || 0,
    sku: propProduct?.sku || `SKU-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    variants: Array.isArray(propProduct?.variants) ? propProduct.variants : [],
    rating: propProduct?.rating || 4.5,
    reviews: propProduct?.reviews || 0,
    size: propProduct?.size || '370g',
    ...propProduct // Spread any additional product properties
  };
  
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [expandedView, setExpandedView] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const cardRef = useRef(null);
  const { setCartAnimation } = useCart();
  
  // Use selected variant price or original price if no variant is selected
  const originalPrice = selectedVariant ? 
    (Number(selectedVariant.price) || 0) : 
    (Number(product.price) || 0);
  
  // Generate star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="text-golden-yellow" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FontAwesomeIcon key={i} icon={faStarHalfAlt} className="text-golden-yellow" />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={farStar} className="text-golden-yellow" />);
      }
    }
    
    return stars;
  };

  // Handle touch events for mobile interactions
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsTouched(true);
    
    // Add a short timer for immediate feedback
    setTimeout(() => {
      if (isTouched) {
        // Show quick options if held
        setExpandedView(true);
      }
    }, 200);
    
    // Reset touch state after a short delay
    setTimeout(() => setIsTouched(false), 300);
  };

  const handleTouchMove = (e) => {
    const touchDiff = touchStartY - e.touches[0].clientY;
    
    // If user swipes up more than 20px, show expanded view (reduced threshold for better responsiveness)
    if (touchDiff > 20) {
      setExpandedView(true);
    } else if (touchDiff < -20) {
      setExpandedView(false);
    }
  };
  
  const handleTouchEnd = () => {
    // Keep expanded view open for a bit after touch to allow reading
    if (expandedView) {
      // Don't immediately close the expanded view
      // Let user manually close it by tapping or swiping down
    }
    setIsTouched(false);
  };

  const handleAddToCart = () => {
    // Create a product copy with the selected variant information
    const productToAdd = {
      ...product,
      selectedVariant,
      // Update price to the selected variant price
      price: selectedVariant ? selectedVariant.price : product.price,
      // Update size to include the mass information
      size: selectedVariant ? `${selectedVariant.mass}g` : product.size,
      _id: product._id // Ensure backend _id is always present
    };

    // Provide haptic feedback on mobile if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Trigger add to cart animation
    setCartAnimation(true);
    
    // Call the addToCart function
    addToCart(productToAdd);
  };

  // Handle missing or invalid product data
  if (!product) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
        <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${isHovered ? 'shadow-lg scale-[1.02]' : ''} ${isTouched ? 'shadow-lg scale-[1.02]' : ''} ${isMobile ? 'active:bg-gray-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={cardRef}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      data-product-id={product._id}
      data-sku={product.sku}
    >
      {/* Top action buttons for quick add to cart on mobile - shown when touched */}
      <div className="absolute top-2 right-2 z-20 flex space-x-1">
        <button 
          className={`bg-white bg-opacity-90 backdrop-blur-sm p-2 rounded-full shadow-sm ${product.inventoryStatus === 'OUT_OF_STOCK' ? 'opacity-50' : 'active:scale-90'} transition-all duration-200`}
          onClick={(e) => {
            e.stopPropagation();
            if (product.inventoryStatus !== 'OUT_OF_STOCK') {
              handleAddToCart();
            }
          }}
          disabled={product.inventoryStatus === 'OUT_OF_STOCK'}
          aria-label="Add to cart"
        >
          <FontAwesomeIcon 
            icon={faCartPlus} 
            className={`text-rich-brown ${isTouched ? 'animate-pulse' : ''}`} 
          />
        </button>
      </div>
      
      {/* Product image with interactive overlay */}
      <div className="relative overflow-hidden bg-gray-100" style={{ paddingBottom: '75%' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={fixImagePath(product.images[0])} 
            alt={product.name} 
            className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${isMobile && isTouched ? 'scale-105' : ''}`}
            onError={(e) => {
              // Replace with inline SVG placeholder
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXdlaWdodD0iYm9sZCI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iOTUlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkxpbmRhJ3MgTnV0IEJ1dHRlcjwvdGV4dD4KPC9zdmc+';
            }}
          />
          
          {/* Category badge */}
          <div className="absolute top-2 left-2">
            <span className="bg-soft-green bg-opacity-90 text-white text-xs px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>
          
          {/* Out of stock overlay */}
          {product.inventoryStatus === 'OUT_OF_STOCK' && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white bg-opacity-90 px-3 py-1 rounded-lg text-red-600 font-medium text-sm">
                Out of Stock
              </div>
            </div>
          )}
          
          {/* Interactive overlay for desktop */}
          {!isMobile && (
            <div className={`absolute inset-0 bg-black transition-opacity duration-300 flex items-center justify-center ${isHovered ? 'bg-opacity-20' : 'bg-opacity-0'}`}>
              <div className={`flex gap-2 transform transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <button 
                  className="bg-white p-2 rounded-full hover:bg-soft-green hover:text-white transition-colors shadow-sm active:scale-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickViewOpen(true);
                  }}
                  aria-label="Quick view"
                >
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button 
                  className="bg-white p-2 rounded-full hover:bg-soft-green hover:text-white transition-colors shadow-sm active:scale-90"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Add to wishlist"
                >
                  <FontAwesomeIcon icon={faHeart} />
                </button>
              </div>
            </div>
          )}
          
          {/* Mobile touch indicator */}
          {isMobile && (
            <div className={`absolute bottom-2 right-2 transition-opacity duration-300 ${isTouched ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-white bg-opacity-80 px-2 py-1 rounded text-xs text-gray-700">
                <span>Tap and hold</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Product details */}
      <div className="p-3 sm:p-4">
        {/* Product name */}
        <h3 className="text-base font-bold text-rich-brown truncate" title={product.name}>
          {product.name}
          {!propProduct?.name && <span className="text-xs text-gray-500 ml-2">(No Name)</span>}
        </h3>
        
        {/* Size info */}
        <div className="mb-1">
          <span className="text-xs text-gray-500">
            {product.size || '200g'}
          </span>
        </div>
        
        {/* Star rating */}
        <div className="flex items-center mb-2">
          <div className="flex mr-1 text-xs">
            {renderStars(product.rating)}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>
        
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-base font-bold text-rich-brown">
              {formatKES(originalPrice)}
            </span>
            {product.inventoryStatus === 'LOW_STOCK' && (
              <span className="ml-2 text-xs text-yellow-600">Low Stock</span>
            )}
          </div>
          
          {/* Mobile-optimized add to cart button */}
          {isMobile && product.inventoryStatus !== 'OUT_OF_STOCK' && (
            <button
              className="bg-soft-green text-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-rich-brown transition-colors active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              aria-label="Add to cart"
            >
              <FontAwesomeIcon icon={faCartPlus} className="text-sm" />
            </button>
          )}
        </div>
        
        {/* Description - conditionally expanded on mobile */}
        <div className="mt-2">
          <p className={`text-xs sm:text-sm text-gray-600 ${expandedView ? '' : 'line-clamp-2'} transition-all duration-300`}>
            {product.description}
          </p>
          {product.description && product.description.length > 80 && (
            <button 
              className="text-xs text-soft-green mt-1 font-medium focus:outline-none active:scale-95 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedView(!expandedView);
              }}
            >
              {expandedView ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        
        {/* Desktop add to cart button */}
        {!isMobile && product.inventoryStatus !== 'OUT_OF_STOCK' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="w-full mt-3 py-2 bg-soft-green text-white rounded-md hover:bg-rich-brown transition-colors active:scale-98 flex items-center justify-center space-x-2"
          >
            <FontAwesomeIcon icon={faCartPlus} />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
