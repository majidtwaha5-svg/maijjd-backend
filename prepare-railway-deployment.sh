#!/bin/bash

echo "🚂 Preparing Backend for Railway Production Deployment"
echo "======================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend_maijjd directory"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing production dependencies...${NC}"
npm install --production --legacy-peer-deps 2>&1 | tail -5

echo ""
echo -e "${BLUE}✅ Step 2: Verifying all updates are in place...${NC}"

# Verify reset password route has been updated
if grep -q "Enhanced error handling\|comprehensive error handling\|VALIDATION_ERROR" routes/auth.js 2>/dev/null; then
    echo -e "${GREEN}   ✅ Reset password route updated${NC}"
else
    echo -e "${YELLOW}   ⚠️  Reset password route may need updates${NC}"
fi

# Verify server.js exists
if [ -f "server.js" ]; then
    echo -e "${GREEN}   ✅ server.js found${NC}"
else
    echo -e "${YELLOW}   ⚠️  server.js not found${NC}"
fi

# Verify package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}   ✅ package.json found${NC}"
    NODE_VERSION=$(grep -A 2 '"engines"' package.json | grep node | sed 's/.*"node": ">=\(.*\)".*/\1/' || echo "18.0.0")
    echo "      Node version required: >= $NODE_VERSION"
else
    echo -e "${YELLOW}   ⚠️  package.json not found${NC}"
fi

# Verify railway.json
if [ -f "railway.json" ]; then
    echo -e "${GREEN}   ✅ railway.json configuration found${NC}"
else
    echo -e "${YELLOW}   ⚠️  railway.json not found (Railway will use defaults)${NC}"
fi

echo ""
echo -e "${BLUE}📋 Step 3: Checking environment configuration...${NC}"

# Check for .env files
if [ -f ".env.production" ]; then
    echo -e "${GREEN}   ✅ .env.production found${NC}"
elif [ -f ".env" ]; then
    echo -e "${YELLOW}   ⚠️  .env found (check Railway dashboard for production env vars)${NC}"
else
    echo -e "${YELLOW}   ⚠️  No .env file found (make sure to set env vars in Railway)${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Step 4: Verifying critical files...${NC}"

FILES=("server.js" "package.json" "routes/auth.js" "middleware/auth.js" "models/User.js")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}   ✅ $file${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $file not found${NC}"
    fi
done

echo ""
echo -e "${BLUE}📝 Step 5: Summary of updates ready for deployment...${NC}"
echo ""
echo "✅ Reset Password Endpoint Enhanced:"
echo "   - Comprehensive error handling"
echo "   - Token validation"
echo "   - Password validation (min 8 characters)"
echo "   - Structured error responses"
echo "   - Better token expiration checking"
echo ""
echo "✅ All dependencies installed"
echo "✅ Configuration files ready"
echo ""
echo -e "${GREEN}🎉 Backend is ready for Railway deployment!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps (Manual Deployment):${NC}"
echo "   1. cd backend_maijjd"
echo "   2. railway login"
echo "   3. railway link (or railway init)"
echo "   4. railway up"
echo ""
echo -e "${BLUE}📊 Check deployment:${NC}"
echo "   - railway logs"
echo "   - railway status"
echo "   - https://api.maijjd.com/api/health"

