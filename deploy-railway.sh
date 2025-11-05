#!/bin/bash
# Railway Deployment Script
export RAILWAY_TOKEN=c9b4bd49-b3d9-4a14-a2fb-fe3547021bdf

# Try Railway CLI deployment
if command -v railway &> /dev/null; then
  echo "🚂 Deploying to Railway..."
  railway up --detach || railway deploy --detach || echo "⚠️  Railway CLI deployment failed. Please use Railway dashboard."
else
  echo "⚠️  Railway CLI not found. Please deploy via dashboard at https://railway.app"
fi

echo ""
echo "✅ Backend code is ready for deployment"
echo "📋 Manual deployment steps:"
echo "   1. Go to https://railway.app"
echo "   2. Select 'maijjd-backend' project"
echo "   3. Click 'Deploy' or trigger new deployment"
