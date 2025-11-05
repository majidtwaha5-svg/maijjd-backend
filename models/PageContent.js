const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  pageType: {
    type: String,
    required: true,
    enum: ['home', 'about', 'contact', 'login', 'signup', 'pricing'],
    unique: true
  },
  // Home Page Content
  hero: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    primaryButtonText: { type: String, default: '' },
    primaryButtonLink: { type: String, default: '' },
    secondaryButtonText: { type: String, default: '' },
    secondaryButtonLink: { type: String, default: '' },
    backgroundImage: { type: String, default: '' },
    videoUrl: { type: String, default: '' }
  },
  banners: [{
    title: String,
    description: String,
    image: String,
    link: String,
    position: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  featuredServices: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],
  featuredSoftware: [{
    softwareId: { type: mongoose.Schema.Types.ObjectId, ref: 'Software' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],
  testimonials: [{
    name: String,
    role: String,
    company: String,
    content: String,
    image: String,
    rating: { type: Number, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  // About Page Content
  companyHistory: {
    title: String,
    content: String,
    images: [String],
    videos: [String]
  },
  mission: {
    title: String,
    content: String,
    image: String
  },
  vision: {
    title: String,
    content: String,
    image: String
  },
  teamMembers: [{
    name: String,
    role: String,
    bio: String,
    image: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      email: String
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  // Contact Page Content
  companyInfo: {
    name: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phone: String,
    email: String,
    mapLink: String,
    mapEmbed: String
  },
  formFields: [{
    name: String,
    label: String,
    type: { type: String, enum: ['text', 'email', 'tel', 'textarea', 'select', 'checkbox'] },
    required: { type: Boolean, default: false },
    placeholder: String,
    options: [String],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }],
  recipientEmails: [{
    email: String,
    name: String,
    category: String,
    isActive: { type: Boolean, default: true }
  }],
  chatOptions: {
    enabled: { type: Boolean, default: true },
    provider: String,
    widgetId: String,
    apiKey: String
  },
  // Login/Signup Page Content
  loginSettings: {
    appearance: {
      logo: String,
      backgroundImage: String,
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1E40AF' }
    },
    twoFactorAuth: { type: Boolean, default: false },
    loginLimits: {
      enabled: { type: Boolean, default: false },
      maxAttempts: { type: Number, default: 5 },
      lockoutDuration: { type: Number, default: 30 } // minutes
    },
    socialLogins: [{
      provider: String,
      enabled: { type: Boolean, default: false },
      clientId: String,
      clientSecret: String
    }]
  },
  signupSettings: {
    registrationFields: [{
      name: String,
      label: String,
      type: String,
      required: { type: Boolean, default: false },
      order: Number
    }],
    emailVerification: { type: Boolean, default: true },
    defaultRole: { type: String, default: 'user' },
    defaultPlan: { type: String, default: 'free' },
    spamProtection: {
      captcha: { type: Boolean, default: false },
      captchaType: { type: String, enum: ['recaptcha', 'hcaptcha', 'turnstile'], default: 'recaptcha' },
      captchaKey: String,
      captchaSecret: String
    }
  },
  // Pricing Page Content
  pricingPlans: [{
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingPlan' },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],
  // SEO Settings
  seo: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String,
    canonicalUrl: String,
    metaTags: [{
      name: String,
      content: String
    }]
  },
  // Section Visibility
  sections: {
    hero: { type: Boolean, default: true },
    banners: { type: Boolean, default: true },
    featuredServices: { type: Boolean, default: true },
    featuredSoftware: { type: Boolean, default: true },
    testimonials: { type: Boolean, default: true },
    companyHistory: { type: Boolean, default: true },
    mission: { type: Boolean, default: true },
    team: { type: Boolean, default: true },
    contactForm: { type: Boolean, default: true },
    map: { type: Boolean, default: true },
    chat: { type: Boolean, default: true }
  },
  // Metadata
  lastModified: {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  },
  revisionHistory: [{
    content: mongoose.Schema.Types.Mixed,
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: { type: Date, default: Date.now },
    reason: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

pageContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PageContent', pageContentSchema);

