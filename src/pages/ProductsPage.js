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
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6"> {/* Added padding at bottom for mobile nav */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Our Products</h2>
        <div className="flex items-center">
          <div className="relative mr-4">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <input
              id="product-search"
              name="product-search"
              type="text"
              placeholder="Search products..."
              aria-label="Search products"
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
            onClick={() => {
              if (window.setCartOpen) {
                window.setCartOpen(true);
              } else {
                // Fallback if window function is not available
                setCartOpen(true);
              }
            }}
            className="relative bg-rich-brown text-white px-4 py-2 rounded-full flex items-center hover:bg-soft-green transition-all duration-300 group"
          >
            <div className={`absolute -top-2 -right-2 bg-golden-yellow text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ${window.cartAnimation ? 'animate-bounce' : ''}`}>
              {cartItems.length}
            </div>
            <FontAwesomeIcon 
              icon={faShoppingCart} 
              className={`mr-2 ${window.cartAnimation ? 'animate-wiggle' : ''} transition-transform duration-300 group-hover:scale-110`} 
            />
            <span>Cart</span>
          </button>
        </div>
      </div>
      
      <div className="lg:flex gap-6">
        {/* Mobile filter toggle */}
        <button 
          className="lg:hidden w-full bg-soft-green bg-opacity-20 text-rich-brown mb-4 py-2 rounded flex items-center justify-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FontAwesomeIcon icon={faFilter} className="mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {/* Sidebar for desktop or when toggled on mobile */}
        <div className={`lg:block lg:w-1/4 ${showFilters ? 'block' : 'hidden'} mb-6 lg:mb-0`}>
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            categories={categories} 
          />
        </div>
        
        {/* Main content */}
        <div className="lg:w-3/4">
          <div className="bg-soft-green bg-opacity-10 p-4 rounded mb-6 flex justify-between items-center">
            <p className="text-sm">
              Showing <span className="font-bold">{filteredProducts.length}</span> of <span className="font-bold">{products.length}</span> products
            </p>

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product._id || product.id}
              product={product}
              addToCart={addToCart} // Now from context
            />
          ))}
        </div>
      )}
        </div>
      </div>
      
      
      
      {/* Mobile Bottom Navigation with Cart */}
      <MobileBottomNav 
        cartItems={cartItems} // Now from context
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
