const express = require('express');
const { body, validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const Store = require('../models/Store');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Submit or update rating (upsert)
router.post('/', auth, [body('storeId').notEmpty(), body('value').isInt({ min: 1, max: 5 })], async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { storeId, value } = req.body;
  const store = await Store.findById(storeId);
  if (!store) return res.status(404).json({ msg: 'Store not found' });
  try {
    const rating = await Rating.findOneAndUpdate({ storeId, userId: req.user._id }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ rating });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// Owner or admin: get ratings for a store
router.get('/store/:storeId', auth, async (req, res) => {
  const { storeId } = req.params;
  const user = req.user;
  if (user.role === 'owner') {
    if (!user.storeId || user.storeId.toString() !== storeId) return res.status(403).json({ msg: 'Forbidden' });
  }
  const ratings = await Rating.find({ storeId }).populate('userId', 'name email address');
  const avgAgg = await Rating.aggregate([{ $match: { storeId: mongoose.Types.ObjectId(storeId) } }, { $group: { _id: '$storeId', avg: { $avg: '$value' }, count: { $sum: 1 } } }]);
  const avg = avgAgg[0] ? Math.round(avgAgg[0].avg*10)/10 : 0;
  res.json({ ratings, avgRating: avg });
});

module.exports = router;
