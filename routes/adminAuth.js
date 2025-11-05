const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Configuration (same as in auth.js)
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: 'maijjd',
  audience: 'maijjd-app'
};

// Import passwordResetTokens - shared Map (in production, use Redis/database)
// Note: This should ideally be a shared module, but for now we'll create a separate one
// that will be merged with the main auth.js tokens in production
const passwordResetTokens = new Map();

// Export for potential sharing with auth.js
module.exports.passwordResetTokens = passwordResetTokens;

// Token generation functions (same as in auth.js)
function generateToken(user) {
  const payload = {
    userId: user._id || user.id,
    email: user.email,
    role: user.role,
    permissions: ['read', 'write', 'admin', 'manage_users', 'manage_app'],
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_CONFIG.issuer || 'maijjd',
    aud: JWT_CONFIG.audience || 'maijjd-app'
  };

  return jwt.sign(payload, JWT_CONFIG.secret || process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
    expiresIn: JWT_CONFIG.expiresIn || '24h'
  });
}

function generateRefreshToken(user) {
  const payload = {
    userId: user._id || user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_CONFIG.issuer || 'maijjd',
    aud: JWT_CONFIG.audience || 'maijjd-app'
  };

  return jwt.sign(payload, JWT_CONFIG.secret || process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
    expiresIn: JWT_CONFIG.refreshExpiresIn || '7d'
  });
}

