import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import CustomToast from '../components/CustomToast';
import productService from '../services/productService';

// Create Cart Context
const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('lindas-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lindas-cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  // Sync cart with database products
  const syncCartWithDatabase = useCallback(async (force = false) => {
    // Only sync if we haven't synced in the last 5 minutes, unless forced
    const fiveMinutes = 5 * 60 * 1000;
    const shouldSync = force || !lastSyncTime || (Date.now() - lastSyncTime > fiveMinutes);
    
    if (!shouldSync || isSyncing || cartItems.length === 0) return;
    try {
      console.log('Syncing cart with database, force update:', force);
      setIsSyncing(true);
      setLastSyncTime(Date.now()); // Update sync timestamp
      
      // Only fetch products if we haven't done so already
      let freshProducts;
      try {
        freshProducts = await productService.fetchProducts();
        console.log('Fetched', freshProducts.length, 'products for cart sync');
      } catch (error) {
        console.error('Error fetching product data for sync:', error);
        // Continue with the items we have
        setIsSyncing(false);
        return cartItems;
      }
      
      // Create a map for faster product lookup with consistent ID handling
      const productMap = {};
      freshProducts.forEach(product => {
        // Store product references by all possible ID formats
        productMap[product.id] = product;                  // MongoDB string ID
        productMap[product.numericId] = product;           // Numeric database ID
        productMap[String(product.numericId)] = product;   // String version of numeric ID
      });
      
      // Map through cart items and update with fresh data
      const updatedItems = cartItems.map(item => {
        // Use our product map for faster, more reliable lookups
        const productId = item.id || item.productId;
        const freshProduct = productMap[productId] || 
                            productMap[String(productId)] ||
                            // Fallback to slower, full search in case ID formats don't match
                            freshProducts.find(p => p.name === item.name);
        
        if (!freshProduct) {
          console.warn(`Product not found in database during sync: ${item.name} (ID: ${productId})`);
          return item; // Keep the item as is
        }
        // Check if price or stock status has changed
        const priceChanged = freshProduct.price !== item.price;
        const stockChanged = ('inStock' in freshProduct) && (freshProduct.inStock !== item.inStock);
        
        // Log important changes
        if (priceChanged) {
          console.log(`Price changed for ${item.name}: ${item.price} → ${freshProduct.price}`);
        }
        
        if (stockChanged && !freshProduct.inStock) {
          console.warn(`Product ${item.name} is now out of stock`);
        }
        
        // If force parameter is true or there are changes, update the item
        if (force || priceChanged || stockChanged) {
          return {
            ...item,
            price: freshProduct.price,
            inStock: freshProduct.inStock ?? true, // Default to true if not specified
            // Ensure consistent ID format
            id: freshProduct.id || item.id,
            productId: freshProduct.id || item.productId,
            // Update other product fields
            name: freshProduct.name || item.name,
            image: freshProduct.image || (freshProduct.images && freshProduct.images[0]) || item.image,
            // Track the last sync time
            lastSyncedAt: new Date().toISOString()
          };
        }
        return item;
      });
      
      // If any items were updated, update the cart state
      const hasUpdates = updatedItems.some((item, i) => item !== cartItems[i]);
      
      if (hasUpdates) {
        setCartItems(updatedItems);
        localStorage.setItem('cartItems', JSON.stringify(updatedItems));
        
        // Only show toast for user-initiated updates (not background syncs)
        if (force) {
          toast.info('Cart has been updated with the latest product information', { containerId: 'main-toast-container' });
        }
        
        // Check for out-of-stock items
        const outOfStockItems = updatedItems.filter(item => item.inStock === false);
        if (outOfStockItems.length > 0) {
          const itemNames = outOfStockItems.map(item => item.name).join(', ');
          toast.warning(`Some items in your cart are out of stock: ${itemNames}`, { containerId: 'main-toast-container' });
        }
      }
      
      return updatedItems;
    } catch (error) {
      console.error('Error syncing cart with database:', error);
    }
  }, [cartItems]);
  
  // Sync cart with database when cart opens or when component mounts
  useEffect(() => {
    if (cartOpen && cartItems.length > 0) {
      syncCartWithDatabase();
    }
  }, [cartOpen, cartItems.length, syncCartWithDatabase]);
  
  // Sync cart with database periodically in the background (every 5 minutes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (cartItems.length > 0) {
        syncCartWithDatabase();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [syncCartWithDatabase, cartItems.length]);

  // Standardize product IDs for consistent handling
  const normalizeProductId = (product) => {
    // Debug the incoming product
    console.log('Normalizing product ID for:', product ? 
      (product.name || 'unnamed product') : 'undefined product');

    // Handle product IDs consistently by checking all possible formats
    // 1. If product is an ID string or number itself, return it as string
    if (typeof product === 'string' || typeof product === 'number') {
      console.log(`Direct ID conversion: ${String(product)}`);
      return String(product);
    }

    // If product is null or undefined, return null
    if (!product) {
      console.warn('Product is null or undefined');
      return null;
    }

    // Priority for numeric ID (matches MongoDB schema)
    if (product.id !== undefined && product.id !== null) {
      console.log(`Using numeric ID: ${product.id}`);
      return String(product.id); // Always convert to string for consistent comparison
    }

    // Fall back to MongoDB _id if numeric id is not available
    if (product._id) {
      console.log(`Using MongoDB _id: ${product._id}`);
      return String(product._id);
    }

    // Last resort - check for productId field (already normalized)
    if (product.productId) {
      console.log(`Using productId field: ${product.productId}`);
      return String(product.productId);
    }

    // Handle nested product structure
    if (product.product && (typeof product.product === 'string' || typeof product.product === 'number')) {
      console.log(`Using nested product ID: ${product.product}`);
      return String(product.product);
    }
    
    console.warn('Product has no valid ID', product);
    return null;
  };

  // Generate a unique cart item ID to avoid duplicate keys
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Create a standardized cart item structure
  const createCartItem = (product, quantity = 1) => {
    // Get normalized string ID
    const productId = normalizeProductId(product);
    if (!productId) {
      throw new Error('Cannot add product without ID to cart');
    }

    // Important: Ensure we preserve the numeric id which corresponds to the database schema
    // The backend expects products with numeric IDs
    let numericId = 0;
    
    // Try to get numeric ID - first check if product already has numeric id
    if (product.id !== undefined && product.id !== null) {
      numericId = Number(product.id);
    } 
    // Fall back to converting the string productId to number if possible
    else if (!isNaN(Number(productId))) {
      numericId = Number(productId);
    }

    console.log(`Creating cart item for ${product.name || 'Unknown Product'} with ID: ${productId} (numeric: ${numericId})`);
    
    // Generate a unique cart item ID to avoid duplicate keys
    const uniqueCartItemId = generateUniqueId();
    
    // Standardized cart item format - always includes necessary fields
    return {
      ...product,                        // Preserve all original product data
      _id: uniqueCartItemId,             // Unique ID for cart item to prevent duplicate keys
      id: numericId,                     // Numeric ID matching database schema
      productId: String(productId),      // Consistent ID field name for lookups as STRING
      name: product.name || 'Unknown Product',
      price: Number(product.price) || 0,
      image: product.image || (product.images && product.images[0]) || '/images/placeholder.png',
      images: product.images || (product.image ? [product.image] : []),
      category: product.category || '',
      sku: product.sku || '',
      quantity: Number(quantity) || 1,
      addedAt: new Date().toISOString(), // Track when item was added
      inStock: product.inStock === false ? false : true, // Explicitly set inStock status
      stockQuantity: product.stockQuantity || 999    // Track available stock with fallback
    };
  };

  // Add item to cart with proper deduplication, inventory checking, and database synchronization
  const addToCart = async (product, requestedQuantity = 1) => {
    // Validate product
    if (!product) {
      toast.error(<CustomToast type="error" title="Error" message="Invalid product. Cannot add to cart." />, { containerId: 'main-toast-container' });
      return false;
    }

    const productId = normalizeProductId(product);
    if (!productId) {
      toast.error(<CustomToast type="error" title="Error" message="Product has no valid ID. Cannot add to cart." />, { containerId: 'main-toast-container' });
      return false;
    }
    
    // Normalize requested quantity
    const quantity = Number(requestedQuantity) || 1;
    
    try {
      // Try to get fresh product data from database for consistency
      let updatedProduct = product;
      try {
        // Get the numeric ID or string ID
        const idForFetch = typeof product.id === 'number' ? product.id : product.productId || product.id;
        const freshProduct = await productService.fetchProductById(idForFetch);
        if (freshProduct) {
          updatedProduct = freshProduct;
          console.log('Got fresh product data for cart:', freshProduct.name);
        }
      } catch (error) {
        // If fetch fails, continue with the provided product data
        console.warn('Could not fetch fresh product data, using provided product:', error);
      }
    
      // Check if product already exists in cart using the normalized ID
      const existingIndex = cartItems.findIndex(item => {
        const itemId = normalizeProductId(item);
        return itemId === productId;
      });

      let updatedItems = [...cartItems];
      let newQuantity;
      
      if (existingIndex >= 0) {
        // Update quantity if product already in cart
        newQuantity = (updatedItems[existingIndex].quantity || 1) + quantity;
        
        // Update the existing item with fresh product data if available
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          name: updatedProduct.name,
          price: updatedProduct.price,
          image: updatedProduct.image,
          images: updatedProduct.images,
          inStock: updatedProduct.inStock,
          stockQuantity: updatedProduct.stockQuantity,
          quantity: newQuantity,
          updatedAt: new Date().toISOString() // Track updates
        };
      } else {
        // Add new item to cart with fresh data
        const cartItem = createCartItem(updatedProduct, quantity);
        updatedItems = [...updatedItems, cartItem];
      }
      
      setCartItems(updatedItems);

      // Cart animation
      setCartAnimation(true);
      setTimeout(() => setCartAnimation(false), 1000);
      
      // Show success notification
      toast.success(<CustomToast type="success" title="Added to Cart" message={`${updatedProduct.name} added to your cart!`} />, { containerId: 'main-toast-container' });
      return true;
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error(<CustomToast type="error" title="Error" message="Failed to add product to cart. Please try again." />, { containerId: 'main-toast-container' });
      return false;
    }
  };

  // Remove item from cart with enhanced feedback
  const removeFromCart = (productId) => {
    const normalizedId = typeof productId === 'object' ? normalizeProductId(productId) : productId;
    
    // Find the item first to get its name for the notification
    const itemToRemove = cartItems.find(item => {
      const itemId = normalizeProductId(item);
      return itemId === normalizedId;
    });
    
    setCartItems(prevItems => 
      prevItems.filter(item => normalizeProductId(item) !== normalizedId)
    );
    
    if (itemToRemove) {
      toast.info(<CustomToast type="info" title="Removed" message={`${itemToRemove.name} removed from cart.`} />, { containerId: 'main-toast-container' });
    } else {
      toast.info(<CustomToast type="info" title="Removed" message="Item removed from cart." />, { containerId: 'main-toast-container' });
    }
  };

  // Update item quantity with inventory checks
  const updateQuantity = (productId, quantity) => {
    const normalizedId = typeof productId === 'object' ? normalizeProductId(productId) : productId;
    
    // Handle removal if quantity is zero or less
    if (quantity <= 0) {
      removeFromCart(normalizedId);
      return;
    }
    
    // Find the item to update using consistent ID handling
    const itemToUpdate = cartItems.find(item => {
      const itemId = normalizeProductId(item);
      return itemId === normalizedId;
    });
    
    if (itemToUpdate) {
      // Allow any quantity (no stock limit)
      // if (itemToUpdate.stockQuantity !== undefined && quantity > itemToUpdate.stockQuantity) {
      //   toast.warning(<CustomToast type="warning" title="Stock Limit" message={`Only ${itemToUpdate.stockQuantity} units available.`} />, { containerId: 'main-toast-container' });
      //   quantity = itemToUpdate.stockQuantity;
      // }
      
      // Update the item
      setCartItems(prevItems => 
        prevItems.map(item => 
          normalizeProductId(item) === normalizedId 
            ? { ...item, quantity, updatedAt: new Date().toISOString() } 
            : item
        )
      );
    }
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    toast.info(<CustomToast type="info" title="Cart Cleared" message="Your cart has been cleared." />, { containerId: 'main-toast-container' });
  };

  // Cart totals calculation - VAT and discounts disabled as per business requirements
  const getCartTotals = (discountCode = null) => {
    // Calculate subtotal from all items
    const subtotal = cartItems.reduce(
      (total, item) => total + (item.price * (item.quantity || 1)), 
      0
    );
    
    // Flat shipping fee of 300 KSH for all orders
    const shippingCost = 300; // Flat shipping fee regardless of order total
    
    // VAT and discounts are disabled
    const taxAmount = 0; // VAT disabled
    const discountAmount = 0; // Discounts disabled
    const discountName = ''; // Discounts disabled
    
    // Calculate final total without VAT or discounts
    const total = subtotal + shippingCost;
    
    // Count total items
    const itemCount = cartItems.reduce((count, item) => count + (item.quantity || 1), 0);
    
    return {
      subtotal,
      shipping: shippingCost,
      tax: taxAmount, // Will be 0
      discount: discountAmount, // Will be 0
      discountName, // Will be empty string
      total,
      itemCount
    };
    
    /* Original implementation with VAT and discounts - preserved for future use
    // Initialize discount amount
    let discountAmount = 0;
    let discountName = '';
    
    // Apply discount if provided
    if (discountCode) {
      // Example discount logic - this would be expanded with real discount validation
      if (discountCode === 'WELCOME10') {
        discountAmount = subtotal * 0.1; // 10% off
        discountName = '10% Welcome Discount';
      } else if (discountCode === 'FREESHIP') {
        // Free shipping discount would be applied to shipping cost
        discountName = 'Free Shipping';
      }
    }
    
    // Calculate tax - Kenya VAT is 16%
    const taxRate = 0.16;
    const taxAmount = subtotal * taxRate;
    
    // Calculate final total with VAT and discounts
    const total = subtotal + shippingCost + taxAmount - discountAmount;
    */
  };

  // Add wishlist functionality
  const [wishlistItems, setWishlistItems] = useState(() => {
    const savedWishlist = localStorage.getItem('lindas-wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  
  // Save wishlist to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lindas-wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);
  
  // Add to wishlist
  const addToWishlist = (product) => {
    const productId = normalizeProductId(product);
    if (!productId) return;
    
    // Check if already in wishlist
    const exists = wishlistItems.some(item => normalizeProductId(item) === productId);
    
    if (!exists) {
      setWishlistItems(prev => [...prev, createCartItem(product, 1)]);
      toast.success(<CustomToast type="success" title="Wishlist" message={`${product.name} added to your wishlist!`} />, { containerId: 'main-toast-container' });
    } else {
      toast.info(<CustomToast type="info" title="Wishlist" message={`${product.name} is already in your wishlist.`} />, { containerId: 'main-toast-container' });
    }
  };
  
  // Remove from wishlist
  const removeFromWishlist = (productId) => {
    const normalizedId = typeof productId === 'object' ? normalizeProductId(productId) : productId;
    setWishlistItems(prev => prev.filter(item => normalizeProductId(item) !== normalizedId));
  };
  
  // Move from wishlist to cart
  const moveToCart = (productId) => {
    const normalizedId = typeof productId === 'object' ? normalizeProductId(productId) : productId;
    const item = wishlistItems.find(item => normalizeProductId(item) === normalizedId);
    if (item) {
      addToCart(item);
      removeFromWishlist(normalizedId);
    }
  };
  
  // Get related products based on cart items using ProductService
  const getRelatedProducts = async () => {
    if (cartItems.length === 0) return [];
    
    try {
      // Get categories from cart items
      const categories = [...new Set(cartItems.map(item => item.category).filter(Boolean))];
      
      // Get a random category from cart items
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      // Get product IDs already in cart to exclude them
      const cartProductIds = cartItems.map(item => normalizeProductId(item));
      
      // Use ProductService to fetch related products
      let relatedProducts = [];
      try {
        // Get products from the random category using our service
        relatedProducts = await productService.fetchProductsByCategory(randomCategory, { limit: 8 });
      } catch (error) {
        console.error('Error fetching related products:', error);
        return [];
      }
      
      // Filter out products already in cart
      return relatedProducts
        .filter(product => !cartProductIds.includes(normalizeProductId(product)))
        .slice(0, 4);
    } catch (error) {
      console.error('Error getting related products:', error);
      return [];
    }
  };
  
  // Discount code functionality - disabled as per business requirements
  // State maintained for future use but functionality disabled
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  
  const applyDiscount = (code) => {
    // Discount functionality disabled
    toast.info(<CustomToast type="info" title="Discounts Disabled" message="Discount codes are not currently accepted." />, { containerId: 'main-toast-container' });
    return false;
    
    /* Original implementation - preserved for future use
    // Simple validation example - would be replaced with server-side validation
    if (code === 'WELCOME10' || code === 'FREESHIP') {
      setDiscountCode(code);
      setDiscountApplied(true);
      toast.success(<CustomToast type="success" title="Discount Applied" message={`Discount code ${code} applied!`} />, { containerId: 'main-toast-container' });
      return true;
    } else {
      toast.error(<CustomToast type="error" title="Invalid Code" message="Invalid discount code." />, { containerId: 'main-toast-container' });
      return false;
    }
    */
  };
  
  const removeDiscount = () => {
    // Just clear the state, but discount functionality is disabled
    setDiscountCode('');
    setDiscountApplied(false);
  };

  // Provide expanded cart context value
  const value = {
    cartItems,
    cartOpen,
    cartAnimation,
    setCartOpen,
    setCartAnimation,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotals,
    // Sync functionality
    syncCartWithDatabase,
    isSyncing,
    lastSyncTime,
    // Wishlist functionality
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    getRelatedProducts,
    // Discount functionality
    discountCode,
    discountApplied,
    applyDiscount,
    removeDiscount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
