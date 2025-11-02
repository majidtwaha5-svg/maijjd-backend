#!/bin/bash
# Quick Railway Deployment Script
# This script will authenticate and deploy the backend

set -e

echo "🚂 Railway Backend Deployment"
echo "=============================="
echo ""

cd "$(dirname "$0")"

# Step 1: Authenticate
echo "Step 1: Railway Authentication"
echo "-------------------------------"
echo ""

if railway whoami &> /dev/null; then
    echo "✅ Already authenticated"
    railway whoami
else
    echo "⚠️  Need to authenticate with Railway"
    echo ""
    echo "Please run this command manually:"
    echo "  railway login"
    echo ""
    echo "Then run this script again:"
    echo "  ./DEPLOY_NOW.sh"
    exit 1
fi

echo ""
echo "Step 2: Link Project"
echo "-------------------"
echo ""

if railway status &> /dev/null; then
    echo "✅ Project already linked"
else
    echo "🔗 Linking to Railway project..."
    railway link
fi

echo ""
echo "Step 3: Deploy to Production"
echo "----------------------------"
echo ""

echo "🚀 Deploying backend with latest changes..."
railway up --environment production

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next steps:"
echo "   - View logs: railway logs"
echo "   - Check status: railway status"
echo "   - View URL: railway domain"

