const Joi = require('joi');

// AI-specific validation schemas
const aiAnalysisSchema = Joi.object({
  software_id: Joi.string().required().messages({
    'string.empty': 'Software ID is required',
    'any.required': 'Software ID is required'
  }),
  analysis_type: Joi.string().valid('performance', 'security', 'scalability', 'user_experience', 'comprehensive').required().messages({
    'string.empty': 'Analysis type is required',
    'any.only': 'Analysis type must be one of: performance, security, scalability, user_experience, comprehensive'
  }),
  ai_model: Joi.string().valid('gpt-4', 'claude-3', 'gemini-pro', 'llama-2', 'custom').default('gpt-4').messages({
    'any.only': 'AI model must be one of: gpt-4, claude-3, gemini-pro, llama-2, custom'
  }),
  parameters: Joi.object().default({}).messages({
    'object.base': 'Parameters must be an object'
  })
});

const automationWorkflowSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'Workflow name is required',
    'string.min': 'Workflow name must be at least 3 characters',
    'string.max': 'Workflow name must not exceed 100 characters'
  }),
  workflow_type: Joi.string().valid('data_processing', 'system_maintenance', 'security_scan', 'performance_optimization', 'deployment', 'custom').required().messages({
    'string.empty': 'Workflow type is required',
    'any.only': 'Workflow type must be one of: data_processing, system_maintenance, security_scan, performance_optimization, deployment, custom'
  }),
  steps: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      type: Joi.string().valid('api_call', 'system_command', 'data_processing', 'ai_analysis', 'notification').required(),
      parameters: Joi.object().default({}),
      conditions: Joi.object().default({}),
      timeout: Joi.number().integer().min(1000).max(300000).default(30000)
    })
  ).min(1).required().messages({
    'array.min': 'At least one step is required',
    'array.base': 'Steps must be an array'
  }),
  trigger_conditions: Joi.object().default({}).messages({
    'object.base': 'Trigger conditions must be an object'
  }),
  ai_guidance: Joi.string().max(1000).default('').messages({
    'string.max': 'AI guidance must not exceed 1000 characters'
  })
});

const performanceOptimizationSchema = Joi.object({
  target_system: Joi.string().required().messages({
    'string.empty': 'Target system is required'
  }),
  optimization_type: Joi.string().valid('cpu', 'memory', 'disk', 'network', 'database', 'application', 'comprehensive').required().messages({
    'string.empty': 'Optimization type is required',
    'any.only': 'Optimization type must be one of: cpu, memory, disk, network, database, application, comprehensive'
  }),
  constraints: Joi.object({
    budget: Joi.number().positive(),
    timeline: Joi.string(),
    resources: Joi.array().items(Joi.string()),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical')
  }).default({}).messages({
    'object.base': 'Constraints must be an object'
  })
});

const securityAssessmentSchema = Joi.object({
  target_system: Joi.string().required().messages({
    'string.empty': 'Target system is required'
  }),
  assessment_type: Joi.string().valid('vulnerability_scan', 'penetration_test', 'code_analysis', 'infrastructure_audit', 'compliance_check', 'comprehensive').required().messages({
    'string.empty': 'Assessment type is required',
    'any.only': 'Assessment type must be one of: vulnerability_scan, penetration_test, code_analysis, infrastructure_audit, compliance_check, comprehensive'
  }),
  scan_depth: Joi.string().valid('basic', 'standard', 'comprehensive', 'exhaustive').default('comprehensive').messages({
    'any.only': 'Scan depth must be one of: basic, standard, comprehensive, exhaustive'
  })
});

const monitoringQuerySchema = Joi.object({
  system_id: Joi.string().required().messages({
    'string.empty': 'System ID is required'
  }),
  metrics_type: Joi.string().valid('all', 'performance', 'security', 'availability', 'custom').default('all').messages({
    'any.only': 'Metrics type must be one of: all, performance, security, availability, custom'
  }),
  time_range: Joi.string().valid('1h', '6h', '24h', '7d', '30d', 'custom').default('24h').messages({
    'any.only': 'Time range must be one of: 1h, 6h, 24h, 7d, 30d, custom'
  })
});

