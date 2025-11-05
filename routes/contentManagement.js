const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const PageContent = require('../models/PageContent');
const Service = require('../models/Service');
const Software = require('../models/Software');
const PricingPlan = require('../models/PricingPlan');
const GlobalSettings = require('../models/GlobalSettings');
const ContactSubmission = require('../models/ContactSubmission');
const LoginAttempt = require('../models/LoginAttempt');

// ==================== PAGE CONTENT MANAGEMENT ====================

// Get page content
router.get('/pages/:pageType', adminAuth, async (req, res) => {
  try {
    const { pageType } = req.params;
    let content = await PageContent.findOne({ pageType });
    
    if (!content) {
      // Create default content
      content = new PageContent({ pageType });
      await content.save();
    }
    
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error getting page content:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update page content
router.put('/pages/:pageType', adminAuth, async (req, res) => {
  try {
    const { pageType } = req.params;
    const updateData = req.body;
    
    // Save to revision history
    const existing = await PageContent.findOne({ pageType });
    if (existing) {
      if (!existing.revisionHistory) existing.revisionHistory = [];
      existing.revisionHistory.push({
        content: existing.toObject(),
        modifiedBy: req.user.userId,
        modifiedAt: new Date(),
        reason: updateData.reason || 'Content update'
      });
      // Keep only last 100 revisions
      if (existing.revisionHistory.length > 100) {
        existing.revisionHistory = existing.revisionHistory.slice(-100);
      }
    }
    
    const content = await PageContent.findOneAndUpdate(
      { pageType },
      {
        ...updateData,
        lastModified: {
          by: req.user.userId,
          at: new Date()
        },
        $push: existing ? { revisionHistory: existing.revisionHistory[existing.revisionHistory.length - 1] } : {}
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: content, message: 'Page content updated successfully' });
  } catch (error) {
    console.error('Error updating page content:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get page content revisions
router.get('/pages/:pageType/revisions', adminAuth, async (req, res) => {
  try {
    const { pageType } = req.params;
    const content = await PageContent.findOne({ pageType }).populate('revisionHistory.modifiedBy', 'name email');
    
    if (!content) {
      return res.json({ success: true, data: [] });
    }
    
    res.json({ success: true, data: content.revisionHistory || [] });
  } catch (error) {
    console.error('Error getting revisions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== SERVICE MANAGEMENT (26 Categories) ====================

// Get all services
router.get('/services', adminAuth, async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    const services = await Service.find(query).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get service by ID
router.get('/services/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create service
router.post('/services', adminAuth, async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const service = new Service(serviceData);
    await service.save();
    res.json({ success: true, data: service, message: 'Service created successfully' });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update service
router.put('/services/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.userId },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    
    res.json({ success: true, data: service, message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete service
router.delete('/services/:id', adminAuth, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk operations for services
router.post('/services/bulk', adminAuth, async (req, res) => {
  try {
    const { action, ids, data } = req.body;
    
    switch (action) {
      case 'delete':
        await Service.deleteMany({ _id: { $in: ids } });
        res.json({ success: true, message: 'Services deleted successfully' });
        break;
      case 'update':
        await Service.updateMany(
          { _id: { $in: ids } },
          { $set: { ...data, updatedBy: req.user.userId } }
        );
        res.json({ success: true, message: 'Services updated successfully' });
        break;
      case 'import':
        // Bulk import from JSON/CSV
        const services = data.map(s => ({ ...s, createdBy: req.user.userId, updatedBy: req.user.userId }));
        await Service.insertMany(services);
        res.json({ success: true, message: 'Services imported successfully' });
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export services
router.get('/services/export', adminAuth, async (req, res) => {
  try {
    const services = await Service.find({}).select('-createdBy -updatedBy');
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Error exporting services:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== SOFTWARE MANAGEMENT (50 Categories) ====================

// Get all software
router.get('/software', adminAuth, async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    const software = await Software.find(query).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: software });
  } catch (error) {
    console.error('Error getting software:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get software by ID
router.get('/software/:id', adminAuth, async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    if (!software) {
      return res.status(404).json({ success: false, message: 'Software not found' });
    }
    res.json({ success: true, data: software });
  } catch (error) {
    console.error('Error getting software:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create software
router.post('/software', adminAuth, async (req, res) => {
  try {
    const softwareData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const software = new Software(softwareData);
    await software.save();
    res.json({ success: true, data: software, message: 'Software created successfully' });
  } catch (error) {
    console.error('Error creating software:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update software
router.put('/software/:id', adminAuth, async (req, res) => {
  try {
    const software = await Software.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.userId },
      { new: true }
    );
    
    if (!software) {
      return res.status(404).json({ success: false, message: 'Software not found' });
    }
    
    res.json({ success: true, data: software, message: 'Software updated successfully' });
  } catch (error) {
    console.error('Error updating software:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete software
router.delete('/software/:id', adminAuth, async (req, res) => {
  try {
    const software = await Software.findByIdAndDelete(req.params.id);
    if (!software) {
      return res.status(404).json({ success: false, message: 'Software not found' });
    }
    res.json({ success: true, message: 'Software deleted successfully' });
  } catch (error) {
    console.error('Error deleting software:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manage software reviews
router.get('/software/:id/reviews', adminAuth, async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    if (!software) {
      return res.status(404).json({ success: false, message: 'Software not found' });
    }
    res.json({ success: true, data: software.reviews || [] });
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/software/:id/reviews/:reviewId', adminAuth, async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    if (!software) {
      return res.status(404).json({ success: false, message: 'Software not found' });
    }
    
    const review = software.reviews.id(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    Object.assign(review, req.body);
    await software.save();
    
    res.json({ success: true, data: review, message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/software/:id/reviews/:reviewId', adminAuth, async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    if (!software) {
      return res.status(404).json({ success: false, message: 'Software not found' });
    }
    
    software.reviews.id(req.params.reviewId).remove();
    await software.save();
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk operations for software
router.post('/software/bulk', adminAuth, async (req, res) => {
  try {
    const { action, ids, data } = req.body;
    
    switch (action) {
      case 'delete':
        await Software.deleteMany({ _id: { $in: ids } });
        res.json({ success: true, message: 'Software deleted successfully' });
        break;
      case 'update':
        await Software.updateMany(
          { _id: { $in: ids } },
          { $set: { ...data, updatedBy: req.user.userId } }
        );
        res.json({ success: true, message: 'Software updated successfully' });
        break;
      case 'import':
        const software = data.map(s => ({ ...s, createdBy: req.user.userId, updatedBy: req.user.userId }));
        await Software.insertMany(software);
        res.json({ success: true, message: 'Software imported successfully' });
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export software
router.get('/software/export', adminAuth, async (req, res) => {
  try {
    const software = await Software.find({}).select('-createdBy -updatedBy -reviews');
    res.json({ success: true, data: software });
  } catch (error) {
    console.error('Error exporting software:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== PRICING PLAN MANAGEMENT ====================

// Get all pricing plans
router.get('/pricing', adminAuth, async (req, res) => {
  try {
    const plans = await PricingPlan.find({}).sort({ order: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error getting pricing plans:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pricing plan by ID
router.get('/pricing/:id', adminAuth, async (req, res) => {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Pricing plan not found' });
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Error getting pricing plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create pricing plan
router.post('/pricing', adminAuth, async (req, res) => {
  try {
    const planData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const plan = new PricingPlan(planData);
    await plan.save();
    res.json({ success: true, data: plan, message: 'Pricing plan created successfully' });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update pricing plan
router.put('/pricing/:id', adminAuth, async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.userId },
      { new: true }
    );
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Pricing plan not found' });
    }
    
    res.json({ success: true, data: plan, message: 'Pricing plan updated successfully' });
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete pricing plan
router.delete('/pricing/:id', adminAuth, async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Pricing plan not found' });
    }
    res.json({ success: true, message: 'Pricing plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== GLOBAL SETTINGS ====================

// Get global settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error getting global settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update global settings
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    Object.assign(settings, req.body, { updatedBy: req.user.userId });
    await settings.save();
    res.json({ success: true, data: settings, message: 'Global settings updated successfully' });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== CONTACT SUBMISSIONS ====================

// Get contact submissions
router.get('/contact/submissions', adminAuth, async (req, res) => {
  try {
    const submissions = await ContactSubmission.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error getting contact submissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== LOGIN ATTEMPTS ====================

// Get login attempts
router.get('/login/attempts', adminAuth, async (req, res) => {
  try {
    const attempts = await LoginAttempt.find({}).sort({ createdAt: -1 }).limit(1000);
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Error getting login attempts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== POLICY MANAGEMENT ====================

// Get all policies
router.get('/policies', adminAuth, async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    res.json({ 
      success: true, 
      data: {
        legal: settings.legal || {},
        security: settings.security || {}
      }
    });
  } catch (error) {
    console.error('Error getting policies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get specific policy
router.get('/policies/:policyType', adminAuth, async (req, res) => {
  try {
    const { policyType } = req.params;
    const settings = await GlobalSettings.getSettings();
    
    let policy = null;
    if (settings.legal && settings.legal[policyType]) {
      policy = settings.legal[policyType];
    } else if (settings.security && settings.security[policyType]) {
      policy = settings.security[policyType];
    }
    
    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }
    
    res.json({ success: true, data: policy });
  } catch (error) {
    console.error('Error getting policy:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update legal policy (Privacy, Terms, Cookie, Refund, etc.)
router.put('/policies/legal/:policyType', adminAuth, async (req, res) => {
  try {
    const { policyType } = req.params;
    const settings = await GlobalSettings.getSettings();
    
    const validPolicies = ['privacyPolicy', 'termsOfService', 'cookiePolicy', 'refundPolicy', 
                          'dataRetentionPolicy', 'acceptableUsePolicy', 'shippingPolicy', 'returnPolicy'];
    
    if (!validPolicies.includes(policyType)) {
      return res.status(400).json({ success: false, message: 'Invalid policy type' });
    }
    
    if (!settings.legal) settings.legal = {};
    if (!settings.legal[policyType]) {
      settings.legal[policyType] = {
        content: '',
        version: '1.0',
        isActive: true,
        lastUpdated: new Date()
      };
    }
    
    // Update policy
    const policy = settings.legal[policyType];
    const updateData = req.body;
    
    // Increment version if content changed
    if (updateData.content && updateData.content !== policy.content) {
      const versionParts = policy.version.split('.');
      versionParts[1] = (parseInt(versionParts[1]) + 1).toString();
      policy.version = versionParts.join('.');
    }
    
    Object.assign(policy, updateData, {
      lastUpdated: new Date(),
      updatedBy: req.user.userId
    });
    
    settings.updatedBy = req.user.userId;
    await settings.save();
    
    res.json({ success: true, data: policy, message: `${policyType} updated successfully` });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update GDPR compliance settings
router.put('/policies/gdpr', adminAuth, async (req, res) => {
  try {
    const settings = await GlobalSettings.getSettings();
    
    if (!settings.legal) settings.legal = {};
    if (!settings.legal.gdprCompliance) {
      settings.legal.gdprCompliance = {
        enabled: true,
        rightToAccess: true,
        rightToErasure: true,
        rightToPortability: true,
        dataBreachNotification: true,
        lastUpdated: new Date()
      };
    }
    
    Object.assign(settings.legal.gdprCompliance, req.body, {
      lastUpdated: new Date()
    });
    
    settings.updatedBy = req.user.userId;
    await settings.save();
    
    res.json({ success: true, data: settings.legal.gdprCompliance, message: 'GDPR settings updated successfully' });
  } catch (error) {
    console.error('Error updating GDPR settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update security policies
router.put('/policies/security/:policyType', adminAuth, async (req, res) => {
  try {
    const { policyType } = req.params;
    const settings = await GlobalSettings.getSettings();
    
    const validPolicies = ['passwordPolicy', 'accessControl', 'encryption', 'twoFactorAuth'];
    
    if (!validPolicies.includes(policyType)) {
      return res.status(400).json({ success: false, message: 'Invalid security policy type' });
    }
    
    if (!settings.security) settings.security = {};
    if (!settings.security[policyType]) {
      settings.security[policyType] = {};
    }
    
    Object.assign(settings.security[policyType], req.body);
    settings.updatedBy = req.user.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      data: settings.security[policyType], 
      message: `${policyType} updated successfully` 
    });
  } catch (error) {
    console.error('Error updating security policy:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== MEDIA UPLOAD ====================

// Upload media (placeholder - implement with multer or cloud storage)
router.post('/media/upload', adminAuth, async (req, res) => {
  try {
    // TODO: Implement actual file upload with multer/cloud storage
    // For now, return a placeholder
    res.json({ 
      success: true, 
      data: { 
        url: req.body.url || 'https://via.placeholder.com/300',
        type: req.body.type || 'image'
      },
      message: 'Media uploaded successfully (placeholder)' 
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

