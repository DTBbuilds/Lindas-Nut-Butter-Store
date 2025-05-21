// Sample data for testing the M-Pesa integration and order processing

const products = [
  {
    id: 1,
    name: 'Creamy Almond Butter',
    description: 'Our classic, smooth almond butter made with premium almonds.',
    price: 1200,
    images: ['/images/Plain Almond.jpg'],
    category: 'Almond',
    stockQuantity: 25,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: true,
    sku: 'ALM001',
    isActive: true
  },
  {
    id: 2,
    name: 'Crunchy Peanut Butter',
    description: 'Classic crunchy peanut butter with bits of roasted peanuts for extra texture.',
    price: 850,
    images: ['/images/crunchy Peanut butter.jpg'],
    category: 'Peanut',
    stockQuantity: 25,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: true,
    sku: 'PNT001',
    isActive: true
  },
  {
    id: 3,
    name: 'Creamy Cashew Butter',
    description: 'Luxuriously smooth cashew butter made with premium cashews.',
    price: 1400,
    images: ['/images/plain cashew.jpg'],
    category: 'Cashew',
    stockQuantity: 25,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: true,
    sku: 'CSH001',
    isActive: true
  },
  {
    id: 4,
    name: 'Pure Honey',
    description: 'Raw, unfiltered local honey - perfect pairing with our nut butters.',
    price: 950,
    images: ['/images/Pure Honey.jpg'],
    category: 'Honey',
    stockQuantity: 25,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'HNY001',
    isActive: true
  }
];

// Sample orders for testing
const orders = [
  {
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '254708374149', // Test success number
      address: {
        street: '123 Main St',
        city: 'Nairobi',
        state: 'Nairobi',
        postalCode: '00100',
        country: 'Kenya'
      }
    },
    items: [
      {
        product: 1,
        name: 'Creamy Almond Butter',
        price: 1200,
        quantity: 2
      },
      {
        product: 2,
        name: 'Chunky Peanut Butter',
        price: 850,
        quantity: 1
      }
    ],
    totalAmount: 3250,
    paymentMethod: 'MPESA',
    notes: 'Please deliver in the morning',
    referenceNumber: 'LNB123456789',
    status: 'PENDING',
    paymentStatus: 'PENDING'
  }
];

// Sample transactions for testing
const transactions = [
  {
    orderId: 'WILL_BE_SET_DYNAMICALLY',
    transactionId: 'MZ123456789',
    merchantRequestId: 'MR123456789',
    requestId: 'CR123456789',
    phoneNumber: '254708374149',
    amount: 3250,
    status: 'COMPLETED',
    type: 'STK_PUSH',
    resultCode: '0',
    resultDesc: 'Success',
    timestamp: new Date()
  }
];

module.exports = {
  products,
  orders,
  transactions
};
