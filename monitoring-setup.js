/**
 * MJND Agent Monitoring and Logging Setup
 * This script sets up monitoring for the MJND Agent in production
 */

const fs = require('fs');
const path = require('path');

class MJNDMonitoring {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      errors: [],
      intents: {},
      userTypes: {},
      startTime: new Date()
    };
    
    this.setupLogging();
  }

  setupLogging() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Set up log rotation
    this.setupLogRotation();
  }

  setupLogRotation() {
    // Log rotation every 24 hours
    setInterval(() => {
      this.rotateLogs();
    }, 24 * 60 * 60 * 1000);
  }

  rotateLogs() {
    const logsDir = path.join(__dirname, 'logs');
    const today = new Date().toISOString().split('T')[0];
    
    // Create new log file for today
    const logFile = path.join(logsDir, `mjnd-agent-${today}.log`);
    
    console.log(`🔄 Rotating logs to: ${logFile}`);
  }

  logRequest(req, res, responseTime, success, intent, userType) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      responseTime,
      success,
      intent,
      userType,
      userId: req.body?.user?.id || 'anonymous'
    };

    // Update metrics
    this.updateMetrics(success, responseTime, intent, userType);

    // Write to log file
    this.writeToLog(logEntry);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 MJND Request: ${JSON.stringify(logEntry)}`);
    }
  }

  updateMetrics(success, responseTime, intent, userType) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update response times
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift(); // Keep only last 1000
    }

    // Calculate average response time
    this.metrics.averageResponseTime = 
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;

    // Update intent distribution
    if (intent) {
      this.metrics.intents[intent] = (this.metrics.intents[intent] || 0) + 1;
    }

    // Update user type distribution
    if (userType) {
      this.metrics.userTypes[userType] = (this.metrics.userTypes[userType] || 0) + 1;
    }
  }

  writeToLog(logEntry) {
    const logsDir = path.join(__dirname, 'logs');
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logsDir, `mjnd-agent-${today}.log`);
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  logError(error, req, context = {}) {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      timestamp,
      error: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      context
    };

    this.metrics.errors.push(errorEntry);
    
    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    // Write to error log
    this.writeToErrorLog(errorEntry);
  }

  writeToErrorLog(errorEntry) {
    const logsDir = path.join(__dirname, 'logs');
    const today = new Date().toISOString().split('T')[0];
    const errorLogFile = path.join(logsDir, `mjnd-agent-errors-${today}.log`);
    
    const logLine = JSON.stringify(errorEntry) + '\n';
    
    try {
      fs.appendFileSync(errorLogFile, logLine);
    } catch (error) {
      console.error('Error writing to error log file:', error);
    }
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime.getTime();
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    
    return {
      ...this.metrics,
      uptime: `${uptimeHours}h`,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      errorRate: this.metrics.totalRequests > 0
        ? (this.metrics.failedRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      requestsPerHour: this.metrics.totalRequests / Math.max(uptimeHours, 1)
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const errorRate = parseFloat(metrics.errorRate);
    const avgResponseTime = metrics.averageResponseTime;

    let status = 'healthy';
    let issues = [];

    if (errorRate > 10) {
      status = 'unhealthy';
      issues.push('High error rate: ' + metrics.errorRate);
    }

    if (avgResponseTime > 5000) {
      status = 'degraded';
      issues.push('Slow response time: ' + avgResponseTime.toFixed(2) + 'ms');
    }

    if (metrics.errors.length > 50) {
      status = 'degraded';
      issues.push('High error count: ' + metrics.errors.length);
    }

    return {
      status,
      issues,
      metrics: {
        uptime: metrics.uptime,
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
        errorRate: metrics.errorRate,
        averageResponseTime: avgResponseTime.toFixed(2) + 'ms',
        requestsPerHour: metrics.requestsPerHour.toFixed(2)
      }
    };
  }

  // Express middleware for request logging
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        
        // Determine if request was successful
        const success = res.statusCode >= 200 && res.statusCode < 400;
        
        // Extract intent and user type from request body
        const intent = req.body?.intent || 'unknown';
        const userType = req.body?.user?.isAuthenticated ? 'authenticated' : 'anonymous';
        
        // Log the request
        if (req.url.includes('/api/mjnd/')) {
          monitoring.logRequest(req, res, responseTime, success, intent, userType);
        }
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }
}

// Global monitoring instance
const monitoring = new MJNDMonitoring();

module.exports = monitoring;
