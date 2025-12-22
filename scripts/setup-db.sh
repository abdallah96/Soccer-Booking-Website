#!/bin/bash

# Database setup script for Petit Camp
# This script helps you set up the database

echo "🗄️  Petit Camp Database Setup"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "   Please create .env.local with your Supabase credentials"
    exit 1
fi

echo "✅ Found .env.local"
echo ""

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing required environment variables!"
    echo "   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""
echo "📋 Next steps:"
echo "   1. Run migrations in Supabase SQL Editor (see DATABASE_SETUP.md)"
echo "   2. Run: npm run seed"
echo ""
echo "   Or run migrations manually with: npm run migrate"
echo ""

