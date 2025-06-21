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

/**
 * Send password reset email
 * @param {string} email - Customer email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - URL with reset token for the customer to click
 * @returns {Promise} - Email send result
 */
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    if (!email || !resetToken || !resetUrl) {
      console.error('Cannot send password reset email: Missing required parameters');
      return false;
    }
    
    const transporter = createTransporter();
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"Linda's Nut Butter Store" <${process.env.EMAIL_FROM || 'noreply@linda-nut-butter.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `
Hello,

You are receiving this email because you (or someone else) has requested to reset your password for your Linda's Nut Butter Store account.

Please click on the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this, please ignore this email and your password will remain unchanged.

Thank you,
Linda's Nut Butter Store Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #8B4513;">Linda's Nut Butter Store</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #333;">Password Reset Request</h3>
            <p>Hello,</p>
            <p>You are receiving this email because you (or someone else) has requested to reset your password for your Linda's Nut Butter Store account.</p>
            <p>Please click on the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; font-size: 12px; color: #777; text-align: center;">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Linda's Nut Butter Store. All rights reserved.</p>
          </div>
        </div>
      `
    });
    
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send a generic email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body (optional)
 * @returns {Promise} - Email send result
 */
const sendEmail = async (options) => {
  try {
    if (!options.to || !options.subject || !options.text) {
      console.error('Cannot send email: Missing required fields');
      return false;
    }
    
    const transporter = createTransporter();
    
    // Send the email
    const info = await transporter.sendMail({
      from: `"Linda's Nut Butter Store" <${process.env.EMAIL_FROM || 'noreply@linda-nut-butter.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>')
    });
    
    console.log(`Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send batch emails (for marketing or announcements)
 * @param {Array} emails - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Plain text email body
 * @param {string} html - HTML email body (optional)
 * @returns {Promise} - Results of batch email operation
 */
const sendBatchEmails = async (emails, subject, text, html) => {
  if (!emails || !emails.length || !subject || !text) {
    console.error('Cannot send batch emails: Missing required fields');
    return { success: false, sent: 0, total: 0 };
  }
  
  const results = [];
  const batchSize = 10; // Process in batches to avoid overwhelming the mail server
  
  // Process emails in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Send emails in this batch concurrently
    const batchPromises = batch.map(email => {
      return sendEmail({
        to: email,
        subject,
        text,
        html
      });
    });
    
    // Wait for this batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Add a small delay between batches to prevent rate limiting
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Count successful sends
  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value === true
  ).length;
  
  return { 
    success: successful > 0,
    sent: successful,
    total: emails.length
  };
};

/**
 * Send an alert email to the admin.
 * @param {string} subject - The subject of the alert email.
 * @param {string} htmlContent - The HTML content of the alert email.
 * @returns {Promise<boolean>} - True if email sent successfully, false otherwise.
 */
const sendAdminAlert = async (subject, htmlContent) => {
  if (!config.adminEmail) {
    console.error('Admin email not configured. Cannot send admin alert.');
    return false;
  }
  try {
    await sendEmail({
      to: config.adminEmail,
      subject: subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>?/gm, '') // Basic text version from HTML
    });
    console.log(`Admin alert email sent: "${subject}"`);
    return true;
  } catch (error) {
    console.error(`Error sending admin alert email "${subject}":`, error);
    return false;
  }
};

module.exports = {
  sendPaymentConfirmation,
  sendOrderShippedNotification,
  sendPasswordResetEmail,
  sendEmail,
  sendBatchEmails,
  sendAdminAlert
};
