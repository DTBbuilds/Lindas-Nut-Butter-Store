import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faStar, faHeart, faPercent, faTags, faFire } from '@fortawesome/free-solid-svg-icons';
import { formatKES, calculateDiscountedPrice } from '../utils/currencyUtils';
import { SERVER_BASE_URL } from '../config/api';


const HomeFeaturedProductCard = ({ product, addToCart, icon, iconText }) => {
    const { name, image, price, rating, reviews, description } = product;
  const [pulseDiscount, setPulseDiscount] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants ? product.variants[0] : null);
  
  // Use selected variant price or original price if no variant is selected
  const originalPrice = selectedVariant ? selectedVariant.price : price;

  const handleAddToCart = () => {
    // Create a product copy with the selected variant information
    const productToAdd = {
      ...product,
      selectedVariant,
      // Update price to the selected variant price
      price: selectedVariant ? selectedVariant.price : price,
      // Update size to include the mass information
      size: selectedVariant ? `${selectedVariant.mass}g` : product.size
    };
    
    // Check if we have access to the global cart functionality
    if (window.addToCart) {
      window.addToCart(productToAdd);
    } else if (addToCart) {
      addToCart(productToAdd);
    }
  };
  
  // Animation effects
  useEffect(() => {
    // Pulsing discount badge effect
    const pulseInterval = setInterval(() => {
      setPulseDiscount(prev => !prev);
    }, 2000);
    
    // Bouncing price effect
    const bounceInterval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }, 5000);
    
    return () => {
      clearInterval(pulseInterval);
      clearInterval(bounceInterval);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 touch-manipulation">
      <div className="relative overflow-hidden h-48">
        <img 
          src={image.startsWith('/') ? image : `${SERVER_BASE_URL}/uploads/${image}`}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            console.log(`Image failed to load: ${e.target.src}`);
            e.target.src = '/images/placeholder.png';
          }}
        />

        {product.inventoryStatus === 'OUT_OF_STOCK' && (
          <div className="absolute top-2 left-2 bg-rich-brown text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            Out of Stock
          </div>
        )}

      </div>
      <div className="p-6">
                <h3 className="text-xl font-bold mb-2 h-14 overflow-hidden group-hover:text-soft-green transition-colors duration-300">{name}</h3>
        <p className="text-gray-600 text-sm mb-3 h-10 overflow-hidden line-clamp-2">
          {description}
        </p>
        <div className="flex text-golden-yellow mb-3">
          {[...Array(5)].map((_, i) => (
            <FontAwesomeIcon 
              key={i} 
              icon={faStar} 
              className={`mr-1 ${i < Math.floor(rating || 5) ? '' : 'opacity-50'}`} 
            />
          ))}
          <span className="text-gray-500 text-sm ml-2">({reviews || 0} reviews)</span>
        </div>
        <div className="mb-4">
          <div className="relative">
            {/* Pricing information */}
            <div className="flex items-center mb-2">
              <span className={`text-rich-brown text-xl font-bold mr-2 transition-transform ${bounce ? 'animate-bounce' : ''}`}>
                {formatKES(originalPrice, true)}
              </span>
            </div>
            
            {/* Size variants */}
            <div className="flex gap-2 mb-2">
              {product.variants && product.variants.map((variant) => (
                <button 
                  key={variant.mass}
                  onClick={() => setSelectedVariant(variant)}
                  className={`inline-block ${selectedVariant && selectedVariant.mass === variant.mass ? 'bg-amber-200 text-rich-brown' : 'bg-warm-beige text-rich-brown'} px-2 py-1 rounded-full text-xs font-bold transition-colors`}
                >
                  {variant.mass}g - {formatKES(variant.price, true)}
                </button>
              ))}
            </div>
            
            {/* Limited time offer tag */}
            <div className="flex items-center">
              <FontAwesomeIcon icon={faTags} className="text-golden-yellow mr-1 text-xs" />
              <span className="text-xs font-medium text-golden-yellow">Premium Quality</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.inventoryStatus === 'OUT_OF_STOCK'}
          className="relative block bg-rich-brown text-white px-4 py-2 rounded-full hover:bg-soft-green w-full text-center transition-all duration-300 cursor-pointer group-hover:shadow-md overflow-hidden"
        >
          <span className="absolute inset-0 w-0 bg-gradient-to-r from-golden-yellow to-soft-green group-hover:w-full transition-all duration-300 opacity-25"></span>
          <span className="relative flex items-center justify-center">
            <FontAwesomeIcon icon={faShoppingCart} className="mr-2 transform group-hover:scale-110 transition-transform duration-300" />
            <span>{product.inventoryStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Add to Cart'}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default HomeFeaturedProductCard;
