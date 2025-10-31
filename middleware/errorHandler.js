/**
 * Global Error Handler Middleware
 * Provides consistent error handling and performance monitoring
 */

const monitoring = require('../monitoring-setup');

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error for monitoring
  monitoring.logError(err, req, {
    endpoint: req.path,
    method: req.method,
    body: req.body
  });

  // Determine error status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Determine error message
  const message = err.message || 'Internal Server Error';
  
  // Build error response
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Include validation errors if present
  if (err.validationErrors) {
    errorResponse.validationErrors = err.validationErrors;
  }

  // Include error code if present
  if (err.code) {
    errorResponse.code = err.code;
  }

  res.status(statusCode).json(errorResponse);
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests (>1 second)
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow request detected: ${req.method} ${req.path} took ${responseTime}ms`);
    }
    
    // Add performance header
    res.set('X-Response-Time', `${responseTime}ms`);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  asyncHandler,
  errorHandler,
  performanceMonitor,
  notFoundHandler
};