// Admin Login with Email or Phone
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    // Require either email or phone
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Either email or phone number is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Validate input format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please enter a valid email address',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (phone) {
      const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$|^\+?[1-9]\d{1,14}$/;
      const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
      if (cleaned.length < 10 || !phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please enter a valid phone number',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (!password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Find admin user by email or phone
    let admin;
    try {
      if (email) {
        admin = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
      } else if (phone) {
        admin = await User.findOne({ phone: phone.trim(), role: 'admin' });
      }
    } catch (dbError) {
      console.error('Database error during admin login:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Unable to process login. Please try again later.',
        code: 'DATABASE_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (!admin) {
      // Always return generic error for security
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(403).json({
        error: 'Account Inactive',
        message: 'Your admin account is not active. Please contact support.',
        code: 'ACCOUNT_INACTIVE',
        timestamp: new Date().toISOString()
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const accessToken = generateToken(admin);
    const refreshToken = generateRefreshToken(admin);

    res.json({
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin._id || admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: ['admin', 'read', 'write', 'delete', 'manage_users', 'manage_app'],
          lastLogin: admin.lastLogin
        },
        authentication: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: JWT_CONFIG.expiresIn,
          refreshExpiresIn: JWT_CONFIG.refreshExpiresIn
        }
      },
      metadata: {
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0',
        accountType: 'Administrator',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login service temporarily unavailable',
      code: 'LOGIN_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin Registration (with admin key)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, adminKey } = req.body;
    
    // Require either email or phone
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Either email or phone number is required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Validate admin key
    const validAdminKey = process.env.ADMIN_CREATION_KEY || 'maijjd-admin-2024';
    if (!adminKey || adminKey !== validAdminKey) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Invalid admin creation key',
        code: 'INVALID_ADMIN_KEY',
        timestamp: new Date().toISOString()
      });
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please enter a valid email address',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$|^\+?[1-9]\d{1,14}$/;
      const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
      if (cleaned.length < 10 || !phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Enhanced password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password confirmation does not match password',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Check if admin already exists
    let existingAdmin;
    try {
      if (email) {
        existingAdmin = await User.findOne({ 
          $or: [
            { email: email.toLowerCase().trim(), role: 'admin' },
            { email: email.toLowerCase().trim() }
          ]
        });
      }
      if (!existingAdmin && phone) {
        existingAdmin = await User.findOne({ 
          $or: [
            { phone: phone.trim(), role: 'admin' },
            { phone: phone.trim() }
          ]
        });
      }
    } catch (dbError) {
      console.error('Database error during admin registration check:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Unable to process registration. Please try again later.',
        code: 'DATABASE_ERROR',
        timestamp: new Date().toISOString()
      });
    }
    
    if (existingAdmin) {
      return res.status(409).json({
        error: 'Admin Already Exists',
        message: existingAdmin.email ? 'An admin with this email already exists' : 'An admin with this phone number already exists',
        code: 'ADMIN_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    // Create new admin user
    let newAdmin;
    try {
      newAdmin = new User({
        name: name.trim(),
        email: email ? email.toLowerCase() : undefined,
        phone: phone ? phone.trim() : undefined,
        password,
        role: 'admin',
        status: 'active',
        subscription: 'enterprise',
        emailVerified: false,
        phoneVerified: false
      });

      await newAdmin.save();
      console.log('✅ Admin created successfully in database');
    } catch (dbError) {
      console.error('Database error during admin creation:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Unable to create admin account. Please try again later.',
        code: 'DATABASE_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Generate tokens
    const accessToken = generateToken(newAdmin);
    const refreshToken = generateRefreshToken(newAdmin);

    // Log admin creation (important for security)
    console.log(`[ADMIN_CREATION] New admin account created: ${email || phone} at ${new Date().toISOString()}`);

    res.status(201).json({
      message: 'Admin account created successfully',
      data: {
        admin: {
          id: newAdmin._id || newAdmin.id,
          name: newAdmin.name,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          permissions: ['admin', 'read', 'write', 'delete', 'manage_users', 'manage_app'],
          createdAt: newAdmin.createdAt || new Date()
        },
        authentication: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: JWT_CONFIG.expiresIn,
          refreshExpiresIn: JWT_CONFIG.refreshExpiresIn
        }
      },
      metadata: {
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0',
        accountType: 'Administrator',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration service temporarily unavailable',
      code: 'REGISTRATION_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin Forgot Password (Email/Phone)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Contact information required',
        message: 'Email or phone number is required'
      });
    }

    // Validate input format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please enter a valid email address',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (phone) {
      const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$|^\+?[1-9]\d{1,14}$/;
      const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
      if (cleaned.length < 10 || !phoneRegex.test(phone.trim())) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please enter a valid phone number',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    // Find admin by email or phone
    let admin;
    try {
      if (email) {
        admin = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' });
      } else if (phone) {
        admin = await User.findOne({ phone: phone.trim(), role: 'admin' });
      }
    } catch (dbError) {
      console.error('Database error during admin forgot password:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Unable to process request. Please try again later.',
        code: 'DATABASE_ERROR'
      });
    }

    if (!admin) {
      // Always respond success to avoid enumeration
      return res.json({
        message: 'If an admin account exists with this information, a reset link has been sent'
      });
    }

    // Generate reset token
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minutes
    
    passwordResetTokens.set(token, { 
      email: admin.email, 
      phone: admin.phone,
      expiresAt,
      role: 'admin'
    });

    const frontendBase = process.env.FRONTEND_BASE_URL || 'https://maijjd.com';
    const resetUrl = `${frontendBase}/admin/reset-password?token=${token}`;

    // Send reset email (if email service available)
    if (admin.email) {
      try {
        const EmailService = require('../services/emailService');
        const emailService = new EmailService();
        await emailService.sendEmail(
          admin.email,
          'Reset Your Maijjd Admin Password',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Admin Password Reset Request</h1>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Reset Your Admin Password</h2>
                
                <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                  Hi ${admin.name},
                </p>
                
                <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                  We received a request to reset your admin password. Click the button below to set a new password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Admin Password
                  </a>
                </div>
                
                <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                  This link will expire in 30 minutes. If you didn't request this, you can ignore this email.
                </p>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <p style="color: #666; margin: 0; font-size: 12px;">
                    If the button doesn't work, copy and paste this link: ${resetUrl}
                  </p>
                </div>
              </div>
            </div>
          `
        );
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }
    }

    // Send reset SMS (if Twilio service available)
    if (admin.phone) {
      try {
        const TwilioService = require('../services/twilio');
        if (TwilioService.isConfigured && TwilioService.isConfigured()) {
          await TwilioService.sendSMS(
            admin.phone,
            `🔐 Maijjd Admin Password Reset\n\nClick here to reset your password: ${resetUrl}\n\nThis link expires in 30 minutes.\n\n- Maijjd Admin Team`
          );
        }
      } catch (smsError) {
        console.error('Failed to send reset SMS:', smsError);
      }
    }

    console.log(`[Admin Password Reset] To: ${admin.email || admin.phone} | Link: ${resetUrl}`);
    
    res.json({
      message: 'If an admin account exists with this information, a reset link has been sent',
      data: {
        emailSent: !!admin.email,
        smsSent: !!(admin.phone && (() => {
          try {
            const TwilioService = require('../services/twilio');
            return TwilioService.isConfigured && TwilioService.isConfigured();
          } catch {
            return false;
          }
        })())
      }
    });

  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process password reset request',
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Admin Reset Password (via token from forgot password)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};
    
    if (!token || !password) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Token and password are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters long',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Enhanced password validation (same as registration)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Validate confirmPassword if provided
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password confirmation does not match password',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Check if token exists and is valid
    const entry = passwordResetTokens.get(token);
    
    if (!entry) {
      return res.status(400).json({ 
        error: 'Invalid Token',
        message: 'Invalid or expired reset token. Please request a new password reset.',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Check if token has expired
    if (Date.now() > entry.expiresAt) {
      passwordResetTokens.delete(token);
      return res.status(400).json({ 
        error: 'Expired Token',
        message: 'Reset token has expired. Please request a new password reset.',
        code: 'EXPIRED_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Verify this is an admin token
    if (entry.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This reset token is not for admin accounts',
        code: 'NOT_ADMIN_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Find admin by email or phone
    let admin;
    try {
      if (entry.email) {
        admin = await User.findOne({ email: entry.email.toLowerCase(), role: 'admin' });
      } else if (entry.phone) {
        admin = await User.findOne({ phone: entry.phone, role: 'admin' });
      }
    } catch (dbError) {
      console.error('Database error during admin password reset:', dbError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Unable to process password reset. Please try again later.',
        code: 'DATABASE_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (!admin) {
      passwordResetTokens.delete(token);
      return res.status(404).json({ 
        error: 'Admin Not Found',
        message: 'Admin account not found. Please contact support.',
        code: 'ADMIN_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Update password (User model will hash it automatically)
    try {
      admin.password = password;
      await admin.save();
      passwordResetTokens.delete(token);
      
      console.log(`✅ Admin password reset successful for: ${admin.email || admin.phone}`);
      
      res.json({ 
        success: true,
        message: 'Admin password updated successfully',
        data: {
          email: admin.email,
          phone: admin.phone,
          resetAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (saveError) {
      console.error('Error saving new admin password:', saveError);
      return res.status(500).json({
        error: 'Save Error',
        message: 'Failed to update password. Please try again.',
        code: 'SAVE_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process password reset. Please try again later.',
      code: 'RESET_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin Profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    const admin = await User.findById(decoded.userId).select('-password');
    
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        permissions: ['admin', 'read', 'write', 'delete', 'manage_users', 'manage_app'],
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Unable to retrieve admin profile',
      code: 'PROFILE_ERROR'
    });
  }
});

module.exports = router;

