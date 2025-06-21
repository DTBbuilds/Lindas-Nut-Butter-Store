import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faReceipt, 
  faArrowLeft, 
  faEnvelope, 
  faPhone, 
  faLocationDot, 
  faTruck, 
  faCalendarAlt,
  faFileDownload,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { formatOrderDate, getStatusColor } from '../../utils/orderUtils';
import { formatKES } from '../../utils/currencyUtils';
import OrderTracker from './OrderTracker';
import { toast } from 'react-toastify';

/**
 * Order Details Component
 * Displays detailed information about a specific order
 */
const OrderDetails = ({ order, onBack }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const statusColors = getStatusColor(order.status);
  
  const handleDownloadReceipt = () => {
    setIsDownloading(true);
    
    // Simulate receipt download (would connect to actual API in production)
    setTimeout(() => {
      setIsDownloading(false);
      toast.success('Receipt downloaded successfully');
    }, 1500);
  };
  
  const handlePrintReceipt = () => {
    window.print();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md animate-fadeIn">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              aria-label="Go back"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Order #{order.orderNumber}</h2>
              <p className="text-sm text-gray-500">
                Placed on {formatOrderDate(order.orderDate, true)}
              </p>
            </div>
          </div>
          <span 
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}
          >
            {order.status}
          </span>
        </div>
      </div>
      
      {/* Order Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Tracker */}
          <div className="md:col-span-2">
            <OrderTracker order={order} />
            
            {/* Order Items */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Order Items
              </h3>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
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
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="h-10 w-10 rounded-md object-cover mr-3"
                              />
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {formatKES(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
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
                        {formatKES(order.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                        Shipping
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        {formatKES(order.shippingFee)}
                      </td>
                    </tr>
                    {order.discount > 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                          Discount
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-green-600">
                          -{formatKES(order.discount)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="3" className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                        {formatKES(order.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          
          {/* Order Information Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Customer Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">{order.customerEmail}</p>
                    <p className="text-gray-500">Email</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">{order.customerPhone}</p>
                    <p className="text-gray-500">Phone</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Shipping Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">{order.deliveryAddress}</p>
                    <p className="text-gray-500">Delivery Address</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <FontAwesomeIcon icon={faTruck} />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">Standard Delivery (48 hours)</p>
                    <p className="text-gray-500">Shipping Method</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">
                      {order.estimatedDeliveryDate ? 
                        formatOrderDate(order.estimatedDeliveryDate) : 
                        'Calculating...'}
                    </p>
                    <p className="text-gray-500">Estimated Delivery</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                Payment Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <FontAwesomeIcon icon={faReceipt} />
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">{order.paymentMethod}</p>
                    <p className="text-gray-500">Payment Method</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-gray-400 w-5">
                    <span className="text-xs font-bold">KES</span>
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-gray-900">{formatKES(order.totalAmount)}</p>
                    <p className="text-gray-500">Total Amount</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col space-y-2">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <FontAwesomeIcon icon={faFileDownload} className="animate-pulse mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFileDownload} className="mr-2" />
                      Download Receipt
                    </>
                  )}
                </button>
                
                <button
                  onClick={handlePrintReceipt}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-green"
                >
                  <FontAwesomeIcon icon={faPrint} className="mr-2" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

OrderDetails.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    orderNumber: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    orderDate: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired,
        image: PropTypes.string
      })
    ).isRequired,
    subtotal: PropTypes.number.isRequired,
    shippingFee: PropTypes.number.isRequired,
    discount: PropTypes.number,
    total: PropTypes.number.isRequired,
    customerEmail: PropTypes.string.isRequired,
    customerPhone: PropTypes.string.isRequired,
    deliveryAddress: PropTypes.string.isRequired,
    paymentMethod: PropTypes.string.isRequired,
    estimatedDeliveryDate: PropTypes.string
  }).isRequired,
  onBack: PropTypes.func.isRequired
};

export default OrderDetails;
