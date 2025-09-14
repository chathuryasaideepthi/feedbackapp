const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true });

ratingSchema.index({ storeId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);
