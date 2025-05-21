import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faCartPlus, faHeart, faEye } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { formatKES } from '../utils/currencyUtils';
import { useCart } from '../contexts/CartContext';
import fixImagePath from '../utils/imagePathFixer';

const ProductCard = ({ product: propProduct, addToCart }) => {
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
    setTimeout(() => setIsTouched(false), 300);
  };

  const handleTouchMove = (e) => {
    const touchDiff = touchStartY - e.touches[0].clientY;
    
    // If user swipes up more than 30px, show expanded view
    if (touchDiff > 30) {
      setExpandedView(true);
    } else if (touchDiff < -30) {
      setExpandedView(false);
    }
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
      ref={cardRef}
      className={`bg-white rounded-xl shadow-md transform transition-all duration-300 relative ${isTouched ? 'scale-[0.98]' : ''} ${isHovered ? 'shadow-lg sm:scale-[1.03]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsTouched(false)}
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
      
      {/* Out of stock badge */}
      {product.inventoryStatus === 'OUT_OF_STOCK' && (
        <div className="absolute top-2 left-2 bg-rich-brown text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
          Out of Stock
        </div>
      )}
      
      {/* Product image with touch feedback */}
      <div className="relative overflow-hidden rounded-t-xl">
        <div className="pt-[100%] relative">
          <img
            src={product.images && product.images.length > 0 
              ? product.images[0].startsWith('http') 
                ? product.images[0] 
                : fixImagePath(`${product.images[0].startsWith('/') ? '' : '/'}${product.images[0]}`)
              : '/images/placeholder.png'
            }
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${isHovered || isTouched ? 'scale-110' : 'scale-100'}`}
            loading="lazy"
            onError={(e) => {
              console.log(`Image failed to load: ${e.target.src}`);
              // Use a base64 placeholder image on error
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlZWVlIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXdlaWdodD0iYm9sZCI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iOTUlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkxpbmRhJ3MgTnV0IEJ1dHRlcjwvdGV4dD4KPC9zdmc+';
            }}
          />
          
          {/* Interactive overlay for desktop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 flex items-center justify-center ${isHovered ? 'bg-opacity-20' : 'bg-opacity-0'}`}
          >
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
        </div>
      </div>
      
      {/* Product details */}
      <div className="p-4">
        {/* Category and size */}
        <div className="mb-1">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {product.category || 'Uncategorized'} • {product.size || '200g'}
          </span>
        </div>
        
        {/* Product name */}
        <h3 className="text-base sm:text-lg font-bold mb-1 text-rich-brown truncate" title={product.name}>
          {product.name}
          {!propProduct?.name && <span className="text-xs text-gray-500 ml-2">(No Name)</span>}
        </h3>
        
        {/* Star rating */}
        <div className="flex items-center mb-2">
          <div className="flex mr-1 text-xs sm:text-sm">
            {renderStars(product.rating)}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>
        
        {/* Price and stock status */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-rich-brown">
              {formatKES(originalPrice)}
            </span>
            {product.inventoryStatus === 'OUT_OF_STOCK' && (
              <span className="ml-2 text-xs text-red-600 font-medium">Out of Stock</span>
            )}
            {product.inventoryStatus === 'LOW_STOCK' && (
              <span className="ml-2 text-xs text-yellow-600">Low Stock</span>
            )}
          </div>
        </div>
        
        {/* Description - conditionally expanded on mobile */}
        <div className="mt-3">
          <p className={`text-sm text-gray-600 ${expandedView ? '' : 'line-clamp-2'} transition-all duration-300`}>
            {product.description}
          </p>
          {product.description && product.description.length > 100 && (
            <button 
              className="text-xs text-soft-green mt-1 font-medium focus:outline-none active:scale-95 transition-transform"
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
