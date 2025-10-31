const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function fixAdminUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maijjd';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    let adminUser = await User.findOne({ email: 'admin@maijjd.com' });
    
    if (adminUser) {
      console.log('✅ Admin user found, updating password...');
      adminUser.password = 'password';
      adminUser.role = 'admin';
      adminUser.status = 'active';
      await adminUser.save();
      console.log('✅ Admin password updated to: password');
    } else {
      console.log('❌ Admin user not found, creating new one...');
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@maijjd.com',
        password: 'password',
        role: 'admin',
        status: 'active',
        subscription: 'enterprise',
        emailVerified: true
      });
      await adminUser.save();
      console.log('✅ New admin user created');
    }

    // Test the login
    const testUser = await User.findOne({ email: 'admin@maijjd.com' });
    const isValidPassword = await testUser.comparePassword('password');
    console.log('✅ Password test result:', isValidPassword);

    console.log('✅ Admin user fix completed');
    console.log('📧 Email: admin@maijjd.com');
    console.log('🔑 Password: password');
    console.log('👤 Role: admin');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
    process.exit(1);
  }
}

fixAdminUser();
