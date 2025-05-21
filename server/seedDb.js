// Script to seed the database with test data
const mongoose = require('mongoose');
const { Order, Transaction, Product } = require('./models');
const { products, orders, transactions } = require('./sampleData');
const config = require('./config');

// Connect to MongoDB
// Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
mongoose.connect(config.mongodb.uri)
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await Order.deleteMany({});
    await Transaction.deleteMany({});
    await Product.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Insert products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Inserted ${insertedProducts.length} products`);
    
    // Insert orders with references to products
    const insertedOrders = await Promise.all(
      orders.map(async order => {
        // Create new order object with product references
        const orderWithRefs = {
          ...order,
          items: order.items.map(item => ({
            ...item,
            product: insertedProducts.find(p => p.id === item.product)._id
          })),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return await Order.create(orderWithRefs);
      })
    );
    
    console.log(`Inserted ${insertedOrders.length} orders`);
    
    // Insert transactions with references to orders
    const insertedTransactions = await Promise.all(
      transactions.map(async transaction => {
        // Use the first order ID for the test transaction
        const transactionWithRefs = {
          ...transaction,
          orderId: insertedOrders[0]._id
        };
        
        return await Transaction.create(transactionWithRefs);
      })
    );
    
    console.log(`Inserted ${insertedTransactions.length} transactions`);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
