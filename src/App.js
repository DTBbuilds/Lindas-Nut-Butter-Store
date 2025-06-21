import React, { useState, useEffect } from 'react';
import './styles/animations.css';
import './styles/profileAnimations.css';
import { BrowserRouter as Router, Routes, Route, Link, createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
// Future flags for React Router v7 compatibility
import { UNSAFE_enhanceManualRouteObjects } from '@remix-run/router';
import ProductsPage from './pages/ProductsPage';
import AboutPage from './pages/AboutPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
// Admin pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminCustomerDetailPage from './pages/AdminCustomerDetailPage';

// Customer account pages
import AccountLoginPage from './pages/AccountLoginPage';
import AccountRegisterPage from './pages/AccountRegisterPage';
import AccountPage from './pages/AccountPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faStore, faInfoCircle, faShoppingCart, faGift, faLeaf, faHeart, faStar, faPhone, faEnvelope, faCopy, faPercent, faStore as faShop, faTrash, faTimes, faLock, faArrowRight, faBars, faSearch, faUser, faShield, faTruck, faSync } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import HomeFeaturedProductCard from './components/HomeFeaturedProductCard';
import ProductCardSkeleton from './components/ProductCardSkeleton';
import productService from './services/productService';
import MobileBottomNav from './components/MobileBottomNav';
import CartDrawer from './components/CartDrawer';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast-notifications.css'; // Import our custom toast styles
import { useCart } from './contexts/CartContext';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  // Function to shuffle and select 3 products from the main list
  const shuffleFeaturedProducts = () => {
    if (allProducts.length > 0) {
      setIsLoadingFeatured(true);
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      setFeaturedProducts(shuffled.slice(0, 3));
      setTimeout(() => setIsLoadingFeatured(false), 500); // Simulate loading for smooth transition
    }
  };

  // Fetch all products on initial mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoadingFeatured(true);
      try {
        const products = await productService.fetchProducts({}); // Fetch all products
        if (products && products.length > 0) {
          setAllProducts(products);
          // Set initial featured products
          const shuffled = [...products].sort(() => 0.5 - Math.random());
          setFeaturedProducts(shuffled.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast.error('Could not fetch products. Please try again!');
      } finally {
        setTimeout(() => setIsLoadingFeatured(false), 500);
      }
    };

    fetchAllProducts();
  }, []);
  // We'll use CartContext instead of local state for cart management
  const [cartOpen, setCartOpen] = useState(false);
  
  // This references the cart context that is provided from index.js
  // We still keep this reference for components that haven't been updated to use useCart() directly
  const { 
    cartItems, 
    cartAnimation, 
    setCartAnimation,
    addToCart, 
    removeFromCart 
  } = useCart();
  
  // Expose some cart functions to window for legacy components that might need it
  useEffect(() => {
    window.setCartOpen = setCartOpen;
  }, []);
  
  // We're now using these functions from CartContext
  // See src/contexts/CartContext.js for implementation
  
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
        {/* Toast container for all notifications */}
        <ToastContainer
          position="top-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          transition={Slide}
          className="toast-container-custom"
          toastClassName="toast-enhanced"
          bodyClassName="toast-body-enhanced"
          progressClassName="toast-progress"
          limit={3}
          stacked
        />
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
              {/* Admin link removed - replaced with customer login */}
              <Link to="/account/login" className="flex items-center space-x-1 hover:text-soft-green transition-colors duration-300">
                <FontAwesomeIcon icon={faUser} />
                <span>Account</span>
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
            
            {/* Mobile Header Actions */}
            <div className="flex items-center space-x-3 md:hidden">
              {/* Mobile Search Button */}
              <button 
                className="text-rich-brown hover:text-soft-green transition-colors duration-300 p-2 rounded-full hover:bg-gray-100"
                aria-label="Search products"
              >
                <FontAwesomeIcon icon={faSearch} className="text-lg" />
              </button>
              
              {/* Mobile Cart Button */}
              <button 
                onClick={() => setCartOpen(true)}
                className="text-rich-brown hover:text-soft-green transition-colors duration-300 p-2 rounded-full hover:bg-gray-100 relative"
                aria-label="Open cart"
              >
                <FontAwesomeIcon icon={faShoppingCart} className="text-lg" />
                {cartItems.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-golden-yellow text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full shadow-md font-bold">
                    {cartItems.length}
                  </div>
                )}
              </button>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-rich-brown hover:text-soft-green transition-colors duration-300 p-2 rounded-full hover:bg-gray-100"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                <FontAwesomeIcon icon={faBars} className="text-lg" />
              </button>
            </div>
          </nav>
          
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-warm-beige border-t border-gray-200 shadow-lg">
              <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col space-y-3">
                  <Link 
                    to="/" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="bg-soft-green bg-opacity-10 p-2 rounded-full">
                      <FontAwesomeIcon icon={faHome} className="text-soft-green" />
                    </div>
                    <span className="font-medium">Home</span>
                  </Link>
                  
                  <Link 
                    to="/products" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="bg-soft-green bg-opacity-10 p-2 rounded-full">
                      <FontAwesomeIcon icon={faStore} className="text-soft-green" />
                    </div>
                    <span className="font-medium">Shop All Products</span>
                  </Link>
                  
                  <Link 
                    to="/about" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="bg-soft-green bg-opacity-10 p-2 rounded-full">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-soft-green" />
                    </div>
                    <span className="font-medium">About Us</span>
                  </Link>
                  
                  {/* Admin link removed - replaced with customer login */}
                  <Link 
                    to="/account/login" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="bg-soft-green bg-opacity-10 p-2 rounded-full">
                      <FontAwesomeIcon icon={faUser} className="text-soft-green" />
                    </div>
                    <span className="font-medium">My Account</span>
                  </Link>
                  
                  <button 
                    onClick={() => {
                      setCartOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-soft-green text-white transition-colors duration-300 mt-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-full">
                        <FontAwesomeIcon icon={faShoppingCart} className="text-white" />
                      </div>
                      <span className="font-medium">View Cart</span>
                    </div>
                    {cartItems.length > 0 && (
                      <span className="bg-white text-soft-green text-xs px-2 py-1 rounded-full font-bold">
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
        
        {/* Main Content */}
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* Enhanced Hero Section */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-warm-beige via-white to-soft-green bg-opacity-90">
                    {/* Decorative patterns */}
                    <div className="absolute inset-0 bg-pattern opacity-10"></div>
                  
                    <div className="absolute top-0 right-0 w-64 h-64 bg-golden-yellow rounded-full filter blur-3xl opacity-20 animate-float-slow"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-soft-green rounded-full filter blur-3xl opacity-20 animate-float-slow-reverse"></div>
                    
                    <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center relative z-10">
                      <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0 z-10">
                        {/* Badge */}
                        <div className="inline-block px-4 py-2 rounded-full bg-golden-yellow bg-opacity-20 text-golden-yellow font-semibold text-sm mb-6 animate-fadeIn">
                          <span className="flex items-center">
                            <FontAwesomeIcon icon={faStar} className="mr-2" />
                            Handcrafted in Kenya
                          </span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-bold text-rich-brown mb-6 leading-tight animate-fadeIn">
                          Taste the <span className="text-golden-yellow relative inline-block">
                            <span className="relative z-10">Magic</span>
                            <span className="absolute bottom-1 left-0 w-full h-3 bg-golden-yellow opacity-20 rounded"></span>
                          </span> of Natural Nut Butters
                        </h1>
                        
                        <p className="text-lg md:text-xl mb-8 text-gray-700 leading-relaxed animate-fadeIn">
                          Indulge in Kenya's finest artisanal nut butters — a symphony of flavors crafted with love, using only premium ingredients for your wellness journey and culinary delight.
                        </p>
                        
                        {/* Benefits */}
                        <div className="flex flex-wrap gap-4 mb-8 animate-fadeIn">
                          <div className="flex items-center text-rich-brown bg-white px-4 py-2 rounded-full shadow-sm">
                            <FontAwesomeIcon icon={faLeaf} className="text-soft-green mr-2" />
                            <span>100% Natural</span>
                          </div>
                          <div className="flex items-center text-rich-brown bg-white px-4 py-2 rounded-full shadow-sm">
                            <FontAwesomeIcon icon={faGift} className="text-golden-yellow mr-2" />
                            <span>No Additives</span>
                          </div>
                          <div className="flex items-center text-rich-brown bg-white px-4 py-2 rounded-full shadow-sm">
                            <FontAwesomeIcon icon={faHeart} className="text-soft-green mr-2" />
                            <span>Locally Sourced</span>
                          </div>
                        </div>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4 mb-8 animate-fadeIn">
                          <Link to="/products" className="group bg-soft-green hover:bg-rich-brown text-white font-medium py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 flex items-center">
                            <span className="mr-2">Shop Collection</span>
                            <span className="bg-white bg-opacity-20 rounded-full p-2 group-hover:bg-opacity-30 transition-all">
                              <FontAwesomeIcon icon={faStore} className="text-sm" />
                            </span>
                          </Link>
                          <Link to="/about" className="group bg-white hover:bg-golden-yellow text-rich-brown hover:text-white font-medium py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1 border border-gray-200 flex items-center">
                            <span className="mr-2">Our Story</span>
                            <span className="bg-golden-yellow bg-opacity-10 rounded-full p-2 group-hover:bg-white group-hover:bg-opacity-20 transition-all">
                              <FontAwesomeIcon icon={faInfoCircle} className="text-sm" />
                            </span>
                          </Link>
                        </div>
                        
                        {/* Social Proof */}
                        <div className="flex items-center space-x-6 mt-10 animate-fadeIn">
                          <div className="flex -space-x-3">
                            {['A', 'B', 'C', 'D'].map((letter, idx) => (
                              <div key={idx} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-soft-green to-golden-yellow flex items-center justify-center text-white font-bold text-xs shadow-md transform hover:scale-110 transition-all duration-300 hover:rotate-12">
                                {letter}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="font-bold text-rich-brown text-lg flex items-center">
                              <span>500+ Happy Customers</span>
                              <div className="flex ml-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FontAwesomeIcon key={star} icon={faStar} className="text-golden-yellow text-xs" />
                                ))}
                              </div>
                            </div>
                            <div className="text-gray-600">Across East Africa</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hero Image Section */}
                      <div className="md:w-1/2 relative z-10">
                        {/* Main product image with floating effect */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-md transform hover:rotate-0 transition-all duration-500 hover:shadow-golden animate-fadeIn">
                          <div className="absolute inset-0 bg-gradient-to-t from-rich-brown/30 to-transparent z-10"></div>
                          <img 
                            src="/images/Hero-image.jpg" 
                            alt="Linda's Premium Nut Butter" 
                            className="w-full h-full object-cover transform hover:scale-105 transition-all duration-500"
                          />
                          
                          {/* Floating badge */}
                          <div className="absolute -bottom-1 -right-1 bg-golden-yellow text-white font-bold px-6 py-3 rounded-tl-2xl shadow-lg transform rotate-2 hover:scale-105 transition-all duration-300 z-20 flex items-center">
                            <FontAwesomeIcon icon={faStar} className="mr-2" />
                            Premium Quality
                          </div>
                        </div>
                        
                        {/* Floating product thumbnails */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-2 rounded-lg shadow-lg transform rotate-6 hover:rotate-0 transition-all duration-300 border-2 border-soft-green animate-float-slow w-24 h-24 overflow-hidden">
                          <img src="/images/almond-butter.jpg" alt="Almond Butter" className="w-full h-full object-cover rounded" />
                        </div>
                        
                        <div className="absolute -top-10 -right-6 bg-white p-2 rounded-lg shadow-lg transform -rotate-6 hover:rotate-0 transition-all duration-300 border-2 border-golden-yellow animate-float-slow-reverse w-28 h-28 overflow-hidden">
                          <img src="/images/creamy-cashew-butter.jpg" alt="Cashew Butter" className="w-full h-full object-cover rounded" />
                        </div>
                        
                        {/* Floating icons */}
                        <div className="absolute -bottom-4 left-1/2 bg-soft-green text-white p-4 rounded-full shadow-lg animate-pulse-slow">
                          <FontAwesomeIcon icon={faLeaf} className="text-2xl" />
                        </div>
                        
                        <div className="absolute top-1/4 -right-4 bg-rich-brown text-white p-3 rounded-full shadow-lg animate-bounce-subtle">
                          <FontAwesomeIcon icon={faHeart} className="text-xl" />
                        </div>
                        
                        {/* Limited time offer badge */}
                        <div className="absolute top-4 left-4 bg-white text-rich-brown px-4 py-2 rounded-full shadow-md transform -rotate-3 hover:rotate-0 transition-all duration-300 border border-golden-yellow flex items-center space-x-2 animate-pulse-slow">
                          <FontAwesomeIcon icon={faPercent} className="text-golden-yellow" />
                          <span className="font-bold text-sm">Limited Time Offer</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Featured Products */}
                  <div className="bg-white py-16">
                    <div className="container mx-auto px-4">
                      <div className="text-center mb-12">
                        <div className="flex justify-center items-center gap-4 mb-4">
                          <h2 className="text-3xl font-bold text-rich-brown">Our Featured Products</h2>
                          <button 
                            onClick={shuffleFeaturedProducts}
                            className="p-2 rounded-full bg-golden-yellow text-white hover:bg-opacity-90 transition-transform duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-yellow"
                            aria-label="Shuffle featured products"
                          >
                            <FontAwesomeIcon icon={faSync} className="text-lg" />
                          </button>
                        </div>
                        <p className="text-gray-600 max-w-2xl mx-auto">Discover our most loved nut butters, carefully crafted to deliver the perfect blend of taste and nutrition.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {isLoadingFeatured ? (
                          // Display skeleton loaders while fetching data
                          Array.from({ length: 3 }).map((_, index) => (
                            <ProductCardSkeleton key={index} />
                          ))
                        ) : (
                          // Display actual product cards once data is loaded
                          featuredProducts.map(product => (
                            <HomeFeaturedProductCard
                              key={product.id}
                              product={product}
                              addToCart={addToCart}
                            />
                          ))
                        )}
                      </div>
                      
                      <div className="text-center mt-12">
                        <Link to="/products" className="inline-flex items-center bg-soft-green hover:bg-rich-brown text-white font-medium py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                          View All Products
                          <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Categories Section */}
                  <div className="bg-warm-beige py-16">
                    <div className="container mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-rich-brown mb-4">Explore Our Collections</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Discover our range of natural nut butters, each crafted to perfection.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Category 1 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                          <div className="h-48 overflow-hidden">
                            <img src="/images/almond-butter.jpg" alt="Almond Butters" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-rich-brown mb-2">Almond Butters</h3>
                            <p className="text-gray-600 mb-4">Premium almond butters made from organic almonds.</p>
                            <Link to="/products" className="text-soft-green hover:text-rich-brown font-medium transition-colors duration-300 flex items-center">
                              Explore <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Link>
                          </div>
                        </div>
                        
                        {/* Category 2 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                          <div className="h-48 overflow-hidden">
                            <img src="/images/creamy-cashew-butter.jpg" alt="Cashew Butters" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-rich-brown mb-2">Cashew Butters</h3>
                            <p className="text-gray-600 mb-4">Smooth and creamy cashew butters for a delicious taste.</p>
                            <Link to="/products" className="text-soft-green hover:text-rich-brown font-medium transition-colors duration-300 flex items-center">
                              Explore <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Link>
                          </div>
                        </div>
                        
                        {/* Category 3 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                          <div className="h-48 overflow-hidden">
                            <img src="/images/chocolate-macadamia-butter.jpg" alt="Macadamia Butters" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-rich-brown mb-2">Macadamia Butters</h3>
                            <p className="text-gray-600 mb-4">Rich and buttery macadamia nut butters for a luxurious experience.</p>
                            <Link to="/products" className="text-soft-green hover:text-rich-brown font-medium transition-colors duration-300 flex items-center">
                              Explore <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Link>
                          </div>
                        </div>
                        
                        {/* Category 4 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                          <div className="h-48 overflow-hidden">
                            <img src="/images/chocolate-mint-peanut.jpg" alt="Peanut Butters" className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-rich-brown mb-2">Peanut Butters</h3>
                            <p className="text-gray-600 mb-4">Classic peanut butters in creamy and crunchy varieties.</p>
                            <Link to="/products" className="text-soft-green hover:text-rich-brown font-medium transition-colors duration-300 flex items-center">
                              Explore <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Benefits Section */}
                  <div className="bg-white py-16">
                    <div className="container mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-rich-brown mb-4">Why Choose Our Nut Butters?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">We take pride in creating premium quality nut butters that are both delicious and nutritious.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Benefit 1 */}
                        <div className="bg-warm-beige bg-opacity-30 rounded-lg p-8 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                          <div className="bg-soft-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FontAwesomeIcon icon={faLeaf} className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-rich-brown mb-4">100% Natural</h3>
                          <p className="text-gray-700">Made with only the finest natural ingredients, with no artificial additives or preservatives.</p>
                        </div>
                        
                        {/* Benefit 2 */}
                        <div className="bg-warm-beige bg-opacity-30 rounded-lg p-8 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                          <div className="bg-golden-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FontAwesomeIcon icon={faHeart} className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-rich-brown mb-4">Health Benefits</h3>
                          <p className="text-gray-700">Rich in proteins, healthy fats, and essential nutrients that support your well-being.</p>
                        </div>
                        
                        {/* Benefit 3 */}
                        <div className="bg-warm-beige bg-opacity-30 rounded-lg p-8 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2">
                          <div className="bg-rich-brown w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FontAwesomeIcon icon={faStar} className="text-white text-2xl" />
                          </div>
                          <h3 className="text-xl font-bold text-rich-brown mb-4">Premium Quality</h3>
                          <p className="text-gray-700">Each jar is crafted with care and attention to detail for consistent quality and taste.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Testimonials Section */}
                  <div className="bg-warm-beige py-16">
                    <div className="container mx-auto px-4">
                      <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-rich-brown mb-4">What Our Customers Say</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Don't just take our word for it - hear from our satisfied customers.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-soft-green rounded-full flex items-center justify-center text-white font-bold mr-4">M</div>
                            <div>
                              <h4 className="font-bold text-rich-brown">Maria K.</h4>
                              <div className="flex text-golden-yellow">
                                {[...Array(5)].map((_, i) => (
                                  <FontAwesomeIcon key={i} icon={faStar} className="mr-1" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 italic">"I'm absolutely obsessed with the Almond Butter! It's the perfect blend of creaminess and flavor. I use it for everything from my morning toast to smoothies."</p>
                        </div>
                        
                        {/* Testimonial 2 */}
                        <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-golden-yellow rounded-full flex items-center justify-center text-white font-bold mr-4">J</div>
                            <div>
                              <h4 className="font-bold text-rich-brown">James W.</h4>
                              <div className="flex text-golden-yellow">
                                {[...Array(5)].map((_, i) => (
                                  <FontAwesomeIcon key={i} icon={faStar} className="mr-1" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 italic">"The Macadamia Nut Butter is a game-changer. It's rich, flavorful, and makes for an excellent post-workout snack. I appreciate the quality of the ingredients."</p>
                        </div>
                        
                        {/* Testimonial 3 */}
                        <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-rich-brown rounded-full flex items-center justify-center text-white font-bold mr-4">S</div>
                            <div>
                              <h4 className="font-bold text-rich-brown">Sarah M.</h4>
                              <div className="flex text-golden-yellow">
                                {[...Array(5)].map((_, i) => (
                                  <FontAwesomeIcon key={i} icon={faStar} className="mr-1" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 italic">"I love that these nut butters are all-natural with no additives. The Chocolate Cashew Butter is my favorite treat - it's like dessert but healthier!"</p>
                        </div>
                      </div>
                      
                      <div className="text-center mt-12">
                        <Link to="/products" className="inline-flex items-center bg-rich-brown hover:bg-soft-green text-white font-medium py-3 px-8 rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                          Try For Yourself
                          <FontAwesomeIcon icon={faShoppingCart} className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Newsletter Section */}
                  <div className="bg-soft-green py-16">
                    <div className="container mx-auto px-4">
                      <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-rich-brown mb-4">Join Our Newsletter</h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Subscribe to receive updates on new products, special offers, and healthy recipe ideas.</p>
                        
                        <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                          <input 
                            type="email" 
                            placeholder="Your email address" 
                            className="flex-grow px-4 py-3 rounded-full border border-gray-300 focus:border-soft-green focus:ring focus:ring-soft-green focus:ring-opacity-50 transition-all duration-300"
                            required
                          />
                          <button 
                            type="submit" 
                            className="bg-golden-yellow hover:bg-rich-brown text-white font-medium py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            Subscribe Now
                          </button>
                        </form>
                        
                        <p className="text-xs text-gray-500 mt-4">By subscribing, you agree to receive marketing emails from Linda's Nut Butter. You can unsubscribe at any time.</p>
                      </div>
                    </div>
                  </div>
                </>
              }
            />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            {/* Admin routes - wrapped with AdminAuthProvider */}
            <Route element={<AdminAuthWrapper />}>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
              <Route path="/admin/customers" element={<RequireAdmin><AdminCustomersPage /></RequireAdmin>} />
              <Route path="/admin/customers/:customerId" element={<RequireAdmin><AdminCustomerDetailPage /></RequireAdmin>} />
            </Route>
            
            {/* Customer account routes - wrapped with AuthProvider */}
            <Route element={<AuthWrapper />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account/login" element={<AccountLoginPage />} />
              <Route path="/account/register" element={<AccountRegisterPage />} />
              <Route path="/account/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/account/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Routes>
        </main>
        
        {/* Shopping Cart Drawer */}
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav setCartOpen={setCartOpen} />
        
        {/* Footer */}
        <footer className="bg-rich-brown text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                    <a href="tel:+254725317864" className="flex items-center hover:text-golden-yellow transition-colors">
                      <FontAwesomeIcon icon={faPhone} className="mr-2" />
                      +254 725 317 864
                    </a>
                  </li>
                  <li>
                    <a href="mailto:lmunyendo@gmail.com" className="flex items-center hover:text-golden-yellow transition-colors">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                      lmunyendo@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <a href="https://www.instagram.com/linda_nut_butters" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-500 transition-all duration-300 transform hover:scale-110">
                    <FontAwesomeIcon icon={faInstagram} size="2x" />
                  </a>
                  <a href="https://www.facebook.com/LindasNutbutters" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-600 transition-all duration-300 transform hover:scale-110">
                    <FontAwesomeIcon icon={faFacebook} size="2x" />
                  </a>
                  <a href="https://wa.me/254725317864" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-500 transition-all duration-300 transform hover:scale-110">
                    <FontAwesomeIcon icon={faWhatsapp} size="2x" />
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-warm-beige border-opacity-20 mt-8 pt-8 text-center">
              <p>© 2025 Linda's Nut Butter. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

// Admin authentication wrapper component
const AdminAuthWrapper = () => {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
};

// Require admin authentication component
const RequireAdmin = ({ children }) => {
  const { admin, loading, checkAdminAuth } = useAdminAuth();
  const [isChecking, setIsChecking] = useState(true);
  
  // Check admin authentication on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      await checkAdminAuth();
      setIsChecking(false);
    };
    
    verifyAdmin();
  }, [checkAdminAuth]);
  
  // Show loading spinner while checking
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not admin
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Render children if admin
  return children;
};

// Wrapper component for AuthProvider that includes Outlet for nested routes
const AuthWrapper = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default App;
