const mongoose = require('mongoose');

const savingsTransactionSchema = new mongoose.Schema({
  savingsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Savings',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
savingsTransactionSchema.index({ savingsId: 1, createdAt: -1 });
savingsTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavingsTransaction', savingsTransactionSchema);
