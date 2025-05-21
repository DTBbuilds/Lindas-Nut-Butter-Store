// Script to create an initial admin user
const mongoose = require('mongoose');
const { User } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node createAdminUser.js <email> <password>');
  process.exit(1);
}

mongoose.connect(MONGO_URI) // Modern MongoDB driver no longer needs connection options
  .then(async () => {
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    const user = new User({ email, password, role: 'admin' });
    await user.save();
    console.log('Admin user created:', email);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
