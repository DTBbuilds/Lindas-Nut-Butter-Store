/**
 * Create a test customer for login testing
 */
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const config = require('./config');

async function createTestCustomer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected');
    
    // Check if test customer already exists
    const existingCustomer = await Customer.findOne({ email: 'customer@test.com' });
    
    if (existingCustomer) {
      console.log('Test customer already exists');
      console.log('Email: customer@test.com');
      console.log('Password: password123');
      process.exit(0);
    }
    
    // Create a new test customer
    const customer = new Customer({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      phoneNumber: '254712345678'
    });
    
    await customer.save();
    console.log('Test customer created successfully');
    console.log('Email: customer@test.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test customer:', error);
    process.exit(1);
  }
}

createTestCustomer();
