import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import productService from '../services/productService';
import FilterSidebar from '../components/FilterSidebar';
import MobileBottomNav from '../components/MobileBottomNav';
import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingCart, faFilter } from '@fortawesome/free-solid-svg-icons';

function ProductsPage() {
  const { addToCart, cartItems } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: { min: 0, max: 3000 },
    features: [],
    sort: 'price-low'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from backend on mount using our ProductService
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // Use our standardized product service
        const processedProducts = await productService.fetchProducts({
          limit: 100,  // Increase limit to get more products
          sort: 'name' // Ensure consistent ordering
        });
        
        if (processedProducts && processedProducts.length > 0) {
          console.log('Products fetched successfully:', processedProducts.length);
          setProducts(processedProducts);
          setFilteredProducts(processedProducts);
        } else {
          console.warn('No products found or empty response');
          toast.info('No products available at the moment', { containerId: 'main-toast-container' });
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        const errorMessage = err.response?.data?.message || 
          (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Failed to load products');
        
        toast.error(errorMessage, {
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          containerId: 'main-toast-container'
        });
        
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique categories from products
  const categories = [...new Set(products.map(product => product.category))];

  // Filter and sort products based on filters
  // (Removed local cart sync logic; cartItems now comes from context)


  // Memoize filtered products
  // (No change needed here)
  useEffect(() => {
    const filterProducts = () => {
      let result = [...products];
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(product => 
          product.name.toLowerCase().includes(query) || 
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      }
      // Filter by categories
      if (filters.categories.length > 0) {
        result = result.filter(product => filters.categories.includes(product.category));
      }
      // Filter by price range
      result = result.filter(product => 
        product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
      );
      // Filter by features
      if (filters.features.length > 0) {
        result = result.filter(product => 
          product.features && filters.features.some(feature => product.features.includes(feature))
        );
      }
      // Sort products
      switch (filters.sort) {
        case 'price-low':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          result.sort((a, b) => b.id - a.id);
          break;
        default:
          break;
      }
      return result;
    };
    
    const timeoutId = setTimeout(() => {
      setFilteredProducts(filterProducts());
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, products]);

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      {/* Header Section with Improved Mobile Spacing */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-rich-brown mb-3">Linda's Nut Butter Products</h1>
        <p className="text-sm sm:text-base text-gray-600">Discover our range of delicious, naturally sweet nut butters made with premium nuts.</p>
      </div>
      
      {/* Mobile Sticky Search and Filter Bar */}
      <div className="sticky top-0 z-10 bg-white pb-3 pt-2 -mx-4 px-4 mb-4 shadow-sm lg:shadow-none lg:static lg:mb-6 lg:p-0 lg:z-0">
        {/* Search Bar - Full Width on Mobile */}
        <div className="relative w-full mb-3 lg:mb-0 lg:max-w-lg">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-soft-green text-white rounded-full p-1 sm:hidden"
            onClick={() => setSearchQuery('')}
            style={{ display: searchQuery ? 'block' : 'none' }}
            aria-label="Clear search"
          >
            ×
          </button>
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            aria-hidden="true"
          />
        </div>
        
        {/* Mobile Filter Controls */}
        <div className="flex justify-between items-center lg:hidden">
          <button 
            className={`flex-1 mr-2 py-2 px-4 rounded-full flex items-center justify-center ${showFilters ? 'bg-soft-green text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            <span>Filters</span>
            {filters.categories.length > 0 || filters.features.length > 0 ? 
              <span className="ml-2 bg-white text-soft-green rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {filters.categories.length + filters.features.length}
              </span> : null
            }
          </button>
          
          <button 
            onClick={() => {
              if (window.setCartOpen) {
                window.setCartOpen(true);
              } else {
                setCartOpen(true);
              }
            }}
            className="relative flex-1 bg-rich-brown text-white py-2 px-4 rounded-full flex items-center justify-center"
          >
            <div className={`absolute -top-2 -right-2 bg-golden-yellow text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ${window.cartAnimation ? 'animate-bounce' : ''}`}>
              {cartItems.length}
            </div>
            <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
            <span>Cart</span>
          </button>
        </div>
      </div>
      
      {/* Desktop Filter and Search Controls */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-grow max-w-lg">
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-soft-green focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              aria-hidden="true"
            />
          </div>
          <button 
            className="relative bg-rich-brown text-white px-4 py-2 rounded-full flex items-center hover:bg-soft-green transition-all duration-300 group"
            onClick={() => {
              if (window.setCartOpen) {
                window.setCartOpen(true);
              } else {
                setCartOpen(true);
              }
            }}
          >
            <div className={`absolute -top-2 -right-2 bg-golden-yellow text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ${window.cartAnimation ? 'animate-bounce' : ''}`}>
              {cartItems.length}
            </div>
            <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
            <span>Cart</span>
          </button>
        </div>
      </div>
      
      <div className="lg:flex gap-6">
        {/* Mobile Filter Panel - Sliding Drawer */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex" onClick={() => setShowFilters(false)}>
            <div 
              className="bg-white w-4/5 max-w-sm h-full overflow-y-auto animate-slide-in-right" 
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                <h3 className="font-bold text-lg">Filters</h3>
                <button 
                  className="text-gray-500 hover:text-gray-800"
                  onClick={() => setShowFilters(false)}
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <FilterSidebar 
                  filters={filters} 
                  setFilters={setFilters} 
                  categories={categories}
                  isMobile={true}
                />
              </div>
              <div className="sticky bottom-0 bg-white border-t p-4 flex space-x-3">
                <button 
                  className="flex-1 py-2 bg-gray-200 rounded-md text-gray-700"
                  onClick={() => {
                    setFilters({
                      categories: [],
                      priceRange: { min: 0, max: 3000 },
                      features: [],
                      sort: 'price-low'
                    });
                  }}
                >
                  Reset
                </button>
                <button 
                  className="flex-1 py-2 bg-soft-green text-white rounded-md"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-1/4 mb-6 lg:mb-0">
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            categories={categories} 
          />
        </div>
        
        {/* Main content */}
        <div className="lg:w-3/4">
          <div className="bg-soft-green bg-opacity-10 p-3 rounded mb-4 flex justify-between items-center">
            <p className="text-xs sm:text-sm">
              Showing <span className="font-bold">{filteredProducts.length}</span> of <span className="font-bold">{products.length}</span> products
            </p>
            
            {/* Sort dropdown for mobile */}
            <div className="relative">
              <select 
                className="text-xs sm:text-sm bg-white border border-gray-300 rounded-md py-1 px-2 appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-soft-green"
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg">No products match your filters.</p>
              <button 
                className="mt-4 text-soft-green hover:underline"
                onClick={() => setFilters({
                  categories: [],
                  priceRange: { min: 0, max: 3000 },
                  features: [],
                  sort: 'price-low'
                })}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product._id || product.id}
                  product={product}
                  addToCart={addToCart}
                  isMobile={window.innerWidth < 640}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation with Cart */}
      <MobileBottomNav 
        cartItems={cartItems}
        setCartOpen={() => {
          if (window.setCartOpen) {
            window.setCartOpen(true);
          } else {
            setCartOpen(true);
          }
        }} 
      />
    </div>
  );
}

export default ProductsPage;
