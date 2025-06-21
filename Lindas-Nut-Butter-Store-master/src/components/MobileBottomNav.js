import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faStore, faShoppingCart, faInfoCircle, 
  faSearch, faUser, faHeart, faTag, faLeaf,
  faBoxOpen, faStar
} from '@fortawesome/free-solid-svg-icons';
import '../styles/animations.css';
import { useCart } from '../contexts/CartContext';

const MobileBottomNav = ({ setCartOpen }) => {
  const location = useLocation();
  const { cartItems, cartAnimation, setCartAnimation } = useCart();
  const [cartBounce, setCartBounce] = useState(false);
  const [lastYOffset, setLastYOffset] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [touchStart, setTouchStart] = useState(0);

  // Get current path to highlight active nav item
  const currentPath = location.pathname;
  
  // Handle cart animation effects
  useEffect(() => {
    if (cartAnimation) {
      setCartBounce(true);
      // Provide haptic feedback on mobile if available
      if (navigator.vibrate) {
        navigator.vibrate(50); // Short vibration for tactile feedback
      }
      
      // Reset animations after completion
      const timeout = setTimeout(() => {
        setCartBounce(false);
        setCartAnimation(false);
      }, 800);
      
      return () => clearTimeout(timeout);
    }
  }, [cartAnimation, setCartAnimation]);
  
  // Improved scroll behavior for mobile nav
  useEffect(() => {
    const handleScroll = () => {
      const currentYOffset = window.pageYOffset;
      
      // More responsive scrolling behavior:
      // 1. Always show nav when near the top of the page
      // 2. Hide when scrolling down significantly
      // 3. Show when scrolling up
      // 4. Add a delay before hiding to prevent flickering
      
      if (currentYOffset < 50) {
        // Always show when near the top
        setIsNavVisible(true);
      } else if (Math.abs(currentYOffset - lastYOffset) > 10) {
        // Only change visibility on significant scroll
        setIsNavVisible(currentYOffset < lastYOffset);
      }
      
      setLastYOffset(currentYOffset);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastYOffset]);
  
  // Improved touch gestures with better thresholds and feedback
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };
  
  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    
    // More forgiving threshold (60px instead of 80px)
    // and only activate when on certain pages
    if (diff > 60 && !currentPath.includes('/checkout') && !currentPath.includes('/admin')) {
      setCartOpen(true);
      // Gentler haptic feedback
      if (navigator.vibrate) navigator.vibrate(40);
    }
  };
  
  // Don't show on checkout or order confirmation pages
  if (currentPath.includes('/checkout') || currentPath.includes('/order-confirmation')) {
    return null;
  }

  // Enhanced navigation items with modern look and micro-interactions
  const navItems = [
    { path: '/', icon: faHome, label: 'Home', color: 'from-soft-green to-green-600' },
    { path: '/products', icon: faLeaf, label: 'Products', color: 'from-rich-brown to-amber-700' },
    { type: 'cart', icon: faShoppingCart, label: 'Cart', color: 'from-golden-yellow to-amber-600' },
    { path: '/account', icon: faUser, label: 'Account', color: 'from-blue-500 to-blue-700' }
  ];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transform transition-all duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating pill navigation with curved top */}
      <div className="relative px-4 pb-2 pt-1">
        {/* Swipe indicator - modern floating pill design */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex justify-center items-center z-10 pointer-events-none">
          <div className="h-1 w-12 bg-gray-400 rounded-full opacity-80"></div>
        </div>
        
        {/* Modern Floating Navigation Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
          {/* Curved background effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-transparent opacity-70 pointer-events-none"></div>
          
          {/* Bottom border indicator that slides */}
          <div className="absolute bottom-0 h-1 transition-all duration-300 ease-in-out bg-gradient-to-r from-soft-green to-green-600"
            style={{
              width: '20%',
              left: currentPath === '/' ? '0%' :
                   currentPath === '/products' ? '20%' :
                   currentPath.includes('/cart') ? '40%' :
                   currentPath === '/featured' ? '60%' :
                   currentPath === '/account' ? '80%' : '0%'
            }}>
          </div>
          
          {/* Nav items container */}
          <div className="flex justify-around items-center py-3 px-1 relative z-10">
            {navItems.map((item, index) => {
              // Special handling for cart button with floating indicator
              if (item.type === 'cart') {
                return (
                  <button 
                    key="cart"
                    onClick={() => {
                      setCartOpen(true);
                      if (navigator.vibrate) navigator.vibrate([15, 10, 15]); // Double tap feeling
                    }}
                    className="relative flex flex-col items-center justify-center px-1 py-2 w-1/5 touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Open Cart"
                  >
                    <div className="relative">
                      <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transform transition-all duration-300 
                        ${cartBounce ? 'scale-110' : 'scale-100'} 
                        bg-gradient-to-br ${item.color} shadow-md group-hover:shadow-lg`}>
                        <FontAwesomeIcon 
                          icon={item.icon} 
                          className={`text-white text-lg ${cartAnimation ? 'animate-wiggle' : ''}`} 
                        />
                        
                        {cartItems.length > 0 && (
                          <div className={`absolute -top-1 -right-1 bg-white text-rich-brown text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-md font-bold border border-golden-yellow transition-all duration-300 ${cartAnimation ? 'scale-125 animate-pulse' : 'scale-100'}`}>
                            {cartItems.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium mt-1 text-center text-rich-brown">{item.label}</span>
                  </button>
                );
              }
              
              // Regular nav items with enhanced visual effects
              const isActive = currentPath === item.path;
              return (
                <Link 
                  key={index}
                  to={item.path} 
                  className="group relative flex flex-col items-center w-1/5 touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="relative">
                    {/* Circle background with enhanced animation */}
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 
                      ${isActive ? `bg-gradient-to-br ${item.color} shadow-md` : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                      <FontAwesomeIcon 
                        icon={item.icon} 
                        className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-gray-600 group-hover:scale-105'}`} 
                        size="lg"
                      />
                    </div>
                    
                    {/* Subtle ping animation for active item */}
                    {isActive && (
                      <span className={`absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-gradient-to-br ${item.color}`}></span>
                    )}
                  </div>
                  
                  {/* Label with subtle animation */}
                  <span className={`text-xs font-medium mt-1 transition-all duration-300 
                    ${isActive ? 'text-soft-green font-semibold' : 'text-gray-600 group-hover:text-gray-800'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
