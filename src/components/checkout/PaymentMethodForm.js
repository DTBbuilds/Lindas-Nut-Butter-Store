import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobile, faSpinner, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';

const PaymentMethodForm = ({
  onSubmit,
  onBack,
  orderTotal,
  customerInfo,
  isSubmitting,
  submissionError,
}) => {
  const validationSchema = Yup.object({
    phoneNumber: Yup.string()
      .matches(/^(\+?254|0)?[17]\d{8}$/, 'Please enter a valid Kenyan phone number (e.g., 0712345678)')
      .required('Phone number is required for M-Pesa payments'),
    notes: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      method: 'MPESA',
      phoneNumber: customerInfo?.phoneNumber || '',
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      // console.log('Submitting payment form with values:', values);
      onSubmit({
        paymentMethod: values.method,
        mpesaPhoneNumber: values.phoneNumber,
        notes: values.notes,
      });
    },
    enableReinitialize: true,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-yellow-100 rounded-full p-2 mr-3">
            <FontAwesomeIcon icon={faMobile} className="text-yellow-600" />
          </div>
          <div>
            <h4 className="font-medium text-yellow-800">M-Pesa Payment</h4>
            <p className="text-yellow-700">
              Pay securely using M-Pesa. You will receive a prompt on your phone to complete the payment.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-semibold text-green-700">{formatKES(orderTotal)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Payment Method:</span>
                <span className="text-green-700">M-Pesa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-lg mb-6">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faMobile} className="text-green-600 h-6 w-6 mr-3" />
            <h3 className="text-lg font-medium text-gray-800">M-Pesa Payment</h3>
          </div>

          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isSubmitting}
                className={`w-full pl-3 pr-10 py-2 border ${
                  formik.touched.phoneNumber && formik.errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="e.g., 0712345678"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  className="text-gray-400 hover:text-gray-600"
                  title="Enter your M-Pesa registered phone number"
                />
              </div>
            </div>
            {formik.touched.phoneNumber && formik.errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.phoneNumber}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the phone number registered with M-Pesa that you wish to use for payment.
            </p>
          </div>
        </div>

        {submissionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <p className="font-bold mb-1">An error occurred:</p>
            <p>{submissionError}</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-300 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formik.isValid}
            className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{`Pay ${formatKES(orderTotal)}`}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
