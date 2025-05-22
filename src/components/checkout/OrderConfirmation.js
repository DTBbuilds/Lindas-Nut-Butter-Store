import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faInfoCircle, faHome, faPrint, faEnvelope, 
  faTruck, faLocationDot, faComment, faFileDownload, faReceipt 
} from '@fortawesome/free-solid-svg-icons';
import { formatKES } from '../../utils/currencyUtils';
import { formatOrderDate, getStatusLabel, getStatusColor } from '../../utils/orderUtils';
import { downloadReceipt } from '../../utils/receiptGenerator';
import { toast } from 'react-toastify';
import FeedbackForm from '../feedback/FeedbackForm';

/**
 * Order Confirmation Component
 * Displays order details after a successful checkout
 */
const OrderConfirmation = ({ orderInfo = {}, customerInfo = {}, paymentInfo = {}, cartItems = [], cartTotal = {}, onContinueShopping }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);
  
  const printOrder = () => {
    window.print();
  };
  
  const handleDownloadReceipt = () => {
    // Download PDF receipt using the utility function with success callback
    const result = downloadReceipt(
      orderInfo, 
      customerInfo, 
      paymentInfo, 
      cartItems, 
      cartTotal,
      (filename) => {
        // Mark receipt as downloaded
        setReceiptDownloaded(true);
        
        // Show success toast notification
        toast.success(
          <div>
            <p className="font-medium">Receipt downloaded successfully!</p>
            <p className="text-sm mt-1">Saved as: {filename}</p>
          </div>,
          { autoClose: 5000 }
        );
      }
    );
    
    // Handle any errors
    if (!result.success) {
      toast.error(
        <div>
          <p className="font-medium">Could not generate receipt</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      );
    }
  };
  
  const handleFeedbackSubmitted = () => {
    setFeedbackSubmitted(true);
    setShowFeedback(false);
  };
  
  // Check if we have the necessary order information
  const hasOrderInfo = orderInfo && orderInfo.orderNumber;
  const safeOrderNumber = hasOrderInfo ? orderInfo.orderNumber : 'PENDING';
  const safeOrderDate = orderInfo?.orderDate || new Date().toISOString();

  // Get status color classes based on payment status
  const statusClasses = getStatusColor(paymentInfo?.paymentStatus || 'PENDING');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block bg-green-100 rounded-full p-3 mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-4xl" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Thank You for Your Order!</h1>
        <p className="text-lg text-gray-600 mt-2">
          Your order has been successfully placed.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Order #{safeOrderNumber}</h2>
            <span 
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses.bg} ${statusClasses.text}`}
            >
              {getStatusLabel(paymentInfo?.paymentStatus || 'PENDING')}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Placed on {formatOrderDate(safeOrderDate, true)}
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Customer Information
              </h3>
              <div className="space-y-2">
                <p className="text-gray-800">
                  <span className="font-medium">Name:</span> {customerInfo.name}
                </p>
                <p className="text-gray-800">
                  <span className="font-medium">Phone:</span> {customerInfo.phoneNumber}
                </p>
                <p className="text-gray-800">
                  <span className="font-medium">Email:</span> {customerInfo.email}
                </p>
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Delivery Information
              </h3>
              <div className="space-y-2">
                <p className="text-gray-800">
                  <span className="font-medium"><FontAwesomeIcon icon={faLocationDot} className="mr-1" /> Address:</span> {customerInfo.address}
                  {customerInfo.apartment && <span>, {customerInfo.apartment}</span>}
                </p>
                <p className="text-gray-800">
                  <span className="font-medium">City:</span> {customerInfo.city}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium"><FontAwesomeIcon icon={faTruck} className="mr-1" /> Delivery:</span> Within 48 hours
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Shipping Fee:</span> {formatKES(orderInfo.shippingFee || 300)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Payment Information
            </h3>
            <div className="space-y-2">
              <p className="text-gray-800">
                <span className="font-medium">Payment Method:</span> {paymentInfo?.paymentMethod === 'MPESA' ? 'M-Pesa' : 'Cash on Delivery'}
              </p>
              <p className="text-gray-800">
                <span className="font-medium">Status:</span> <span className={`font-medium ${paymentInfo?.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {paymentInfo?.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                </span>
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Order Items
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {formatKES(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {formatKES(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      Subtotal
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatKES(cartTotal.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      Shipping Fee
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      {formatKES(orderInfo.shippingFee || 300)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right text-base font-semibold text-gray-800">
                      Total
                    </td>
                    <td className="px-6 py-3 text-right text-base font-semibold text-green-700">
                      {formatKES((cartTotal.total || cartTotal.subtotal) + (orderInfo.shippingFee || 300))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center pt-6 border-t border-gray-200">
            <button
              onClick={onContinueShopping}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FontAwesomeIcon icon={faHome} className="mr-2" />
              Continue Shopping
            </button>
            <button
              onClick={handleDownloadReceipt}
              className={`flex items-center px-4 py-2 ${receiptDownloaded ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}
              disabled={false}
            >
              <FontAwesomeIcon icon={receiptDownloaded ? faCheckCircle : faReceipt} className="mr-2" />
              {receiptDownloaded ? 'Receipt Downloaded' : 'Download Receipt'}
            </button>
            <button
              onClick={printOrder}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              <FontAwesomeIcon icon={faPrint} className="mr-2" />
              Print Page
            </button>
            {paymentInfo?.paymentStatus === 'PAID' && !feedbackSubmitted && (
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                <FontAwesomeIcon icon={faComment} className="mr-2" />
                {showFeedback ? 'Hide Feedback Form' : 'Rate Your Experience'}
              </button>
            )}
            {feedbackSubmitted && (
              <div className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Thank you for your feedback!
              </div>
            )}
          </div>
          {showFeedback && (
            <div className="mt-8">
              <FeedbackForm 
                order={{
                  orderId: orderInfo.orderId,
                  orderNumber: safeOrderNumber
                }}
                onFeedbackSubmitted={handleFeedbackSubmitted} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">What Happens Next?</h3>
        <ol className="list-decimal ml-6 space-y-2 text-gray-600">
          <li>You'll receive an order confirmation email with your order details.</li>
          <li>Our team will process your order and prepare it for delivery.</li>
          {paymentInfo?.paymentStatus !== 'PAID' && (
            <li>Once your M-Pesa payment is confirmed, we'll begin processing your order.</li>
          )}
          <li>Your order will be delivered to the address you provided within 48 hours.</li>
          <li>Our delivery team will contact you before delivery.</li>
          <li>If you have any questions, please contact our customer service team at <span className="font-medium">0712 345 678</span>.</li>
        </ol>
      </div>
    </div>
  );
};

export default OrderConfirmation;
