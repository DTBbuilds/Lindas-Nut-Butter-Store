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
  const [cartTotal, setCartTotal] = useState({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lindas-cart', JSON.stringify(cartItems));

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 500 : 0; // Example shipping logic
    const total = subtotal + shipping;
    const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    setCartTotal({ subtotal, shipping, total, itemCount });
  }, [cartItems]);
  
  // Sync cart with database products
  const syncCartWithDatabase = useCallback(async (force = false) => {
    // Only sync if we haven't synced in the last 5 minutes, unless forced
    const fiveMinutes = 5 * 60 * 1000;
    const shouldSync = force || !lastSyncTime || (Date.now() - lastSyncTime > fiveMinutes);
    
    if (!shouldSync || isSyncing || cartItems.length === 0) return cartItems; // Return current items if sync is skipped
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
        return cartItems; // Return original items on fetch failure
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
          return item; // Keep the item as is if no match is found
        }
        
        // A fresh product was found, so we create an updated version of the item.
        // This ensures the ID is always updated from 'temp-...' to the real one.
        const updatedItem = {
          ...item,
          price: freshProduct.price,
          inStock: freshProduct.inStock ?? true,
          id: freshProduct.id, // Always use the ID from the database
          productId: freshProduct.id, // Keep consistent
          name: freshProduct.name,
          image: freshProduct.image || (freshProduct.images && freshProduct.images[0]) || item.image,
          lastSyncedAt: new Date().toISOString()
        };

        // Log significant changes for debugging
        if (freshProduct.price !== item.price) {
          console.log(`Price changed for ${item.name}: ${item.price} → ${freshProduct.price}`);
        }
        if (('inStock' in freshProduct) && (freshProduct.inStock !== item.inStock) && !freshProduct.inStock) {
          console.warn(`Product ${item.name} is now out of stock`);
        }
        
        return updatedItem;
      });
      
      // If any items were updated, update the cart state
      const hasUpdates = updatedItems.some((item, i) => item !== cartItems[i]);
      
      if (hasUpdates) {
        setCartItems(updatedItems);
        
        // Only show toast for user-initiated updates (not background syncs)
        if (force) {
          toast.info('Cart has been updated with the latest product information');
        }
        
        // Check for out-of-stock items
        const outOfStockItems = updatedItems.filter(item => item.inStock === false);
        if (outOfStockItems.length > 0) {
          const itemNames = outOfStockItems.map(item => item.name).join(', ');
          toast.warning(`Some items in your cart are out of stock: ${itemNames}`);
        }
      }
      
      return updatedItems;
    } catch (error) {
      console.error('Error syncing cart with database:', error);
      return cartItems; // Return original items on general failure
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
  const addToCart = (product, requestedQuantity = 1) => {
    if (!product || !(product._id || product.id)) {
      toast.error(<CustomToast type="error" title="Error" message="Invalid product data." />);
      return;
    }

    const quantity = Number(requestedQuantity) || 1;

    // A unique signature for a product variant (e.g., 'productId_size')
    const size = product.selectedVariant ? (product.selectedVariant.size || `${product.selectedVariant.mass}g`) : (product.size || '370g');
    const itemSignature = `${product._id || product.id}_${size}`;

    const existingCartItemIndex = cartItems.findIndex(
      (item) => {
        const existingItemSize = item.selectedVariant ? (item.selectedVariant.size || `${item.selectedVariant.mass}g`) : (item.size || '370g');
        return `${item.id}_${existingItemSize}` === itemSignature;
      }
    );

    if (existingCartItemIndex > -1) {
      // Product variant already in cart, so update quantity
      const updatedItems = [...cartItems];
      const existingItem = updatedItems[existingCartItemIndex];
      existingItem.quantity += quantity;
      existingItem.updatedAt = new Date().toISOString();
      
      setCartItems(updatedItems);
      toast.success(<CustomToast type="success" title="Cart Updated" message={`${existingItem.name} quantity is now ${existingItem.quantity}.`} />);
    } else {
      // Product variant not in cart, add as a new item
      const newCartItem = createCartItem(product, quantity);
      if (newCartItem) {
        setCartItems((prevItems) => [...prevItems, newCartItem]);
        toast.success(<CustomToast type="success" title="Added to Cart" message={`${newCartItem.name} added to your cart!`} />);
      }
    }

    // Trigger cart animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 1000);
  };

  const removeFromCart = (itemIdToRemove) => {
    if (!itemIdToRemove) {
      console.error("removeFromCart: Invalid item ID provided.", itemIdToRemove);
      toast.error(<CustomToast type="error" title="Error" message="Could not remove item." />);
      return;
    }

    const itemToRemove = cartItems.find(item => 
        item.cartItemId === itemIdToRemove || 
        item._id === itemIdToRemove || 
        item.id === itemIdToRemove
    );

    if (itemToRemove) {
      const updatedCartItems = cartItems.filter(item => item.cartItemId !== itemIdToRemove);
      setCartItems(updatedCartItems);
      toast.success(<CustomToast type="success" title="Removed from Cart" message={`${itemToRemove.name} removed from your cart`} />);
    } else {
      console.warn('No matching item found for removal. Item ID:', itemIdToRemove);
      toast.error(<CustomToast type="error" title="Error" message="Could not find the item to remove." />);
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
            toast.warning(<CustomToast type="warning" title="Limited Stock" message={`Only ${item.stockQuantity} units available`} />);
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
              { autoClose: 1500 });
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
    toast.info(<CustomToast type="info" title="Cart Cleared" message="Your cart has been cleared." />);
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
      toast.success(<CustomToast type="success" title="Wishlist" message={`${product.name} added to your wishlist!`} />);
    } else {
      toast.info(<CustomToast type="info" title="Wishlist" message={`${product.name} is already in your wishlist.`} />);
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
    clearCart, // ADDED THIS LINE
    cartTotal,
    // Sync functionality
    syncCartWithDatabase,
    isSyncing,
    lastSyncTime,
    // Wishlist functionality
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    getRelatedProducts
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
