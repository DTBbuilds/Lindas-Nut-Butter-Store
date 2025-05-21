# Linda's Nut Butter Store

An e-commerce website for premium nut butters, built with React, Tailwind CSS, Node.js, Express, and MongoDB. Features Safaricom Daraja API integration for M-Pesa payments.

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Register for Safaricom Daraja API and add your credentials to `.env`
5. Start the development server: `npm run dev`

## Features
- Fast loading with optimized images and CDN
- Simple, user-friendly interface
- Seamless checkout and cart options
- M-Pesa payment integration via Safaricom Daraja API
- Real-time payment confirmation and order processing
- Admin dashboard for transaction management
- Clear product return information and refund processing

## Color Palette
- Warm Beige (#F5E8C7)
- Rich Brown (#5C4033)
- Soft Green (#A8B5A2)
- Golden Yellow (#D4A017)

## Typography
- Primary: Poppins (Bold for headings, Regular for body)
- Secondary: Lora (Italic for emphasis)

## M-Pesa Integration

### Safaricom Daraja API
The application integrates with Safaricom's Daraja API to provide a seamless payment experience via M-Pesa for customers of Linda's Nut Butter Store.

### Key Features
- **STK Push**: Customers receive a payment prompt directly on their phones
- **C2B Validation**: Real-time verification of payment details
- **C2B Confirmation**: Instant notification when payments are completed
- **Transaction Query**: Check payment status in real-time
- **Reversal**: Process refunds for cancelled orders

### Configuration
- Paybill Number: 247247
- Account Number: 0725317864

### Setup Requirements
1. Register for a Daraja API account at [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create a Daraja API app and obtain Consumer Key and Secret
3. Set up your Webhook URLs for validation and confirmation
4. Configure security credentials for B2C and reversal operations
5. Update your `.env` file with the credentials

## Backend API Endpoints

### M-Pesa Endpoints
- **POST /api/mpesa/stkpush**: Initiate STK push payment
- **POST /api/mpesa/validation**: C2B validation endpoint
- **POST /api/mpesa/confirmation**: C2B confirmation endpoint
- **POST /api/mpesa/callback**: STK push callback endpoint
- **POST /api/mpesa/query**: Query transaction status
- **POST /api/mpesa/refund**: Process payment refund

### Order Endpoints
- **POST /api/orders**: Create a new order
- **GET /api/orders/:id**: Get order details
- **GET /api/admin/orders**: Get all orders (admin only)
- **GET /api/admin/transactions**: Get all transactions (admin only)
- **GET /api/admin/transactions/export**: Export transactions as CSV
