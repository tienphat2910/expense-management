const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['savings_invite', 'transaction', 'budget_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    savingsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Savings'
    },
    inviteToken: String,
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  inviteStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
