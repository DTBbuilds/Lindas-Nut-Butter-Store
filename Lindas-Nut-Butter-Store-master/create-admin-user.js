const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { User } = require('./server/models');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lindas_nut_butter_store';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create new admin user
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcryptjs.hash('AdminPassword123!', 10),
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
