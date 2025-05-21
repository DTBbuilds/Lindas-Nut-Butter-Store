import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { fixImagePath } from '../utils/imagePathFixer';
import { formatKES } from '../utils/formatters';

/**
 * CartItem Component
 * Handles display, quantity controls, wishlist, and removal for a single cart item.
 * Props:
 * - item: cart item object
 * - onRemove: function(itemId)
 * - onUpdateQuantity: function(itemId, newQty)
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
          src={fixImagePath(item.image || item.images?.[0])}
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

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2 relative">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item._id || item.id, Math.max((item.quantity || 1) - 1, 1))}
              className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none transition-colors"
              aria-label="Decrease quantity"
            >
              <FontAwesomeIcon icon={faMinus} size="xs" />
            </button>
            <span className="px-3 py-1 text-gray-700 bg-white">{item.quantity || 1}</span>
            <button
              onClick={() => onUpdateQuantity(item._id || item.id, (item.quantity || 1) + 1)}
              className={`px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none transition-colors ${item.stockQuantity && item.quantity >= item.stockQuantity ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Increase quantity"
              disabled={item.stockQuantity && item.quantity >= item.stockQuantity}
            >
              <FontAwesomeIcon icon={faPlus} size="xs" />
            </button>
          </div>

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
