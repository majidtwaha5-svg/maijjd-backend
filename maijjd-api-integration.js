/**
 * Maijjd API Integration System
 * Handles connections between MJND Agent and external services
 */

class MaijjdAPIIntegration {
  constructor() {
    this.baseURL = process.env.MAIJJD_API_URL || 'https://maijjd.com/api';
    this.agent = null;
    this.webhooks = new Map();
    this.apiKeys = new Map();
    this.rateLimits = new Map();
  }

  /**
   * Initialize the API integration system
   */
  async initialize() {
    try {
      // Load API keys from environment or config
      await this.loadAPIKeys();
      
      // Initialize rate limiting
      this.initializeRateLimiting();
      
      // Set up webhook endpoints
      await this.setupWebhooks();
      
      console.log('✅ Maijjd API Integration initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize API integration:', error);
      return false;
    }
  }

  /**
   * Load API keys from environment variables
   */
  async loadAPIKeys() {
    const keys = {
      okta: process.env.OKTA_API_KEY,
      stripe: process.env.STRIPE_API_KEY,
      twilio: process.env.TWILIO_API_KEY,
      sendgrid: process.env.SENDGRID_API_KEY,
      webhook: process.env.WEBHOOK_SECRET
    };

    for (const [service, key] of Object.entries(keys)) {
      if (key) {
        this.apiKeys.set(service, key);
        console.log(`✅ Loaded API key for ${service}`);
      }
    }
  }

  /**
   * Initialize rate limiting for API calls
   */
  initializeRateLimiting() {
    const limits = {
      okta: { requests: 1000, window: 3600000 }, // 1000 requests per hour
      stripe: { requests: 100, window: 60000 },   // 100 requests per minute
      twilio: { requests: 50, window: 60000 },    // 50 requests per minute
      sendgrid: { requests: 200, window: 60000 }  // 200 requests per minute
    };

    for (const [service, limit] of Object.entries(limits)) {
      this.rateLimits.set(service, {
        ...limit,
        requests: 0,
        resetTime: Date.now() + limit.window
      });
    }
  }

  /**
   * Set up webhook endpoints for external services
   */
  async setupWebhooks() {
    const webhooks = [
      {
        name: 'customer-message',
        endpoint: '/webhooks/customer-message',
        method: 'POST',
        handler: this.handleCustomerMessage.bind(this)
      },
      {
        name: 'payment-update',
        endpoint: '/webhooks/payment-update',
        method: 'POST',
        handler: this.handlePaymentUpdate.bind(this)
      },
      {
        name: 'user-registration',
        endpoint: '/webhooks/user-registration',
        method: 'POST',
        handler: this.handleUserRegistration.bind(this)
      }
    ];

    for (const webhook of webhooks) {
      this.webhooks.set(webhook.name, webhook);
      console.log(`✅ Webhook configured: ${webhook.name}`);
    }
  }

