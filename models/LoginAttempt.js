const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  success: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  failureReason: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
});

loginAttemptSchema.index({ email: 1, createdAt: -1 });
loginAttemptSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);

