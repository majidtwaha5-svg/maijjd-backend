#!/usr/bin/env node

/**
 * Initialize Default Users Script
 * Creates default admin and test users for the Maijjd application
 */

const mongoose = require('mongoose');
const User = require('./models/User');

async function initializeUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maijjd';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create default admin user
    await User.createDefaultAdmin();
    
    // Create test users
    await User.createTestUsers();
    
    console.log('✅ All users initialized successfully');
    
    // List all users
    const users = await User.find({}).select('-password');
    console.log('\n📋 Current users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

initializeUsers();