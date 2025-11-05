const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly', 'one-time', 'lifetime'],
    default: 'monthly'
  },
  features: [{
    name: String,
    description: String,
    included: { type: Boolean, default: true },
    limit: Number,
    unit: String
  }],
  discounts: [{
    type: { type: String, enum: ['percentage', 'fixed', 'trial'] },
    value: Number,
    duration: Number, // days
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false }
  }],
  paymentGateways: [{
    provider: { type: String, enum: ['stripe', 'paypal', 'square', 'custom'] },
    enabled: { type: Boolean, default: true },
    apiKey: String,
    secretKey: String,
    webhookUrl: String
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  limits: {
    users: Number,
    storage: Number,
    apiCalls: Number,
    bandwidth: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

pricingPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }
  next();
});

pricingPlanSchema.index({ isVisible: 1, isActive: 1 });
pricingPlanSchema.index({ slug: 1 });

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);

