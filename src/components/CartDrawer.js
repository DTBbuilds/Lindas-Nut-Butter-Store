import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, faTrash, faTimes, faArrowRight, faMinus, faPlus, faChevronLeft,
  faHandPointUp, faHeart, faTruck, faPercent, faSpinner, faTag 
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useCart } from '../contexts/CartContext';
import fixImagePath from '../utils/imagePathFixer';
import { formatKES } from '../utils/formatters';


const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    cartTotal,
    addToWishlist,
    removeFromWishlist,
    wishlistItems,
    getRelatedProducts,
    applyDiscount,
    removeDiscount,
    discountCode,
    discountApplied,
    addToCart,
    clearCart,
    cartOpen, 
    setCartOpen
  } = useCart();
  
  const { subtotal, total, shipping, itemCount } = cartTotal;
  const navigate = useNavigate();
  
  const drawerRef = useRef(null);
  
  // State for recommendations
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // State for discount code input
  const [discountInput, setDiscountInput] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  
  // The swipe hint has been removed
  
  // Load related product recommendations when cart is opened
  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      const loadRecommendations = async () => {
        setLoadingRecommendations(true);
        try {
          const products = await getRelatedProducts();
          setRelatedProducts(products);
        } catch (error) {
          console.error('Failed to load recommendations:', error);
        } finally {
          setLoadingRecommendations(false);
        }
      };
      
      loadRecommendations();
    }
  }, [isOpen, cartItems, getRelatedProducts]);
  
  // Handle touch events for closing drawer - simplified
  const onTouchStart = (e) => {
    // Touch functionality removed
  };

  const onTouchMove = (e) => {
    // Touch functionality removed
  };

  const onTouchEnd = () => {
    // Touch functionality removed
  };

  // Reset positions - no longer needed but kept as a stub to avoid breaking function calls
  const resetItemPositions = () => {
    // Swipe reset functionality removed
  };

  // Handle discount code application
  const handleApplyDiscount = () => {
    if (!discountInput.trim()) {
      toast.warning('Please enter a discount code');
      return;
    }
    
    setApplyingDiscount(true);
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      const success = applyDiscount(discountInput.trim());
      if (success) {
        setDiscountInput('');
      }
      setApplyingDiscount(false);
    }, 800);
  };
  
  // Handle removing discount
  const handleRemoveDiscount = () => {
    removeDiscount();
    setDiscountInput('');
  };
  
  // Handle move to wishlist
  const handleMoveToWishlist = (item) => {
    addToWishlist(item);
    removeFromCart(item.cartItemId || item._id || item.id);
    toast.success(`${item.name} moved to wishlist`);
  };
  
  // Check if item is in wishlist
  const isInWishlist = (itemId) => {
    return wishlistItems.some(wishlistItem => 
      (wishlistItem._id === itemId) || (wishlistItem.id === itemId)
    );
  };

  const handleClearCartConfirmation = () => {
    const toastId = 'clear-cart-confirmation';

    const ConfirmDialog = ({ closeToast }) => (
      <div className='flex flex-col p-2'>
        <p className='font-lora font-bold text-rich-brown'>Clear all items from cart?</p>
        <p className='text-sm text-gray-600 mt-1'>This action cannot be undone.</p>
        <div className='flex gap-3 mt-4'>
          <button 
            onClick={() => { clearCart(); closeToast(); }}
            className='flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all transform hover:scale-105'
          >
            Yes, Clear
          </button>
          <button 
            onClick={closeToast} 
            className='flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all'
          >
            Cancel
          </button>
        </div>
      </div>
    );

    toast.warn(<ConfirmDialog />, {
      toastId,
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      hideProgressBar: true,
      className: 'clear-cart-toast',
      style: { 
        width: '340px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '12px',
      }
    });
  };

  return (
    <>
      {/* Overlay - only shown when cart is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => {
            resetItemPositions();
            onClose();
          }}
        />
      )}
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-br from-warm-beige to-soft-green/20 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <h2 className="text-xl font-lora font-bold text-rich-brown">Your Cart ({itemCount})</h2>
            <button 
              onClick={() => {
                resetItemPositions();
                onClose();
              }}
              className="p-2 text-gray-400 hover:text-rich-brown transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-4" onClick={resetItemPositions}>
            {/* Empty cart view */}
            {cartItems.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center p-8 h-full bg-gradient-to-br from-warm-beige to-soft-green/20">
                <div className="bg-white/60 p-8 rounded-full shadow-lg mb-6">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-5xl text-rich-brown/80" />
                </div>
                <h3 className="text-2xl font-lora font-bold text-rich-brown">Your Cart is Empty</h3>
                <p className="text-gray-600 mt-2 max-w-xs">Discover our delicious, all-natural nut butters and fill your cart with goodness!</p>

                <button 
                  onClick={onClose}
                  className="mt-8 px-8 py-3 bg-golden-yellow text-rich-brown font-bold rounded-full hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                  Start Shopping
                </button>
              </div>
            )}

            {/* Cart items */}
            {cartItems.length > 0 && (
              <ul className="divide-y divide-gray-200 -mx-4">
                {cartItems.map((item, index) => (
                  <div key={item.cartItemId || item._id || item.id || `cart-item-${index}`} className="py-4 flex items-start space-x-4 relative overflow-hidden bg-white/60 backdrop-blur-sm border border-white/30 shadow-md rounded-xl p-3 my-2">
                    {/* Delete button with consistent visibility on both desktop and mobile */}
                    <button 
                      onClick={() => removeFromCart(item.cartItemId || item._id || item.id)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 transition-colors z-10 bg-white bg-opacity-80 rounded-full shadow-sm"
                      aria-label="Remove item"
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>

                    {/* Product image with improved error handling */}
                    <div className="w-20 h-20 bg-white rounded-md border overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={fixImagePath(item.image)}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholder.png';
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <div className="flex items-center">
                          {/* Wishlist toggle button */}
                          <button 
                            onClick={() => handleMoveToWishlist(item)}
                            className="mr-2 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Save for later"
                          >
                            <FontAwesomeIcon icon={farHeart} className="text-sm" />
                          </button>
                          <p className="text-sm font-medium text-gray-900">{formatKES(item.price)}</p>
                        </div>
                      </div>
                      {/* Enhanced Quantity Controls with better feedback and usability */}
                      <div className="flex items-center justify-between mt-2 relative">
                        <div className="flex items-center border rounded-lg overflow-hidden shadow-sm">
                          <button 
                            onClick={() => {
                              // Add button press animation
                              const btn = document.activeElement;
                              btn.classList.add('button-press');
                              setTimeout(() => btn.classList.remove('button-press'), 150);
                              
                              // Add animation to quantity display
                              const quantityDisplay = document.getElementById(`quantity-display-${item.cartItemId || index}`);
                              if (quantityDisplay) {
                                quantityDisplay.classList.add('quantity-change-decrease');
                                setTimeout(() => quantityDisplay.classList.remove('quantity-change-decrease'), 300);
                              }
                              
                              if (navigator.vibrate) navigator.vibrate(10);
                              if (item.quantity <= 1) {
                                // Show confirmation before removing last item
                                if (window.confirm(`Remove ${item.name} from your cart?`)) {
                                  // Pass the item's unique ID for removal
                                  removeFromCart(item.cartItemId || item._id || item.id);
                                }
                              } else {
                                // Pass the entire item object instead of just the ID
                                updateQuantity(item, (item.quantity || 1) - 1);
                              }
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:outline-none transition-colors active:scale-95 transform duration-150"
                            aria-label="Decrease quantity"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <div id={`quantity-display-${item.cartItemId || index}`} className="px-4 py-2 text-gray-800 bg-white font-medium min-w-[40px] text-center">{item.quantity || 1}</div>
                          <button 
                            onClick={() => {
                              // Add button press animation
                              const btn = document.activeElement;
                              btn.classList.add('button-press');
                              setTimeout(() => btn.classList.remove('button-press'), 150);
                              
                              // Add animation to quantity display
                              const quantityDisplay = document.getElementById(`quantity-display-${item.cartItemId || index}`);
                              if (quantityDisplay) {
                                quantityDisplay.classList.add('quantity-change-increase');
                                setTimeout(() => quantityDisplay.classList.remove('quantity-change-increase'), 300);
                              }
                              
                              if (navigator.vibrate) navigator.vibrate(10);
                              // Check stock limit but still allow adding more
                              const newQuantity = (item.quantity || 1) + 1;
                              const isNearStockLimit = item.stockQuantity && newQuantity >= item.stockQuantity;
                              
                              if (isNearStockLimit) {
                                toast.info(`Limited stock available (${item.stockQuantity})`);
                              }
                              
                              // Pass the entire item object to ensure correct identification
                              updateQuantity(item, newQuantity);
                            }}
                            className={`px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:outline-none transition-colors active:scale-95 transform duration-150 ${item.stockQuantity && item.quantity >= item.stockQuantity ? 'bg-yellow-50 text-yellow-600' : ''}`}
                            aria-label="Increase quantity"
                            disabled={item.stockQuantity && item.quantity >= item.stockQuantity}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                        </div>
                        
                        {/* Stock quantity indicator */}
                        {item.stockQuantity && item.quantity >= item.stockQuantity && (
                          <div className="absolute right-0 -bottom-4 text-xs text-amber-600 font-medium">
                            Max quantity reached
                          </div>
                        )}

                        <p className="text-sm text-gray-600 font-medium">
                          {formatKES(item.price * (item.quantity || 1))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ul>
            )}
            
            {/* Related products recommendation section */}
            {relatedProducts.length > 0 && (
              <div className="mt-6 mb-2">
                <h3 className="text-lg font-medium mb-3">You might also like</h3>
                <div className="grid grid-cols-2 gap-2">
                  {relatedProducts.map((product, index) => (
                    <div key={product._id || product.id || `related-product-${index}`} className="border rounded-lg p-2 bg-white hover:shadow-md transition-shadow">
                      <img 
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-md mb-2"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
                      />
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-semibold">{formatKES(product.price)}</p>
                        <button 
                          onClick={() => {
                            addToCart(product);
                            // Provide haptic feedback
                            if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
                            // Remove from recommendations to avoid confusion
                            setRelatedProducts(prev => prev.filter(p => p._id !== product._id));
                          }}
                          className="bg-rich-brown text-white p-2 rounded-full hover:bg-soft-green transition-colors transform hover:scale-105 active:scale-95 duration-150 shadow-sm"
                          aria-label="Add to cart"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Loading state for recommendations */}
            {loadingRecommendations && (
              <div className="mt-6 mb-2 text-center p-4">
                <FontAwesomeIcon icon={faSpinner} spin className="text-gray-400 text-2xl" />
                <p className="text-sm text-gray-500 mt-2">Loading recommendations...</p>
              </div>
            )}
            
            {/* Show wishlist items if any */}
            {wishlistItems.length > 0 && (
              <div className="mt-8 w-full">
                <h4 className="text-left text-lg font-medium mb-3 flex items-center">
                  <FontAwesomeIcon icon={faHeart} className="text-red-500 mr-2" />
                  <span>Your Wishlist</span>
                </h4>
                <div className="border rounded-lg overflow-hidden bg-white">
                  {wishlistItems.slice(0, 2).map((item, index) => (
                    <div key={`wishlist-item-${index}-${item._id || item.id}`} className="flex items-center p-3 border-b last:border-b-0">
                      <img 
                        src={fixImagePath(item.image || item.images?.[0])}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-md"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
                      />
                      <div className="ml-3 flex-1">
                        <h5 className="font-medium text-sm">{item.name}</h5>
                        <p className="text-sm text-gray-600">{formatKES(item.price)}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const success = addToCart(item);
                          if (success) removeFromWishlist(item._id || item.id);
                        }}
                        className="ml-2 bg-soft-green text-white p-2 rounded-full hover:bg-rich-brown transition-colors"
                        aria-label="Add to cart"
                      >
                        <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
                      </button>
                    </div>
                  ))}
                  {wishlistItems.length > 2 && (
                    <div className="p-2 text-center bg-gray-50">
                      <button 
                        onClick={() => window.location.href = '/wishlist'}
                        className="text-sm text-rich-brown hover:text-soft-green transition-colors"
                      >
                        View all {wishlistItems.length} wishlist items
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with discount code section */}
          <div className="border-t border-white/30 p-4 bg-white/60 backdrop-blur-sm">
            {/* Order summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatKES(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatKES(shipping)}</span>
              </div>
              <div className="h-px bg-gray-200 my-1"></div>
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Total</p>
                <p>{formatKES(total)}</p>
              </div>
            </div>
            
            {/* Shipping and delivery notification */}
            {subtotal > 0 && (
              <div className="mb-3 bg-blue-50 p-2 rounded-md text-center flex flex-col items-center justify-center">
                <div className="flex items-center justify-center mb-1">
                  <FontAwesomeIcon icon={faTruck} className="text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700 font-medium">Flat shipping rate: {formatKES(300)}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">⏱️ All orders delivered within 48 hours!</span>
                </div>
              </div>
            )}
            
            <button
              className="w-full py-3 bg-rich-brown text-white font-semibold rounded-lg hover:bg-soft-green transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              disabled={cartItems.length === 0}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
                onClose();
                navigate('/checkout');
              }}
            >
              Proceed to Checkout
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
            
            <div className="flex gap-3 mt-3">
              <button 
                onClick={onClose}
                className="flex-1 py-2 text-rich-brown bg-transparent border border-current rounded-lg font-medium hover:text-soft-green transition-colors"
              >
                Continue Shopping
              </button>
              {cartItems.length > 0 && (
                <button 
                  onClick={handleClearCartConfirmation}  
                  className="px-4 py-2 text-red-500 bg-transparent border border-current rounded-lg font-medium hover:text-red-700 hover:border-red-700 transition-colors flex items-center"
                  aria-label="Clear cart"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
