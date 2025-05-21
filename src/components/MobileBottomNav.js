import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faStore, faShoppingCart, faInfoCircle, faSearch, faUser, faHeart, faLock } from '@fortawesome/free-solid-svg-icons';
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

  // Enhanced navigation items with micro-interactions
  const navItems = [
    { path: '/', icon: faHome, label: 'Home', color: 'from-teal-400 to-green-500' },
    { path: '/products', icon: faStore, label: 'Shop', color: 'from-purple-400 to-indigo-500' },
    { type: 'cart', icon: faShoppingCart, label: 'Cart', color: 'from-amber-400 to-yellow-500' },
    { path: '/about', icon: faInfoCircle, label: 'About', color: 'from-blue-400 to-teal-500' },
    { path: '/account', icon: faUser, label: 'Account', color: 'from-blue-400 to-indigo-500' }
  ];

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Improved Swipe Indicator - more visible */}
      <div className="absolute -top-2 left-0 right-0 flex justify-center pointer-events-none">
        <div className="h-1.5 w-20 bg-gray-300 rounded-full opacity-80 shadow-sm"></div>
      </div>
      
      {/* Bottom Navigation Bar with Enhanced Glass Effect */}
      <div className="bg-warm-beige bg-opacity-95 backdrop-blur-md border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          {navItems.map((item, index) => {
            // Special handling for cart button
            if (item.type === 'cart') {
              return (
                <button 
                  key="cart"
                  onClick={() => {
                    setCartOpen(true);
                    if (navigator.vibrate) navigator.vibrate(30);
                  }}
                  className="relative flex flex-col items-center justify-center w-1/5 touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Open Cart"
                >
                  <div className={`relative p-3 rounded-full shadow-md transform transition-all duration-300 ${cartBounce ? 'scale-110' : 'scale-100'} bg-gradient-to-r ${item.color}`}>
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className={`text-white text-lg ${cartAnimation ? 'animate-wiggle' : ''}`} 
                    />
                    
                    {cartItems.length > 0 && (
                      <div className={`absolute -top-1 -right-1 bg-white text-rich-brown text-xs min-w-5 h-5 flex items-center justify-center rounded-full shadow-md font-bold transition-all duration-300 ${cartAnimation ? 'scale-125 animate-pulse-custom' : 'scale-100'}`}>
                        {cartItems.length}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-rich-brown mt-1 font-medium">{item.label}</span>
                </button>
              );
            }
            
            // Enhanced navigation links with micro-animations
            const isActive = currentPath === item.path;
            return (
              <Link 
                key={index}
                to={item.path} 
                className="relative flex flex-col items-center justify-center w-1/5 touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`p-3 rounded-full transition-all duration-300 ${isActive ? `bg-gradient-to-r ${item.color} shadow-md` : 'bg-transparent hover:bg-gray-100'}`}>
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className={`text-lg transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-rich-brown'}`} 
                  />
                </div>
                <span className={`text-xs mt-1 font-medium transition-all duration-300 ${isActive ? 'text-soft-green' : 'text-rich-brown'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
