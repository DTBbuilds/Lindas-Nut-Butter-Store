import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Context and Hooks
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import * as orderService from '../services/orderService';

// Components
import CheckoutStepper from '../components/checkout/CheckoutStepper';
import CartSummary from '../components/checkout/CartSummary';
import LoginStep from '../components/checkout/LoginStep';
import CustomerInfoForm from '../components/checkout/CustomerInfoForm';
import PaymentMethodForm from '../components/checkout/PaymentMethodForm';
import LoadingOverlay from '../components/common/LoadingOverlay';

// The checkout process now ends before confirmation, which is on a separate page.
const STEPS_WITH_LOGIN = ['Cart Review', 'Login', 'Customer Info', 'Payment'];
const STEPS_WITHOUT_LOGIN = ['Cart Review', 'Customer Info', 'Payment'];

const CheckoutPage = () => {
  const { user, isAuthenticated, login, register } = useAuth();
  const { cartItems, cartTotal, clearCart, updateQuantity, removeFromCart, syncCartWithDatabase } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeStep, setActiveStep] = useState(0);
  const [checkoutSteps, setCheckoutSteps] = useState(isAuthenticated ? STEPS_WITHOUT_LOGIN : STEPS_WITH_LOGIN);
  
  // State for forms and submission
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phoneNumber: '', deliveryAddress: '' });
  const [paymentInfo, setPaymentInfo] = useState({ paymentMethod: 'mpesa', phoneNumber: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  
  // State for auth step
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const goToNextStep = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, checkoutSteps.length - 1));
  }, [checkoutSteps.length]);

  const goToPreviousStep = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Effect to manage checkout steps based on authentication status
  useEffect(() => {
    const newSteps = isAuthenticated ? STEPS_WITHOUT_LOGIN : STEPS_WITH_LOGIN;
    setCheckoutSteps(newSteps);
    // If user logs out during checkout, reset to first step
    if (!isAuthenticated && activeStep > 0) {
        setActiveStep(0);
    }
  }, [isAuthenticated, activeStep]);

  // Effect to handle direct navigation to a specific step, e.g., from confirmation page
  useEffect(() => {
    if (location.state) {
      // Navigate to a specific step if provided
      if (location.state.step) {
        const stepIndex = checkoutSteps.findIndex(step => step.toLowerCase().includes(location.state.step));
        if (stepIndex !== -1) {
          setActiveStep(stepIndex);
        }
      }
      // Pre-fill customer info if provided
      if (location.state.customerInfo) {
        setCustomerInfo(prevInfo => ({ ...prevInfo, ...location.state.customerInfo }));
      }
    }
  }, [location.state, checkoutSteps]);

  // Effect to populate customer info from user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      const formatAddress = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country];
        return parts.filter(Boolean).join(', ');
      };

      setCustomerInfo(prevInfo => ({
        ...prevInfo,
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
        deliveryAddress: formatAddress(user.address) || prevInfo.deliveryAddress || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Auth handlers
  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await login(credentials);
      if (result.success) {
        toast.success('Login successful!');
        // The useEffect watching isAuthenticated will adjust steps and we can move to the next one
        goToNextStep();
      } else {
        const errorMessage = result.error || 'Failed to log in.';
        setAuthError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userInfo) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await register(userInfo);
      if (result.success) {
        toast.success(result.message || 'Registration successful!');
        // The useEffect watching isAuthenticated will adjust steps and we can move to the next one
        goToNextStep();
      } else {
        const errorMessage = result.error || 'Failed to register. Please try again.';
        setAuthError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to register. Please try again.';
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  // Form submission handlers
  const handleCustomerInfoSubmit = (formData) => {
    setCustomerInfo(formData);
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.deliveryAddress) {
      toast.error('Please fill in all required fields.');
      return;
    }
    goToNextStep();
  };

  const handlePaymentMethodSubmit = async (paymentData) => {
    setPaymentInfo(paymentData);

    if (!isAuthenticated) {
      toast.error('You must be logged in to place an order.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const syncedCartItems = await syncCartWithDatabase(true);

      if (!syncedCartItems || syncedCartItems.length === 0) {
        toast.error("Your cart is empty or could not be synced. Please add items to your cart and try again.");
        setIsSubmitting(false);
        return;
      }

      const hasInvalidItems = syncedCartItems.some(item => !item.id || String(item.id).startsWith('temp-'));
      if (hasInvalidItems) {
        toast.error("We couldn't verify all items in your cart. Please try again in a moment.");
        setIsSubmitting(false);
        return;
      }

      // Recalculate totals based on the definitive synced data
      const subtotal = syncedCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const shippingFee = subtotal > 0 ? 500 : 0; // Consistent shipping logic
      const total = subtotal + shippingFee;

      const orderPayload = {
        customerId: user?._id,
        items: syncedCartItems.map(item => ({ product: item.id, quantity: item.quantity })),
        totalAmount: total,
        subtotal: subtotal,
        shippingFee: shippingFee,
        customerEmail: customerInfo.email || user?.email,
        customerInfo: {
          name: customerInfo.name,
          phone: paymentData.mpesaPhoneNumber || customerInfo.phoneNumber,
          address: customerInfo.deliveryAddress,
        },
        paymentMethod: paymentData.paymentMethod,
      };

      const response = await orderService.createOrder(orderPayload);
      console.log('Order creation and payment initiation response:', response);

      // The cart will be cleared on the confirmation page after successful payment
      navigate(`/order-confirmation/${response.order._id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setSubmissionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const currentStepName = checkoutSteps[activeStep];
    switch (currentStepName) {
      case 'Login':
        return <LoginStep onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} error={authError} />;
      case 'Customer Info':
        return <CustomerInfoForm customerInfo={customerInfo} onSubmit={handleCustomerInfoSubmit} onBack={goToPreviousStep} onChange={handleCustomerInfoChange} />;
      case 'Payment':
        return <PaymentMethodForm initialData={paymentInfo} onSubmit={handlePaymentMethodSubmit} onBack={goToPreviousStep} isSubmitting={isSubmitting} error={submissionError} />;
      default: // 'Cart Review'
        return (
          <CartSummary 
            cartItems={cartItems} 
            cartTotal={cartTotal} 
            onNextStep={goToNextStep} 
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />
        );
    }
  };

  // Prevent checkout if cart is empty, unless they are already on a later step (e.g. after payment failed and cart was cleared)
  if (cartItems.length === 0 && activeStep === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <p className="mb-8">Add items to your cart to start the checkout process.</p>
        <button onClick={() => navigate('/products')} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isSubmitting && <LoadingOverlay message="Processing your order..." />}
      <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutStepper steps={checkoutSteps} activeStep={activeStep} />
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md min-h-[300px]">
            {renderStepContent()}
          </div>
        </div>
        <div className="lg:col-span-1">
          <CartSummary
            items={cartItems}
            totals={cartTotal}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            isEditable={checkoutSteps[activeStep] === 'Cart Review'}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
