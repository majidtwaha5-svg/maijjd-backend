// Email Service for Maijjd - Ensures customers get responses
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter for sending emails
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'info@maijjd.com',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
      }
    });

    // Email templates
    this.templates = {
      customerConfirmation: {
        subject: 'Thank you for contacting Maijjd - We\'ll get back to you soon!',
        html: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Maijjd</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Advanced Software Solutions & Development</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Thank you for contacting us!</h2>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                Hi ${data.name},
              </p>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                We've received your message and our team will get back to you within 24 hours. 
                Here's what you sent us:
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="color: #333; font-style: italic; margin: 0;">
                  "${data.message}"
                </p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Your Details:</h3>
                <p style="color: #555; margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
                <p style="color: #555; margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
                ${data.company ? `<p style="color: #555; margin: 5px 0;"><strong>Company:</strong> ${data.company}</p>` : ''}
                ${data.service ? `<p style="color: #555; margin: 5px 0;"><strong>Service:</strong> ${data.service}</p>` : ''}
              </div>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                While you wait, you can:
              </p>
              
              <ul style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                <li>Explore our <a href="https://maijjd.com/software" style="color: #667eea;">software solutions</a></li>
                <li>Check out our <a href="https://maijjd.com/services" style="color: #667eea;">services</a></li>
                <li>Try our <a href="https://maijjd.com" style="color: #667eea;">MJND AI Assistant</a></li>
              </ul>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                If you have urgent questions, you can also reach us directly at 
                <a href="mailto:info@maijjd.com" style="color: #667eea;">info@maijjd.com</a>
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://maijjd.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Visit Our Website
                </a>
              </div>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2024 Maijjd. All rights reserved.
              </p>
              <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
                DFW, TX | <a href="mailto:info@maijjd.com" style="color: #999;">info@maijjd.com</a>
              </p>
            </div>
          </div>
        `
      },
      
      teamNotification: {
        subject: 'New Contact Request from Maijjd Website',
        html: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Request</h1>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Contact Details:</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #333; margin: 5px 0;"><strong>Name:</strong> ${data.name}</p>
                <p style="color: #333; margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
                ${data.company ? `<p style="color: #333; margin: 5px 0;"><strong>Company:</strong> ${data.company}</p>` : ''}
                ${data.phone ? `<p style="color: #333; margin: 5px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
                ${data.service ? `<p style="color: #333; margin: 5px 0;"><strong>Service:</strong> ${data.service}</p>` : ''}
                <p style="color: #333; margin: 5px 0;"><strong>Message:</strong></p>
                <p style="color: #555; font-style: italic; margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 4px;">
                  ${data.message}
                </p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="mailto:${data.email}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 10px;">
                  Reply to Customer
                </a>
                <a href="https://maijjd.com/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 0 10px;">
                  View in Admin Panel
                </a>
              </div>
            </div>
          </div>
        `
      }
    };
  }

  // Send email with error handling and retry logic
  async sendEmail(to, subject, html, options = {}) {
    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        const mailOptions = {
          from: `"Maijjd" <${process.env.SMTP_USER || 'info@maijjd.com'}>`,
          to,
          subject,
          html,
          ...options
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to} (attempt ${attempt})`);
        return result;

      } catch (error) {
        console.error(`❌ Email attempt ${attempt} failed to ${to}:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }

  // Send customer confirmation email
  async sendCustomerConfirmation(contactData) {
    try {
      const { email, name, message, company, service } = contactData;
      
      const html = this.templates.customerConfirmation.html({
        name,
        message,
        company,
        service
      });

      await this.sendEmail(
        email,
        this.templates.customerConfirmation.subject,
        html
      );

      console.log(`✅ Customer confirmation email sent to ${email}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send customer confirmation email:', error);
      throw error;
    }
  }

  // Send team notification email
  async sendTeamNotification(contactData) {
    try {
      const teamEmails = [
        process.env.TEAM_EMAIL || 'info@maijjd.com',
        process.env.SUPPORT_EMAIL || 'support@maijjd.com'
      ].filter(Boolean);

      if (teamEmails.length === 0) {
        console.warn('⚠️ No team emails configured for notifications');
        return false;
      }

      const html = this.templates.teamNotification.html(contactData);

      // Send to all team members
      const emailPromises = teamEmails.map(email => 
        this.sendEmail(email, this.templates.teamNotification.subject, html)
      );

      await Promise.all(emailPromises);
      console.log(`✅ Team notification emails sent to ${teamEmails.length} recipients`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send team notification emails:', error);
      throw error;
    }
  }

  // Send both customer confirmation and team notification
  async sendContactEmails(contactData) {
    try {
      const results = await Promise.allSettled([
        this.sendCustomerConfirmation(contactData),
        this.sendTeamNotification(contactData)
      ]);

      const customerResult = results[0];
      const teamResult = results[1];

      if (customerResult.status === 'rejected') {
        console.error('❌ Customer confirmation email failed:', customerResult.reason);
      }

      if (teamResult.status === 'rejected') {
        console.error('❌ Team notification email failed:', teamResult.reason);
      }

      return {
        customerEmailSent: customerResult.status === 'fulfilled',
        teamEmailSent: teamResult.status === 'fulfilled',
        customerError: customerResult.status === 'rejected' ? customerResult.reason.message : null,
        teamError: teamResult.status === 'rejected' ? teamResult.reason.message : null
      };

    } catch (error) {
      console.error('❌ Failed to send contact emails:', error);
      throw error;
    }
  }

  // Test email service
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = EmailService;
