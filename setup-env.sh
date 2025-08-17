#!/bin/bash

# Backend Environment Setup Script
echo "🔧 Setting up backend environment variables..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Server Configuration
PORT=5001
HTTPS_PORT=5002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=maijjd-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=24h

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/maijjd_db
MONGODB_URI_PROD=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/maijjd_db

# AI Integration Configuration
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# Twilio Configuration (for SMS/voice features)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=maijjd-session-secret-change-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
LOG_FILE=server.log

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,https://maijjd.com,https://www.maijjd.com

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_VOICE_FEATURES=true
ENABLE_PREMIUM_FEATURES=true
ENABLE_ANALYTICS=true

# Monitoring
ENABLE_HEALTH_CHECKS=true
ENABLE_METRICS=true
ENABLE_LOGGING=true
EOF

    echo "✅ .env file created successfully!"
    echo "⚠️  Please update the API keys and sensitive information in the .env file"
    echo "🔑 You can get API keys from:"
    echo "   - OpenAI: https://platform.openai.com/api-keys"
    echo "   - Anthropic: https://console.anthropic.com/"
    echo "   - Google AI: https://makersuite.google.com/app/apikey"
else
    echo "✅ .env file already exists"
fi

# Set proper permissions
chmod 600 .env

echo "🔐 Environment setup complete!"
echo "🚀 You can now start the backend server with: npm start"
