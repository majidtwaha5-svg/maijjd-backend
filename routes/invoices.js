const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all invoices for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('billing');
    
    // Mock invoices - In production, fetch from Stripe
    const mockInvoices = [
      { 
        id: 'INV-001', 
        date: '2025-01-15', 
        dueDate: '2025-01-15', 
        amount: 299.00, 
        status: 'Paid', 
        items: ['Premium Plan Subscription', 'Advanced Tools Access', 'Priority Support'],
        stripeInvoiceId: null
      },
      { 
        id: 'INV-002', 
        date: '2024-12-15', 
        dueDate: '2024-12-15', 
        amount: 299.00, 
        status: 'Paid', 
        items: ['Premium Plan Subscription', 'Advanced Tools Access', 'Priority Support'],
        stripeInvoiceId: null
      },
      { 
        id: 'INV-003', 
        date: '2024-11-15', 
        dueDate: '2024-11-15', 
        amount: 299.00, 
        status: 'Paid', 
        items: ['Premium Plan Subscription', 'Advanced Tools Access', 'Priority Support'],
        stripeInvoiceId: null
      },
    ];

    res.json({
      success: true,
      data: mockInvoices
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download invoice PDF
router.get('/:invoiceId/download', auth, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Check if it's a Stripe invoice ID
    if (invoiceId.startsWith('in_')) {
      // Redirect to Stripe invoice PDF
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      if (stripe) {
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          if (invoice.invoice_pdf) {
            return res.redirect(invoice.invoice_pdf);
          }
        } catch (stripeError) {
          console.error('Stripe invoice error:', stripeError);
        }
      }
    }
    
    // For mock invoices or when Stripe is not configured
    // Generate a simple PDF response (or return error)
    res.status(404).json({
      success: false,
      message: 'Invoice PDF not available. Please contact support for invoice PDF.'
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to download invoice PDF. Please contact support.' 
    });
  }
});

module.exports = router;

