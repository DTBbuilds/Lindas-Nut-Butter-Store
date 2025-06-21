// Script to seed the database with test data
process.on('unhandledRejection', (reason, promise) => {
  console.error('SEED_DB: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit with error
});

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') }); // Load .env variables first

const mongoose = require('mongoose');
const { Order, Transaction, Admin, Customer, Product } = require('./models'); // Import all models from the central index
const { products, users, orders, transactions } = require('./sampleData'); // Import products, users, orders, and transactions from the updated sampleData.js
const config = require('./config');

// Connect to MongoDB
// Modern MongoDB driver no longer needs useNewUrlParser and useUnifiedTopology
mongoose.connect(config.mongodb.uri)
.then(() => {
    console.log('MongoDB connected for seeding');
    seedDatabase().catch(err => {
      console.error('SEED_DB: Unhandled error during seedDatabase execution:', err);
      process.exit(1);
    });
  })
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to seed the database
const seedDatabase = async () => {
  let createdProducts = [];
  let createdCustomers = [];
  console.log('SEED_DB: Inside seedDatabase function.');
  console.log('SEED_DB: Using MongoDB URI from config:', config.mongodb.uri);
  // It's possible mongoose.connection.db might not be fully populated here if connect isn't fully done.
  // Let's ensure we log dbName after we are sure connection is stable for the seed operation.

  try {
    // Ensure we have a stable connection reference for operations
    const db = mongoose.connection;
    console.log('SEED_DB: Current database name from Mongoose connection:', db.db.databaseName);

    const productCollection = db.collection('products'); // Use db.collection
  let currentIndexes = [];
  try {
    currentIndexes = await productCollection.listIndexes().toArray();
    console.log('SEED_DB: Current indexes on "products" collection (BEFORE attempting drop):', JSON.stringify(currentIndexes, null, 2));
  } catch (listIndexError) {
    if (listIndexError.codeName === 'NamespaceNotFound') {
      console.log('SEED_DB: "products" collection does not exist yet. No indexes to list.');
    } else {
      throw listIndexError; // Re-throw other errors
    }
  }

  try {
    if (currentIndexes.length > 0) { // Only attempt drop if collection (and thus possibly indexes) exists
      console.log('SEED_DB: Attempting to drop "id_1" index from "products" collection...');
      await productCollection.dropIndex("id_1");
      console.log('SEED_DB: "id_1" index dropped successfully or did not exist (if no error).');
    }
  } catch (indexDropError) {
    if (indexDropError.codeName === 'IndexNotFound' || indexDropError.message.includes('index not found')) {
      console.log('SEED_DB: "id_1" index not found, which is expected/good.');
    } else if (indexDropError.codeName === 'NamespaceNotFound') {
      console.log('SEED_DB: "products" collection does not exist, so "id_1" index cannot be dropped (which is fine).');
    } else {
      console.warn('SEED_DB: Warning/Error trying to drop "id_1" index (will proceed with seeding):', indexDropError.message);
    }
  }

  let indexesAfterDropAttempt = [];
  try {
    indexesAfterDropAttempt = await productCollection.listIndexes().toArray();
    console.log('SEED_DB: Current indexes on "products" collection (AFTER attempting drop):', JSON.stringify(indexesAfterDropAttempt, null, 2));
  } catch (listIndexErrorAfterDrop) {
    if (listIndexErrorAfterDrop.codeName === 'NamespaceNotFound') {
      console.log('SEED_DB: "products" collection does not exist yet (after drop attempt). No indexes to list.');
    } else {
      // Log other errors but allow seeding to continue, as primary goal is data insertion
      console.warn('SEED_DB: Warning/Error listing indexes after drop attempt (will proceed with seeding):', listIndexErrorAfterDrop.message);
    }
  }

  // Clear existing data
    await Order.deleteMany({});
    await Transaction.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({}); // Clear existing customers
    
    console.log('Cleared existing data (Orders, Transactions, Products, Admin Users, and Customers)');
    
    console.log('SEED_DB: Starting product seeding...');
  const mappedProductData = products.map(p => ({
    name: p.name,
    description: p.description,
    price: p.price,
    images: p.images || [],
    category: p.category,
    isActive: p.isActive !== undefined ? p.isActive : true,
    stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : 0,
    originalId: p.id,
    sku: p.sku
  }));

    // ---- Product Seeding Phase ----
    console.log('SEED_DB: Starting product seeding phase...');
    await Product.deleteMany({});
    console.log('SEED_DB: Products collection cleared.');

    if (mappedProductData && mappedProductData.length > 0) {
      const productDataToSeed = mappedProductData; // Attempt to seed all products
      console.log('SEED_DB: Attempting to seed all product data:', JSON.stringify(productDataToSeed.length > 3 ? productDataToSeed.slice(0,3) : productDataToSeed, null, 2)); // Log first 3 or all if fewer
      console.log('SEED_DB: VERBOSE - About to call Product.create...');
      try {
        createdProducts = await Product.create(productDataToSeed);
        console.log('SEED_DB: VERBOSE - Product.create call completed.');
        console.log(`SEED_DB: ${createdProducts.length} products were processed by Product.create.`);
      } catch (productCreateError) {
        console.error('SEED_DB: VERBOSE - Error during Product.create:', productCreateError);
        if (productCreateError.errors) {
          for (const key in productCreateError.errors) {
            console.error(`SEED_DB: VERBOSE - Validation error for ${key}: ${productCreateError.errors[key].message}`);
          }
        }
        console.error('SEED_DB: VERBOSE - Product data that caused error:', JSON.stringify(productDataToSeed, null, 2));
        createdProducts = []; // Ensure createdProducts is empty on error
      }
      console.log('SEED_DB: VERBOSE - State of createdProducts array after Product.create attempt:', JSON.stringify(createdProducts, null, 2));
    } else {
      console.log('SEED_DB: mappedProductData is empty. No products to seed.');
      createdProducts = []; // Ensure createdProducts is empty if no data
    }

    // ---- Admin User Seeding Phase ----
    console.log('SEED_DB: Starting admin user seeding phase...');
    await Admin.deleteMany({}); // Clear existing admin users
    console.log('SEED_DB: Existing admin users cleared.');

    // The 'users' variable from sampleData contains both regular users and admins.
    // We filter for the one with role 'super-admin'.
    const adminUsersToSeed = users.filter(user => user.role && (user.role === 'super-admin' || user.role === 'super_admin'));

    if (adminUsersToSeed.length > 0) {
        try {
            await Admin.create(adminUsersToSeed);
            console.log(`SEED_DB: Successfully seeded ${adminUsersToSeed.length} admin user(s).`);
        } catch (error) {
            console.error('SEED_DB: ERROR - Failed to seed admin users:', error);
        }
    } else {
        console.log('SEED_DB: No admin users with role \'super-admin\' found in sample data to seed.');
    }

    // ---- Check Product Seeding Result ----
    if (!createdProducts || createdProducts.length === 0) {
      console.error('SEED_DB: CRITICAL - Product seeding phase failed or resulted in no products. See logs above. Halting script.');
      process.exit(1); // Exit immediately if product seeding failed
      // return; // Unreachable due to process.exit, but good for logical flow understanding
    }

    // If we reach here, product seeding (for the single product) was successful
    console.log(`SEED_DB: Product seeding phase successful. ${createdProducts.length} product(s) created.`);
    if (createdProducts.length > 0) {
        const firstCreatedProduct = createdProducts[0];
        console.log('SEED_DB: Details of the first created product (raw):', firstCreatedProduct);
        console.log('SEED_DB: Details (mapped for verification):', JSON.stringify({
            _id: firstCreatedProduct._id,
            originalId: firstCreatedProduct.originalId,
            name: firstCreatedProduct.name,
            sku: firstCreatedProduct.sku,
            isActive: firstCreatedProduct.isActive,
            stockQuantity: firstCreatedProduct.stockQuantity
        }, null, 2));
    }

    // ---- Customer Seeding Phase ----
    console.log('SEED_DB: Starting customer seeding phase...');
    const customersToSeed = [
      {
        customerId: 'CUST-001',
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'CustomerPassword123!', // Plain text, will be hashed by pre-save hook
        phoneNumber: '1234567890',
        addresses: [{
          name: 'Home',
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '90210',
          country: 'USA',
          isDefault: true
        }],
        tags: ['loyal', 'newsletter_subscriber']
      }
    ];
    try {
      createdCustomers = await Customer.create(customersToSeed);
      console.log(`SEED_DB: ${createdCustomers.length} customer(s) created successfully.`);
      if (createdCustomers.length > 0) {
        console.log('SEED_DB: Details of the first created customer:', JSON.stringify(createdCustomers[0], null, 2));
      }
    } catch (customerCreateError) {
      console.error('SEED_DB: ERROR - Failed to create customer(s):', customerCreateError);
      if (customerCreateError.errors) {
        for (const key in customerCreateError.errors) {
          console.error(`SEED_DB: VERBOSE - Validation error for ${key} (Customer): ${customerCreateError.errors[key].message}`);
        }
      }
    }
    console.log('SEED_DB: Customer seeding phase completed.');

    // ---- Order Seeding Phase ----
    console.log('SEED_DB: Starting order seeding phase...');
    console.log('SEED_DB: Raw sample order data:', JSON.stringify(orders, null, 2));
    let createdOrders = [];

    if (createdProducts && createdProducts.length > 0 && createdCustomers && createdCustomers.length > 0) {
      for (const sampleOrder of orders) {
        const customer = createdCustomers.find(c => c.customerId === sampleOrder.customerId);
        if (!customer) {
          console.warn(`SEED_DB: WARNING - Customer with customerId ${sampleOrder.customerId} not found. Skipping order.`);
          continue;
        }

        const validOrderItems = sampleOrder.items.map(item => {
          const product = createdProducts.find(p => p.originalId === item.originalId);
          if (!product) {
            console.warn(`SEED_DB: WARNING - Product with originalId ${item.originalId} not found for order item. Skipping item.`);
            return null;
          }
          return {
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.images[0] || ''
          };
        }).filter(item => item !== null);

        if (validOrderItems.length === 0 && sampleOrder.items.length > 0) {
          console.warn(`SEED_DB: WARNING - Order for customer ${customer.email} had items, but none could be mapped. Skipping order.`);
          continue;
        }
        
        if (validOrderItems.length === 0) {
            console.log(`SEED_DB: INFO - Sample order for customer ${customer.email} has no items. Skipping.`);
            continue;
        }

        const subtotal = validOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingFee = 150; // Example shipping fee
        const total = subtotal + shippingFee;

        const orderToCreate = {
          orderNumber: Order.generateOrderNumber(),
          customerId: customer._id.toString(),
          customerEmail: customer.email,
          items: validOrderItems,
          subtotal,
          shippingFee,
          total,
          paymentMethod: sampleOrder.paymentMethod,
          deliveryAddress: sampleOrder.deliveryAddress,
          notes: sampleOrder.notes,
          status: sampleOrder.status,
        };

        try {
          const createdOrder = await Order.create(orderToCreate);
          createdOrders.push(createdOrder);
          console.log(`SEED_DB: Successfully created order ${createdOrder.orderNumber} for customer ${customer.email}.`);
        } catch (error) {
          console.error(`SEED_DB: ERROR - Failed to create order for customer ${customer.email}:`, error);
          console.error('SEED_DB: ERROR - Order data that failed:', JSON.stringify(orderToCreate, null, 2));
        }
      }
    } else {
        console.log('SEED_DB: Skipping order seeding because no products or customers were created.');
    }

    // ---- Transaction Seeding Phase ----
    console.log('SEED_DB: Starting transaction seeding phase...');
    let createdTransactions = [];
    if (createdOrders && createdOrders.length > 0 && transactions && transactions.length > 0) {
        try {
            // Map each created order to a sample transaction for seeding
            for (let i = 0; i < createdOrders.length; i++) {
                const order = createdOrders[i];
                // Use a sample transaction, cycling through if there are more orders than sample transactions
                const sampleTransaction = transactions[i % transactions.length];

                const newTransactionData = {
                    transactionId: `${sampleTransaction.transactionId}-${i}`, // Ensure unique transactionId
                    orderId: order._id,
                    amount: order.total, // Dynamically set from the order's total
                    paymentMethod: order.paymentMethod, // Dynamically set from the order's payment method
                    status: sampleTransaction.status || 'COMPLETED',
                    phoneNumber: sampleTransaction.phoneNumber,
                    notes: `Seeded transaction for order ${order.orderNumber}`,
                };

                try {
                    const newTransaction = await Transaction.create(newTransactionData);
                    createdTransactions.push(newTransaction);
                    console.log(`SEED_DB: Successfully created transaction for order ${order.orderNumber}.`);
                } catch (transactionCreateError) {
                    console.error(`SEED_DB: ERROR - Failed to create transaction for order ${order.orderNumber}:`, transactionCreateError);
                    console.error('SEED_DB: ERROR - Transaction data that failed:', JSON.stringify(newTransactionData, null, 2));
                }
            }
            
            console.log(`SEED_DB: Transaction seeding attempt completed. ${createdTransactions.length} transaction(s) created successfully.`);
            if (createdTransactions.length > 0) {
                console.log('SEED_DB: First created transaction (sample):', JSON.stringify(createdTransactions[0], null, 2));
            }

        } catch (error) {
            console.error('SEED_DB: CRITICAL ERROR during transaction seeding phase:', error);
        }
    } else {
        console.log('SEED_DB: No orders were created or no sample transactions found, skipping transaction seeding.');
    }

    console.log('SEED_DB: Database seeded successfully!'); // Final success log

  } catch (error) { // Main catch block for the entire seedDatabase async function
    console.error('SEED_DB: A critical error occurred during the database seeding process:', error);
    if (error.stack) {
      console.error('SEED_DB: Stack trace for critical error:', error.stack);
    }
    process.exit(1); // Exit with error code
  }
}; // This closes the seedDatabase async function

// seedDatabase() is now called within the mongoose.connect().then() block
