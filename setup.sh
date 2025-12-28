#!/bin/bash

# FinBoard Setup Script
# This script helps you set up the FinBoard application

echo "🎯 FinBoard Setup Script"
echo "========================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
else
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your Alpha Vantage API key!"
    echo ""
    echo "Steps to get your API key:"
    echo "1. Visit: https://www.alphavantage.co/support/#api-key"
    echo "2. Click 'GET FREE API KEY'"
    echo "3. Fill in the form and get your key"
    echo "4. Open .env.local and replace 'demo' with your key"
    echo ""
    read -p "Press Enter when you've added your API key..."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting development server..."
echo ""
echo "📊 FinBoard will be available at:"
echo "   http://localhost:3000"
echo ""
echo "💡 Tips:"
echo "   - Add widgets using the 'Add Widget' button"
echo "   - Drag widgets to rearrange them"
echo "   - Toggle dark mode with the moon/sun icon"
echo "   - Export your dashboard to save your layout"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Full documentation"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - DEPLOYMENT.md - How to deploy"
echo ""
echo "Starting server..."
npm run dev
