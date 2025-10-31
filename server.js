// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// MJND Agent imports
const MJNDAgent = require('./maijjd-ai-agent');
const MaijjdAPIIntegration = require('./maijjd-api-integration');
const monitoring = require('./monitoring-setup');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize MJND Agent
const mjndAgent = new MJNDAgent();

// Initialize API Integration
const apiIntegration = new MaijjdAPIIntegration();

// Configure CORS for frontend access
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://maijjd.com',
    'https://www.maijjd.com',
    'https://frontend-maijjd-*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configure Helmet with custom CSP
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        "https://maijjd-backend-production-ad65.up.railway.app",
        "https://api.maijjd.com",
        "wss:",
        "ws:"
      ],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
};

// Basic middleware
app.use(helmet(helmetConfig));
app.use(compression());
app.use(morgan('combined'));

// Performance monitoring and error handling
const { performanceMonitor, errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(performanceMonitor);

// Rate limiting for MJND Agent
const mjndLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors({
  origin: [
    'https://maijjd.com',
    'https://www.maijjd.com',
    'https://api.maijjd.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MJND Agent monitoring middleware
app.use(monitoring.middleware());

// Simple health check for Railway
app.get('/health', (req, res) => {
  const healthStatus = monitoring.getHealthStatus();
  res.status(200).json({ 
    status: healthStatus.status,
    message: 'Maijjd Backend is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mjndAgent: {
      status: 'active',
      issues: healthStatus.issues,
      metrics: healthStatus.metrics
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Maijjd API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Mount API routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const usersRoutes = require('./routes/users');
const softwareRoutes = require('./routes/software');
const servicesRoutes = require('./routes/services');
const aiIntegrationRoutes = require('./routes/ai-integration');
const stripeRoutes = require('./routes/stripe-api');
const adminRoutes = require('./routes/admin');
const developerRoutes = require('./routes/developer');

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/ai', aiIntegrationRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/developer', developerRoutes);

// MJND Agent routes
app.post('/api/mjnd/chat', mjndLimiter, async (req, res) => {
  try {
    const { message, user } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long (max 1000 characters)'
      });
    }

    const result = await mjndAgent.processMessage(message, user || {});
    
    // Add intent to request body for monitoring
    req.body.intent = result.intent;
    
    res.json(result);
  } catch (error) {
    console.error('Error in MJND chat endpoint:', error);
    
    // Log error for monitoring
    monitoring.logError(error, req, { endpoint: '/api/mjnd/chat' });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// MJND Agent info endpoint
app.get('/api/mjnd/info', (req, res) => {
  res.json(mjndAgent.getAgentInfo());
});

// MJND Agent conversation history endpoint
app.get('/api/mjnd/history', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  const history = mjndAgent.getConversationHistory();
  res.json({
    success: true,
    history: history,
    total: history.length
  });
});

// MJND Agent webhook endpoints
app.post('/api/mjnd/webhooks/customer-message', (req, res) => {
  apiIntegration.handleCustomerMessage(req, res);
});

app.post('/api/mjnd/webhooks/payment-update', (req, res) => {
  apiIntegration.handlePaymentUpdate(req, res);
});

app.post('/api/mjnd/webhooks/user-registration', (req, res) => {
  apiIntegration.handleUserRegistration(req, res);
});

// MJND Agent monitoring endpoints
app.get('/api/mjnd/metrics', (req, res) => {
  res.json(monitoring.getMetrics());
});

app.get('/api/mjnd/health', (req, res) => {
  const healthStatus = monitoring.getHealthStatus();
  res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
});

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Maijjd Backend API',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      '/api/auth',
      '/api/contact',
      '/api/users',
      '/api/software',
      '/api/services',
      '/api/ai',
      '/api/stripe',
      '/api/admin',
      '/api/developer',
      '/api/mjnd'
    ]
  });
});

// 404 handler - must be after all routes
app.use('*', notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server with database connection
const startServer = async () => {
  try {
    // Initialize MJND Agent API Integration
    await apiIntegration.initialize();
    apiIntegration.setAgent(mjndAgent);
    console.log('✅ MJND Agent initialized successfully');
    
    // Try to connect to database (optional)
    const dbConnection = await connectDB();
    
    if (dbConnection) {
      // Initialize database with default admin user
      const User = require('./models/User');
      await User.createDefaultAdmin();
      console.log('✅ Database initialized with default admin');
    } else {
      console.log('⚠️ Running without database connection');
    }
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Maijjd Backend running on port ${PORT}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`🤖 MJND Agent: http://localhost:${PORT}/api/mjnd/info`);
      console.log(`💬 MJND Chat: http://localhost:${PORT}/api/mjnd/chat`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Still try to start the server even if database fails
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Maijjd Backend running on port ${PORT} (without database)`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
      console.log(`🤖 MJND Agent: http://localhost:${PORT}/api/mjnd/info`);
      console.log(`💬 MJND Chat: http://localhost:${PORT}/api/mjnd/chat`);
    });
  }
};

startServer();

module.exports = app;
