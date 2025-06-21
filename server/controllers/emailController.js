const nodemailer = require('nodemailer');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Create email backup directory if it doesn't exist
const EMAIL_BACKUP_DIR = path.join(__dirname, '../email_backup');

// Ensure email backup directory exists
(async () => {
  try {
    await fs.mkdir(EMAIL_BACKUP_DIR, { recursive: true });
    console.log('Email backup directory initialized');
  } catch (err) {
    console.error('Failed to create email backup directory:', err);
  }
})();

// Create a reusable transporter with Gmail integration
const createTransporter = async () => {
  try {
    // Check if we should use OAuth2 or direct password authentication
    if (config.email.useOAuth2 && 
        config.email.clientId && 
        config.email.clientSecret && 
        config.email.refreshToken) {
      
      console.log('Using OAuth2 authentication for Gmail');
      
      // Create OAuth2 client
      const oauth2Client = new OAuth2(
        config.email.clientId,
        config.email.clientSecret,
        'https://developers.google.com/oauthplayground'
      );
      
      // Set refresh token
      oauth2Client.setCredentials({
        refresh_token: config.email.refreshToken
      });
      
      // Get access token
      const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            console.error('Error getting OAuth2 access token:', err);
            reject(err);
          }
          resolve(token);
        });
      });
      
      // Create transporter with OAuth2
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.email.user,
          clientId: config.email.clientId,
          clientSecret: config.email.clientSecret,
          refreshToken: config.email.refreshToken,
          accessToken: accessToken
        },
        // Gmail-specific settings to enable auto-composition features
        headers: {
          'X-GM-AUTO-COMPOSE': 'true',
          'X-GM-SMART-COMPOSE': config.email.gmailSmartCompose ? 'true' : 'false'
        },
        connectionTimeout: 15000, // Increased timeout
        greetingTimeout: 10000,
        socketTimeout: 20000,
        pool: true,
        maxConnections: 5,
        debug: true // Enable debug mode for troubleshooting
      });
    } else {
      // Fallback to password authentication (with app password) if OAuth2 is not configured
      console.log('Using app password authentication for Gmail');
      
      // Create a test connection to verify credentials
      const testTransporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password
        },
        debug: true
      });
      
      // Verify connection configuration
      try {
        await testTransporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (error) {
        console.error('SMTP connection verification failed:', error);
        console.log('Proceeding with configuration anyway, will attempt to send emails');
      }
      
      return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password
        },
        tls: {
          rejectUnauthorized: false, // Accept self-signed certificates
          ciphers: 'SSLv3' // Use more compatible cipher suite
        },
        // Gmail-specific settings
        headers: {
          'X-GM-AUTO-COMPOSE': 'true',
          'X-GM-SMART-COMPOSE': config.email.gmailSmartCompose ? 'true' : 'false'
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        debug: true, // Enable debug mode
        pool: true,
        maxConnections: 3
      });
    }
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error('Failed to create email transporter');
  }
};

// Save email to backup file in case sending fails
const backupEmail = async (emailData) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `email_${timestamp}_${Math.random().toString(36).substring(2, 8)}.json`;
    const filePath = path.join(EMAIL_BACKUP_DIR, filename);
    
    await fs.writeFile(filePath, JSON.stringify(emailData, null, 2));
    console.log(`Email backed up to ${filePath}`);
    return filePath;
  } catch (err) {
    console.error('Failed to back up email:', err);
    return null;
  }
};

/**
 * Generic email sending function.
 * @param {object} emailOptions - Options for the email (to, subject, html, etc.)
 */
const sendEmail = async (emailOptions) => {
  let transporter;
  try {
    transporter = await createTransporter();
  } catch (error) {
    console.error('Failed to create email transporter for sendEmail:', error);
    await backupEmail(emailOptions); // Backup if transporter fails
    throw new Error('Could not create email transporter.');
  }

  const mailOptions = {
    from: `"Linda's Nut Butter Store" <${config.email.user}>`,
    to: emailOptions.to,
    subject: emailOptions.subject,
    html: emailOptions.html,
    attachments: emailOptions.attachments || [],
  };

  try {
    console.log(`Attempting to send email to ${emailOptions.to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${emailOptions.to}. Message ID: ${info.messageId}`);
    
    // Since sending was successful, we can remove any backup
    // (This part is optional, might be good to keep backups for a while)

  } catch (error) {
    console.error(`Error sending email to ${emailOptions.to}:`, error);
    await backupEmail(emailOptions); // Backup on send failure
    throw new Error(`Failed to send email. It has been backed up. Reason: ${error.message}`);
  }
};

