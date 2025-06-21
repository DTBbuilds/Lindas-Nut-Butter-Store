  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <CartSummary 
            cartItems={cartItems} 
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onContinue={goToNextStep}
            cartTotal={cartTotal} 
          />
        );
      case 1:
        // Login step with enhanced UI
        return (
          <div className="mt-8 max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Account Required</h2>
              <p className="text-gray-600 mt-2">Please log in or create an account to continue with your purchase</p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Creating an account allows us to:
                  </p>
                  <ul className="list-disc ml-5 mt-1 text-xs text-blue-700">
                    <li>Send order confirmations to your email</li>
                    <li>Save your delivery information for faster checkout</li>
                    <li>Track your order history and status</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                <h3 className="font-semibold text-lg mb-3">Existing Customer</h3>
                <p className="text-gray-600 text-sm mb-4">Log in with your email and password to continue checkout</p>
                <Link 
                  to="/account/login?redirect=checkout" 
                  className="w-full py-2 px-4 flex justify-center items-center bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  Log In
                </Link>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors">
                <h3 className="font-semibold text-lg mb-3">New Customer</h3>
                <p className="text-gray-600 text-sm mb-4">Create a new account to track orders and save information</p>
                <Link 
                  to="/register?redirect=checkout" 
                  className="w-full py-2 px-4 flex justify-center items-center border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Create Account
                </Link>
              </div>
            </div>
            
            <div className="text-center mt-6 border-t border-gray-200 pt-6">
              <button 
                onClick={goToPreviousStep}
                className="flex items-center justify-center mx-auto text-amber-600 hover:text-amber-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Return to Cart
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <CustomerInfoForm 
            initialValues={customerInfo}
            onSubmit={handleCustomerInfoSubmit}
            onBack={goToPreviousStep}
            onChange={handleCustomerInfoChange}
          />
        );
      case 3:
        return (
          <PaymentMethodForm 
            onSubmit={handlePaymentMethodSubmit}
            onBack={goToPreviousStep}
            loading={isLoading}
            orderTotal={cartTotal.total || cartTotal.subtotal}
            customerPhone={customerInfo.phoneNumber}
          />
        );
      case 4:
        return (
          <OrderConfirmation 
            orderInfo={orderInfo}
            customerInfo={customerInfo}
            paymentInfo={{ paymentMethod: 'MPESA', paymentStatus: 'PAID' }}
            cartItems={orderItems.length > 0 ? orderItems : cartItems}
            cartTotal={orderTotals || cartTotal}
            onContinueShopping={handleContinueShopping}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };
