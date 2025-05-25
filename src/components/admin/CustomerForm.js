import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

// Validation schema
const CustomerSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().matches(
    /^(?:\+?254|0)[17]\d{8}$/,
    'Please enter a valid Kenyan phone number'
  ).required('Phone number is required'),
  address: Yup.object().shape({
    street: Yup.string().required('Street address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string(),
    postalCode: Yup.string().required('Postal code is required'),
    country: Yup.string().required('Country is required')
  })
});

const CustomerForm = ({ customer, onSubmit, onCancel }) => {
  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Kenya'
    }
  });

  useEffect(() => {
    if (customer) {
      setInitialValues({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          postalCode: customer.address?.postalCode || '',
          country: customer.address?.country || 'Kenya'
        }
      });
    }
  }, [customer]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await onSubmit(values);
      resetForm();
      toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-6">
        {customer ? 'Edit Customer' : 'Add New Customer'}
      </h2>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={CustomerSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Field
                  type="text"
                  name="firstName"
                  id="firstName"
                  className={`w-full p-2 border rounded ${
                    errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Field
                  type="text"
                  name="lastName"
                  id="lastName"
                  className={`w-full p-2 border rounded ${
                    errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  className={`w-full p-2 border rounded ${
                    errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Field
                  type="text"
                  name="phone"
                  id="phone"
                  placeholder="+254/0 format"
                  className={`w-full p-2 border rounded ${
                    errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            <div>
              <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <Field
                type="text"
                name="address.street"
                id="address.street"
                className={`w-full p-2 border rounded ${
                  errors.address?.street && touched.address?.street ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <ErrorMessage name="address.street" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <Field
                  type="text"
                  name="address.city"
                  id="address.city"
                  className={`w-full p-2 border rounded ${
                    errors.address?.city && touched.address?.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="address.city" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <Field
                  type="text"
                  name="address.postalCode"
                  id="address.postalCode"
                  className={`w-full p-2 border rounded ${
                    errors.address?.postalCode && touched.address?.postalCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="address.postalCode" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Field
                  type="text"
                  name="address.country"
                  id="address.country"
                  className={`w-full p-2 border rounded ${
                    errors.address?.country && touched.address?.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <ErrorMessage name="address.country" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CustomerForm;