/**
 * Send an email with shipping address details to the customer
 */
const sendShippingAddressEmail = async (req, res) => {
  let backupFilePath = null;
  
  try {
    const { email, customerEmail, name, orderId, shippingAddress, cartDetails, fromCustomer = false } = req.body;

    if (!email || !name || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Include customer's email in the message if provided
    const customerEmailText = customerEmail ? `<p>Customer Email: ${customerEmail}</p>` : '';
    
    // Create the email data object for sending and potential backup
    const emailData = {
      to: email,
      customerEmail,
      name,
      shippingAddress,
      timestamp: new Date().toISOString()
    };
    
    // Back up email data first in case sending fails
    backupFilePath = await backupEmail(emailData);
    
    // Create subject line with order ID if available - making it clear and professional
    const subjectLine = orderId 
      ? `Linda's Nut Butter - New Order #${orderId} with Shipping Details` 
      : 'Linda\'s Nut Butter - New Order with Shipping Details';
    
    // Create order ID highlight box
    const orderIdHighlight = orderId ? `
      <div style="background-color: #f8f4e5; border: 1px solid #d4a05b; padding: 15px; margin-bottom: 20px; border-radius: 5px; text-align: center;">
        <h2 style="margin: 0; color: #8B4513; font-size: 16px;">Order Reference</h2>
        <p style="font-size: 20px; font-weight: bold; margin: 10px 0 0 0; letter-spacing: 1px;">${orderId}</p>
        <p style="font-size: 12px; margin: 5px 0 0 0; color: #666;">Please use this reference for all communications</p>
      </div>
    ` : '';
    
    // Create order summary HTML for cart items with enhanced styling
    let orderSummaryHTML = '';
    if (cartDetails && cartDetails.items && cartDetails.items.length > 0) {
      orderSummaryHTML = `
        <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
          <h3 style="color: #8B4513; margin-bottom: 15px;">Order Summary</h3>
          ${orderIdHighlight}
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f8f4e5;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
            </tr>
            ${cartDetails.items.map(item => `
              <tr>
                <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">KSh ${item.price.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">KSh ${(item.total).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Subtotal:</td>
              <td style="padding: 8px; text-align: right;">KSh ${cartDetails.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Shipping Fee:</td>
              <td style="padding: 8px; text-align: right;">KSh ${cartDetails.shippingFee.toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f8f4e5;">
              <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 8px; text-align: right; font-weight: bold;">KSh ${cartDetails.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      `;
    }
    
    // Send email with enhanced Gmail support
    const transporter = await createTransporter();
    
    // Log transporter configuration (with sensitive info removed)
    console.log('Email transporter created with configuration:', {
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        // Password is hidden for security
        usingOAuth2: config.email.useOAuth2
      }
    });
    
    // Create a more Gmail-friendly mail options object
    const mailOptions = {
      from: fromCustomer ? `"${name} via Linda's Nut Butter" <${customerEmail}>` : config.email.from,
      to: email,
      replyTo: customerEmail, // Set reply-to as the customer's email for easier response
      subject: subjectLine,
      priority: 'high', // Mark as high priority
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-GM-AUTO-COMPOSE': 'true', // Enable Gmail auto-compose
        'X-GM-AUTO-THREAD': 'true' // Enable smart threading for related emails
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f4e5; padding: 20px; text-align: center;">
            <h1 style="color: #8B4513; margin: 0;">Linda's Nut Butter - New Order</h1>
            ${orderId ? `<p style="color: #8B4513; font-weight: bold;">Order ID: ${orderId}</p>` : ''}
          </div>
          
          <div style="padding: 20px; background-color: #fff;">
            <p>Hello from Linda's Nut Butter Store!</p>
            
            ${fromCustomer ? `<p><strong>${name}</strong> has placed a new order with the following delivery details:</p>` : `<p>Here is the shipping information for your order:</p>`}
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Customer Information:</strong></p>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
              ${shippingAddress.phoneNumber ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${shippingAddress.phoneNumber}</p>` : ''}
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Delivery Address:</strong></p>
              <p style="margin: 5px 0;">${shippingAddress.street}</p>
              <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state}</p>
              <p style="margin: 5px 0;">${shippingAddress.country || 'Kenya'}</p>
              ${shippingAddress.location ? `
                <p style="margin: 10px 0 5px;"><strong>GPS Location:</strong></p>
                <p style="margin: 5px 0;">Latitude: ${shippingAddress.location.latitude}, Longitude: ${shippingAddress.location.longitude}</p>
                ${shippingAddress.location.description ? `<p style="margin: 5px 0;">Description: ${shippingAddress.location.description}</p>` : ''}
              ` : ''}
            </div>
            
            <div style="background-color: #f5fff5; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>Delivery Time:</strong> Within 48 hours of order confirmation</p>
              ${shippingAddress.deliveryTime ? `<p style="margin: 5px 0;">Estimated delivery: ${shippingAddress.deliveryTime}</p>` : ''}
            </div>
            
            ${orderSummaryHTML}
            
            <p style="margin-top: 20px;">If you have any questions about this order, please reply directly to this email to contact the customer.</p>
            <p>You can also use the reference number at the top of this email for order tracking.</p>
          </div>
          
          <div style="background-color: #8B4513; color: white; padding: 10px; text-align: center; font-size: 12px;">
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Linda's Nut Butter Store. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated email sent from our order processing system.</p>
          </div>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>© ${new Date().getFullYear()} Linda's Nut Butter Store. All rights reserved.</p>
          <p>
            <a href="https://lindasnutbutter.com/contact" style="color: #8B4513; text-decoration: none;">Contact Us</a> | 
            <a href="https://lindasnutbutter.com/privacy" style="color: #8B4513; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
      `,
      text: `
      LINDA'S NUT BUTTER STORE
      ${fromCustomer ? 'CUSTOMER ORDER INFORMATION' : 'YOUR DELIVERY INFORMATION'}
      
      ${fromCustomer ? `ORDER #${orderId || 'N/A'}
      NEW ORDER FROM: ${name} (${customerEmail || 'No email provided'})` : `Hello ${name},
      
      Thank you for your order! Here is the delivery information you provided:`}
      
      SHIPPING ADDRESS:
      ${addressText}
      
      ${shippingAddress.location ? `LOCATION: ${shippingAddress.location.description}
      Coordinates: ${shippingAddress.location.latitude}, ${shippingAddress.location.longitude}
      View on map: https://www.openstreetmap.org/?mlat=${shippingAddress.location.latitude}&mlon=${shippingAddress.location.longitude}` : ''}
      
      DELIVERY INFORMATION:
      Delivery Time: ${shippingAddress.deliveryTime || '48 hours'}
      ${shippingAddress.phoneNumber ? `Contact Number: ${shippingAddress.phoneNumber}` : ''}
      
      ${cartItemsText}
      
      ${fromCustomer ? `This order requires delivery within 48 hours.
      Please contact the customer to confirm the order.` : `If you need to update your delivery information, please contact us as soon as possible.
      
      Best regards,
      Linda's Nut Butter Store Team`}
      
      © ${new Date().getFullYear()} Linda's Nut Butter Store. All rights reserved.
      `
    };

    // Implement retry mechanism for sending emails
    const MAX_RETRIES = 3;
    let retries = 0;
    let info;
    
    while (retries < MAX_RETRIES) {
      try {
        // Send the email
        info = await transporter.sendMail(mailOptions);
        // If successful, break out of the retry loop
        console.log(`Email sent successfully on attempt ${retries + 1}: ${info.messageId}`);
        break;
      } catch (sendError) {
        retries++;
        console.error(`Email sending attempt ${retries} failed:`, sendError.message);
        
        if (retries >= MAX_RETRIES) {
          throw new Error(`Failed to send email after ${MAX_RETRIES} attempts: ${sendError.message}`);
        }
        
        // Wait before next retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    // For ethereal emails in development, provide the preview URL
    if (info && info.messageId) {
      // If email successfully sent, we can delete the backup file
      if (backupFilePath) {
        try {
          await fs.unlink(backupFilePath);
          console.log(`Backup file ${backupFilePath} deleted after successful email send`);
        } catch (err) {
          console.error('Error deleting backup file:', err);
        }
      }
      
      // For ethereal emails in development, provide the preview URL
      if (info.ethereal) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data: {
          messageId: info.messageId,
          previewUrl: info.ethereal ? nodemailer.getTestMessageUrl(info) : null
        }
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide specific error message for known Gmail issues
    let errorMessage = 'Failed to send email';
    
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Email authentication failed. Please check your Gmail username and password or App Password.';
    } else if (error.message.includes('SMTP')) {
      errorMessage = 'SMTP connection error. Please check your email server settings.';
    }
    
    // Return helpful error message with backup info if available
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      backupCreated: !!backupFilePath,
      backupInfo: backupFilePath ? 'Email data backed up for retry' : null
    });
  }
};

module.exports = {
  createTransporter,
  backupEmail,
  sendEmail,
  sendShippingAddressEmail,
};
