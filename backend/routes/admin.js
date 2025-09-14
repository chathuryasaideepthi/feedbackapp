const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Store = require('../models/Store');
const Rating = require('../models/Rating');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const router = express.Router();

// ------------------------
// Admin dashboard stats
// ------------------------
router.get('/dashboard', auth, roles(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStores = await Store.countDocuments();
    const totalRatings = await Rating.countDocuments();
    res.json({ totalUsers, totalStores, totalRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ------------------------
// Create user (admin)
// ------------------------
router.post(
  '/users',
  auth,
  roles(['admin']),
  [
    body('name').isLength({ min: 3, max: 60 }).withMessage('Name must be 3-60 chars'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8, max: 16 })
      .matches(/[A-Z]/)
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must be 8-16 chars, include uppercase & special char'),
    body('role').optional().isIn(['admin', 'user', 'owner']),
    body('storeId').optional().isMongoId().withMessage('Invalid storeId')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, address, role, storeId } = req.body;

    try {
      if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email already exists' });

      const hashed = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name,
        email,
        password: hashed,
        address,
        role: role || 'user',
        storeId: role === 'owner' ? storeId || null : undefined
      });

      if (role === 'owner' && storeId) {
        await Store.findByIdAndUpdate(storeId, { ownerId: newUser._id });
      }

      res.json({
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          address: newUser.address,
          storeId: newUser.storeId
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// ------------------------
// Create store (admin)
// ------------------------
router.post(
  '/stores',
  auth,
  roles(['admin']),
  [
    body('name').notEmpty().withMessage('Store name required'),
    body('address').optional().isLength({ max: 400 }),
    body('ownerId').optional().isMongoId().withMessage('Invalid ownerId')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, address, ownerId } = req.body;

    try {
      const store = await Store.create({ name, email, address, ownerId: ownerId || null });

      if (ownerId) {
        await User.findByIdAndUpdate(ownerId, { role: 'owner', storeId: store._id });
      }

      res.json({ store });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// ------------------------
// List stores (admin)
// ------------------------
router.get('/stores', auth, roles(['admin']), async (req, res) => {
  const { q, sortBy = 'name', order = 'asc', page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } }
    ];
  }

  try {
    const skip = (page - 1) * limit;
    const stores = await Store.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(+limit);

    const storesWithRating = await Promise.all(
      stores.map(async s => {
        const agg = await Rating.aggregate([
          { $match: { storeId: s._id } },
          { $group: { _id: '$storeId', avg: { $avg: '$value' }, count: { $sum: 1 } } }
        ]);
        const avg = agg[0] ? agg[0].avg : 0;
        return { ...s.toObject(), avgRating: Math.round(avg * 10) / 10 };
      })
    );

    res.json(storesWithRating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ------------------------
// List users (admin)
// ------------------------
router.get('/users', auth, roles(['admin']), async (req, res) => {
  const { q, role, sortBy = 'name', order = 'asc', page = 1, limit = 50 } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } }
    ];
  }
  if (role) filter.role = role;

  try {
    const users = await User.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .select('-password');

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ------------------------
// Get user details (admin)
// ------------------------
router.get('/users/:id', auth, roles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'Not found' });

    let storeRating = null;
    if (user.role === 'owner' && user.storeId) {
      const agg = await Rating.aggregate([
        { $match: { storeId: user.storeId } },
        { $group: { _id: '$storeId', avg: { $avg: '$value' }, count: { $sum: 1 } } }
      ]);
      storeRating = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    }

    res.json({ user, storeRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete user (admin)
router.delete('/users/:id', auth, roles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await user.deleteOne();
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/:id', auth, roles(['admin']), async (req, res) => {
  try {
    const { name, email, address, role, storeId } = req.body;
    const updateData = { name, email, address, role, storeId };
    // Remove undefined fields
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
    
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, roles(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
