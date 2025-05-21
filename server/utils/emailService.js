/**
 * Email notification service for Linda's Nut Butter Store
 * Used to send order confirmations and payment notifications
 */
const nodemailer = require('nodemailer');
const config = require('../config');

// Create reusable transporter
const createTransporter = () => {
  // Use environment variables from config
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send payment confirmation email
 * @param {Object} order - Order details
 * @param {Object} transaction - Transaction details
 * @returns {Promise} - Email send result
 */
const sendPaymentConfirmation = async (order, transaction) => {
  try {
    if (!order || !order.customer || !order.customer.email) {
      console.error('Cannot send payment confirmation: Missing order details or customer email');
      return false;
    }
    
    const transporter = createTransporter();
    
    // Format the order items for the email
    const formattedItems = order.items.map(item => 
      `${item.name} x ${item.quantity} - KES ${item.price * item.quantity}`
    ).join('\\n');
    
    // Format the transaction details
    const transactionDate = transaction.timestamp 
      ? new Date(transaction.timestamp).toLocaleString() 
      : 'N/A';
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"Linda's Nut Butter Store" <${process.env.EMAIL_FROM || 'noreply@linda-nut-butter.com'}>`,
      to: order.customer.email,
      subject: `Payment Confirmation - Order #${order._id}`,
      text: `
        Dear ${order.customer.name},
        
        Thank you for your order at Linda's Nut Butter Store!
        
        We're pleased to confirm that we have received your payment of KES ${order.totalAmount} via M-Pesa.
        
        Order Details:
        --------------
        Order ID: ${order._id}
        Date: ${new Date(order.createdAt).toLocaleString()}
        
        Items:
        ${formattedItems}
        
        Total: KES ${order.totalAmount}
        
        Payment Details:
        ----------------
        Payment Method: M-Pesa
        Transaction ID: ${transaction.transactionId || 'N/A'}
        Date: ${transactionDate}
        
        Your order will be processed shortly. You'll receive another email when your order ships.
        
        If you have any questions, please contact us at info@linda-nut-butter.com.
        
        Thank you for shopping with us!
        
        Best regards,
        Linda's Nut Butter Store Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B4513;">Payment Confirmation</h2>
          <p>Dear <strong>${order.customer.name}</strong>,</p>
          
          <p>Thank you for your order at Linda's Nut Butter Store!</p>
          
          <p>We're pleased to confirm that we have received your payment of <strong>KES ${order.totalAmount}</strong> via M-Pesa.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px;">Item</th>
                <th style="text-align: right; padding: 8px;">Price</th>
              </tr>
              ${order.items.map(item => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px;">${item.name} x ${item.quantity}</td>
                  <td style="text-align: right; padding: 8px;">KES ${item.price * item.quantity}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold;">
                <td style="padding: 8px;">Total</td>
                <td style="text-align: right; padding: 8px;">KES ${order.totalAmount}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #8B4513; margin-top: 0;">Payment Details</h3>
            <p><strong>Payment Method:</strong> M-Pesa</p>
            <p><strong>Transaction ID:</strong> ${transaction.transactionId || 'N/A'}</p>
            <p><strong>Date:</strong> ${transactionDate}</p>
          </div>
          
          <p>Your order will be processed shortly. You'll receive another email when your order ships.</p>
          
          <p>If you have any questions, please contact us at <a href="mailto:info@linda-nut-butter.com">info@linda-nut-butter.com</a>.</p>
          
          <p>Thank you for shopping with us!</p>
          
          <p>Best regards,<br>
          Linda's Nut Butter Store Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    });
    
    console.log('Payment confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return false;
  }
};

/**
 * Send order shipped notification
 * @param {Object} order - Order details
 * @returns {Promise} - Email send result
 */
const sendOrderShippedNotification = async (order) => {
  try {
    if (!order || !order.customer || !order.customer.email) {
      console.error('Cannot send order shipped notification: Missing order details or customer email');
      return false;
    }
    
    const transporter = createTransporter();
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"Linda's Nut Butter Store" <${process.env.EMAIL_FROM || 'noreply@linda-nut-butter.com'}>`,
      to: order.customer.email,
      subject: `Your Order #${order._id} Has Been Shipped`,
      text: `
        Dear ${order.customer.name},
        
        Good news! Your order #${order._id} has been shipped.
        
        If you have any questions, please contact us at info@linda-nut-butter.com.
        
        Thank you for shopping with Linda's Nut Butter Store!
        
        Best regards,
        Linda's Nut Butter Store Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B4513;">Your Order Has Been Shipped</h2>
          <p>Dear <strong>${order.customer.name}</strong>,</p>
          
          <p>Good news! Your order <strong>#${order._id}</strong> has been shipped.</p>
          
          <p>If you have any questions, please contact us at <a href="mailto:info@linda-nut-butter.com">info@linda-nut-butter.com</a>.</p>
          
          <p>Thank you for shopping with Linda's Nut Butter Store!</p>
          
          <p>Best regards,<br>
          Linda's Nut Butter Store Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    });
    
    console.log('Order shipped email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending order shipped email:', error);
    return false;
  }
};

module.exports = {
  sendPaymentConfirmation,
  sendOrderShippedNotification
};