  /**
   * Handle incoming customer messages via webhook
   */
  async handleCustomerMessage(req, res) {
    try {
      const { message, user, channel } = req.body;
      
      // Validate webhook signature
      if (!this.validateWebhookSignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Process message with MJND agent
      if (this.agent) {
        const response = await this.agent.processMessage(message, user);
        
        // Send response back through appropriate channel
        await this.sendResponse(response, user, channel);
        
        res.status(200).json({ success: true, response });
      } else {
        res.status(500).json({ error: 'Agent not initialized' });
      }
    } catch (error) {
      console.error('Error handling customer message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle payment updates
   */
  async handlePaymentUpdate(req, res) {
    try {
      const { userId, status, amount, plan } = req.body;
      
      // Update user subscription status
      await this.updateUserSubscription(userId, status, plan);
      
      // Notify user via email/SMS
      await this.notifyUserPaymentUpdate(userId, status, amount);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling payment update:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle user registration
   */
  async handleUserRegistration(req, res) {
    try {
      const { user, source } = req.body;
      
      // Send welcome message via MJND agent
      if (this.agent) {
        const welcomeMessage = `Welcome to Maijjd, ${user.name}! I'm MJND, your AI assistant. How can I help you get started?`;
        await this.agent.processMessage(welcomeMessage, user);
      }
      
      // Send welcome email
      await this.sendWelcomeEmail(user);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling user registration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Send response through appropriate channel
   */
  async sendResponse(response, user, channel) {
    switch (channel) {
      case 'email':
        await this.sendEmailResponse(user.email, response);
        break;
      case 'sms':
        await this.sendSMSResponse(user.phone, response);
        break;
      case 'web':
        await this.sendWebResponse(user.id, response);
        break;
      case 'chat':
        await this.sendChatResponse(user.id, response);
        break;
      default:
        console.log('Unknown channel:', channel);
    }
  }

  /**
   * Send email response using SendGrid
   */
  async sendEmailResponse(email, response) {
    const apiKey = this.apiKeys.get('sendgrid');
    if (!apiKey) {
      console.error('SendGrid API key not configured');
      return;
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(apiKey);

      const msg = {
        to: email,
        from: 'noreply@maijjd.com',
        subject: 'Response from MJND Agent',
        text: response,
        html: `<p>${response.replace(/\n/g, '<br>')}</p>`
      };

      await sgMail.send(msg);
      console.log('✅ Email response sent to:', email);
    } catch (error) {
      console.error('Error sending email response:', error);
    }
  }

  /**
   * Send SMS response using Twilio
   */
  async sendSMSResponse(phone, response) {
    const apiKey = this.apiKeys.get('twilio');
    if (!apiKey) {
      console.error('Twilio API key not configured');
      return;
    }

    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, apiKey);

      await client.messages.create({
        body: response,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log('✅ SMS response sent to:', phone);
    } catch (error) {
      console.error('Error sending SMS response:', error);
    }
  }

  /**
   * Send web response (store in database for real-time display)
   */
  async sendWebResponse(userId, response) {
    try {
      // Store response in database for real-time display
      const db = require('./database');
      await db.messages.create({
        userId: userId,
        message: response,
        type: 'agent_response',
        timestamp: new Date()
      });

      console.log('✅ Web response stored for user:', userId);
    } catch (error) {
      console.error('Error storing web response:', error);
    }
  }

  /**
   * Send chat response (WebSocket or similar)
   */
  async sendChatResponse(userId, response) {
    try {
      // Send via WebSocket or similar real-time communication
      const io = require('./socket');
      io.to(userId).emit('agent_response', {
        message: response,
        timestamp: new Date(),
        agent: 'MJND'
      });

      console.log('✅ Chat response sent to user:', userId);
    } catch (error) {
      console.error('Error sending chat response:', error);
    }
  }

  /**
   * Validate webhook signature for security
   */
  validateWebhookSignature(req) {
    const signature = req.headers['x-webhook-signature'];
    const secret = this.apiKeys.get('webhook');
    
    if (!signature || !secret) {
      return false;
    }

    // Implement signature validation logic
    // This is a simplified version - implement proper HMAC validation
    return true;
  }

  /**
   * Update user subscription status
   */
  async updateUserSubscription(userId, status, plan) {
    try {
      const db = require('./database');
      await db.users.update(
        { id: userId },
        { 
          subscriptionStatus: status,
          subscriptionPlan: plan,
          updatedAt: new Date()
        }
      );

      console.log('✅ User subscription updated:', userId, status, plan);
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }

  /**
   * Notify user about payment update
   */
  async notifyUserPaymentUpdate(userId, status, amount) {
    try {
      const db = require('./database');
      const user = await db.users.findById(userId);
      
      if (!user) {
        console.error('User not found:', userId);
        return;
      }

      const message = `Your payment of $${amount} has been ${status}. Thank you for using Maijjd!`;
      
      // Send notification via multiple channels
      await this.sendEmailResponse(user.email, message);
      if (user.phone) {
        await this.sendSMSResponse(user.phone, message);
      }
    } catch (error) {
      console.error('Error notifying user payment update:', error);
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user) {
    const welcomeMessage = `
Welcome to Maijjd, ${user.name}!

I'm MJND, your AI assistant for Maijjd's comprehensive software development platform.

Here's what you can explore:
• 50+ Software Categories
• 26+ Professional Services
• Advanced Development Tools
• Real-time Collaboration
• 24/7 Technical Support

Get started at: https://maijjd.com

Best regards,
MJND Agent
Maijjd Platform
    `;

    await this.sendEmailResponse(user.email, welcomeMessage);
  }

  /**
   * Set the MJND agent instance
   */
  setAgent(agent) {
    this.agent = agent;
    console.log('✅ MJND Agent connected to API integration');
  }

  /**
   * Get API integration status
   */
  getStatus() {
    return {
      initialized: this.agent !== null,
      webhooks: Array.from(this.webhooks.keys()),
      apiKeys: Array.from(this.apiKeys.keys()),
      rateLimits: Object.fromEntries(this.rateLimits)
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaijjdAPIIntegration;
}

// Global availability for browser use
if (typeof window !== 'undefined') {
  window.MaijjdAPIIntegration = MaijjdAPIIntegration;
}
