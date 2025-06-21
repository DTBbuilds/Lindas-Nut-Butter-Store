import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faMinus, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';

import { formatKES } from '../utils/formatters';

/**
 * CartItem Component
 * Handles display, quantity controls, wishlist, and removal for a single cart item.
 * Enhanced with improved animations and user interactions.
 * 
 * Props:
 * - item: cart item object
 * - onRemove: function(item) - now expects the full item object
 * - onUpdateQuantity: function(item, newQty) - now expects the full item object
 * - onMoveToWishlist: function(item)
 * - showSwipeHint: boolean
 * - onDismissSwipeHint: function()
 * - onTouchStart/onTouchMove/onTouchEnd: handlers for swipe gestures (optional)
 * - isInWishlist: function(itemId)
 */
const CartItem = ({
  item,
  onRemove,
  onUpdateQuantity,
  onMoveToWishlist,
  showSwipeHint,
  onDismissSwipeHint,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isInWishlist
}) => {
  // State for quantity change animation
  const [animateQuantity, setAnimateQuantity] = useState('');
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  
  // Reset animation after it completes
  useEffect(() => {
    if (animateQuantity) {
      const timer = setTimeout(() => setAnimateQuantity(''), 300);
      return () => clearTimeout(timer);
    }
  }, [animateQuantity]);
  
  // Reset confirmation when quantity changes
  useEffect(() => {
    setShowRemoveConfirmation(false);
  }, [item.quantity]);
  
  return (
    <li
      key={item._id || item.id}
      className="py-4 px-4 flex relative cart-item overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Delete button (hidden until swiped) */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 text-white flex items-center justify-center transform translate-x-full">
        <button
          onClick={() => onRemove(item._id || item.id)}
          className="w-full h-full flex items-center justify-center"
          aria-label="Remove item"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      {/* Item swipe hint */}
      {showSwipeHint && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-10 text-white"
          onClick={onDismissSwipeHint}>
          <div className="text-center p-3">
            <FontAwesomeIcon icon={faMinus} className="text-white text-2xl transform rotate-90 mb-2" />
            <p className="text-sm">Swipe left to remove</p>
            <p className="text-xs mt-1 opacity-70">Tap to dismiss</p>
          </div>
        </div>
      )}

      {/* Product image */}
      <div className="w-20 h-20 bg-white rounded-md border overflow-hidden flex-shrink-0">
        <img
          src={item.image || item.images?.[0]}
          alt={item.name}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          onError={e => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
        />
      </div>

      {/* Product Details */}
      <div className="ml-4 flex flex-1 flex-col justify-between">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
          <div className="flex items-center">
            {/* Wishlist toggle button */}
            <button
              onClick={() => onMoveToWishlist(item)}
              className="mr-2 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Save for later"
            >
              <FontAwesomeIcon icon={farHeart} className="text-sm" />
            </button>
            <p className="text-sm font-medium text-gray-900">{formatKES(item.price)}</p>
          </div>
        </div>

        {/* Enhanced Quantity Controls with animations */}
        <div className="flex items-center justify-between mt-2 relative">
          {showRemoveConfirmation ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
              <span className="text-xs text-red-700">Remove item?</span>
              <button
                onClick={() => {
                  onRemove(item); // Pass the entire item
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 active:scale-95 transform duration-150"
              >
                Yes
              </button>
              <button
                onClick={() => setShowRemoveConfirmation(false)}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 active:scale-95 transform duration-150"
              >
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center border rounded-lg overflow-hidden shadow-md">
              <button
                onClick={() => {
                  // Add button press animation
                  const btn = document.activeElement;
                  btn.classList.add('button-press');
                  setTimeout(() => btn.classList.remove('button-press'), 150);
                  
                  // Animate quantity change
                  setAnimateQuantity('decrease');
                  
                  if (navigator.vibrate) navigator.vibrate(10);
                  
                  if (item.quantity <= 1) {
                    // Show removal confirmation instead of immediately removing
                    setShowRemoveConfirmation(true);
                  } else {
                    // Pass the entire item object to ensure correct identification
                    onUpdateQuantity(item, (item.quantity || 1) - 1);
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:outline-none transition-colors active:scale-95 transform duration-150"
                aria-label="Decrease quantity"
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <div className={`px-4 py-2 text-gray-800 bg-white font-medium min-w-[40px] text-center ${animateQuantity ? `quantity-change-${animateQuantity}` : ''}`}>
                {item.quantity || 1}
              </div>
              <button
                onClick={() => {
                  // Add button press animation
                  const btn = document.activeElement;
                  btn.classList.add('button-press');
                  setTimeout(() => btn.classList.remove('button-press'), 150);
                  
                  // Animate quantity change
                  setAnimateQuantity('increase');
                  
                  if (navigator.vibrate) navigator.vibrate(10);
                  
                  // Pass the entire item object to ensure correct identification
                  onUpdateQuantity(item, (item.quantity || 1) + 1);
                }}
                className={`px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:outline-none transition-colors active:scale-95 transform duration-150 ${item.stockQuantity && item.quantity >= item.stockQuantity ? 'bg-yellow-50 text-yellow-600' : ''}`}
                aria-label="Increase quantity"
                disabled={item.stockQuantity && item.quantity >= item.stockQuantity}
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          )}

          {/* Stock quantity indicator */}
          {item.stockQuantity && item.quantity >= item.stockQuantity && (
            <div className="absolute right-0 -bottom-4 text-xs text-amber-600">
              Max quantity reached
            </div>
          )}

          <p className="text-sm text-gray-600 font-medium">
            {formatKES(item.price * (item.quantity || 1))}
          </p>
        </div>
      </div>
    </li>
  );
};

export default CartItem;
