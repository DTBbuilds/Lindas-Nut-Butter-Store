const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('./models');

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:');
  console.log('Email received:', email);
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  try {
    const user = await User.findOne({ email });
    console.log('User found:', !!user, user ? { email: user.email, role: user.role } : null);
    if (!user) {
      console.log('No user found for email:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password did not match for user:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.role !== 'admin') {
      console.log('User is not admin:', email, 'role:', user.role);
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'changeme', { expiresIn: '12h' });
    console.log('Login successful for admin:', email);
    res.json({ success: true, token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
