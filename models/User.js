const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  subscription: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  verificationCodes: {
    email: {
      code: String,
      expiresAt: Date
    },
    phone: {
      code: String,
      expiresAt: Date
    }
  },
  profile: {
    avatar: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    company: String,
    position: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  },
  billing: {
    customerId: String,
    subscriptionId: String,
    plan: String,
    status: { type: String, default: 'active' },
    nextBillingDate: Date
  },
  billingSettings: {
    emailNotifications: { type: Boolean, default: true },
    autoRenewal: { type: Boolean, default: true },
    invoiceDelivery: { type: String, default: 'email' },
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 0.0825 },
    taxExempt: { type: Boolean, default: false },
    taxId: { type: String, default: '' },
    billingAddress: {
      company: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'USA' }
    }
  },
  apiKeys: [{
    key: String,
    name: String,
    permissions: [String],
    createdAt: { type: Date, default: Date.now },
    lastUsed: Date
  }],
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
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationCodes;
  return user;
};

// Generate verification code
userSchema.methods.generateVerificationCode = function(type = 'email') {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  if (!this.verificationCodes) {
    this.verificationCodes = {};
  }
  
  this.verificationCodes[type] = {
    code,
    expiresAt
  };
  
  return { code, expiresAt };
};

// Verify code
userSchema.methods.verifyCode = function(code, type = 'email') {
  if (!this.verificationCodes || !this.verificationCodes[type]) {
    return false;
  }
  
  const stored = this.verificationCodes[type];
  if (stored.expiresAt < new Date()) {
    return false; // Expired
  }
  
  return stored.code === code;
};

// Mark as verified
userSchema.methods.markAsVerified = function(type = 'email') {
  if (type === 'email') {
    this.emailVerified = true;
  } else if (type === 'phone') {
    this.phoneVerified = true;
  }
  
  // Clear verification code
  if (this.verificationCodes && this.verificationCodes[type]) {
    delete this.verificationCodes[type];
  }
};

// Create default admin user if none exists
userSchema.statics.createDefaultAdmin = async function() {
  const adminExists = await this.findOne({ role: 'admin' });
  
  if (!adminExists) {
    const adminUser = new this({
      name: 'Admin User',
      email: 'admin@maijjd.com',
      password: 'MaijjdAdmin2024!',
      role: 'admin',
      status: 'active',
      subscription: 'enterprise',
      emailVerified: true
    });
    
    await adminUser.save();
    console.log('✅ Default admin user created');
  }
};

// Create test users for development
userSchema.statics.createTestUsers = async function() {
  const testUsers = [
    {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
      role: 'user',
      status: 'active',
      subscription: 'free'
    },
    {
      name: 'Premium User',
      email: 'premium@example.com',
      password: 'PremiumPassword123!',
      role: 'user',
      status: 'active',
      subscription: 'premium'
    }
  ];

  for (const userData of testUsers) {
    const existingUser = await this.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new this(userData);
      await user.save();
      console.log(`✅ Test user created: ${userData.email}`);
    }
  }
};

module.exports = mongoose.model('User', userSchema);