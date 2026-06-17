#!/bin/bash
# Setup development environment
# Run this once after cloning the repo

set -e

echo "🚀 Setting up AI Kombat development environment..."

# Check Bun
if ! command -v bun &> /dev/null; then
  echo "❌ Bun is not installed. Install it: https://bun.sh"
  echo "   curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

echo "✅ Bun found: $(bun --version)"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Copy .env.example to .env
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env with your secrets before continuing"
fi

# API
if [ ! -f apps/api/.env ]; then
  cp .env apps/api/.env
fi

# Web
if [ ! -f apps/web/.env.local ]; then
  cp .env apps/web/.env.local
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Supabase, Upstash, and Telegram bot credentials"
echo "  2. Run: bun run db:migrate   (to create the DB schema)"
echo "  3. Run: bun run db:seed      (to insert initial modules, quests, etc.)"
echo "  4. Run: bun run dev          (to start the API and web dev servers)"
echo ""
echo "📖 Full documentation: see README.md and /docs folder"
