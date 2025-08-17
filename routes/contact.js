const express = require('express');
// const { validateContact } = require('../middleware/validation');
const router = express.Router();

// Contact form submission
router.post('/', async (req, res) => {
  try {

    const { name, email, company, phone, message, service } = req.body;

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Log the contact request

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response
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

    res.status(201).json({
      message: 'Contact request submitted successfully',
      data: contactRequest
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

module.exports = router;
