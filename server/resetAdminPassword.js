// Script to reset the admin user password
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lindas-nut-butter-store-store-store-store';

const email = 'dtbinfotech@gmail.com';
const newPassword = 'dtbinfo@2025';

async function resetPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
    
    // Find the admin user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    // Generate salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password directly in the database
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`Password reset successfully for user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
