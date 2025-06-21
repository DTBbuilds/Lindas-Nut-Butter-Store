/**
 * Receipt Generator Utility
 * 
 * Generates a printable HTML receipt that can be saved as PDF via browser
 */

import { formatKES } from './currencyUtils';
import { formatOrderDate } from './orderUtils';

/**
 * Generate HTML receipt content
 * 
 * @param {Object} orderInfo - Order information (orderNumber, orderDate, etc.)
 * @param {Object} customerInfo - Customer details (name, email, phone, address)
 * @param {Object} paymentInfo - Payment details (method, transaction ID, status)
 * @param {Array} cartItems - Items in the order
 * @param {Object} cartTotal - Order totals (subtotal, shipping, total)
 * @returns {string} HTML content
 */
export const generateReceiptHTML = (orderInfo, customerInfo, paymentInfo, cartItems, cartTotal) => {
  // Calculate total
  const total = (cartTotal.total || cartTotal.subtotal) + (orderInfo.shippingFee || 300);
  
  // Generate item rows
  const itemRows = cartItems.map((item, index) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatKES(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatKES(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  // Create receipt HTML
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Linda's Nut Butter Store - Receipt #${orderInfo.orderNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .receipt-header {
          text-align: center;
          color: #1e7e34;
          margin-bottom: 20px;
        }
        .receipt-header h1 {
          margin-bottom: 5px;
          color: #1e7e34;
        }
        .receipt-info {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .customer-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-box {
          width: 48%;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .info-box h3 {
          margin-top: 0;
          color: #1e7e34;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #1e7e34;
          color: white;
          text-align: left;
          padding: 10px;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
        }
        .total-row {
          font-weight: bold;
          font-size: 1.2em;
          color: #1e7e34;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 0.9em;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1>Linda's Nut Butter Store</h1>
        <p>Official Receipt</p>
      </div>
      
      <div class="receipt-info">
        <p><strong>Receipt #:</strong> ${orderInfo.orderNumber}</p>
        <p><strong>Date:</strong> ${formatOrderDate(orderInfo.orderDate || new Date(), true)}</p>
        <p><strong>Payment Method:</strong> ${paymentInfo.paymentMethod || 'M-Pesa'}</p>
        ${paymentInfo.checkoutRequestId ? `<p><strong>Transaction ID:</strong> ${paymentInfo.checkoutRequestId}</p>` : ''}
      </div>
      
      <div class="customer-info">
        <div class="info-box">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${customerInfo.name}</p>
          <p><strong>Email:</strong> ${customerInfo.email}</p>
          <p><strong>Phone:</strong> ${customerInfo.phoneNumber}</p>
        </div>
        
        ${customerInfo.address ? `
        <div class="info-box">
          <h3>Shipping Address</h3>
          <p>${customerInfo.address}</p>
          ${customerInfo.apartment ? `<p>${customerInfo.apartment}</p>` : ''}
        </div>
        ` : ''}
      </div>
      
      <h3>Order Items</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 45%">Product</th>
            <th style="width: 10%; text-align: center;">Qty</th>
            <th style="width: 20%; text-align: right;">Price</th>
            <th style="width: 20%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      
      <div class="totals">
        <p><strong>Subtotal:</strong> ${formatKES(cartTotal.subtotal)}</p>
        <p><strong>Shipping:</strong> ${formatKES(orderInfo.shippingFee || 300)}</p>
        <p class="total-row"><strong>Total:</strong> ${formatKES(total)}</p>
      </div>
      
      <div class="footer">
        <p>Thank you for shopping with Linda's Nut Butter Store!</p>
        <p>For any questions, please contact us at: support@lindasnutbutter.com | +254 712 345 678</p>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #1e7e34; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Print Receipt
        </button>
      </div>
    </body>
    </html>
  `;
  
  return receiptHTML;
};

/**
 * Open a printable receipt in a new window
 * 
 * @param {Object} orderInfo - Order information (orderNumber, orderDate, etc.)
 * @param {Object} customerInfo - Customer details (name, email, phone, address)
 * @param {Object} paymentInfo - Payment details (method, transaction ID, status)
 * @param {Array} cartItems - Items in the order
 * @param {Object} cartTotal - Order totals (subtotal, shipping, total)
 * @param {Function} onSuccess - Optional callback function to execute after successful opening
 */
export const downloadReceipt = (orderInfo, customerInfo, paymentInfo, cartItems, cartTotal, onSuccess) => {
  try {
    // Generate HTML content
    const html = generateReceiptHTML(orderInfo, customerInfo, paymentInfo, cartItems, cartTotal);
    
    // Create a new window for the receipt
    const receiptWindow = window.open('', '_blank');
    
    // Check if popup was blocked
    if (!receiptWindow) {
      throw new Error('Popup blocked. Please allow popups for this site to download your receipt.');
    }
    
    // Write the HTML content to the new window
    receiptWindow.document.write(html);
    receiptWindow.document.close();
    
    // Create filename for reference
    const filename = `lindas-nut-butter-receipt-${orderInfo.orderNumber}.pdf`;
    
    // Call success callback if provided
    if (typeof onSuccess === 'function') {
      onSuccess(filename);
    }
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating receipt:', error);
    return { success: false, error: error.message };
  }
};
