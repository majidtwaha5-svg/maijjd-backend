const mongoose = require('mongoose');

const softwareSchema = new mongoose.Schema({
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
  version: {
    type: String,
    default: '1.0.0'
  },
  latestVersion: {
    type: String,
    default: '1.0.0'
  },
  logo: {
    type: String,
    default: ''
  },
  media: {
    images: [String],
    videos: [String],
    screenshots: [String],
    demoUrl: String
  },
  pricing: {
    model: { type: String, enum: ['free', 'one-time', 'subscription', 'freemium', 'custom'], default: 'free' },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    pricingTiers: [{
      name: String,
      price: Number,
      features: [String]
    }]
  },
  integrations: [{
    name: String,
    type: String,
    description: String,
    apiKey: String,
    isActive: { type: Boolean, default: true }
  }],
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
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
  downloadCount: {
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

softwareSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.seo.slug && this.name) {
    this.seo.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }
  // Calculate average rating
  if (this.reviews && this.reviews.length > 0) {
    const activeReviews = this.reviews.filter(r => r.isActive);
    if (activeReviews.length > 0) {
      this.averageRating = activeReviews.reduce((sum, r) => sum + r.rating, 0) / activeReviews.length;
      this.reviewCount = activeReviews.length;
    }
  }
  next();
});

softwareSchema.index({ category: 1, isActive: 1 });
softwareSchema.index({ 'seo.slug': 1 });

module.exports = mongoose.model('Software', softwareSchema);

