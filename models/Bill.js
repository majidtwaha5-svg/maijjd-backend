const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: String,
  transactionId: String,
  notes: String,
  category: {
    type: String,
    enum: ['subscription', 'one-time', 'service', 'software', 'other'],
    default: 'subscription'
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
billSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if bill is overdue
billSchema.methods.isOverdue = function() {
  return this.status === 'pending' && new Date() > this.dueDate;
};

// Mark bill as paid
billSchema.methods.markAsPaid = function(paymentMethod, transactionId) {
  this.status = 'paid';
  this.paidDate = new Date();
  this.paymentMethod = paymentMethod;
  this.transactionId = transactionId;
  return this.save();
};

module.exports = mongoose.model('Bill', billSchema);
