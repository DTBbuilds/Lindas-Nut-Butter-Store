import React from 'react';

/**
 * A step-by-step progress indicator for the checkout process
 * 
 * @param {Object} props Component props
 * @param {string[]} props.steps Array of step names
 * @param {number} props.activeStep Current active step index
 */
const CheckoutStepper = ({ steps, activeStep }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            {/* Step circle */}
            <div className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm
                  ${index <= activeStep 
                    ? 'border-green-600 bg-green-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                  }`}
              >
                {index + 1}
              </div>
              <div className="mt-2 text-xs sm:text-sm font-medium text-center">
                <span className={index <= activeStep ? 'text-green-600' : 'text-gray-500'}>
                  {step}
                </span>
              </div>
            </div>
            
            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-auto border-t-2 transition duration-500 ease-in-out 
                  ${index < activeStep ? 'border-green-600' : 'border-gray-300'}`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CheckoutStepper;
