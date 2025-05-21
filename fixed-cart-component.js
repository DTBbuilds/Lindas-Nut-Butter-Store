// Fixed cart component section
// This is just the correctly structured JSX for the cart component
// to be used as a reference for fixing the App.js file

<div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-soft-green scrollbar-track-warm-beige pr-1">
  {cartItems.slice(0, 3).map((item, idx) => (
    <div key={idx} className="flex items-center py-3 border-b border-gray-100 last:border-0 group hover:bg-warm-beige hover:bg-opacity-20 transition-colors duration-200 px-2 rounded-md">
      <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 mr-3 bg-warm-beige border border-gray-100 shadow-sm">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-medium text-rich-brown line-clamp-1">{item.name}</h4>
        <div className="flex items-center text-xs text-gray-500 mt-0.5 mb-1">
          <span>{item.size || '370g'}</span>
          {item.selectedVariant && (
            <span className="ml-2">{item.selectedVariant.mass}g</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-golden-yellow">KES {item.price}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              removeFromCart(item.id);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors duration-300 bg-white bg-opacity-0 hover:bg-opacity-80 p-1 rounded-full"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  ))}
  
  {cartItems.length > 3 && (
    <div className="text-center py-2 text-xs font-medium text-soft-green bg-warm-beige bg-opacity-20 rounded-md mx-2 my-2">
      + {cartItems.length - 3} more {cartItems.length - 3 === 1 ? 'item' : 'items'}
    </div>
  )}
</div>

{/* Cart summary and checkout button */}
<div className="p-3 bg-gray-50 border-t border-gray-100">
  <div className="flex justify-between items-center mb-3">
    <span className="text-sm font-medium text-gray-600">Subtotal:</span>
    <span className="font-bold text-rich-brown">KES {cartItems.reduce((total, item) => total + item.price, 0).toLocaleString()}</span>
  </div>
  <button 
    onClick={() => setCartOpen(true)}
    className="w-full bg-soft-green hover:bg-rich-brown text-white py-2 rounded-md transition-colors duration-300 flex items-center justify-center gap-2 font-medium"
  >
    View Cart
    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
  </button>
</div>
