const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { name, address, password, email } = require('../utils/validators');

const router = express.Router();

// Signup - normal users OR admins
router.post('/signup', [name, email, password, address], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name: fullName, email: userEmail, password: pwd, address: addr, role } = req.body;

  try {
    const existing = await User.findOne({ email: userEmail });
    if (existing) return res.status(400).json({ msg: 'Email already in use' });

    const hashed = await bcrypt.hash(pwd, 10);

    // ✅ allow role but default to 'user'
    const user = await User.create({
      name: fullName,
      email: userEmail,
      password: hashed,
      address: addr,
      role: role || 'user'
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        storeId: user.storeId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email: userEmail, password: pwd } = req.body;
  if (!userEmail || !pwd) return res.status(400).json({ msg: 'Provide email and password' });

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const ok = await bcrypt.compare(pwd, user.password);
    if (!ok) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        storeId: user.storeId || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