// Enhanced software data validation
const softwareDataSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Software name is required',
    'string.min': 'Software name must be at least 2 characters',
    'string.max': 'Software name must not exceed 100 characters'
  }),
  description: Joi.string().min(10).max(1000).required().messages({
    'string.empty': 'Software description is required',
    'string.min': 'Software description must be at least 10 characters',
    'string.max': 'Software description must not exceed 1000 characters'
  }),
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required().messages({
    'string.empty': 'Software version is required',
    'string.pattern.base': 'Version must be in semantic versioning format (e.g., 1.0.0)'
  }),
  price: Joi.string().required().messages({
    'string.empty': 'Software price is required'
  }),
  category: Joi.string().valid('AI & Automation', 'Business & CRM', 'Analytics & BI', 'Development Tools', 'Security', 'Communication', 'Productivity', 'Other').required().messages({
    'string.empty': 'Software category is required',
    'any.only': 'Category must be one of the predefined options'
  }),
  features: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one feature is required',
    'array.base': 'Features must be an array'
  }),
  specifications: Joi.object({
    'AI Capabilities': Joi.string().optional(),
    'Performance': Joi.string().optional(),
    'Security': Joi.string().optional(),
    'Scalability': Joi.string().optional(),
    'Integration': Joi.string().optional(),
    'Compliance': Joi.string().optional()
  }).default({}),
  aiMetadata: Joi.object({
    intelligenceLevel: Joi.string().valid('Basic', 'Intermediate', 'Advanced', 'Expert').default('Intermediate'),
    automationScore: Joi.number().integer().min(0).max(100).default(75),
    aiFeatures: Joi.array().items(Joi.string()).default([]),
    apiEndpoints: Joi.number().integer().min(0).default(10),
    responseTime: Joi.string().default('200ms'),
    accuracy: Joi.string().default('95%')
  }).default({})
});

// Enhanced user validation - email OR phone required
const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 50 characters'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Email must be a valid email address'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Phone number must be in a valid format'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),
  role: Joi.string().valid('user', 'admin', 'ai_analyst', 'system_operator').default('user').messages({
    'any.only': 'Role must be one of: user, admin, ai_analyst, system_operator'
  }),
  ai_access_level: Joi.string().valid('basic', 'standard', 'advanced', 'full').default('standard').messages({
    'any.only': 'AI access level must be one of: basic, standard, advanced, full'
  })
}).custom((value, helpers) => {
  // Require either email or phone
  if (!value.email && !value.phone) {
    return helpers.error('any.custom', {
      message: 'Either email or phone number is required'
    });
  }
  return value;
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

// Enhanced contact validation
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 50 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Phone number must be in a valid format'
  }),
  subject: Joi.string().min(5).max(100).required().messages({
    'string.empty': 'Subject is required',
    'string.min': 'Subject must be at least 5 characters',
    'string.max': 'Subject must not exceed 100 characters'
  }),
  message: Joi.string().min(10).max(2000).required().messages({
    'string.empty': 'Message is required',
    'string.min': 'Message must be at least 10 characters',
    'string.max': 'Message must not exceed 2000 characters'
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages({
    'any.only': 'Priority must be one of: low, medium, high, urgent'
  }),
  ai_analysis_requested: Joi.boolean().default(false).messages({
    'boolean.base': 'AI analysis requested must be a boolean'
  })
});

// Validation middleware functions
const validateAIRequest = (req, res, next) => {
  // Check if req.body exists and has the required properties
  if (!req.body) {
    return res.status(400).json({
      success: false,
      error: 'Request body is required'
    });
  }

  const { message, software, context } = req.body;

  // Validate required fields
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a string'
    });
  }

  if (message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message cannot be empty'
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Message is too long (maximum 1000 characters)'
    });
  }

  // Validate software (optional but if provided, should be string)
  if (software && typeof software !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Software must be a string'
    });
  }

  // Validate context (optional but if provided, should be object)
  if (context && typeof context !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Context must be an object'
    });
  }

  // Sanitize message content
  req.body.message = message.trim();
  
  next();
};

