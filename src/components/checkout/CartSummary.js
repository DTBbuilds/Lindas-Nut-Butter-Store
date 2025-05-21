import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faTrash, faTimes, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';

/**
 * Cart summary component with item details and totals
 */
const CartSummary = ({ cartItems, cartTotal, onContinue, onUpdateQuantity, onRemoveItem }) => {
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
            
            {/* Quantity */}
            <div className="col-span-2 flex items-center justify-center">
              <span className="sm:hidden inline-block mr-2 font-medium">Quantity:</span>
              <div className="flex items-center">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l-md hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faMinus} className="text-gray-600" />
                </button>
                <input
                  type="text"
                  id={`quantity-${item.id}`}
                  name={`quantity-${item.id}`}
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      onUpdateQuantity(item.id, value);
                    }
                  }}
                  className="w-10 h-8 text-center border-t border-b focus:outline-none"
                />
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-r-md hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Total + Remove button */}
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <span className="sm:hidden inline-block mr-2 font-medium">Total:</span>
                <span className="font-semibold text-gray-800">
                  {formatKES(item.price * item.quantity)}
                </span>
              </div>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="ml-4 text-red-500 hover:text-red-700 transition-colors"
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
          onClick={onContinue}
          className="w-full py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          Continue to Customer Information
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
