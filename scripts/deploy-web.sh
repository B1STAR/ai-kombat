#!/bin/bash
# Deploy frontend to Vercel

set -e

echo "🚀 Deploying web to Vercel..."

cd apps/web

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Deploy
vercel --prod

echo "✅ Deployed!"
