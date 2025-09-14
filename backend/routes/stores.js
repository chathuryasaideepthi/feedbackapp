const express = require('express');
const Store = require('../models/Store');
const Rating = require('../models/Rating');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// ➤ Create new store (admin or owner)
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'owner'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ msg: 'Name and address are required' });
    }

    const store = new Store({
      name,
      address,
      ownerId: req.user.role === 'owner' ? req.user._id : undefined
    });

    await store.save();

    if (req.user.role === 'owner') {
      await User.findByIdAndUpdate(req.user._id, { storeId: store._id });
    }

    res.status(201).json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ➤ List stores (authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const { q, sortBy = 'name', order = 'asc', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { address: { $regex: q, $options: 'i' } }
    ];

    const stores = await Store.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(+limit);

    const storesWith = await Promise.all(stores.map(async s => {
      const agg = await Rating.aggregate([
        { $match: { storeId: s._id } },
        { $group: { _id: '$storeId', avg: { $avg: '$value' }, count: { $sum: 1 } } }
      ]);
      const avg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;

      const userRatingDoc = await Rating.findOne({ storeId: s._id, userId: req.user._id });
      const userRating = userRatingDoc ? userRatingDoc.value : null;

      return { ...s.toObject(), avgRating: avg, userRating };
    }));

    res.json(storesWith);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ➤ Get single store
router.get('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    const agg = await Rating.aggregate([
      { $match: { storeId: store._id } },
      { $group: { _id: '$storeId', avg: { $avg: '$value' }, count: { $sum: 1 } } }
    ]);
    const avg = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;

    res.json({ ...store.toObject(), avgRating: avg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ➤ Update store (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { name, address, ownerId } = req.body;
    const updatedData = {};
    if (name) updatedData.name = name;
    if (address) updatedData.address = address;
    if (ownerId) updatedData.ownerId = ownerId;

    const store = await Store.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Update owner's storeId if ownerId changed
    if (ownerId) {
      await User.findByIdAndUpdate(ownerId, { storeId: store._id });
    }

    res.json(store);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ➤ Delete store (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ msg: 'Store not found' });

    // Unlink owner before deletion
    if (store.ownerId) {
      await User.findByIdAndUpdate(store.ownerId, { storeId: null });
    }

    await store.deleteOne();
    res.json({ msg: 'Store deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
