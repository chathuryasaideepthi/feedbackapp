const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 3, maxlength: 60 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, maxlength: 400 },
  role: { type: String, enum: ['admin', 'user', 'owner'], default: 'user' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' } // for owner
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
