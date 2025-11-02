#!/bin/bash

echo "🚂 Railway Backend Deployment Script"
echo "======================================"
echo ""

cd "$(dirname "$0")"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if already authenticated
echo "🔐 Checking Railway authentication..."
if railway whoami &> /dev/null; then
    echo "✅ Already authenticated to Railway"
    RAILWAY_USER=$(railway whoami 2>/dev/null)
    echo "   Logged in as: $RAILWAY_USER"
else
    echo ""
    echo "⚠️  Railway authentication required"
    echo ""
    echo "Please choose an authentication method:"
    echo ""
    echo "Option 1: Browser Login (Recommended)"
    echo "  Run: railway login"
    echo "  This will open your browser for authentication"
    echo ""
    echo "Option 2: Token-based Login"
    echo "  If you have a Railway token, set it:"
    echo "  export RAILWAY_TOKEN=your-token-here"
    echo "  Then run this script again"
    echo ""
    echo "To get a token:"
    echo "  1. Visit: https://railway.app/account/tokens"
    echo "  2. Click 'Create New Token'"
    echo "  3. Copy the token and export it"
    echo ""
    read -p "Do you want to proceed with browser login now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway login
    else
        echo "Please authenticate manually and run this script again."
        exit 1
    fi
fi

echo ""
echo "📦 Checking project link..."
if ! railway status &> /dev/null; then
    echo "🔗 Linking to Railway project..."
    echo "   Please select your project when prompted"
    railway link
fi

echo ""
echo "🚀 Deploying backend to Railway production..."
railway up --environment production

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backend deployment successful!"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: railway logs"
    echo "   Check status: railway status"
    echo "   View domain: railway domain"
else
    echo ""
    echo "❌ Deployment failed"
    echo "📋 Check logs: railway logs"
    exit 1
fi

