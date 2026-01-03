const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'bank', 'ewallet', 'credit-card', 'investment', 'other'],
    default: 'cash',
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'VND',
  },
  description: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
  },
  color: {
    type: String,
    default: '#3b82f6',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster queries
walletSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
