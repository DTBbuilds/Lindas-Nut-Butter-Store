const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Admin User Schema
 * Represents admin users who can access the admin dashboard
 * IMPORTANT: This is the ONLY Admin model definition that should be used
 * across the entire application to avoid schema conflicts
 */
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'super-admin', 'super_admin', 'editor'],
    default: 'admin'
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  phoneNumber: String,
  profilePicture: String
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// If Admin model already exists, use that, otherwise create new one
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

// Create default admin if none exists
Admin.createDefaultAdmin = async function() {
  try {
    const adminCount = await this.countDocuments();
    
    if (adminCount === 0) {
      console.log('Creating default admin user...');
      
      // Check if environment variables are available
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'dtbadmin@lindas.com';
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Password123!@#Linda';
      const defaultName = process.env.DEFAULT_ADMIN_NAME || 'Linda Admin';
      
      const newAdmin = new Admin({
        email: defaultEmail,
        password: defaultPassword, // Will be hashed by pre-save hook
        name: defaultName,
        role: 'super-admin',
        active: true
      });
      
      await newAdmin.save();
      console.log(`Default admin created: ${defaultEmail}`);
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Export the model
module.exports = Admin;
