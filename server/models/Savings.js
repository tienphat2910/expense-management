const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: false,
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  icon: {
    type: String,
    default: 'PiggyBank'
  },
  color: {
    type: String,
    default: '#3b82f6'
  }
}, {
  timestamps: true
});

// Index for efficient queries
savingsSchema.index({ userId: 1, status: 1 });
savingsSchema.index({ userId: 1, createdAt: -1 });

// Virtual for progress percentage
savingsSchema.virtual('progress').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Ensure virtuals are included in JSON
savingsSchema.set('toJSON', { virtuals: true });
savingsSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Savings', savingsSchema);
