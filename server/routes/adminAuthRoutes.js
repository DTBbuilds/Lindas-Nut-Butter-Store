const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

async function handleAdminAuthentication(admin, password, res) {
  try {
    if (!admin.active) {
      console.log('Admin account inactive:', admin.email);
      return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });
    }

    if (!admin.password) {
      console.error('Admin password hash is missing for email:', admin.email);
      return res.status(500).json({ message: 'Account setup incomplete. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('Invalid password for admin:', admin.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Admin login successful:', admin.email);

    admin.lastLogin = new Date();
    await admin.save();

    const payload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      token: token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        active: admin.active
      }
    });
  } catch (authError) {
    console.error('Error in admin authentication process:', authError);
    return res.status(500).json({ message: 'Authentication error', error: authError.message });
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return handleAdminAuthentication(admin, password, res);

  } catch (err) {
    console.error('CRITICAL - Admin login error:', err);
    return res.status(500).json({
      message: 'A server error occurred during login.',
      error: err.message
    });
  }
});

router.get('/me', (req, res) => {
    res.status(501).json({ message: 'This endpoint is not fully implemented. Auth middleware is required.' });
});

module.exports = router;
