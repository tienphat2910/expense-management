const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    currency: {
      type: String,
      default: 'VND',
      enum: ['VND', 'USD', 'EUR']
    },
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh'
    },
    language: {
      type: String,
      default: 'vi',
      enum: ['vi', 'en']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Tự động thêm createdAt và updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password; // Không trả về password khi convert sang JSON
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
