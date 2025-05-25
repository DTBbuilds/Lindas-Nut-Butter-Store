import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faTrash, faTimes, faPlus, faMinus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';

/**
 * Cart summary component with item details and totals
 */
const CartSummary = ({ cartItems, cartTotal, onNextStep, updateQuantity, removeFromCart, isAuthenticated }) => {
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center py-8">
        <FontAwesomeIcon icon={faShoppingCart} className="text-gray-300 text-6xl mb-4" />
        <h2 className="text-2xl font-medium text-gray-600 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to your cart and come back</p>
        <button
          onClick={() => window.location.href = '/products'}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
      
      {/* Cart items */}
      <div className="border rounded-lg overflow-hidden mb-8">
        <div className="hidden sm:grid grid-cols-12 bg-gray-50 p-4 text-sm font-semibold text-gray-600">
          <div className="col-span-6">Product</div>
          <div className="col-span-2 text-center">Price</div>
          <div className="col-span-2 text-center">Quantity</div>
          <div className="col-span-2 text-center">Total</div>
        </div>
        
        {cartItems.map((item, index) => (
          <div 
            key={`${item.id}-${index}`} 
            className="grid grid-cols-1 sm:grid-cols-12 py-4 px-4 border-t items-center"
          >
            {/* Product */}
            <div className="col-span-6 flex items-center mb-3 sm:mb-0">
              <img 
                src={item.image && item.image.trim() !== '' ? item.image : (item.images && item.images[0] ? item.images[0] : '/images/placeholder.png')}
                alt={item.name}
                className="w-16 h-16 rounded-md bg-gray-100 object-cover flex-shrink-0 mr-4"
                onError={e => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
              />
              <div>
                <h3 className="font-medium text-gray-800">{item.name}</h3>
                {(item.sku && item.sku !== item.name) && (
                  <p className="text-sm text-gray-500">{item.sku}</p>
                )}
              </div>
            </div>
            
            {/* Price */}
            <div className="col-span-2 text-center">
              <span className="sm:hidden inline-block mr-2 font-medium">Price:</span>
              {formatKES(item.price)}
            </div>
            
            {/* Quantity - Enhanced with animations and better mobile support */}
            <div className="col-span-2 flex items-center justify-center">
              <span className="sm:hidden inline-block mr-2 font-medium">Quantity:</span>
              <QuantityControls 
                item={item} 
                updateQuantity={updateQuantity} 
                removeFromCart={removeFromCart} 
              />
            </div>
            
            {/* Total + Remove button - Enhanced with animations */}
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <span className="sm:hidden inline-block mr-2 font-medium">Total:</span>
                <span className="font-semibold text-gray-800">
                  {formatKES(item.price * item.quantity)}
                </span>
              </div>
              <button
                onClick={() => {
                  // Add button press animation
                  const btn = document.activeElement;
                  btn.classList.add('button-press');
                  setTimeout(() => btn.classList.remove('button-press'), 150);
                  
                  if (navigator.vibrate) navigator.vibrate(15);
                  removeFromCart(item); // Cart context can handle the full item object
                }}
                className="ml-4 text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 active:scale-95 transform duration-150"
                aria-label="Remove item"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Order summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">{formatKES(cartTotal.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-medium">{formatKES(300)}</span>
          </div>
          <div className="flex items-center justify-center mt-2 py-2 bg-blue-50 rounded-md">
            <span className="text-xs text-blue-700 font-medium">
              ⏱️ All orders delivered within 48 hours!
            </span>
          </div>
          <div className="h-px bg-gray-200 my-2"></div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatKES(cartTotal.total || cartTotal.subtotal)}</span>
          </div>
        </div>
        
        <button
          onClick={onNextStep}
          className="w-full py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Continue to Customer Information
        </button>
      </div>
    </div>
  );
};

/**
 * QuantityControls Component
 * Reusable component for quantity adjustment with animations
 */
const QuantityControls = ({ item, updateQuantity, removeFromCart }) => {
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
  
  if (showRemoveConfirmation) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2 py-1 whitespace-nowrap">
        <span className="text-xs text-red-700">Remove?</span>
        <button
          onClick={() => {
            removeFromCart(item); // Cart context can handle the full item object
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
    );
  }
  
  return (
    <div className="flex items-center shadow-sm rounded-lg overflow-hidden">
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
            // Pass the ID and new quantity as expected by the updateQuantity function
            updateQuantity(item.id || item._id, (item.quantity || 1) - 1);
          }
        }}
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-l-md hover:bg-gray-200 active:bg-gray-300 transition-colors active:scale-95 transform duration-150"
        aria-label="Decrease quantity"
      >
        <FontAwesomeIcon icon={faMinus} />
      </button>
      <div 
        className={`w-10 h-9 flex items-center justify-center text-center bg-white border-t border-b font-medium ${animateQuantity ? `quantity-change-${animateQuantity}` : ''}`}
      >
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
          
          // Pass the ID and new quantity as expected by the updateQuantity function
          updateQuantity(item.id || item._id, (item.quantity || 1) + 1);
        }}
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-r-md hover:bg-gray-200 active:bg-gray-300 transition-colors active:scale-95 transform duration-150"
        aria-label="Increase quantity"
        disabled={item.stockQuantity && item.quantity >= item.stockQuantity}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
};

export default CartSummary;
