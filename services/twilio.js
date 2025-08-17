const twilio = require('twilio');
require('dotenv').config();

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.enabled = process.env.TWILIO_ENABLED === 'true';
    
    if (this.enabled && this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      this.client = null;
      console.log('Twilio service disabled or not configured');
    }
  }

  /**
   * Send SMS message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise<Object>} - Twilio response
   */
  async sendSMS(to, message) {
    if (!this.client) {
      throw new Error('Twilio service not configured');
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      console.log(`SMS sent successfully to ${to}. SID: ${result.sid}`);
      return {
        success: true,
        sid: result.sid,
        status: result.status,
        to: to
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send notification SMS
   * @param {string} to - Recipient phone number
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @returns {Promise<Object>} - Twilio response
   */
  async sendNotification(to, title, body) {
    const message = `🔔 ${title}\n\n${body}\n\n- Maijjd Team`;
    return this.sendSMS(to, message);
  }

  /**
   * Send verification code SMS
   * @param {string} to - Recipient phone number
   * @param {string} code - Verification code
   * @returns {Promise<Object>} - Twilio response
   */
  async sendVerificationCode(to, code) {
    const message = `🔐 Maijjd Verification Code\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\n- Maijjd Team`;
    return this.sendSMS(to, message);
  }

  /**
   * Send welcome SMS
   * @param {string} to - Recipient phone number
   * @param {string} name - User's name
   * @returns {Promise<Object>} - Twilio response
   */
  async sendWelcomeSMS(to, name) {
    const message = `🎉 Welcome to Maijjd, ${name}!\n\nThank you for joining our software suite. We're excited to help you succeed!\n\n- Maijjd Team`;
    return this.sendSMS(to, message);
  }

  /**
   * Check if Twilio is properly configured
   * @returns {boolean} - Configuration status
   */
  isConfigured() {
    return this.enabled && this.client !== null;
  }

  /**
   * Get Twilio configuration status
   * @returns {Object} - Configuration details
   */
  getConfigStatus() {
    return {
      enabled: this.enabled,
      accountSid: this.accountSid ? 'Configured' : 'Not configured',
      authToken: this.authToken ? 'Configured' : 'Not configured',
      phoneNumber: this.phoneNumber || 'Not configured',
      client: this.client ? 'Active' : 'Inactive'
    };
  }
}

module.exports = new TwilioService();
