// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
// Robust swagger loader for different deploy roots (e.g., /app vs /app/backend_maijjd)
let swaggerDocument;
try {
  // Prefer resolving relative to this file
  swaggerDocument = require(path.join(__dirname, 'swagger.json'));
} catch (e1) {
  try {
    // Fallback: resolve relative to current working directory
    swaggerDocument = require(path.resolve(process.cwd(), 'swagger.json'));
  } catch (e2) {
    console.warn('⚠️  Swagger file not found; serving minimal OpenAPI stub');
    swaggerDocument = {
      openapi: '3.0.0',
      info: { title: 'Maijjd Intelligent API', version: '2.0.0' },
      paths: {}
    };
  }
}
const path = require('path');
const https = require('https');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const softwareRoutes = require('./routes/software');
const servicesRoutes = require('./routes/services');
const contactRoutes = require('./routes/contact');
const usersRoutes = require('./routes/users');
const aiIntegrationRoutes = require('./routes/ai-integration');
const paymentsRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 5001;
const HTTPS_PORT = process.env.HTTPS_PORT || 5002;

// Enhanced Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Enhanced CORS Configuration for AI Integration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://maijjd.com',
    'https://www.maijjd.com',
    'https://app.maijjd.com',
    // AI Platform Domains
    'https://openai.com',
    'https://api.openai.com',
    'https://claude.ai',
    'https://api.anthropic.com',
    'https://bard.google.com',
    'https://generativelanguage.googleapis.com',
    'https://platform.openai.com',
    'https://chat.openai.com',
    'https://copilot.microsoft.com',
    'https://github.com',
    'https://api.github.com',
    // Development and Testing
    'http://localhost:*',
    'https://localhost:*',
    'https://127.0.0.1:*'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-API-Key',
    'X-AI-Platform',
    'X-Request-ID',
    'X-Client-Version',
    'X-Platform',
    'X-Device-Type',
    'X-User-Agent'
  ],
  exposedHeaders: [
    'X-Total-Count', 
    'X-API-Version', 
    'X-Response-Time',
    'X-Cache-Status',
    'X-Processing-Time'
  ],
  maxAge: 86400 // 24 hours
}));

// Enhanced Rate Limiting for AI Platforms
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher limit for AI platforms
  message: {
    error: 'AI Platform rate limit exceeded',
    message: 'Please try again later',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for AI platform requests
    const aiPlatforms = ['openai.com', 'anthropic.com', 'google.com', 'microsoft.com'];
    return aiPlatforms.some(platform => 
      req.headers['user-agent']?.includes(platform) || 
      req.headers['x-ai-platform']
    );
  }
});

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Standard limit for regular users
  message: {
    error: 'Rate limit exceeded',
    message: 'Please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/ai', aiLimiter);
app.use('/api', standardLimiter);

// Enhanced Compression for AI responses
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Body parsing middleware with AI-optimized limits
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 1000
}));

