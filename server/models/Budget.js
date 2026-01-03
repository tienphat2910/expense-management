const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD', 'EUR']
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  alertThreshold: {
    type: Number,
    min: 0,
    max: 100,
    default: 80 // Cảnh báo khi đạt 80% ngân sách
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Index để tăng tốc độ truy vấn
budgetSchema.index({ userId: 1, year: 1, month: 1 });
budgetSchema.index({ userId: 1, categoryId: 1 });
budgetSchema.index({ userId: 1, isActive: 1 });

// Virtual để tính phần trăm đã chi tiêu
budgetSchema.virtual('percentageUsed').get(function() {
  if (this.amount === 0) return 0;
  return Math.round((this.spent / this.amount) * 100);
});

// Virtual để tính số tiền còn lại
budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - this.spent);
});

// Virtual để kiểm tra có vượt ngân sách không
budgetSchema.virtual('isOverBudget').get(function() {
  return this.spent > this.amount;
});

// Virtual để kiểm tra có đạt ngưỡng cảnh báo không
budgetSchema.virtual('isNearLimit').get(function() {
  return this.percentageUsed >= this.alertThreshold;
});

module.exports = mongoose.model('Budget', budgetSchema);
