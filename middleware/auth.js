const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// AI-optimized rate limiting for different types of requests
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000),
      ai_compatible: true,
      suggestions: [
        'Implement exponential backoff',
        'Use request queuing for bulk operations',
        'Consider caching frequently requested data'
      ]
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        ai_compatible: true,
        suggestions: [
          'Implement exponential backoff',
          'Use request queuing for bulk operations',
          'Consider caching frequently requested data'
        ]
      });
    }
  });
};

// Different rate limiters for different AI use cases
const aiAnalysisLimiter = createRateLimiter(15 * 60 * 1000, 100, 'AI analysis rate limit exceeded');
const aiOptimizationLimiter = createRateLimiter(15 * 60 * 1000, 50, 'AI optimization rate limit exceeded');
const aiSecurityLimiter = createRateLimiter(15 * 60 * 1000, 30, 'AI security assessment rate limit exceeded');
const standardLimiter = createRateLimiter(15 * 60 * 1000, 1000, 'Standard API rate limit exceeded');

// Enhanced JWT verification with AI-specific metadata
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'JWT token is required for authentication',
        ai_compatible: true,
        suggestions: [
          'Include Authorization header with Bearer token',
          'Check token expiration',
          'Verify token format'
        ],
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
    
    // Add AI-specific metadata to the request
    req.user = {
      ...decoded,
      ai_access_level: decoded.role === 'admin' ? 'full' : 'standard',
      ai_capabilities: decoded.role === 'admin' ? 
        ['analysis', 'optimization', 'security', 'management'] : 
        ['analysis', 'basic_optimization'],
      request_timestamp: new Date().toISOString(),
      ai_session_id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Log AI access for monitoring
    console.log(`AI Access: User ${decoded.email} (${decoded.role}) accessed ${req.path} with AI level: ${req.user.ai_access_level}`);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'JWT token has expired',
        ai_compatible: true,
        suggestions: [
          'Refresh your authentication token',
          'Re-authenticate with the system',
          'Check token expiration time'
        ],
        code: 'TOKEN_EXPIRED',
        expires_at: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'JWT token is invalid or malformed',
        ai_compatible: true,
        suggestions: [
          'Verify token format and signature',
          'Check token encoding',
          'Ensure proper token generation'
        ],
        code: 'TOKEN_INVALID'
      });
    } else {
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during token verification',
        ai_compatible: true,
        suggestions: [
          'Check server logs for details',
          'Verify JWT secret configuration',
          'Contact system administrator'
        ],
        code: 'AUTH_ERROR'
      });
    }
  }
};

// Role-based access control with AI capabilities
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User authentication is required for this operation',
        ai_compatible: true,
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Role '${req.user.role}' does not have access to this resource`,
        ai_compatible: true,
        suggestions: [
          'Request elevated permissions from administrator',
          'Use endpoints appropriate for your role level',
          'Contact system administrator for access'
        ],
        code: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        current_role: req.user.role
      });
    }

    next();
  };
};

// AI-specific access control
const requireAICapability = (capability) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User authentication is required for AI operations',
        ai_compatible: true,
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.ai_capabilities.includes(capability)) {
      return res.status(403).json({
        error: 'AI capability required',
        message: `AI capability '${capability}' is required for this operation`,
        ai_compatible: true,
        suggestions: [
          'Upgrade your account for additional AI capabilities',
          'Contact administrator for capability access',
          'Use alternative endpoints with your current capabilities'
        ],
        code: 'AI_CAPABILITY_REQUIRED',
        required_capability: capability,
        available_capabilities: req.user.ai_capabilities
      });
    }

    next();
  };
};

// Enhanced error handling middleware for AI compatibility
const aiErrorHandler = (err, req, res, next) => {
  console.error('AI API Error:', err);

  // AI-specific error responses
  const aiErrorResponse = {
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ai_compatible: true,
    request_id: req.user?.ai_session_id || `req_${Date.now()}`,
    suggestions: []
  };

  if (err.name === 'ValidationError') {
    aiErrorResponse.suggestions = [
      'Check request payload format',
      'Verify required fields are present',
      'Ensure data types match expected format'
    ];
    return res.status(400).json(aiErrorResponse);
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    aiErrorResponse.suggestions = [
      'Check for duplicate data',
      'Verify unique constraints',
      'Use different identifier values'
    ];
    return res.status(409).json(aiErrorResponse);
  }

  // Default error response
  aiErrorResponse.suggestions = [
    'Check server logs for detailed error information',
    'Verify API endpoint and method',
    'Contact system administrator if issue persists'
  ];

  res.status(err.status || 500).json(aiErrorResponse);
};

// Request logging middleware for AI monitoring
const aiRequestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      user_agent: req.get('User-Agent'),
      ip: req.ip,
      ai_session: req.user?.ai_session_id,
      ai_level: req.user?.ai_access_level,
      ai_capabilities: req.user?.ai_capabilities
    };

    console.log('AI API Request:', JSON.stringify(logData, null, 2));
  });

  next();
};

// Export enhanced middleware functions
module.exports = {
  verifyToken,
  requireRole,
  requireAICapability,
  aiErrorHandler,
  aiRequestLogger,
  rateLimiters: {
    aiAnalysis: aiAnalysisLimiter,
    aiOptimization: aiOptimizationLimiter,
    aiSecurity: aiSecurityLimiter,
    standard: standardLimiter
  }
};
