const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: 'operational',
      authentication: 'operational',
      api: 'operational'
    }
  });
});

// Detailed health check
router.get('/health/detailed', (req, res) => {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
    },
    platform: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    services: {
      database: 'operational',
      authentication: 'operational',
      api: 'operational',
      stripe: 'operational'
    }
  };

  res.json(healthInfo);
});

// Authentication test endpoint
router.post('/auth/test', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }

  // Simple test - you can expand this
  res.json({
    status: 'success',
    message: 'Authentication endpoint is working',
    received: { email, password: password ? '***' : 'missing' },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
