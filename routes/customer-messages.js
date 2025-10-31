const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory storage for customer messages (in production, use a database)
const customerMessages = [];
const upgradeRequests = [];
const supportRequests = [];

// Middleware to validate message data
const validateMessage = (req, res, next) => {
  const { type, message, packageId, userAgent, platform } = req.body;
  
  if (!type || !['upgrade_request', 'support_request', 'general_inquiry'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid message type. Must be upgrade_request, support_request, or general_inquiry' 
    });
  }
  
  if (type === 'upgrade_request' && !packageId) {
    return res.status(400).json({ error: 'Package ID is required for upgrade requests' });
  }
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long. Maximum 2000 characters.' });
  }
  
  next();
};

// Submit customer message during upgrade
router.post('/submit', validateMessage, async (req, res) => {
  try {
    const {
      type,
      message,
      packageId,
      userAgent,
      platform,
      email,
      phone,
      company,
      preferredContact
    } = req.body;

    const messageId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const messageData = {
      id: messageId,
      type,
      message: message.trim(),
      packageId,
      userAgent,
      platform,
      email,
      phone,
      company,
      preferredContact,
      timestamp,
      status: 'pending',
      priority: type === 'upgrade_request' ? 'high' : 'medium'
    };

    // Store message based on type
    switch (type) {
      case 'upgrade_request':
        upgradeRequests.push(messageData);
        break;
      case 'support_request':
        supportRequests.push(messageData);
        break;
      default:
        customerMessages.push(messageData);
    }

    // Log the message for admin review
    console.log(`📧 New ${type}:`, {
      id: messageId,
      packageId,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      timestamp
    });

    // Send notification to admin (in production, use email/SMS service)
    await sendAdminNotification(messageData);

    res.status(201).json({
      success: true,
      messageId,
      message: `${type.replace('_', ' ')} submitted successfully`,
      estimatedResponseTime: getEstimatedResponseTime(type)
    });

  } catch (error) {
    console.error('Error submitting customer message:', error);
    res.status(500).json({ 
      error: 'Failed to submit message. Please try again.' 
    });
  }
});

// Get customer messages (admin only)
router.get('/admin/messages', async (req, res) => {
  try {
    // In production, add authentication middleware here
    const { type, status, limit = 50, offset = 0 } = req.query;
    
    let messages = [];
    
    switch (type) {
      case 'upgrade_requests':
        messages = upgradeRequests;
        break;
      case 'support_requests':
        messages = supportRequests;
        break;
      case 'all':
        messages = [...upgradeRequests, ...supportRequests, ...customerMessages];
        break;
      default:
        messages = [...upgradeRequests, ...supportRequests, ...customerMessages];
    }

    // Filter by status if provided
    if (status) {
      messages = messages.filter(msg => msg.status === status);
    }

    // Sort by timestamp (newest first)
    messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedMessages = messages.slice(offset, offset + parseInt(limit));

    res.json({
      messages: paginatedMessages,
      total: messages.length,
      hasMore: offset + parseInt(limit) < messages.length
    });

  } catch (error) {
    console.error('Error fetching customer messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Update message status (admin only)
router.patch('/admin/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, adminResponse, assignedTo } = req.body;

    // Find message in all collections
    let message = upgradeRequests.find(m => m.id === messageId) ||
                  supportRequests.find(m => m.id === messageId) ||
                  customerMessages.find(m => m.id === messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Update message
    message.status = status || message.status;
    message.adminResponse = adminResponse || message.adminResponse;
    message.assignedTo = assignedTo || message.assignedTo;
    message.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Message status updated successfully',
      updatedMessage: message
    });

  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Get message statistics (admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allMessages = [...upgradeRequests, ...supportRequests, ...customerMessages];

    const stats = {
      total: allMessages.length,
      last24h: allMessages.filter(m => new Date(m.timestamp) > last24h).length,
      last7d: allMessages.filter(m => new Date(m.timestamp) > last7d).length,
      byType: {
        upgrade_requests: upgradeRequests.length,
        support_requests: supportRequests.length,
        general_inquiries: customerMessages.length
      },
      byStatus: {
        pending: allMessages.filter(m => m.status === 'pending').length,
        in_progress: allMessages.filter(m => m.status === 'in_progress').length,
        resolved: allMessages.filter(m => m.status === 'resolved').length,
        closed: allMessages.filter(m => m.status === 'closed').length
      },
      byPriority: {
        high: allMessages.filter(m => m.priority === 'high').length,
        medium: allMessages.filter(m => m.priority === 'medium').length,
        low: allMessages.filter(m => m.priority === 'low').length
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching message statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Helper function to send admin notification
async function sendAdminNotification(messageData) {
  try {
    // In production, implement email/SMS notification here
    const notification = {
      to: 'admin@maijjd.com',
      subject: `New ${messageData.type.replace('_', ' ')} from customer`,
      body: `
        New customer message received:
        
        Type: ${messageData.type}
        Package: ${messageData.packageId || 'N/A'}
        Message: ${messageData.message}
        Platform: ${messageData.platform}
        Timestamp: ${messageData.timestamp}
        
        View at: https://maijjd.com/admin/messages
      `
    };

    console.log('📧 Admin notification:', notification);
    
    // Example: Send email using your preferred service
    // await emailService.send(notification);
    
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

// Helper function to get estimated response time
function getEstimatedResponseTime(type) {
  switch (type) {
    case 'upgrade_request':
      return '2-4 hours';
    case 'support_request':
      return '24 hours';
    default:
      return '48 hours';
  }
}

module.exports = router;
