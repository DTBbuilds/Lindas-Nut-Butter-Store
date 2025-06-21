// Sample data for testing the M-Pesa integration and order processing

const products = [
  // 1. Almond Butter - Creamy
  {
    id: 1,
    name: 'Creamy Almond Butter',
    description: 'Our classic, smooth almond butter made with premium almonds. A creamy delight for any occasion.',
    price: 1200,
    images: ['/images/creamy-almond-butter.jpg'],
    category: 'Almond Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: true,
    sku: 'ALM001',
    isActive: true
  },
  // 2. Almond Butter - Crunchy
  {
    id: 2,
    name: 'Crunchy Almond Butter',
    description: 'A satisfyingly crunchy almond butter, packed with pieces of roasted almonds for a textured treat.',
    price: 1200,
    images: ['/images/plain-almond.jpg'],
    category: 'Almond Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'ALM002',
    isActive: true
  },
  // 3. Almond Butter - Chocolate
  {
    id: 3,
    name: 'Chocolate Almond Butter',
    description: 'Indulge in the rich blend of smooth almond butter and decadent dark chocolate.',
    price: 1400,
    images: ['/images/chocolate-almond-butter.jpg'],
    category: 'Almond Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: true,
    sku: 'ALM003',
    isActive: true
  },
  // 4. Almond Butter - Chocolate Orange
  {
    id: 4,
    name: 'Chocolate Orange Almond Butter',
    description: 'A zesty fusion of rich chocolate, tangy orange, and creamy almond butter.',
    price: 1400,
    images: ['/images/chocolate-orange-almond.jpg'],
    category: 'Almond Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'ALM004',
    isActive: true
  },
  // 5. Cashew Butter - Chilli
  {
    id: 5,
    name: 'Chilli Cashew Butter',
    description: 'A bold and spicy kick of chilli combined with the creamy sweetness of cashew butter.',
    price: 1050,
    images: ['/images/chilli-choco-cashew.jpg'],
    category: 'Cashew Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'CSH001',
    isActive: true
  },
  // 6. Cashew Butter - Plain
  {
    id: 6,
    name: 'Plain Cashew Butter',
    description: 'Luxuriously smooth and creamy butter made from the finest roasted cashews.',
    price: 900,
    images: ['/images/creamy-cashew-butter.jpg'],
    category: 'Cashew Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: true,
    sku: 'CSH002',
    isActive: true
  },
  // 7. Cashew Butter - Chocolate
  {
    id: 7,
    name: 'Chocolate Cashew Butter',
    description: 'A heavenly mix of rich chocolate and creamy cashew butter. Pure indulgence.',
    price: 1050,
    images: ['/images/chocolate-cashew-butter.jpg'],
    category: 'Cashew Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'CSH003',
    isActive: true
  },
  // 8. Cashew Butter - Chocolate Orange
  {
    id: 8,
    name: 'Chocolate Orange Cashew Butter',
    description: 'The perfect balance of zesty orange, rich chocolate, and creamy cashew butter.',
    price: 1200,
    images: ['/images/chocolate-orange-cashew.jpg'],
    category: 'Cashew Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'CSH004',
    isActive: true
  },
  // 9. Cashew Butter - Coconut
  {
    id: 9,
    name: 'Coconut Cashew Butter',
    description: 'A tropical twist on a classic. Creamy cashew butter blended with sweet, toasted coconut.',
    price: 1050,
    images: ['/images/coconut-cashew-butter.jpg'],
    category: 'Cashew Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'CSH005',
    isActive: true
  },
  // 10. Hazelnut Butter - Chocolate
  {
    id: 10,
    name: 'Chocolate Hazelnut Butter',
    description: 'A classic, rich, and creamy chocolate hazelnut spread. Perfect on everything.',
    price: 2600,
    images: ['/images/chocolate-hazelnut-butter.jpg'],
    category: 'Hazelnut Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'HZN001',
    isActive: true
  },
  // 11. Honey
  {
    id: 11,
    name: 'Honey',
    description: 'Raw, unfiltered local honey. The perfect natural sweetener and pairing for our nut butters.',
    price: 600,
    images: ['/images/pure-honey.jpg'],
    category: 'Honey',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'HNY001',
    isActive: true
  },
  // 12. Macadamia Nut Butter
  {
    id: 12,
    name: 'Macadamia Nut Butter',
    description: 'A rich, buttery, and slightly sweet spread made from high-quality macadamia nuts.',
    price: 1050,
    images: ['/images/macadamia-butter.jpg'],
    category: 'Macadamia Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'MAC001',
    isActive: true
  },
  // 13. Macadamia Butter - Chocolate
  {
    id: 13,
    name: 'Chocolate Macadamia Butter',
    description: 'The ultimate indulgence: rich dark chocolate meets buttery macadamia nuts.',
    price: 1200,
    images: ['/images/chocolate-macadamia-butter.jpg'],
    category: 'Macadamia Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'MAC002',
    isActive: true
  },
  // 14. Peanut Butter - Creamy
  {
    id: 14,
    name: 'Creamy Peanut Butter',
    description: 'Classic, creamy, and oh-so-smooth peanut butter. A household staple.',
    price: 500,
    images: ['/images/creamy-peanut-butter.jpg'],
    category: 'Peanut Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'PNT001',
    isActive: true
  },
  // 15. Peanut Butter - Crunchy
  {
    id: 15,
    name: 'Crunchy Peanut Butter',
    description: 'For those who love a bit of crunch. Our classic peanut butter with chunks of roasted peanuts.',
    price: 500,
    images: ['/images/crunchy-peanut-butter.jpg'],
    category: 'Peanut Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'PNT002',
    isActive: true
  },
  // 16. Peanut Butter - Chocolate
  {
    id: 16,
    name: 'Chocolate Peanut Butter',
    description: 'Our classic peanut butter blended with rich dark chocolate.',
    price: 800,
    images: ['/images/chocolate-peanut-butter.jpg'],
    category: 'Peanut Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'PNT003',
    isActive: true
  },
  // 17. Peanut Butter - Chocolate Mint
  {
    id: 17,
    name: 'Chocolate Mint Peanut Butter',
    description: 'A refreshing blend of cool mint and rich chocolate in our classic peanut butter.',
    price: 600,
    images: ['/images/mint-chocolate-peanut.jpg'],
    category: 'Peanut Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'PNT004',
    isActive: true
  },
  // 18. Pumpkin Seed Butter
  {
    id: 18,
    name: 'Pumpkin Seed Butter',
    description: 'A nutritious and flavorful butter made from roasted pumpkin seeds.',
    price: 1000,
    images: ['/images/pumpkin-seed-butter.jpg'],
    category: 'Seed Butter',
    stockQuantity: 9999,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    featured: false,
    sku: 'PUM001',
    isActive: true
  }
];

// Sample users for testing
const users = [
  {
    name: 'Linda Admin',
    email: 'dtbadmin@lindas.com',
    password: 'lindasadmin2025',
    role: 'super-admin'
  }
];

// Sample orders for testing
const orders = [
  {
    // We only need to define the customer and the items they ordered by originalId.
    // The seed script will handle the rest (pricing, totals, etc.).
    customerId: 'CUST-001', // Corresponds to the customer seeded above
    customerEmail: 'customer@example.com',
    deliveryAddress: '123 Main St, Anytown, CA, 90210, USA',
    items: [
      { originalId: 1, quantity: 2 }, // Creamy Almond Butter
      { originalId: 5, quantity: 1 }, // Creamy Cashew Butter
      { originalId: 18, quantity: 1 } // Pistachio Butter
    ],
    paymentMethod: 'MPESA',
    notes: 'Test order for seeding.',
    status: 'PENDING'
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
  users,
  orders,
  transactions
};
