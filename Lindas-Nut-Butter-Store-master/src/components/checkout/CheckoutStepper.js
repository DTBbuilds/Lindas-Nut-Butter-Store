import React from 'react';

/**
 * A step-by-step progress indicator for the checkout process
 * 
 * @param {Object} props Component props
 * @param {string[]} props.steps Array of step names
 * @param {number} props.activeStep Current active step index
 * @param {boolean} props.isAuthenticated Whether user is authenticated
 */
const CheckoutStepper = ({ steps, activeStep, isAuthenticated }) => {
  // If user is authenticated, we want to hide the Login step and adjust the step numbers
  const displaySteps = isAuthenticated ? 
    steps.filter(step => step !== 'Login') : 
    steps;
  
  // Adjust the active step index if user is authenticated and we're past the login step
  const adjustedActiveStep = isAuthenticated && activeStep > 1 ? 
    activeStep - 1 : activeStep;
  
  return (
    <div className="w-full py-6">
      <div className="flex items-center">
        {displaySteps.map((step, index) => (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm
                  ${index <= adjustedActiveStep 
                    ? 'border-green-600 bg-green-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                  }`}
              >
                {index + 1}
              </div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-center">
                <span className={index <= adjustedActiveStep ? 'text-green-600' : 'text-gray-500'}>
                  {step}
                </span>
              </div>
            </div>
            
            {/* Connector line between steps */}
            {index < displaySteps.length - 1 && (
              <div 
                className={`flex-auto border-t-2 transition duration-500 ease-in-out 
                  ${index < adjustedActiveStep ? 'border-green-600' : 'border-gray-300'}`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CheckoutStepper;