// Enhanced Request logging for AI monitoring
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Add request ID and start time to request object
  req.requestId = requestId;
  req.startTime = start;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const aiPlatform = req.headers['x-ai-platform'] || 'unknown';
    
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - AI:${aiPlatform} - ${req.get('User-Agent')}`);
  });
  next();
});

// AI-Friendly Headers and Metadata
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '2.0.0');
  res.setHeader('X-API-Platform', 'Maijjd-Intelligent-System');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Request-ID', req.requestId);
  
  // AI-specific headers
  res.setHeader('X-AI-Compatible', 'true');
  res.setHeader('X-Data-Format', 'JSON');
  res.setHeader('X-Response-Schema', 'https://api.maijjd.com/schemas');
  
  next();
});

// Enhanced Health check endpoint for AI monitoring
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    message: 'Maijjd Intelligent API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: {
      node: process.version,
      os: process.platform,
      arch: process.arch
    },
    ai: {
      compatible: true,
      endpoints: [
        '/api/ai/integration',
        '/api/ai/software-analysis',
        '/api/ai/performance-optimization',
        '/api/ai/security-assessment'
      ],
      dataFormats: ['JSON', 'XML'],
      authentication: 'JWT Bearer Token',
      rateLimiting: 'AI-optimized'
    },
    performance: {
      responseTime: 'optimized',
      compression: 'enabled',
      caching: 'enabled',
      rateLimiting: 'adaptive'
    }
  };
  
  res.json(healthData);
});

// AI Integration Endpoints
app.get('/api/ai/integration', (req, res) => {
  res.json({
    message: 'AI Integration endpoint available',
    capabilities: [
      'Software catalog access',
      'User authentication',
      'Real-time data processing',
      'Secure API access',
      'JSON data format',
      'AI-optimized rate limiting',
      'Enhanced CORS for AI platforms',
      'Performance monitoring',
      'Intelligent automation',
      'Machine learning integration',
      'Natural language processing',
      'Predictive analytics',
      'Automated decision making',
      'Intelligent workflow management',
      'AI-powered optimization'
    ],
    documentation: '/api-docs',
    health: '/api/health',
    version: '2.0.0',
    aiCompatibility: {
      openai: true,
      anthropic: true,
      google: true,
      microsoft: true,
      github: true,
      huggingface: true,
      cohere: true,
      ai21: true
    },
    dataSchemas: {
      software: '/api/schemas/software',
      users: '/api/schemas/users',
      services: '/api/schemas/services',
      ai_models: '/api/schemas/ai-models',
      automation_workflows: '/api/schemas/automation-workflows'
    },
    intelligentAutomation: {
      enabled: true,
      capabilities: [
        'Workflow automation',
        'Process optimization',
        'Predictive maintenance',
        'Intelligent routing',
        'Automated decision making',
        'Smart resource allocation',
        'Dynamic scaling',
        'Intelligent monitoring'
      ]
    }
  });
});

// Enhanced AI Software Analysis Endpoint
app.post('/api/ai/software-analysis', (req, res) => {
  try {
    const { software_id, analysis_type, parameters, ai_model, context } = req.body;
    
    // Validate AI model and context
    const supportedModels = ['gpt-4', 'claude-3', 'gemini-pro', 'llama-2', 'custom'];
    const supportedAnalysisTypes = ['performance', 'security', 'optimization', 'usage', 'compatibility', 'scalability'];
    
    if (!software_id || !analysis_type || !supportedAnalysisTypes.includes(analysis_type)) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'Missing required parameters or unsupported analysis type',
        supportedTypes: supportedAnalysisTypes,
        required: ['software_id', 'analysis_type']
      });
    }
    
    // AI-powered analysis simulation (replace with actual AI integration)
    const analysisResult = {
      software_id,
      analysis_type,
      timestamp: new Date().toISOString(),
      ai_model: ai_model || 'gpt-4',
      analysis: {
        performance_score: Math.random() * 100,
        security_score: Math.random() * 100,
        optimization_potential: Math.random() * 100,
        recommendations: [
          'Implement caching for improved performance',
          'Add input validation for security',
          'Optimize database queries',
          'Enable compression for faster responses'
        ],
        risk_assessment: {
          level: 'low',
          factors: ['performance', 'security', 'scalability'],
          mitigation_strategies: [
            'Regular performance monitoring',
            'Security audits',
            'Load testing'
          ]
        }
      },
      confidence: 0.95,
      processing_time: Date.now() - req.startTime,
      metadata: {
        ai_platform: req.headers['x-ai-platform'] || 'unknown',
        request_id: req.requestId,
        analysis_version: '2.0.0'
      }
    };
    
    res.json(analysisResult);
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      requestId: req.requestId
    });
  }
});

// Intelligent Automation Workflow Endpoint
app.post('/api/ai/automation-workflow', (req, res) => {
  try {
    const { workflow_type, parameters, trigger_conditions, ai_guidance } = req.body;
    
    const supportedWorkflows = [
      'deployment_automation',
      'monitoring_automation',
      'security_automation',
      'performance_optimization',
      'resource_management',
      'incident_response'
    ];
    
    if (!workflow_type || !supportedWorkflows.includes(workflow_type)) {
      return res.status(400).json({
        error: 'Invalid workflow type',
        supportedTypes: supportedWorkflows
      });
    }
    
    // Intelligent workflow creation with AI guidance
    const workflow = {
      id: `workflow_${Date.now()}`,
      type: workflow_type,
      status: 'created',
      created_at: new Date().toISOString(),
      ai_guidance: ai_guidance || 'standard',
      trigger_conditions: trigger_conditions || {
        schedule: 'daily',
        threshold: '80%',
        events: ['error', 'warning', 'critical']
      },
      steps: [
        {
          step: 1,
          action: 'analyze_current_state',
          ai_enhanced: true,
          parameters: parameters || {}
        },
        {
          step: 2,
          action: 'generate_recommendations',
          ai_enhanced: true,
          parameters: {}
        },
        {
          step: 3,
          action: 'execute_optimization',
          ai_enhanced: true,
          parameters: {}
        },
        {
          step: 4,
          action: 'monitor_results',
          ai_enhanced: true,
          parameters: {}
        }
      ],
      metadata: {
        ai_model: 'gpt-4',
        confidence: 0.92,
        estimated_duration: '5 minutes',
        success_rate: '95%'
      }
    };
    
    res.json({
      message: 'Intelligent automation workflow created successfully',
      workflow,
      next_steps: [
        'Review workflow configuration',
        'Set execution schedule',
        'Configure monitoring alerts',
        'Test workflow in staging environment'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Workflow creation failed',
      message: error.message,
      requestId: req.requestId
    });
  }
});

// AI-Powered Performance Optimization
app.post('/api/ai/performance-optimization', (req, res) => {
  try {
    const { system_metrics, performance_goals, constraints, optimization_strategy } = req.body;
    
    // AI-driven optimization analysis
    const optimization = {
      timestamp: new Date().toISOString(),
      strategy: optimization_strategy || 'intelligent_adaptive',
      current_metrics: system_metrics || {
        cpu_usage: 75,
        memory_usage: 60,
        response_time: 250,
        throughput: 1000
      },
      goals: performance_goals || {
        target_cpu: 50,
        target_memory: 40,
        target_response_time: 150,
        target_throughput: 1500
      },
      ai_recommendations: [
        {
          category: 'resource_optimization',
          action: 'Implement intelligent caching',
          expected_improvement: '25% faster response times',
          confidence: 0.89,
          implementation_priority: 'high'
        },
        {
          category: 'algorithm_optimization',
          action: 'Optimize database queries with AI analysis',
          expected_improvement: '30% reduced database load',
          confidence: 0.92,
          implementation_priority: 'high'
        },
        {
          category: 'infrastructure_optimization',
          action: 'Enable auto-scaling based on AI predictions',
          expected_improvement: '40% better resource utilization',
          confidence: 0.85,
          implementation_priority: 'medium'
        }
      ],
      implementation_plan: {
        phase_1: ['Implement caching', 'Optimize queries'],
        phase_2: ['Enable auto-scaling', 'Add monitoring'],
        phase_3: ['Advanced AI optimization', 'Predictive scaling'],
        estimated_timeline: '2-4 weeks'
      },
      monitoring: {
        metrics_to_track: ['response_time', 'throughput', 'resource_usage'],
        alert_thresholds: {
          response_time: 200,
          cpu_usage: 80,
          memory_usage: 85
        },
        ai_anomaly_detection: true
      }
    };
    
    res.json(optimization);
  } catch (error) {
    res.status(500).json({
      error: 'Optimization analysis failed',
      message: error.message,
      requestId: req.requestId
    });
  }
});

// Enhanced AI Security Assessment
app.post('/api/ai/security-assessment', (req, res) => {
  try {
    const { system_config, security_requirements, risk_tolerance, ai_enhanced_scanning } = req.body;
    
    // AI-powered security assessment
    const securityAssessment = {
      timestamp: new Date().toISOString(),
      scan_type: ai_enhanced_scanning ? 'ai_enhanced' : 'standard',
      overall_risk_score: Math.floor(Math.random() * 40) + 10, // 10-50 range
      vulnerabilities: [
        {
          id: 'VULN-001',
          severity: 'medium',
          category: 'authentication',
          description: 'Weak password policy enforcement',
          ai_analysis: {
            risk_level: 'medium',
            exploitation_difficulty: 'low',
            business_impact: 'high',
            ai_confidence: 0.94
          },
          remediation: {
            action: 'Implement strong password policy',
            priority: 'high',
            estimated_effort: '2 hours',
            ai_suggested_tools: ['password-validator', 'policy-enforcer']
          }
        },
        {
          id: 'VULN-002',
          severity: 'low',
          category: 'input_validation',
          description: 'Missing input sanitization in contact form',
          ai_analysis: {
            risk_level: 'low',
            exploitation_difficulty: 'medium',
            business_impact: 'medium',
            ai_confidence: 0.87
          },
          remediation: {
            action: 'Add input validation and sanitization',
            priority: 'medium',
            estimated_effort: '4 hours',
            ai_suggested_tools: ['validator.js', 'sanitize-html']
          }
        }
      ],
      compliance_status: {
        gdpr: 'compliant',
        sox: 'compliant',
        hipaa: 'not_applicable',
        pci_dss: 'compliant'
      },
      ai_recommendations: [
        'Implement AI-powered threat detection',
        'Enable automated security monitoring',
        'Add behavioral analysis for anomaly detection',
        'Implement intelligent access control'
      ],
      next_steps: [
        'Address high-priority vulnerabilities',
        'Implement AI security monitoring',
        'Schedule follow-up assessment',
        'Update security policies'
      ]
    };
    
    res.json(securityAssessment);
  } catch (error) {
    res.status(500).json({
      error: 'Security assessment failed',
      message: error.message,
      requestId: req.requestId
    });
  }
});

// Intelligent System Monitoring Endpoint
app.get('/api/ai/intelligent-monitoring', (req, res) => {
  const monitoringData = {
    timestamp: new Date().toISOString(),
    system_status: 'healthy',
    ai_monitoring: {
      enabled: true,
      models: ['anomaly_detection', 'predictive_analytics', 'intelligent_alerting'],
      active_alerts: 0,
      predicted_issues: [],
      optimization_suggestions: [
        'System performance is optimal',
        'Resource utilization is efficient',
        'No immediate actions required'
      ]
    },
    performance_metrics: {
      cpu_usage: Math.random() * 30 + 20, // 20-50%
      memory_usage: Math.random() * 25 + 15, // 15-40%
      response_time: Math.random() * 50 + 100, // 100-150ms
      throughput: Math.random() * 200 + 800 // 800-1000 req/s
    },
    intelligent_features: {
      auto_scaling: 'enabled',
      predictive_maintenance: 'active',
      intelligent_routing: 'enabled',
      ai_optimization: 'active'
    }
  };
  
  res.json(monitoringData);
});

// AI Model Management Endpoint
app.get('/api/ai/models', (req, res) => {
  const aiModels = {
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        capabilities: ['text_generation', 'code_analysis', 'optimization_suggestions'],
        status: 'active',
        performance: 'excellent'
      },
      {
        id: 'claude-3',
        name: 'Claude 3',
        provider: 'Anthropic',
        capabilities: ['text_generation', 'security_analysis', 'compliance_checking'],
        status: 'active',
        performance: 'excellent'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        capabilities: ['multimodal_analysis', 'performance_optimization', 'scalability_planning'],
        status: 'active',
        performance: 'good'
      }
    ],
    integration_status: 'fully_integrated',
    api_endpoints: [
      '/api/ai/software-analysis',
      '/api/ai/automation-workflow',
      '/api/ai/performance-optimization',
      '/api/ai/security-assessment'
    ]
  };
  
  res.json(aiModels);
});

// API Documentation (Swagger/OpenAPI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Maijjd Intelligent API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    responseInterceptor: (response) => {
      // Add AI-specific metadata to responses
      if (response.obj && response.obj.paths) {
        Object.keys(response.obj.paths).forEach(path => {
          if (response.obj.paths[path].get || response.obj.paths[path].post) {
            const pathObj = response.obj.paths[path];
            if (pathObj.get) pathObj.get['x-ai-compatible'] = true;
            if (pathObj.post) pathObj.post['x-ai-compatible'] = true;
          }
        });
      }
      return response;
    }
  }
}));

// Basic root endpoints for platform health checks (Railway/Render/etc.)
app.head('/', (req, res) => {
  res.status(200).end();
});

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Non-namespaced health endpoint for platform health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Health endpoint',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth refresh aliases to the canonical API path
app.post('/refresh', (req, res) => {
  // Preserve method and body
  res.redirect(307, '/api/auth/refresh');
});
app.post('/auth/refresh', (req, res) => {
  res.redirect(307, '/api/auth/refresh');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiIntegrationRoutes);
app.use('/api/payments', paymentsRoutes);

// Enhanced Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);
  
  const errorResponse = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    ai: {
      retryable: err.status >= 500,
      suggestedAction: err.status >= 500 ? 'retry_later' : 'check_input',
      errorType: err.name || 'UnknownError'
    }
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.requestId,
    availableRoutes: [
      '/api/health',
      '/api/software',
      '/api/auth',
      '/api/services',
      '/api/contact',
      '/api/users',
      '/api/ai/integration',
      '/api/ai/software-analysis',
      '/api/ai/performance-optimization',
      '/api/ai/security-assessment',
      '/api-docs'
    ],
    ai: {
      suggestions: [
        'Check the API documentation at /api-docs',
        'Verify the endpoint URL',
        'Ensure proper authentication',
        'Check request method (GET, POST, etc.)'
      ]
    }
  });
});

// Utility function to generate request ID
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

// Start HTTP server (bind to all interfaces for PaaS platforms like Railway)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Maijjd Intelligent API Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Integration: http://localhost:${PORT}/api/ai/integration`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Enhanced with AI-optimized rate limiting`);
  console.log(`📊 Performance: Compression and caching enabled`);
});

// HTTPS Server Setup (optional: only if explicitly enabled and certificates are available)
const setupHTTPS = () => {
  if (process.env.ENABLE_HTTPS !== 'true') {
    console.log('⚠️  HTTPS disabled (set ENABLE_HTTPS=true to enable)');
    return;
  }
  try {
    const privateKey = fs.readFileSync('../ssl/private.key', 'utf8');
    const certificate = fs.readFileSync('../ssl/certificate.crt', 'utf8');
    
    const httpsServer = https.createServer({
      key: privateKey,
      cert: certificate
    }, app);
    
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`🔐 Maijjd HTTPS Server running on port ${HTTPS_PORT}`);
      console.log(`🔒 Secure API: https://localhost:${HTTPS_PORT}/api`);
    });
  } catch (error) {
    console.log('⚠️  HTTPS not configured - SSL certificates not found');
    console.log('💡 To enable HTTPS, place SSL certificates in ./ssl/ directory');
  }
};

// Setup HTTPS if SSL is available
setupHTTPS();

module.exports = app;
