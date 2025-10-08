#!/bin/bash

# Generate Secure Secrets for Vercel Deployment
# Run this script to generate secure random secrets for your environment variables

echo "🔐 Generating Secure Secrets for Deployment..."
echo ""
echo "Copy these values to your Vercel environment variables:"
echo "=========================================================="
echo ""

echo "JWT_SECRET (64 characters):"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo ""

echo "ENCRYPTION_KEY (32 characters - IMPORTANT: Must be exactly 32 chars):"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
echo ""

echo "=========================================================="
echo "✅ Secrets generated successfully!"
echo ""
echo "⚠️  IMPORTANT:"
echo "  - Copy these secrets immediately and store them securely"
echo "  - Never commit these secrets to git"
echo "  - Use the same secrets across all environments (development, staging, production)"
echo "  - If you lose these secrets, you'll need to regenerate and re-encrypt all data"
echo ""
echo "📝 Next steps:"
echo "  1. Add these to your Vercel project environment variables"
echo "  2. Set up MongoDB Atlas connection string"
echo "  3. Configure email credentials (Gmail app password)"
echo "  4. Deploy your application"
echo ""
