const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  pricingModel: {
    type: String,
    enum: ['fixed', 'hourly', 'monthly', 'yearly', 'custom'],
    default: 'hourly'
  },
  pricingDisplay: {
    type: String,
    default: ''
  },
  features: [{
    name: String,
    included: { type: Boolean, default: true }
  }],
  media: {
    images: [String],
    videos: [String],
    logo: String,
    icon: String
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
    slug: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [String],
  relatedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  relatedSoftware: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Software'
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.seo.slug && this.name) {
    this.seo.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }
  next();
});

serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ 'seo.slug': 1 });

module.exports = mongoose.model('Service', serviceSchema);

