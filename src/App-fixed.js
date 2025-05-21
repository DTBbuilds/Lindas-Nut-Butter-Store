import React, { useState, useEffect } from 'react';
import './styles/animations.css';
import { BrowserRouter as Router, Routes, Route, Link, createBrowserRouter, RouterProvider } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
// Future flags for React Router v7 compatibility
import { UNSAFE_enhanceManualRouteObjects } from '@remix-run/router';
import ProductsPage from './pages/ProductsPage';
import AboutPage from './pages/AboutPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faStore, faInfoCircle, faShoppingCart, faGift, faLeaf, faHeart, faStar, faPhone, faEnvelope, faCopy, faPercent, faStore as faShop, faTrash, faTimes, faLock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import HomeFeaturedProductCard from './components/HomeFeaturedProductCard';
import MobileBottomNav from './components/MobileBottomNav';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  
  // Expose cart functions to window for global access
  useEffect(() => {
    window.cartItems = cartItems;
    window.setCartItems = setCartItems;
    window.cartOpen = cartOpen;
    window.setCartOpen = setCartOpen;
    window.cartAnimation = cartAnimation;
    window.setCartAnimation = setCartAnimation;
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
  }, [cartItems, cartOpen, cartAnimation]);
  
  // Function to add items to cart
  const addToCart = (product) => {
    // Ensure product has a valid backend _id
    if (!product._id) {
      toast.error('Product cannot be added to cart. Please refresh the product list.');
      return;
    }
    // Always store _id as 'product' field for checkout mapping
    const cartItem = {
      ...product,
      product: product._id,
      quantity: product.quantity || 1
    };
    setCartItems([...cartItems, cartItem]);
    // Trigger cart animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 1000);
  };
  
  // Function to remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };
  
  // Handler to scroll to top programmatically anywhere in the app
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  };

  // Expose scroll function globally
  useEffect(() => {
    window.scrollToTop = scrollToTop;
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {/* ScrollToTop component will handle scrolling on navigation */}
      <ScrollToTop />
      <div className="min-h-screen bg-warm-beige text-rich-brown">
        {/* Header and Navigation */}
        <header className="sticky top-0 bg-warm-beige shadow-md z-50">
          <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-rich-brown font-bold text-xl">Linda's Nut Butter</div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="flex items-center space-x-1 hover:text-soft-green transition-colors duration-300">
                <FontAwesomeIcon icon={faHome} />
                <span>Home</span>
              </Link>
              <Link to="/products" className="flex items-center space-x-1 hover:text-soft-green transition-colors duration-300">
                <FontAwesomeIcon icon={faStore} />
                <span>Shop</span>
              </Link>
              <Link to="/about" className="flex items-center space-x-1 hover:text-soft-green transition-colors duration-300">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>About</span>
              </Link>
              
              {/* Cart Button with Mini Cart */}
              <div className="relative">
                <button 
                  onClick={() => setCartOpen(!cartOpen)} 
                  className="group relative flex items-center space-x-3 text-rich-brown bg-white py-2 px-4 rounded-lg border border-gray-200 transition-all duration-300 hover:bg-soft-green hover:text-white hover:border-transparent shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-green focus:ring-opacity-50"
                  aria-label="Shopping Cart"
                  aria-haspopup="true"
                  aria-expanded={cartOpen}
                >
                  {/* Cart icon container with badge */}
                  <div className="relative">
                    {/* Animated background for icon */}
                    <div className="absolute inset-0 bg-golden-yellow bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all duration-300"></div>
                    
                    {/* Cart icon */}
                    <FontAwesomeIcon 
                      icon={faShoppingCart} 
                      className={`text-lg relative z-10 ${cartAnimation ? 'animate-wiggle' : ''} group-hover:scale-110 transition-all duration-300`}
                    />
                    
                    {/* Cart count badge */}
                    {cartItems.length > 0 && (
                      <div 
                        className={`absolute -top-2 -right-2 bg-golden-yellow text-white font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md transform transition-all duration-300 ${cartAnimation ? 'scale-125 animate-pulse-custom' : 'scale-100'}`}
                        style={{
                          fontSize: '0.65rem',
                          lineHeight: 1,
                          zIndex: 20
                        }}
                      >
                        {cartItems.length < 10 ? cartItems.length : '9+'}
                      </div>
                    )}
                  </div>
                  
                  {/* Cart text and subtotal */}
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm leading-none">Cart</span>
                    {cartItems.length > 0 && (
                      <span className="text-xs text-gray-600 group-hover:text-white group-hover:text-opacity-90 transition-colors duration-300">
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>
                </button>
                
                {/* Floating Mini Cart */}
                {cartItems.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 z-50 overflow-hidden group border border-gray-100">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-warm-beige to-white">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-rich-brown text-base flex items-center">
                          Your Cart 
                          <span className="bg-golden-yellow text-white text-xs px-2 py-0.5 rounded-full ml-2 flex items-center justify-center min-w-[20px]">
                            {cartItems.length}
                          </span>
                        </h3>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCartOpen(true);
                          }}
                          className="text-xs font-medium bg-soft-green text-white px-3 py-1.5 rounded-full hover:bg-rich-brown transition-colors duration-300 flex items-center gap-1 shadow-sm"
                        >
                          <span>View Cart</span>
                          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </button>
                      </div>
                      
                      {/* Cart items list */}
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
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-rich-brown hover:text-soft-green transition-colors duration-300"
              aria-label="Toggle mobile menu"
            >
              <FontAwesomeIcon icon={faLeaf} className="text-lg" />
            </button>
          </nav>
        </header>
        
        {/* Main Content */}
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* Home Page Content */}
                  <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">Welcome to Linda's Nut Butter</h1>
                    <p className="mb-4">Premium natural nut butters made with love in Kenya.</p>
                  </div>
                </>
              }
            />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-rich-brown text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Linda's Nut Butter</h3>
                <p className="mb-4">Premium natural nut butters made with love in Kenya.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="hover:text-golden-yellow transition-colors">Home</Link></li>
                  <li><Link to="/products" className="hover:text-golden-yellow transition-colors">Shop</Link></li>
                  <li><Link to="/about" className="hover:text-golden-yellow transition-colors">About</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="tel:+254725317864" className="hover:text-golden-yellow transition-colors">
                      <FontAwesomeIcon icon={faPhone} className="mr-2" />
                      +254 725 317 864
                    </a>
                  </li>
                  <li>
                    <a href="mailto:lmunyendo@gmail.com" className="hover:text-golden-yellow transition-colors">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                      lmunyendo@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-warm-beige border-opacity-20 mt-8 pt-8 text-center">
              <p>&copy; {new Date().getFullYear()} Linda's Nut Butter. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>
      {/* ToastContainer removed to prevent duplicates - using the one in App.js */}
    </Router>
  );
}

export default App;
