import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faCartPlus, faHeart, faEye, faCheck, faShoppingBag, faLeaf, faGlobeAfrica, faSeedling, faCarrot, faAlignLeft, faCircle } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { formatKES } from '../utils/currencyUtils';
import { useCart } from '../contexts/CartContext';
import { SERVER_BASE_URL } from '../config/api';

import '../styles/animations.css';

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
    features: propProduct?.features || [],
    isOrganic: propProduct?.isOrganic || propProduct?.organic || false,
    isVegan: propProduct?.isVegan || propProduct?.vegan || false,
    isGlutenFree: propProduct?.isGlutenFree || propProduct?.glutenFree || false,
    isLocallySourced: propProduct?.isLocallySourced || propProduct?.locallySourced || true,
    ...propProduct // Spread any additional product properties
  };
  
  // Extract key features based on product description and category
  const extractedFeatures = [];
  
  // Add organic feature if product is organic
  if (product.isOrganic || product.category?.toLowerCase().includes('organic') || 
      product.name?.toLowerCase().includes('organic')) {
    extractedFeatures.push({ icon: faLeaf, text: 'Organic', color: 'text-green-600' });
  }
  
  // Add locally sourced feature
  if (product.isLocallySourced || product.name?.toLowerCase().includes('local')) {
    extractedFeatures.push({ icon: faGlobeAfrica, text: 'Locally Sourced', color: 'text-amber-600' });
  }
  
  // Add vegan feature if applicable
  if (product.isVegan || product.category?.toLowerCase().includes('vegan') || 
      product.name?.toLowerCase().includes('vegan')) {
    extractedFeatures.push({ icon: faSeedling, text: 'Vegan', color: 'text-green-500' });
  }
  
  // Add gluten-free feature if applicable
  if (product.isGlutenFree || product.category?.toLowerCase().includes('gluten-free') || 
      product.name?.toLowerCase().includes('gluten-free') || 
      product.name?.toLowerCase().includes('gluten free')) {
    extractedFeatures.push({ icon: faCarrot, text: 'Gluten Free', color: 'text-orange-600' });
  }
  
  // Add any additional features from the product data
  if (Array.isArray(product.features) && product.features.length > 0) {
    product.features.forEach(feature => {
      // Avoid duplicates
      if (!extractedFeatures.find(f => f.text.toLowerCase() === feature.toLowerCase())) {
        extractedFeatures.push({ icon: faCircle, text: feature, color: 'text-soft-green' });
      }
    });
  }
  
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [expandedView, setExpandedView] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showFlyAnimation, setShowFlyAnimation] = useState(false);
  const cardRef = useRef(null);
  const addButtonRef = useRef(null);
  const { setCartAnimation } = useCart();
  
  // Reset add to cart success state after a few seconds
  useEffect(() => {
    let timeout;
    if (addedToCart) {
      timeout = setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [addedToCart]);
  
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
    // Don't allow adding again if we're in the process of adding
    if (isAddingToCart) return;
    
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
    
    // Show adding animation
    setIsAddingToCart(true);
    
    // After a brief delay, show the fly animation
    setTimeout(() => {
      setShowFlyAnimation(true);
      
      // After the fly animation starts, trigger the cart animation
      setTimeout(() => {
        setCartAnimation(true);
        
        // Call the addToCart function
        addToCart(productToAdd);
        
        // Reset animations and show success state
        setTimeout(() => {
          setShowFlyAnimation(false);
          setIsAddingToCart(false);
          setAddedToCart(true);
        }, 600); // Match the animation duration
      }, 200);
    }, 300);
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
            src={product.images[0]} 
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

        {/* Product Description */}
                                <p className="text-sm text-gray-700 italic font-lora mt-2 h-10 line-clamp-2" title={product.description}>
          {product.description}
        </p>
        
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
          
          {/* Mobile-optimized add to cart button with animation states */}
          {isMobile && product.inventoryStatus !== 'OUT_OF_STOCK' && (
            <div className="relative">
              {/* Fly to cart animation element */}
              {showFlyAnimation && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="w-8 h-8 bg-soft-green text-white rounded-full flex items-center justify-center animate-[flyToCart_0.8s_ease-in-out_forwards]">
                    <FontAwesomeIcon icon={faShoppingBag} className="text-sm" />
                  </div>
                </div>
              )}
              
              <button
                ref={addButtonRef}
                className={`relative overflow-hidden text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md
                  ${addedToCart ? 'bg-green-500' : isAddingToCart ? 'bg-soft-green/80' : 'bg-soft-green'} 
                  ${isAddingToCart ? 'animate-[addToCartBounce_0.6s_ease-in-out]' : ''}
                  transition-colors duration-300 active:scale-95`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={isAddingToCart || addedToCart}
                aria-label="Add to cart"
              >
                {addedToCart ? (
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                ) : (
                  <FontAwesomeIcon icon={faCartPlus} className="text-sm" />
                )}
                
                {/* Add ripple effect */}
                {isAddingToCart && (
                  <span className="absolute w-full h-full top-0 left-0 bg-white/30 animate-ping rounded-full"></span>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Description with bullet points - conditionally expanded on mobile */}
        {/* Product Feature Highlights */}
        <div className="mt-2 mb-3">
          {extractedFeatures.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {extractedFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="inline-flex items-center bg-gray-50 px-2 py-1 rounded-md text-xs border border-gray-100"
                >
                  <FontAwesomeIcon icon={feature.icon} className={`${feature.color} mr-1 text-xs`} />
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Check if description contains bullet points already */}
          {product.description && product.description.includes('•') ? (
            <div className={`text-xs sm:text-sm text-gray-600 transition-all duration-300 ${expandedView ? '' : 'max-h-12 overflow-hidden'}`}>
              {product.description.split('•').filter(item => item.trim()).map((point, index) => (
                <div key={index} className="flex items-start mb-1">
                  <span className="text-soft-green mr-1 mt-0.5">•</span>
                  <span>{point.trim()}</span>
                </div>
              ))}
            </div>
          ) : product.description && product.description.includes('-') && product.description.split('-').length > 2 ? (
            <div className={`text-xs sm:text-sm text-gray-600 transition-all duration-300 ${expandedView ? '' : 'max-h-12 overflow-hidden'}`}>
              {product.description.split('-').filter(item => item.trim()).map((point, index) => (
                <div key={index} className="flex items-start mb-1">
                  <span className="text-soft-green mr-1 mt-0.5">•</span>
                  <span>{point.trim()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-xs sm:text-sm text-gray-600 ${expandedView ? '' : 'line-clamp-2'} transition-all duration-300`}>
              {/* If no bullet points or dashes, create key points from sentences */}
              {product.description && product.description.split('.').length > 1 ? (
                <div className={`${expandedView ? '' : 'max-h-12 overflow-hidden'}`}>
                  {product.description.split('.').filter(item => item.trim()).map((point, index) => (
                    <div key={index} className="flex items-start mb-1">
                      <span className="text-soft-green mr-1 mt-0.5">•</span>
                      <span>{point.trim()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  {product.description}
                </p>
              )}
            </div>
          )}
          
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
        
        {/* Desktop add to cart button with animation states */}
        {!isMobile && product.inventoryStatus !== 'OUT_OF_STOCK' && (
          <div className="relative mt-3">
            {/* Fly to cart animation element */}
            {showFlyAnimation && (
              <div className="absolute top-0 right-1/4 z-10">
                <div className="w-10 h-10 bg-soft-green text-white rounded-full flex items-center justify-center animate-[flyToCart_0.8s_ease-in-out_forwards]">
                  <FontAwesomeIcon icon={faShoppingBag} className="text-sm" />
                </div>
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isAddingToCart || addedToCart}
              className={`w-full relative overflow-hidden py-3 text-white rounded-md flex items-center justify-center space-x-2 shadow-md
                ${addedToCart ? 'bg-green-500' : isAddingToCart ? 'bg-soft-green/80' : 'bg-soft-green'} 
                ${isAddingToCart ? 'animate-[addToCartBounce_0.6s_ease-in-out]' : ''}
                transition-all duration-300 hover:shadow-lg active:scale-98`}
            >
              {addedToCart ? (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCartPlus} />
                  <span>Add to Cart</span>
                </>
              )}
              
              {/* Add ripple effect */}
              {isAddingToCart && (
                <span className="absolute w-full h-full top-0 left-0 bg-white/20 animate-ping"></span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
