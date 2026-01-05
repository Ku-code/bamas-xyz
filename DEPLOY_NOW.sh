#!/bin/bash

# ============================================
# DocuSeal Edge Function Deployment Script
# ============================================
# Run this script in your terminal to deploy the Edge Function
#
# Usage: ./DEPLOY_NOW.sh
# ============================================

set -e  # Exit on error

echo "🚀 Starting DocuSeal Edge Function Deployment..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Installing via Homebrew..."
    brew install supabase/tap/supabase
fi

echo "✅ Supabase CLI version: $(supabase --version)"
echo ""

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in. Opening browser for authentication..."
    supabase login
else
    echo "✅ Already logged in"
fi
echo ""

# Navigate to project directory
cd /Users/kuzo/Documents/GitHub/bama-digital-forge
echo "📁 Working directory: $(pwd)"
echo ""

# Link to project (if not already linked)
echo "🔗 Linking to Supabase project..."
supabase link --project-ref swgnchtjypwkxveffrpl || echo "Already linked"
echo ""

# Set DocuSeal API key secret
echo "🔐 Setting DocuSeal API key secret..."
supabase secrets set DOCUSEAL_API_KEY=Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz
echo ""

# Verify secret is set
echo "🔍 Verifying secrets..."
supabase secrets list
echo ""

# Deploy the Edge Function
echo "🚀 Deploying Edge Function..."
supabase functions deploy docuseal-proxy
echo ""

# Show function URL
echo "✅ Deployment complete!"
echo ""
echo "📋 Edge Function URL:"
echo "   https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy"
echo ""
echo "🧪 Test the deployment:"
echo "   1. Go to https://bamas.xyz/dashboard"
echo "   2. Create a Critical document with a PDF"
echo "   3. Check browser console for success messages"
echo ""
echo "📊 Monitor logs:"
echo "   supabase functions logs docuseal-proxy --follow"
echo ""
echo "🎉 Done! Your DocuSeal integration should now be working!"

