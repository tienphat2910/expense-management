const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'], // Thu nhập hoặc Chi tiêu
    default: 'expense'
  },
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#3B82F6' // Mã màu hex
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false // Đánh dấu category mặc định của hệ thống
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Index để tăng tốc độ truy vấn
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, isActive: 1 });

// Virtual để đếm số giao dịch của category
categorySchema.virtual('transactionCount', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

module.exports = mongoose.model('Category', categorySchema);
