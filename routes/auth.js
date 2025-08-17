const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();
const nodemailer = require('nodemailer');

// Mock user database (replace with actual database in production)
let users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@maijjd.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    apiKeys: [],
    permissions: ['read', 'write', 'admin']
  }
];

// In-memory reset tokens map: token -> { email, expiresAt }
const passwordResetTokens = new Map();

// Lazy mail transporter (uses env or falls back to console)
let mailTransporter = null;
function getMailer() {
  if (mailTransporter) return mailTransporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  } else {
    // Console transport fallback
    mailTransporter = {
      sendMail: async (opts) => {
        console.log('[MAIL:FALLBACK] To:', opts.to, '| Subject:', opts.subject, '\n', opts.text);
        return { messageId: `console-${Date.now()}` };
      }
    };
  }
  return mailTransporter;
}

// Enhanced JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  // Extend default access token lifetime to reduce frequent re-logins in dev
  expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  // Keep refresh token reasonably long
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d',
  issuer: 'maijjd-api',
  audience: 'maijjd-clients'
};

// Generate JWT Token with Enhanced Payload
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  });
}

// Generate Refresh Token
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn
  });
}

// Enhanced Login with AI-friendly Response
router.post('/login', async (req, res) => {
  try {
    // Basic validation
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 6 characters long',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // AI-friendly response with comprehensive user data
    const response = {
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        authentication: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: JWT_CONFIG.expiresIn,
          refreshExpiresIn: JWT_CONFIG.refreshExpiresIn
        },
        apiAccess: {
          endpoints: [
            '/api/software',
            '/api/services',
            '/api/users',
            '/api/contact'
          ],
          rateLimits: {
            general: '1000 requests per 15 minutes',
            auth: '100 requests per 15 minutes'
          },
          documentation: '/api-docs'
        }
      },
      metadata: {
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0',
        authenticationMethod: 'JWT',
        securityFeatures: [
          'Rate Limiting',
          'Input Validation',
          'Password Hashing',
          'Token Expiration',
          'Role-Based Access Control'
        ]
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process login request',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced Registration with AI-friendly Response
router.post('/register', async (req, res) => {
  try {
    // Basic validation
    const { name, email, password, confirmPassword } = req.body;
    
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields are required',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name must be between 2 and 50 characters',
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

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password confirmation does not match password',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'A user with this email already exists',
        code: 'USER_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
      apiKeys: [],
      permissions: ['read']
    };

    users.push(newUser);

    // Generate tokens
    const accessToken = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // AI-friendly response
    const response = {
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          permissions: newUser.permissions,
          createdAt: newUser.createdAt
        },
        authentication: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: JWT_CONFIG.expiresIn,
          refreshExpiresIn: JWT_CONFIG.refreshExpiresIn
        },
        welcome: {
          message: 'Welcome to Maijjd! Your account has been created successfully.',
          nextSteps: [
            'Explore our software catalog',
            'Set up your profile',
            'Check out our API documentation',
            'Contact support if you need help'
          ]
        }
      },
      metadata: {
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0',
        accountType: 'Standard User',
        features: [
          'Software Access',
          'API Integration',
          'User Dashboard',
          'Support Access'
        ]
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration service temporarily unavailable',
      code: 'REGISTRATION_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced Profile Retrieval with AI-friendly Response
router.get('/profile', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // AI-friendly response with comprehensive profile data
    const response = {
      message: 'Profile retrieved successfully',
      data: {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        account: {
          status: 'Active',
          type: user.role === 'admin' ? 'Administrator' : 'Standard User',
          memberSince: user.createdAt,
          lastActivity: user.lastLogin
        },
        apiAccess: {
          currentToken: {
            issuedAt: req.user.iat,
            expiresAt: req.user.iat + (24 * 60 * 60), // 24 hours
            permissions: req.user.permissions
          },
          endpoints: [
            '/api/software',
            '/api/services',
            '/api/users',
            '/api/contact'
          ],
          rateLimits: {
            remaining: 'Unlimited for authenticated users',
            resetTime: 'Every 15 minutes'
          }
        },
        security: {
          twoFactorEnabled: false,
          lastPasswordChange: 'Not available',
          loginHistory: 'Available in dashboard',
          apiKeys: user.apiKeys.length
        }
      },
      metadata: {
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0',
        requestedBy: req.user.userId,
        authenticationMethod: 'JWT Bearer Token'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Profile service temporarily unavailable',
      code: 'PROFILE_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Token Refresh Endpoint
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing Refresh Token',
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_MISSING',
        timestamp: new Date().toISOString()
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, JWT_CONFIG.secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: 'Invalid Refresh Token',
          message: 'Refresh token is invalid or expired',
          code: 'INVALID_REFRESH_TOKEN',
          timestamp: new Date().toISOString()
        });
      }

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          error: 'Invalid Token Type',
          message: 'Token is not a refresh token',
          code: 'INVALID_TOKEN_TYPE',
          timestamp: new Date().toISOString()
        });
      }

      // Find user
      const user = users.find(u => u.id === decoded.userId);
      if (!user) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User associated with refresh token not found',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Generate new tokens
      const newAccessToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      const response = {
        message: 'Tokens refreshed successfully',
        data: {
          authentication: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            tokenType: 'Bearer',
            expiresIn: JWT_CONFIG.expiresIn,
            refreshExpiresIn: JWT_CONFIG.refreshExpiresIn
          }
        },
        metadata: {
          responseTime: new Date().toISOString(),
          apiVersion: '1.0.0',
          tokenRefresh: true
        }
      };

      res.json(response);
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh service temporarily unavailable',
      code: 'TOKEN_REFRESH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Logout Endpoint
