import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faTrash, faArrowRight, faPlus, faMinus, faTruck } from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';

/**
 * Cart summary component with item details and totals
 */
const CartSummary = ({ cartItems, cartTotal, onNextStep, updateQuantity, removeFromCart }) => {
  const { subtotal = 0, total = 0, shipping = 0 } = cartTotal || {};
  const [isTotalUpdating, setIsTotalUpdating] = useState(false);
  const isFirstRun = useRef(true);

  // Effect to animate the total price on update, skipping the initial render.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setIsTotalUpdating(true);
    const timer = setTimeout(() => setIsTotalUpdating(false), 400); // Animation duration
    return () => clearTimeout(timer);
  }, [total]);

  // A more colorful and engaging empty cart view
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center p-8 sm:p-16 bg-gradient-to-br from-warm-beige to-soft-green/20 rounded-2xl shadow-lg">
        <FontAwesomeIcon icon={faShoppingCart} className="text-rich-brown opacity-10 text-7xl mb-6" />
        <h2 className="text-4xl font-bold text-rich-brown mb-3">Your Cart is a Little Light!</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">Ready to fill it with something delicious? Explore our handcrafted nut butters.</p>
        <Link
          to='/products'
          className="inline-flex items-center px-8 py-4 bg-rich-brown text-white font-bold rounded-full hover:bg-soft-green transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          Find Your Favorite Flavor <FontAwesomeIcon icon={faArrowRight} className="ml-3" />
        </Link>
      </div>
    );
  }

  // Main Cart View with a warm, colorful, and smooth background
  return (
    <div className="bg-gradient-to-br from-warm-beige to-soft-green/20 p-4 sm:p-8 rounded-2xl shadow-inner">
      <h2 className="text-3xl font-bold text-rich-brown mb-8 text-center">Review Your Order</h2>
      
      {/* Cart Items with enhanced styling */}
      <div className="space-y-4 mb-8">
        {cartItems.map((item) => (
          <div 
            key={item.cartItemId}
            className="relative group bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-center gap-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <img 
              src={item.image || (item.images && item.images[0]) || '/images/placeholder.png'}
              alt={item.name}
              className="w-24 h-24 rounded-lg bg-gray-100 object-cover flex-shrink-0 shadow-md"
              onError={e => { e.target.onerror = null; e.target.src = '/images/placeholder.png'; }}
            />
            <div className="flex-grow text-center sm:text-left">
              <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
              <p className="text-sm text-gray-500">{formatKES(item.price)} per item</p>
            </div>
            <div className="flex-shrink-0 w-24 text-center">
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-bold text-lg text-gray-800">{item.quantity}</p>
            </div>
            <div className="font-semibold text-lg text-rich-brown w-24 text-right flex-shrink-0">
              {formatKES(item.price * item.quantity)}
            </div>
            <button
              onClick={() => removeFromCart(item.cartItemId)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-100"
              aria-label={`Remove ${item.name} from cart`}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Totals Section with glassmorphism effect */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg p-6 mb-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-600 flex items-center">
              <FontAwesomeIcon icon={faShoppingCart} className="mr-3 text-golden-yellow animate-pulse" />
              Subtotal:
            </span>
            <span className="font-medium text-gray-800">{formatKES(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-600 flex items-center">
              <FontAwesomeIcon icon={faTruck} className="mr-3 text-golden-yellow animate-pulse" />
              Shipping:
            </span>
            <span className="font-medium text-gray-800">{formatKES(shipping)}</span>
          </div>
          <div className="border-t border-gray-200/50 my-2"></div>
          <div className={`flex justify-between text-2xl font-bold text-rich-brown pt-2 p-2 rounded-lg transition-all duration-300 ${isTotalUpdating ? 'price-update-flash' : ''}`}>
            <span>Total:</span>
            <span>{formatKES(total)}</span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons with enhanced styling */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
        <Link to="/products" className="text-rich-brown font-medium hover:underline transition-colors">
          &larr; Continue Shopping
        </Link>
        <button
          onClick={onNextStep}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-rich-brown text-white font-bold rounded-full hover:bg-soft-green transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          Proceed to Checkout <FontAwesomeIcon icon={faArrowRight} className="ml-3" />
        </button>
      </div>
    </div>
  );
};


export default CartSummary;
