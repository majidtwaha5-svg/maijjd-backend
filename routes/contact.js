const express = require('express');
const { validateContact } = require('../middleware/validation');
const EmailService = require('../services/emailService');
const router = express.Router();

// Initialize email service
const emailService = new EmailService();

// Contact form submission
router.post('/', validateContact, async (req, res) => {
  try {
    const { name, email, company, phone, message, service } = req.validatedData || req.body;

    // Create contact request object
    const contactRequest = {
      id: Date.now(),
      name,
      email,
      company: company || null,
      phone: phone || null,
      message,
      service: service || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Send emails to customer and team
    let emailResults = null;
    try {
      emailResults = await emailService.sendContactEmails(contactRequest);
      console.log('📧 Email results:', emailResults);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      // Continue with the request even if emails fail
    }

    // Here you would typically save to database
    // For now, we'll log it
    console.log('📝 New contact request received:', contactRequest);

    // Return success response with email status
    res.status(201).json({
      message: 'Contact request submitted successfully',
      data: contactRequest,
      emails: {
        customerConfirmation: emailResults?.customerEmailSent || false,
        teamNotification: emailResults?.teamEmailSent || false,
        customerError: emailResults?.customerError || null,
        teamError: emailResults?.teamError || null
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      error: 'Failed to submit contact request',
      message: 'Please try again later'
    });
  }
});

// Get all contact requests (admin only)
router.get('/', async (req, res) => {
  try {
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}"`
    });

    // Here you would typically check for admin authentication
    // For now, we'll return mock data
    
    const mockContacts = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Tech Corp',
        phone: '+1 (872) 312-2293',
        message: 'Interested in your CRM software solution.',
        service: 'crm-software',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00.000Z'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        company: 'Startup Inc',
        phone: '+1 (872) 312-2293',
        message: 'Looking for custom development services.',
        service: 'custom-development',
        status: 'contacted',
        createdAt: '2024-01-14T14:20:00.000Z'
      }
    ];

    res.json({
      message: 'Contact requests retrieved successfully',
      data: mockContacts
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      error: 'Failed to retrieve contact requests',
      message: 'Please try again later'
    });
  }
});

// Get contact request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Here you would typically fetch from database
    // For now, return mock data
    const mockContact = {
      id: parseInt(id),
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Tech Corp',
      phone: '+1 (872) 312-2293',
      message: 'Interested in your CRM software solution.',
      service: 'crm-software',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00.000Z'
    };

    res.json({
      message: 'Contact request retrieved successfully',
      data: mockContact
    });

  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      error: 'Failed to retrieve contact request',
      message: 'Please try again later'
    });
  }
});

// Update contact request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'contacted', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, contacted, completed, cancelled'
      });
    }

    // Here you would typically update in database
    // For now, return mock response
    const updatedContact = {
      id: parseInt(id),
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Tech Corp',
      phone: '+1 (872) 312-2293',
      message: 'Interested in your CRM software solution.',
      service: 'custom-development',
      status,
      updatedAt: new Date().toISOString()
    };

    res.json({
      message: 'Contact request status updated successfully',
      data: updatedContact
    });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      error: 'Failed to update contact request status',
      message: 'Please try again later'
    });
  }
});

// Test email service endpoint
router.post('/test-email', async (req, res) => {
  try {
    // Test email service connection
    const connectionTest = await emailService.testConnection();
    
    if (!connectionTest) {
      return res.status(500).json({
        error: 'Email service connection failed',
        message: 'Please check your SMTP configuration'
      });
    }

    // Send test email
    const testData = {
      name: 'Test User',
      email: req.body.testEmail || 'test@example.com',
      company: 'Test Company',
      message: 'This is a test message to verify email functionality.',
      service: 'test-service'
    };

    const emailResults = await emailService.sendContactEmails(testData);

    res.json({
      message: 'Email service test completed',
      connection: 'successful',
      emails: emailResults
    });

  } catch (error) {
    console.error('Email service test error:', error);
    res.status(500).json({
      error: 'Email service test failed',
      message: error.message
    });
  }
});

module.exports = router;
