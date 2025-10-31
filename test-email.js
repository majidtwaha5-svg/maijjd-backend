#!/usr/bin/env node

// Test script for Maijjd Email Service
// Run with: node test-email.js

require('dotenv').config();
const EmailService = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Maijjd Email Service...\n');

  try {
    // Initialize email service
    const emailService = new EmailService();

    // Test 1: Connection test
    console.log('1️⃣ Testing email service connection...');
    const connectionTest = await emailService.testConnection();
    
    if (connectionTest) {
      console.log('✅ Email service connection successful\n');
    } else {
      console.log('❌ Email service connection failed\n');
      return;
    }

    // Test 2: Send test customer confirmation
    console.log('2️⃣ Testing customer confirmation email...');
    const testData = {
      name: 'Test Customer',
      email: process.env.TEST_EMAIL || 'test@example.com',
      company: 'Test Company Inc',
      message: 'This is a test message to verify that the email service is working correctly. Please ignore this email.',
      service: 'test-service'
    };

    const customerResult = await emailService.sendCustomerConfirmation(testData);
    if (customerResult) {
      console.log('✅ Customer confirmation email sent successfully\n');
    } else {
      console.log('❌ Customer confirmation email failed\n');
    }

    // Test 3: Send test team notification
    console.log('3️⃣ Testing team notification email...');
    const teamResult = await emailService.sendTeamNotification(testData);
    if (teamResult) {
      console.log('✅ Team notification email sent successfully\n');
    } else {
      console.log('❌ Team notification email failed\n');
    }

    // Test 4: Test both emails together
    console.log('4️⃣ Testing both emails together...');
    const bothResults = await emailService.sendContactEmails(testData);
    console.log('📧 Email results:', bothResults);

    console.log('\n🎉 Email service test completed!');
    console.log('\n📋 Summary:');
    console.log(`   Customer Email: ${bothResults.customerEmailSent ? '✅ Sent' : '❌ Failed'}`);
    console.log(`   Team Email: ${bothResults.teamEmailSent ? '✅ Sent' : '❌ Failed'}`);
    
    if (bothResults.customerError) {
      console.log(`   Customer Error: ${bothResults.customerError}`);
    }
    if (bothResults.teamError) {
      console.log(`   Team Error: ${bothResults.teamError}`);
    }

  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has correct SMTP settings');
    console.log('2. Verify your email credentials');
    console.log('3. Check if your email provider allows SMTP access');
    console.log('4. For Gmail, make sure you have an App Password');
  }
}

// Run the test
if (require.main === module) {
  testEmailService();
}

module.exports = testEmailService;
