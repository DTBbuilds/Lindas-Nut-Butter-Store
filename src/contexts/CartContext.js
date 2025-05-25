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
    if (!product) {
      console.log('normalizeProductId: product is null or undefined');
      return null;
    }
    
    // Handle case where the entire product is passed vs just the ID
    if (typeof product === 'string' || typeof product === 'number') {
      console.log(`normalizeProductId: direct string/number ID: ${String(product)}`);
      return String(product); // Convert to string for consistent comparison
    }
    
    // Debug input product
    console.log('normalizeProductId input:', {
      name: product.name,
      id: product.id,
      _id: product._id,
      productId: product.productId,
      cartItemId: product.cartItemId
    });
    
    // Handle product objects with various ID formats
    const possibleIds = [
      product.productId,
      product._id,
      product.id,
      product.numericId,
      product.cartItemId // Added cartItemId as a possible ID
    ];
    
    // Filter out undefined/null values and convert to string
    const validIds = possibleIds.filter(id => id !== undefined && id !== null)
                              .map(id => String(id));
    
    console.log('Valid IDs found:', validIds);
    
    // For cart items, prioritize cartItemId if available
    if (product.cartItemId) {
      console.log('Using cartItemId as primary ID:', product.cartItemId);
      return String(product.cartItemId);
    }
    
    // For product variants, create a composite ID that includes selected variant info
    if (product.selectedVariant && validIds.length > 0) {
      const baseId = validIds[0];
      const variantId = product.selectedVariant.id || product.selectedVariant._id || product.selectedVariant.size || product.selectedVariant.mass;
      if (variantId) {
        const compositeId = `${baseId}_${variantId}`;
        console.log('Created variant composite ID:', compositeId);
        return compositeId;
      }
    }
    
    // Create a composite key for matching that includes product name and size
    // This helps identify duplicate products even with different IDs
    if (product.name) {
      const size = product.size || (product.selectedVariant && product.selectedVariant.size) || ''; 
      const nameBasedId = validIds.length > 0 ? `${validIds[0]}_${product.name}_${size}` : `${product.name}_${size}`;
      console.log('Created name-based ID:', nameBasedId);
      return nameBasedId;
    }
    
    const finalId = validIds.length > 0 ? validIds[0] : product.sku || null;
    console.log('Final normalized ID:', finalId);
    return finalId;
  };

  // Generate a unique cart item ID to avoid duplicate keys
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Create a standardized cart item structure
  const createCartItem = (product, quantity = 1) => {
    if (!product) return null;
    
    // Create unique cart item ID
    const cartItemId = generateUniqueId();
    
    // Handle variant price if selected variant exists
    let price = Number(product.price) || 0;
    let size = product.size || '370g'; // Default size
    let sku = product.sku || 'SKU-DEFAULT';
    
    if (product.selectedVariant) {
      price = product.selectedVariant.price || price;
      size = product.selectedVariant.size || `${product.selectedVariant.mass}g` || size;
      sku = product.selectedVariant.sku || sku;
    }
    
    // Ensure consistent structure for better deduplication
    return {
      cartItemId,
      id: product._id || product.id,
      productId: product._id || product.id, // Alternative ID format
      name: product.name,
      description: product.description,
      price,
      image: product.image || (product.images && product.images[0]),
      images: product.images,
      category: product.category,
      sku,
      inStock: product.inStock !== false, // Default to true if not specified
      stockQuantity: product.stockQuantity || 999, // Default to large value if not specified
      quantity: Number(quantity) || 1,
      size, // Standardized size format
      // Store variant in a consistent format
      selectedVariant: product.selectedVariant ? {
        id: product.selectedVariant.id || '',
        price: product.selectedVariant.price || price,
        size: product.selectedVariant.size || '',
        mass: product.selectedVariant.mass || '',
        sku: product.selectedVariant.sku || ''
      } : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add a composite key for better matching
      productSignature: `${product.name}_${size}`
    };
  };

  // Add item to cart with proper deduplication, inventory checking, and database synchronization
  const addToCart = async (product, requestedQuantity = 1) => {
    // Validate product
    if (!product) {
      toast.error(<CustomToast type="error" title="Error" message="Invalid product. Cannot add to cart." />, { containerId: 'main-toast-container' });
      return false;
    }

    // Enhanced duplicate detection with better product identity matching
    // Create a more reliable product signature that includes name and variant
    const productSignature = {
      ...product,
      // Make sure size is consistently represented
      size: product.size || (product.selectedVariant && (product.selectedVariant.size || `${product.selectedVariant.mass}g`)) || ''
    };
    
    const productId = normalizeProductId(productSignature);
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
          updatedProduct = {
            ...freshProduct,
            selectedVariant: product.selectedVariant, // Preserve selected variant
            size: product.size || (product.selectedVariant && (product.selectedVariant.size || `${product.selectedVariant.mass}g`)) || freshProduct.size
          };
          console.log('Got fresh product data for cart:', freshProduct.name);
        }
      } catch (error) {
        // If fetch fails, continue with the provided product data
        console.warn('Could not fetch fresh product data, using provided product:', error);
      }
      
      // Enhanced duplicate detection - check for similar products
      const existingItems = cartItems.filter(item => {
        // Primary match by ID
        if (normalizeProductId(item) === productId) return true;
        
        // Secondary match by name and size/variant
        if (item.name === product.name) {
          const itemSize = item.size || '';
          const productSize = product.size || 
            (product.selectedVariant && (product.selectedVariant.size || `${product.selectedVariant.mass}g`)) || '';
          
          return itemSize === productSize;
        }
        
        return false;
      });

      let updatedItems = [...cartItems];
      
      if (existingItems.length > 0) {
        // Update quantity if product already in cart
        const existingIndex = cartItems.indexOf(existingItems[0]);
        const newQuantity = (updatedItems[existingIndex].quantity || 1) + quantity;
        
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
        
        // Remove any other duplicate items that match this product
        if (existingItems.length > 1) {
          // Get all indices except the first one we just updated
          const duplicateIndices = existingItems.slice(1).map(item => cartItems.indexOf(item));
          
          // Filter out the duplicate items
          updatedItems = updatedItems.filter((_, index) => !duplicateIndices.includes(index));
        }
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
  const removeFromCart = (productOrId) => {
    try {
      console.log('RemoveFromCart called with:', productOrId);
      
      // Handle different parameter types
      const normalizedId = typeof productOrId === 'object' 
        ? normalizeProductId(productOrId) 
        : normalizeProductId({ id: productOrId });
      
      console.log('Normalized ID for removal:', normalizedId);
      
      // Find the item to display in toast
      const item = cartItems.find(item => {
        const itemId = normalizeProductId(item);
        const matches = itemId === normalizedId;
        console.log(`Comparing item ${item.name} for removal:`, { itemId, normalizedId, matches });
        return matches;
      });
      
      if (item) {
        console.log('Found item to remove:', item.name);
      } else {
        console.log('No matching item found for removal');
      }
      
      // Remove from cart
      setCartItems(prev => {
        const newItems = prev.filter(item => normalizeProductId(item) !== normalizedId);
        console.log('Items removed:', prev.length - newItems.length);
        return newItems;
      });
      
      // Show success toast if item was found
      if (item) {
        toast.success(<CustomToast type="success" title="Removed from Cart" message={`${item.name} removed from your cart`} />, { containerId: 'main-toast-container' });
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      toast.error(<CustomToast type="error" title="Error" message="Failed to remove item from cart" />, { containerId: 'main-toast-container' });
    }
  };

  // Update item quantity with inventory checks
  const updateQuantity = (productId, quantity) => {
    // Normalize the quantity value
    const newQuantity = Math.max(1, Number(quantity) || 1);
    
    console.log('CartContext: updateQuantity called with:', { productId, quantity });
    
    // Check if we have a string ID or an object
    if (typeof productId === 'object') {
      console.log('Product is an object:', productId);
    } else {
      console.log('Product ID is:', productId);
    }
    
    setCartItems(prev => {
      console.log('Current cart items:', prev);
      
      // Debug all item IDs in cart for comparison
      prev.forEach((item, index) => {
        const itemId = normalizeProductId(item);
        console.log(`Cart item ${index}:`, { 
          name: item.name,
          normalizedId: itemId,
          rawIds: {
            id: item.id,
            _id: item._id,
            productId: item.productId,
            cartItemId: item.cartItemId
          }
        });
      });
      
      const normalizedProductId = typeof productId === 'object' ? normalizeProductId(productId) : productId;
      console.log('Normalized product ID to find:', normalizedProductId);
      
      const updatedItems = prev.map(item => {
        const itemId = normalizeProductId(item);
        
        // Debug the comparison
        console.log(`Comparing item ${item.name}:`, { 
          itemId, 
          normalizedProductId, 
          matches: itemId === normalizedProductId 
        });
        
        if (itemId === normalizedProductId) {
          console.log('MATCH FOUND! Updating quantity for:', item.name);
          
          // Check if new quantity is within stock limits
          if (item.stockQuantity && newQuantity > item.stockQuantity) {
            // Don't update beyond stock limit
            toast.warning(<CustomToast type="warning" title="Limited Stock" message={`Only ${item.stockQuantity} units available`} />, { containerId: 'main-toast-container' });
            return {
              ...item,
              quantity: item.stockQuantity
            };
          }
          
          // Provide haptic feedback on mobile devices
          if (navigator.vibrate) {
            navigator.vibrate(10); // Gentle vibration
          }
          
          // Show toast feedback for quantity updates
          if (newQuantity > (item.quantity || 1)) {
            toast.info(<CustomToast type="info" title="Quantity Updated" message={`${item.name}: ${item.quantity} → ${newQuantity}`} />, 
              { containerId: 'main-toast-container', autoClose: 1500 });
          }
          
          const updatedItem = {
            ...item,
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          };
          
          console.log('Updated item:', updatedItem);
          return updatedItem;
        }
        return item;
      });
      
      // Check if any items were actually updated
      const itemWasUpdated = JSON.stringify(prev) !== JSON.stringify(updatedItems);
      console.log('Was any item updated?', itemWasUpdated);
      
      return updatedItems;
    });
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
