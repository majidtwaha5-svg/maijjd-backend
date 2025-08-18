// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint for Railway health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Maijjd Backend is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Simple health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Maijjd Backend is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
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

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Maijjd Backend API',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      '/',
      '/health',
      '/api/health',
      '/api'
    ]
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Maijjd Backend API',
    version: '2.0.0',
    description: 'Backend API for Maijjd Platform',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/',
      '/health',
      '/api/health',
      '/api',
      '/api/info'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Maijjd Backend running on port ${PORT}`);
  console.log(`🔍 Root Health Check: http://localhost:${PORT}/`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
