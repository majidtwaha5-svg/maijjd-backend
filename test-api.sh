#!/bin/bash

echo "🧪 Running Maijjd API Tests..."
echo "=================================="

# Check if server is running
if ! curl -s http://localhost:5001/api/health > /dev/null; then
    echo "❌ Backend server is not running on port 5001"
    echo "Please start the server first with: npm start"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Run tests
echo "Running test suite..."
npm test

echo ""
echo "=================================="
echo "🎯 Test execution completed!"
