const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maijjd';
    console.log('📡 Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected successfully');
    
    // Test if we can query the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections found:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Database connection test completed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testDatabaseConnection();
