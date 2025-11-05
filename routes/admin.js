const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const emailService = require('../services/emailService');

// Admin Dashboard - Get system statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalInvoices = await Invoice.countDocuments();
    const totalRevenue = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingBills = await Bill.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingBills,
        systemHealth: 'healthy'
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new user
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { name, email, role, subscription, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Generate password if not provided
    const userPassword = password || generateSecurePassword();
    
    const user = new User({
      name,
      email,
      password: userPassword,
      role: role || 'user',
      subscription: subscription || 'free',
      status: 'active',
      emailVerified: true
    });

    await user.save();

    res.json({ 
      success: true, 
      message: 'User created successfully',
      data: user.toJSON(),
      password: userPassword // Only return in admin context
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove password from update if present (use separate endpoint for password reset)
    delete updateData.password;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user by ID
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset user password
router.post('/users/:userId/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate secure password if not provided
    const password = newPassword || generateSecurePassword();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    // Send email notification
    try {
      await emailService.sendPasswordResetEmail(user.email, password);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      newPassword: password // Only return in development
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user status
router.patch('/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user status (alternative PUT endpoint)
router.put('/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send email to user
router.post('/users/:userId/send-email', adminAuth, async (req, res) => {
  try {
    const { emailType, customMessage } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let emailSent = false;
    
    switch (emailType) {
      case 'welcome':
        emailSent = await emailService.sendWelcomeEmail(user.email, user.name);
        break;
      case 'password-reset':
        emailSent = await emailService.sendPasswordResetEmail(user.email);
        break;
      case 'invoice':
        emailSent = await emailService.sendInvoiceEmail(user.email, user.name);
        break;
      default:
        if (customMessage) {
          emailSent = await emailService.sendCustomEmail(user.email, customMessage);
        }
    }

    if (emailSent) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all invoices
router.get('/invoices', adminAuth, async (req, res) => {
  try {
    const invoices = await Invoice.find({}).populate('customerId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create invoice
router.post('/invoices', adminAuth, async (req, res) => {
  try {
    const { customerId, items, amount, dueDate } = req.body;
    
    const invoice = new Invoice({
      customerId,
      invoiceNumber: generateInvoiceNumber(),
      items,
      amount: amount || 0, // Admin gets everything for free
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'pending'
    });

    await invoice.save();

    res.json({ 
      success: true, 
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send invoice
router.post('/invoices/:invoiceId/send', adminAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId).populate('customerId', 'name email');
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const emailSent = await emailService.sendInvoiceEmail(
      invoice.customerId.email,
      invoice.customerId.name,
      invoice
    );

    if (emailSent) {
      invoice.status = 'sent';
      await invoice.save();
      res.json({ success: true, message: 'Invoice sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send invoice' });
    }
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Generate receipt
router.post('/invoices/:invoiceId/receipt', adminAuth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId).populate('customerId', 'name email');
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Generate receipt (in a real app, this would create a PDF)
    const receipt = {
      receiptNumber: `REC-${Date.now()}`,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerId.name,
      amount: invoice.amount,
      date: new Date(),
      items: invoice.items
    };

    res.json({ 
      success: true, 
      message: 'Receipt generated successfully',
      receipt,
      receiptUrl: `/receipts/${receipt.receiptNumber}.pdf` // Mock URL
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all bills
router.get('/bills', adminAuth, async (req, res) => {
  try {
    const bills = await Bill.find({}).populate('customerId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error getting bills:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user bills
router.get('/users/:userId/bills', adminAuth, async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error getting user bills:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manage billing
router.post('/users/:userId/billing', adminAuth, async (req, res) => {
  try {
    const { action, amount, description } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    switch (action) {
      case 'mark-paid':
        // Mark bills as paid
        await Bill.updateMany(
          { customerId: req.params.userId, status: 'pending' },
          { status: 'paid', paidAt: new Date() }
        );
        break;
      
      case 'create-bill':
        const bill = new Bill({
          customerId: req.params.userId,
          billNumber: generateBillNumber(),
          amount: amount || 0, // Admin gets everything for free
          description: description || 'Monthly subscription',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
        await bill.save();
        break;
      
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({ success: true, message: `Billing ${action} completed successfully` });
  } catch (error) {
    console.error('Error managing billing:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Utility functions
function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateInvoiceNumber() {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

function generateBillNumber() {
  return `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

module.exports = router;
