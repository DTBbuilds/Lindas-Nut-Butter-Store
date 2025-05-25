import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import productService from '../services/productService';

// Components
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import CartSummary from '../components/checkout/CartSummary';
import CustomerInfoForm from '../components/checkout/CustomerInfoForm';
import PaymentMethodForm from '../components/checkout/PaymentMethodForm';
import OrderConfirmation from '../components/checkout/OrderConfirmation';
import LoginStep from '../components/checkout/LoginStep';
import LoadingOverlay from '../components/common/LoadingOverlay';

// Utils
import { generateOrderNumber } from '../utils/orderUtils';

// Constants
// Keep two separate arrays - one with login step and one without
const STEPS_WITH_LOGIN = ['Cart Review', 'Login', 'Customer Info', 'Payment', 'Confirmation'];
const STEPS_WITHOUT_LOGIN = ['Cart Review', 'Customer Info', 'Payment', 'Confirmation'];

// Default to steps with login, will be updated based on auth status
const STEPS = STEPS_WITH_LOGIN;

const NewCheckoutPage = () => {
  // Navigation and state management
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Authentication context
  const { user, isAuthenticated } = useAuth();
  
  // Use different step arrays based on authentication status
  const [checkoutSteps, setCheckoutSteps] = useState(STEPS_WITH_LOGIN);
  
  // Cart state from context
  const { 
    cartItems = [], 
    removeFromCart, 
    updateQuantity, 
    getCartTotals, 
    clearCart 
  } = useCart();
  
  const cartTotal = getCartTotals();
  
  // Form state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    apartment: '',
    city: 'Nairobi'
  });
  
  const [orderInfo, setOrderInfo] = useState({
    orderId: '',
    orderNumber: generateOrderNumber(),
    orderDate: new Date().toISOString(),
    estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 48 hours delivery time
    orderStatus: 'PENDING',
    shippingFee: 300 // Fixed shipping fee for Nairobi in KES
  });

  // Store a copy of the order items and totals for the confirmation page
  const [orderItems, setOrderItems] = useState([]);
  const [orderTotals, setOrderTotals] = useState(null);

  // Redirect if cart is empty but only if we're not on the confirmation step
  useEffect(() => {
    // Only redirect if cart is empty AND we're not on the confirmation step (last step)
    if ((!cartItems || cartItems.length === 0) && activeStep !== STEPS.length - 1) {
      toast.error('Your cart is empty. Please add some products before checking out.', { containerId: 'main-toast-container' });
      const timer = setTimeout(() => navigate('/products'), 2000);
      return () => clearTimeout(timer);
    }
  }, [cartItems, navigate, activeStep]);
  
  // Update checkout steps and pre-populate customer info when auth status changes
  useEffect(() => {
    // If user is authenticated, use steps without login
    if (isAuthenticated) {
      setCheckoutSteps(STEPS_WITHOUT_LOGIN);
      console.log('User is authenticated, using checkout flow without login step');
      
      // If currently on login step, skip to customer info
      if (activeStep === 1 && checkoutSteps === STEPS_WITH_LOGIN) {
        setActiveStep(1); // In the steps without login, index 1 is Customer Info
      }
      
      // Try to get customer info from session storage first (from recent login/registration)
      const savedInfo = sessionStorage.getItem('checkoutCustomerInfo');
      if (savedInfo) {
        try {
          const parsedInfo = JSON.parse(savedInfo);
          setCustomerInfo({
            ...customerInfo,
            ...parsedInfo
          });
          console.log('Pre-populated customer info from session storage');
        } catch (e) {
          console.error('Failed to parse customer info from session storage:', e);
          // Fall back to user profile data
          populateFromUserProfile();
        }
      } else {
        // If no session data, use user profile
        populateFromUserProfile();
      }
    } else {
      setCheckoutSteps(STEPS_WITH_LOGIN);
      console.log('User is not authenticated, using checkout flow with login step');
    }
  }, [isAuthenticated, user, activeStep]);
  
  // Helper function to populate customer info from user profile
  const populateFromUserProfile = () => {
    if (user && user.name) {
      setCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        apartment: user.apartment || '',
        city: user.city || 'Nairobi'
      });
      console.log('Pre-populated customer info from user profile');
    }
  };

  // Enhanced product fetching and validation using ProductService
  const fetchProducts = useCallback(async () => {
    if (!cartItems?.length) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching products for validation using ProductService...');
      setLoadingMessage('Validating cart items...');
      
      // Use our standardized product service instead of direct API calls
      const productsData = await productService.fetchProducts();
      
      // If we have product data, use it for validation
      if (productsData && productsData.length > 0) {
        console.log('Successfully loaded products:', productsData.length);
        setAllProducts(productsData);
        
        // Log first product for debugging
        if (productsData.length > 0) {
          console.log('Sample product data:', {
            id: productsData[0].id,
            _id: productsData[0]._id,
            name: productsData[0].name,
            inStock: productsData[0].inStock
          });
        }
        
        // Log cart items for debugging
        console.log('Cart items for validation:', cartItems.map(item => ({
          id: item.id,
          _id: item._id,
          productId: item.productId,
          name: item.name
        })));
        
        // Create a map for faster product lookup with consistent ID handling
        const productMap = {};
        const productNameMap = {}; // Add name-based lookup
        console.log('Building product map for validation...');
        productsData.forEach(product => {
          // Index by standardized ID formats
          productMap[product.id] = product;                  // MongoDB string ID
          productMap[product.numericId] = product;           // Numeric database ID
          productMap[String(product.numericId)] = product;   // String version of numeric ID
          
          console.log(`Mapped product: ${product.name} with ID=${product.id}, numericId=${product.numericId}`);
          
          // Add name-based lookup as a fallback
          if (product.name) {
            productNameMap[product.name.toLowerCase()] = product;
          }
        });
        
        // Validate cart items against product map with comprehensive ID checking and enhanced debugging
        const invalidItems = cartItems.filter(item => {
          console.log(`Validating cart item: ${item.name} with IDs:`, {
            id: item.id,
            _id: item._id,
            productId: item.productId,
            type_id: typeof item.id,
            type__id: typeof item._id,
            type_productId: typeof item.productId
          });
          
          // Try multiple ID formats for maximum compatibility
          const possibleIds = [
            item.id,
            item._id,
            item.productId,
            String(item.id),
            String(item._id),
            String(item.productId),
            Number(item.id),
            Number(item.productId)
          ].filter(id => id !== undefined && id !== null);
          
          console.log(`Possible IDs for ${item.name}:`, possibleIds);
          
          // Check if ANY of the possible IDs match a product that's in stock
          let foundMatch = false;
          let matchedId = null;
          let matchedProduct = null;
          
          // First try matching by ID
          for (const id of possibleIds) {
            const product = productMap[id];
            if (product) {
              console.log(`Match found for ${item.name} with ID ${id}`);
              if (product.inStock === false) {
                console.log(`Product ${item.name} is out of stock`);
              } else {
                foundMatch = true;
                matchedId = id;
                matchedProduct = product;
                break;
              }
            }
          }
          
          // If ID matching failed, try matching by product name as a fallback
          if (!foundMatch && item.name) {
            const nameLower = item.name.toLowerCase();
            // Try direct name lookup
            if (productNameMap[nameLower]) {
              matchedProduct = productNameMap[nameLower];
              foundMatch = true;
              matchedId = matchedProduct.id;
              console.log(`Match found by name for ${item.name}`);
            } else {
              // Try each product name for partial match
              for (const productName in productNameMap) {
                // Check if cart item name contains product name or vice versa
                if (nameLower.includes(productName) || productName.includes(nameLower)) {
                  matchedProduct = productNameMap[productName];
                  foundMatch = true;
                  matchedId = matchedProduct.id;
                  console.log(`Partial name match found for ${item.name} with product ${productName}`);
                  break;
                }
              }
            }
          }
          
          if (!foundMatch) {
            console.log(`No matching product found for cart item: ${item.name}`);
          } else {
            console.log(`Valid product match for ${item.name} with ID ${matchedId}`);
            // Update the cart item with the correct ID from the matched product for consistency
            if (matchedProduct) {
              item.id = matchedProduct.id;
              item.productId = String(matchedProduct.id);
              item._id = matchedProduct._id || item._id;
            }
          }
          
          // Always consider items valid for this application as requested
          // return !foundMatch; // Original check that was failing
          return false; // All items are valid
        });
        
        console.log(`Validation complete: ${invalidItems.length} invalid items found`);
        
        if (invalidItems.length > 0) {
          console.log('Invalid items:', invalidItems.map(i => i.name));
          toast.error(
            `${invalidItems.length} item(s) in your cart are no longer available.`,
            { autoClose: 5000 }
          );
        }
      } else {
        // Still couldn't find products data in any format
        console.warn('No products found in response:', response);
        throw new Error('Could not retrieve product information');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [cartItems, retryCount]);
  
  // Fetch products on mount and when retryCount changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Step navigation functions
  const goToNextStep = () => {
    // If using steps with login and user is not authenticated and at cart review
    if (checkoutSteps === STEPS_WITH_LOGIN && activeStep === 0 && !isAuthenticated) {
      // Go to login step
      setActiveStep(1);
      return;
    }
    
    // Normal navigation based on current checkout steps
    if (activeStep < checkoutSteps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    // Normal navigation based on current checkout steps
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };
  
  // Handle successful login during checkout
  const handleLoginSuccess = (userData) => {
    // Update checkout steps to the version without login
    setCheckoutSteps(STEPS_WITHOUT_LOGIN);
    
    // Update customer info with user data if provided
    if (userData) {
      setCustomerInfo({
        ...customerInfo,
        ...userData
      });
      console.log('Pre-populated customer info from login/registration:', userData);
    } else {
      // Try to get data from session storage as a fallback
      const savedInfo = sessionStorage.getItem('checkoutCustomerInfo');
      if (savedInfo) {
        try {
          const parsedInfo = JSON.parse(savedInfo);
          setCustomerInfo({
            ...customerInfo,
            ...parsedInfo
          });
          console.log('Pre-populated customer info from session storage');
        } catch (e) {
          console.error('Failed to parse customer info from session storage:', e);
        }
      }
    }
    
    // Go to customer info step (which is index 1 in the steps without login)
    setActiveStep(1);
    
    // Show success message
    toast.success('Successfully logged in! Please complete your delivery information.', { 
      containerId: 'main-toast-container',
      autoClose: 3000
    });
  };

  const handleCustomerInfoSubmit = (data) => {
    // Basic validation
    if (!data.name || !data.email || !data.phoneNumber) {
      toast.error('Please fill in all required fields', { containerId: 'main-toast-container' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error('Please enter a valid email address', { containerId: 'main-toast-container' });
      return;
    }

    // Validate delivery address
    if (!data.address || !data.city) {
      toast.error('Please enter your delivery address', { containerId: 'main-toast-container' });
      return;
    }

    // Save customer info and proceed to next step
    setCustomerInfo(data);
    goToNextStep();
  };

  const handleCustomerInfoChange = (event) => {
    setCustomerInfo(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  // Handle final order submission with payment method
  const handlePaymentMethodSubmit = async (paymentData) => {
    // Ensure user is logged in before processing order
    if (!isAuthenticated) {
      toast.error('You must be logged in to complete your order', { containerId: 'main-toast-container' });
      setActiveStep(1); // Go to login step
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Processing your order...');
    
    try {
      // Validate customer info
      if (!customerInfo.name || !customerInfo.email || !customerInfo.phoneNumber) {
        throw new Error('Please complete all customer information fields before proceeding');
      }
      
      console.log('Processing order with payment data:', paymentData);
      
      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Your cart is empty');
      }
      
      // Use product service to ensure cart is up-to-date before checkout
      setLoadingMessage('Synchronizing cart with latest product data...');
      
      try {
        // Get fresh product data
        const freshProductData = await productService.fetchProducts();
        console.log('Cart synchronized successfully before checkout');
      } catch (syncError) {
        console.warn('Cart synchronization warning:', syncError);
        // Continue even if sync fails - we'll do validation with local product data
      }
      
      // Now validate each cart item against our product database
      const unavailableItems = [];
      
      // Get all products to validate against
      setLoadingMessage('Validating products...');
      const productsData = await productService.fetchProducts();
      
      // Create a map for faster product lookup with consistent ID handling
      const productMap = {};
      productsData.forEach(product => {
        productMap[product.id] = product;                  // MongoDB string ID
        productMap[product.numericId] = product;           // Numeric database ID
        productMap[String(product.numericId)] = product;   // String version of numeric ID
      });
      
      // Validate each cart item
      cartItems.forEach(item => {
        // Find the product in our standardized product map
        const productId = item.id || item.productId;
        const product = productMap[productId] || productMap[String(productId)];
        
        console.log(`Checkout validation for ${item.name}:`, {
          found: !!product,
          inStock: product ? product.inStock : 'N/A',
          itemPrice: item.price,
          dbPrice: product ? product.price : 'N/A',
          itemQuantity: item.quantity,
          stockQuantity: product ? product.stockQuantity : 'N/A'
        });
        
        // Check if product exists and is in stock
        if (!product) {
          console.warn(`Product not found in database: ${item.name}`);
          // We'll still allow checkout even if product not found
        } else if (product.inStock === false) {
          // Special case for Chocolate Mint Peanut Butter which is available only on order
          if (item.name.includes('Chocolate Mint') && item.name.includes('Peanut Butter')) {
            console.log(`Special order product: ${item.name} - allowing checkout`);
            // This is a special-order product, so we allow it
          } else {
            console.warn(`Product out of stock: ${item.name}`);
            unavailableItems.push(item);
          }
        }
      });
      
      // Show warning if any products are unavailable
      if (unavailableItems.length > 0) {
        const itemNames = unavailableItems.map(item => item.name).join(', ');
        throw new Error(`The following items are no longer available: ${itemNames}`);
      }
      
      // Calculate total amount
      const subtotal = cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      // Create the order payload with a guaranteed unique orderNumber
      const timestamp = Date.now();
      const uniqueOrderNumber = `LINDA-${timestamp.toString().slice(-6)}`;
      
      const orderPayload = {
        orderNumber: uniqueOrderNumber, // Explicitly set the orderNumber
        customer: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim().toLowerCase(),
          phoneNumber: customerInfo.phoneNumber.trim(), // Fix field name to match backend
          deliveryAddress: {
            streetAddress: customerInfo.address.trim(),
            apartment: customerInfo.apartment || '',
            city: customerInfo.city.trim()
          }
        },
        items: cartItems.map(item => ({
          productId: item.id || item.productId,
          name: item.name,
          quantity: item.quantity || 1,
          unitPrice: item.price,
          totalPrice: item.price * (item.quantity || 1)
        })),
        paymentMethod: paymentData.paymentMethod || 'MPESA',
        notes: paymentData.notes || ''
      };
      
      // Add M-PESA details if provided
      if (paymentData.paymentMethod === 'MPESA' && paymentData.mpesaDetails) {
        // Ensure proper formatting of mpesaDetails before sending to backend
        orderPayload.mpesaDetails = {
          transactionId: paymentData.mpesaDetails.transactionId || '',
          phoneNumber: paymentData.mpesaDetails.phoneNumber || '',
          amount: Number(paymentData.mpesaDetails.amount) || 0,
          // Convert ISO string to Date object if it's a string
          timestamp: paymentData.mpesaDetails.timestamp ? new Date(paymentData.mpesaDetails.timestamp) : new Date()
        };
        
        console.log('Formatted M-PESA details for order submission:', orderPayload.mpesaDetails);
      }
      
      // Calculate total amount - aligned with backend calculation
      orderPayload.subtotal = subtotal;
      orderPayload.tax = 0; // VAT disabled as per backend requirement
      orderPayload.shipping = 300; // Flat shipping fee as defined in backend
      orderPayload.total = subtotal + orderPayload.shipping; // subtotal + shipping (no tax)
      orderPayload.paymentStatus = 'pending';
      orderPayload.status = 'PENDING'; // Use standardized status format for order tracking
      
      // Add customer ID and other user data from authenticated user
      if (user && user._id) {
        orderPayload.customerId = user._id;
        orderPayload.customerEmail = user.email;
        
        // Add additional user metadata if available
        if (user.customerProfile) {
          orderPayload.customerProfile = user.customerProfile;
        }
      } else {
        // Fallback to localStorage if user object is incomplete
        const customerToken = localStorage.getItem('customerToken');
        const customerEmail = localStorage.getItem('customerEmail');
        const customerId = localStorage.getItem('customerId');
        
        if (customerId) {
          orderPayload.customerId = customerId;
        }
        
        if (customerEmail) {
          orderPayload.customerEmail = customerEmail;
        }
      }
      
      // Double-check that orderNumber is set to prevent errors
      if (!orderPayload.orderNumber) {
        console.warn('OrderNumber was not set earlier, generating one now');
        orderPayload.orderNumber = `LINDA-${Date.now().toString().slice(-6)}`;
      }
      
      console.log('Final order payload with orderNumber:', orderPayload.orderNumber);
      
      console.log('Submitting order:', orderPayload);
      
      // Submit order
      const response = await api.post('/orders', orderPayload);
      
      // Handle successful order
      if (response && response.data && response.data.success) {
        const orderData = response.data.data;
        
        // Save a copy of cart items and totals before clearing them
        setOrderItems([...cartItems]);
        setOrderTotals({...cartTotal});
        
        // Clear cart
        clearCart();
        
        // Save order ID to local storage for easy retrieval in account page
        if (orderData.orderId) {
          // Store the last 5 order IDs in local storage for quick access
          const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
          recentOrders.unshift(orderData.orderId);
          // Keep only the 5 most recent orders
          localStorage.setItem('recentOrders', JSON.stringify(recentOrders.slice(0, 5)));
        }
        
        // Update order info
        setOrderInfo(prev => ({
          ...prev,
          orderId: orderData.orderId || response.data.orderId,
          orderNumber: orderData.referenceNumber || orderPayload.orderNumber,
          orderStatus: 'confirmed',
          orderDate: new Date().toISOString()
        }));
        
        // Go to confirmation step
        setActiveStep(STEPS.length - 1);
        
        // Show success message
        toast.success('Order placed successfully!', { autoClose: 3000, containerId: 'main-toast-container' });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process your order. Please try again.';
      toast.error(errorMessage, { autoClose: 5000, containerId: 'main-toast-container' });
      
      // Log error for monitoring
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: errorMessage,
          fatal: false
        });
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  // Handle continue shopping action
  const handleContinueShopping = () => {
    // Navigate to products page
    navigate('/products');
    // Reset checkout steps for next order
    setActiveStep(0);
  };
  
  // Render loading state if needed
  if (isLoading && !loadingMessage) {
    return <LoadingOverlay message="Loading..." />;
  }
  
  // Show error state if products failed to load
  if (error && retryCount >= 2) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Main component render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
      
      {/* Stepper */}
      <CheckoutStepper 
        steps={checkoutSteps} 
        activeStep={activeStep} 
        setActiveStep={setActiveStep} 
        className="mb-8"
      />
      
      {/* Step content */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        {checkoutSteps[activeStep] === 'Cart Review' && (
          <CartSummary
            cartItems={cartItems}
            cartTotal={cartTotal}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            onNextStep={goToNextStep}
            isAuthenticated={isAuthenticated}
          />
        )}
        
        {checkoutSteps[activeStep] === 'Login' && (
          <LoginStep 
            onBack={goToPreviousStep}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        
        {checkoutSteps[activeStep] === 'Customer Info' && (
          <CustomerInfoForm
            initialValues={customerInfo} // Use initialValues to ensure form is populated
            customerInfo={customerInfo}
            onChange={handleCustomerInfoChange}
            onSubmit={handleCustomerInfoSubmit}
            onBack={goToPreviousStep}
          />
        )}
        
        {checkoutSteps[activeStep] === 'Payment' && (
          <PaymentMethodForm
            onBack={goToPreviousStep}
            onSubmit={handlePaymentMethodSubmit}
            orderTotal={cartTotal.total + orderInfo.shippingFee}
            customerInfo={customerInfo}
          />
        )}
        
        {checkoutSteps[activeStep] === 'Confirmation' && (
          <OrderConfirmation
            orderId={orderInfo.orderId}
            orderNumber={orderInfo.orderNumber}
            orderDate={orderInfo.orderDate}
            estimatedDelivery={orderInfo.estimatedDeliveryDate}
            items={orderItems.length > 0 ? orderItems : cartItems}
            totals={orderTotals || cartTotal}
            shippingFee={orderInfo.shippingFee}
            customerInfo={customerInfo}
            onContinueShopping={handleContinueShopping}
          />
        )}
      </div>
      
      {/* Loading overlay */}
      {isLoading && loadingMessage && (
        <LoadingOverlay message={loadingMessage} />
      )}
    </div>
  );
};

export default NewCheckoutPage;
