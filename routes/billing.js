const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get billing settings
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('billingSettings');
    
    const defaultSettings = {
      emailNotifications: true,
      autoRenewal: true,
      invoiceDelivery: 'email',
      currency: 'USD',
      taxRate: 0.0825,
      taxExempt: false,
      taxId: '',
      billingAddress: {
        company: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA'
      }
    };

    const settings = user?.billingSettings || defaultSettings;

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting billing settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update billing settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { emailNotifications, autoRenewal, taxInformation, billingAddress } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize billingSettings if it doesn't exist
    if (!user.billingSettings) {
      user.billingSettings = {};
    }

    // Update settings
    if (emailNotifications !== undefined) {
      user.billingSettings.emailNotifications = emailNotifications;
    }
    
    if (autoRenewal !== undefined) {
      user.billingSettings.autoRenewal = autoRenewal;
    }

    if (taxInformation) {
      user.billingSettings.taxRate = taxInformation.taxRate || user.billingSettings.taxRate || 0.0825;
      user.billingSettings.taxExempt = taxInformation.taxExempt || false;
      user.billingSettings.taxId = taxInformation.taxId || '';
    }

    if (billingAddress) {
      if (!user.billingSettings.billingAddress) {
        user.billingSettings.billingAddress = {};
      }
      user.billingSettings.billingAddress = {
        company: billingAddress.company || user.billingSettings.billingAddress?.company || '',
        address: billingAddress.address || user.billingSettings.billingAddress?.address || '',
        city: billingAddress.city || user.billingSettings.billingAddress?.city || '',
        state: billingAddress.state || user.billingSettings.billingAddress?.state || '',
        zip: billingAddress.zip || user.billingSettings.billingAddress?.zip || '',
        country: billingAddress.country || user.billingSettings.billingAddress?.country || 'USA'
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Billing settings updated successfully',
      data: user.billingSettings
    });
  } catch (error) {
    console.error('Error updating billing settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

