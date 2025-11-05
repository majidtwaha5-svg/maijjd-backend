const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Maijjd'
  },
  siteUrl: {
    type: String,
    default: 'https://maijjd.com'
  },
  navigation: {
    menuItems: [{
      label: String,
      link: String,
      icon: String,
      order: Number,
      isActive: { type: Boolean, default: true },
      children: [{
        label: String,
        link: String,
        order: Number
      }]
    }],
    mobileMenuItems: [{
      label: String,
      link: String,
      icon: String,
      order: Number,
      isActive: { type: Boolean, default: true }
    }]
  },
  footer: {
    links: [{
      category: String,
      links: [{
        label: String,
        link: String,
        order: Number
      }]
    }],
    socialLinks: [{
      platform: String,
      url: String,
      icon: String,
      isActive: { type: Boolean, default: true }
    }],
    copyright: String,
    legal: {
      privacyPolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true }
      },
      termsOfService: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true }
      },
      cookiePolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true }
      },
      refundPolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true },
        refundWindowDays: { type: Number, default: 30 },
        autoRefundEnabled: { type: Boolean, default: false }
      },
      dataRetentionPolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true },
        retentionPeriodDays: { type: Number, default: 365 },
        autoDeleteEnabled: { type: Boolean, default: false }
      },
      gdprCompliance: {
        enabled: { type: Boolean, default: true },
        dataProcessingBasis: String,
        rightToAccess: { type: Boolean, default: true },
        rightToErasure: { type: Boolean, default: true },
        rightToPortability: { type: Boolean, default: true },
        dataBreachNotification: { type: Boolean, default: true },
        dpoContact: String,
        lastUpdated: Date
      },
      acceptableUsePolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true }
      },
      shippingPolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true }
      },
      returnPolicy: {
        content: String,
        lastUpdated: Date,
        version: { type: String, default: '1.0' },
        isActive: { type: Boolean, default: true },
        returnWindowDays: { type: Number, default: 30 }
      }
    }
  },
  seo: {
    defaultTitle: String,
    defaultDescription: String,
    defaultKeywords: [String],
    defaultOgImage: String,
    robotsTxt: String,
    sitemapUrl: String,
    analytics: {
      googleAnalytics: String,
      googleTagManager: String,
      facebookPixel: String,
      customScripts: [String]
    }
  },
  multilingual: {
    enabled: { type: Boolean, default: false },
    defaultLanguage: { type: String, default: 'en' },
    supportedLanguages: [{
      code: String,
      name: String,
      isActive: { type: Boolean, default: true }
    }],
    translations: mongoose.Schema.Types.Mixed
  },
  userPermissions: {
    roles: [{
      name: String,
      permissions: [String],
      isActive: { type: Boolean, default: true }
    }],
    defaultPermissions: [String]
  },
  security: {
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      maxLength: { type: Number, default: 128 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: true },
      preventCommonPasswords: { type: Boolean, default: true },
      preventUserInfoInPassword: { type: Boolean, default: true },
      maxAgeDays: { type: Number, default: 90 },
      historyCount: { type: Number, default: 5 },
      lockoutAfterFailedAttempts: { type: Number, default: 5 },
      lockoutDurationMinutes: { type: Number, default: 30 }
    },
    sessionTimeout: { type: Number, default: 30 }, // minutes
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 }, // minutes
    ipWhitelist: [String],
    ipBlacklist: [String],
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      required: { type: Boolean, default: false },
      methods: [{ type: String, enum: ['email', 'sms', 'totp', 'app'] }]
    },
    accessControl: {
      requireEmailVerification: { type: Boolean, default: true },
      requirePhoneVerification: { type: Boolean, default: false },
      allowGuestAccess: { type: Boolean, default: false },
      maxConcurrentSessions: { type: Number, default: 5 }
    },
    encryption: {
      algorithm: { type: String, default: 'AES-256' },
      keyRotationDays: { type: Number, default: 30 },
      encryptAtRest: { type: Boolean, default: true },
      encryptInTransit: { type: Boolean, default: true }
    }
  },
  backups: {
    enabled: { type: Boolean, default: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    retentionDays: { type: Number, default: 30 },
    storageLocation: String,
    lastBackup: Date,
    backupHistory: [{
      date: Date,
      size: Number,
      location: String,
      status: String
    }]
  },
  revisionHistory: {
    enabled: { type: Boolean, default: true },
    retentionDays: { type: Number, default: 90 },
    maxRevisions: { type: Number, default: 100 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

globalSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure only one global settings document exists
globalSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({});
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);