router.post('/logout', verifyToken, (req, res) => {
  try {
    // In a real application, you would blacklist the token
    // For now, we'll just return a success response
    
    const response = {
      message: 'Logout successful',
      data: {
        logout: {
          timestamp: new Date().toISOString(),
          message: 'You have been successfully logged out'
        },
        nextSteps: [
          'Destroy the access token on the client side',
          'Clear any stored authentication data',
          'Redirect to login page'
        ]
      },
      metadata: {
        responseTime: new Date().toISOString(),
        apiVersion: '1.0.0',
        logoutMethod: 'Token Invalidation'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout service temporarily unavailable',
      code: 'LOGOUT_SERVICE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// AI Integration Endpoint for Authentication
router.get('/ai/integration', (req, res) => {
  try {
    const response = {
      message: 'Authentication AI Integration endpoint available',
      capabilities: {
        userAuthentication: {
          endpoint: '/api/auth/login',
          method: 'POST',
          description: 'Authenticate users and receive JWT tokens',
          requiredFields: ['email', 'password'],
          responseFormat: 'JSON with access and refresh tokens'
        },
        userRegistration: {
          endpoint: '/api/auth/register',
          method: 'POST',
          description: 'Create new user accounts',
          requiredFields: ['name', 'email', 'password', 'confirmPassword'],
          responseFormat: 'JSON with user data and tokens'
        },
        profileAccess: {
          endpoint: '/api/auth/profile',
          method: 'GET',
          description: 'Retrieve user profile information',
          authentication: 'JWT Bearer Token required',
          responseFormat: 'JSON with comprehensive user data'
        },
        tokenRefresh: {
          endpoint: '/api/auth/refresh',
          method: 'POST',
          description: 'Refresh expired access tokens',
          requiredFields: ['refreshToken'],
          responseFormat: 'JSON with new tokens'
        }
      },
      authentication: {
        method: 'JWT (JSON Web Tokens)',
        tokenTypes: ['access', 'refresh'],
        expiration: {
          access: JWT_CONFIG.expiresIn,
          refresh: JWT_CONFIG.refreshExpiresIn
        },
        security: [
          'Password Hashing (bcrypt)',
          'Token Expiration',
          'Refresh Token Rotation',
          'Rate Limiting',
          'Input Validation'
        ]
      },
      dataFormats: {
        request: 'JSON',
        response: 'JSON',
        errorHandling: 'Structured error responses with codes',
        validation: 'Express-validator with custom rules'
      },
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        supportedMethods: ['POST', 'GET'],
        rateLimiting: '100 requests per 15 minutes for auth endpoints'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('AI integration endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'AI integration information temporarily unavailable',
      code: 'AI_INTEGRATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

// --- Minimal Forgot/Reset Password routes (email link logged to console) ---
router.post('/forgot', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = users.find(u => u.email === email);
  // Always respond success to avoid email enumeration
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = Date.now() + 1000 * 60 * 30; // 30 minutes
  if (user) passwordResetTokens.set(token, { email, expiresAt });
  const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${frontendBase}/reset-password?token=${token}`;
  try {
    const transporter = getMailer();
    const from = process.env.SMTP_FROM || 'no-reply@maijjd.com';
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your MAIJJD password',
      text: `We received a request to reset your password.\n\nUse this link to set a new password:\n${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
      html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>`
    });
  } catch (e) {
    console.warn('[Password Reset Email] Failed to send via SMTP, link below for manual copy:', resetUrl);
  }
  console.log(`[Password Reset] To: ${email} | Link: ${resetUrl}`);
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
  const entry = passwordResetTokens.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  const user = users.find(u => u.email === entry.email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const hashed = await bcrypt.hash(password, 12);
  user.password = hashed;
  passwordResetTokens.delete(token);
  res.json({ message: 'Password updated successfully' });
});