// Voice request validation
const validateVoiceRequest = (req, res, next) => {
  // Check if req.body exists and has the required properties
  if (!req.body) {
    return res.status(400).json({
      success: false,
      error: 'Request body is required'
    });
  }

  const { audioData, format, software, context } = req.body;

  // Validate required fields
  if (!audioData) {
    return res.status(400).json({
      success: false,
      error: 'Audio data is required'
    });
  }

  if (!format || !['wav', 'mp3', 'ogg', 'webm'].includes(format)) {
    return res.status(400).json({
      success: false,
      error: 'Valid audio format is required (wav, mp3, ogg, webm)'
    });
  }

  // Validate software (optional but if provided, should be string)
  if (software && typeof software !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Software must be a string'
    });
  }

  // Validate context (optional but if provided, should be object)
  if (context && typeof context !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Context must be an object'
    });
  }

  next();
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }));

      return res.status(400).json({
        error: 'Query validation failed',
        message: 'Query parameters validation failed',
        errors,
        ai_compatible: true
      });
    }

    req.validatedQuery = value;
    next();
  };
};

// Specific validation functions using Joi schemas
const validateSoftwareData = (req, res, next) => {
  const { error, value } = softwareDataSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Software data validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateUserRegistration = (req, res, next) => {
  // Check for either email or phone before validation
  if (!req.body.email && !req.body.phone) {
    return res.status(400).json({
      error: 'User registration validation failed',
      message: 'Either email or phone number is required',
      errors: [{
        field: 'email',
        message: 'Either email or phone number is required',
        code: 'any.custom'
      }]
    });
  }
  
  const { error, value } = userRegistrationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'User registration validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateUserLogin = (req, res, next) => {
  const { error, value } = userLoginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'User login validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateContact = (req, res, next) => {
  const { error, value } = contactSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Contact validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateAIAnalysis = (req, res, next) => {
  const { error, value } = aiAnalysisSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'AI analysis validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateAutomationWorkflow = (req, res, next) => {
  const { error, value } = automationWorkflowSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Automation workflow validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validatePerformanceOptimization = (req, res, next) => {
  const { error, value } = performanceOptimizationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Performance optimization validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateSecurityAssessment = (req, res, next) => {
  const { error, value } = securityAssessmentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Security assessment validation failed',
      message: 'Please check your input data',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }))
    });
  }
  req.validatedData = value;
  next();
};

const validateMonitoringQuery = validateQuery(monitoringQuerySchema);

// AI-specific validation for request headers
const validateAIHeaders = (req, res, next) => {
  // Check if req.headers exists
  if (!req.headers) {
    return res.status(400).json({
      error: 'Request headers are required',
      message: 'Headers object is missing',
      ai_compatible: true
    });
  }

  const requiredHeaders = ['x-request-id', 'x-ai-platform', 'x-client-version'];
  const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);

  if (missingHeaders.length > 0) {
    return res.status(400).json({
      error: 'Missing required headers',
      message: 'AI platform headers are required',
      missing_headers: missingHeaders,
      ai_compatible: true,
      suggestions: [
        'Include X-Request-ID header for request tracking',
        'Include X-AI-Platform header to identify the AI platform',
        'Include X-Client-Version header for version compatibility'
      ]
    });
  }

  next();
};

// Rate limiting validation
const validateRateLimit = (req, res, next) => {
  // Check if req.headers and req.path exist
  if (!req.headers) {
    return res.status(400).json({
      error: 'Request headers are required',
      message: 'Headers object is missing'
    });
  }

  if (!req.path) {
    return res.status(400).json({
      error: 'Request path is required',
      message: 'Path information is missing'
    });
  }

  const aiPlatform = req.headers['x-ai-platform'];
  const requestType = req.path.includes('/ai/') ? 'ai' : 'standard';
  
  // Add rate limit info to request for middleware
  req.rateLimitInfo = {
    platform: aiPlatform,
    type: requestType,
    timestamp: new Date().toISOString()
  };

  next();
};

module.exports = {
  validateSoftwareData,
  validateUserRegistration,
  validateUserLogin,
  validateContact,
  validateAIAnalysis,
  validateAutomationWorkflow,
  validatePerformanceOptimization,
  validateSecurityAssessment,
  validateMonitoringQuery,
  validateAIHeaders,
  validateRateLimit,
  validateAIRequest,
  validateQuery,
  validateVoiceRequest
};
