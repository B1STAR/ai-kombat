# 🤖 AI Kombat

> A Telegram Mini App tap-to-earn game on the theme of AI.
> Forked and adapted from [mudachyo/quackup-app](https://github.com/nikandr-surkov/Hamster-Kombat-Telegram-Mini-App-Clone) (the only public repo with a real prod-ready backend).

---

## 📚 Documentation

Read the full design and architecture before diving into code:

- **[VISION.md](./docs/VISION.md)** — Game Design Document (concept, mechanics, economy, roadmap)
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Technical architecture (stack, DB, API, auth)
- **[ARCHITECTURE_ADDENDUM.md](./docs/ARCHITECTURE_ADDENDUM.md)** — Phase 2+ endpoints (ads, datasets B2B, cash-out, token)
- **[MONETIZATION.md](./docs/MONETIZATION.md)** — Monetization & cash-out plan (6 revenue sources, datasets B2B)
- **[EXECUTIVE_SUMMARY.md](./docs/EXECUTIVE_SUMMARY.md)** — 1-page pitch summary

---

## 🚀 Quick start (local development)

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Node.js](https://nodejs.org) >= 20 (as backup)
- [Git](https://git-scm.com)
- A [Supabase](https://supabase.com) account (free)
- An [Upstash](https://upstash.com) account (free)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### Setup

```bash
# Clone the repo
git clone https://github.com/B1STAR/ai-kombat.git
cd ai-kombat

# Install dependencies (uses Bun workspaces)
bun install

# Copy env example and fill in your values
cp .env.example .env
# Edit .env with your secrets (NEVER commit this file)

# Run database migrations
bun run db:migrate

# Seed the database with base modules, quests, achievements
bun run db:seed

# Start the dev servers (both API and web)
bun run dev
```

The API will be on `http://localhost:3001` and the web on `http://localhost:3000`.

### Testing the Telegram Mini App locally

1. Install [ngrok](https://ngrok.com) and run `ngrok http 3000`
2. In @BotFather, edit your bot → Bot Settings → Menu Button → set URL to your ngrok URL
3. Open your bot in Telegram and click the menu button

---

## 🏗️ Architecture overview

```
ai-kombat/
├── apps/
│   ├── web/              # Next.js 14 (Telegram Mini App frontend)
│   │   ├── app/          # Pages: /game, /tasks, /quests, /shop, etc.
│   │   ├── components/   # UI components
│   │   └── lib/          # Telegram SDK, API client, hooks
│   │
│   └── api/              # Backend (Bun + Hono + TypeScript)
│       ├── src/
│       │   ├── routes/   # REST endpoints (30+)
│       │   ├── services/ # Business logic
│       │   ├── middlewares/  # auth, rateLimit, antiCheat
│       │   ├── workers/  # Cron jobs
│       │   └── bot/      # Telegraf Telegram bot
│       ├── migrations/   # 14 SQL files (Postgres)
│       └── seeds/        # Initial data (modules, quests, etc.)
│
├── packages/
│   └── shared/           # Shared types between front and back
│
├── docs/                 # Design and architecture documentation
└── scripts/              # Utility scripts
```

**Stack**:
- Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- Backend: Bun + Hono + TypeScript
- Database: Supabase (Postgres) + Upstash (Redis)
- Auth: Telegram initData HMAC validation
- Bot: Telegraf (Telegram Bot API)
- Deployment: Vercel (web) + Fly.io (API)

---

## 🔐 Security: handling secrets

**CRITICAL: This is a public repository. Never commit any secrets.**

All sensitive values (bot token, database URL, API keys) go in `.env` (which is gitignored) and in your hosting platform's environment variable settings.

What's tracked in git:
- `.env.example` (template only, no real values)
- Source code
- Documentation

What's NOT tracked (in `.gitignore`):
- `.env` and any `.env.local`
- `node_modules/`
- Build outputs
- Any file matching `*.pem`, `*.key`, etc.

If you accidentally commit a secret:
1. Rotate the secret IMMEDIATELY (regenerate the bot token, change DB password, etc.)
2. Use `git filter-repo` or BFG Repo-Cleaner to remove from history
3. Force-push (this rewrites history, coordinate with collaborators)

---

## 💰 Cost projection

| Phase | DAU | Infra cost/mo | Revenue/mo |
|---|---|---|---|
| 1 (MVP) | < 1k | **$0** (all free tiers) | $0 |
| 2 | 1k-10k | ~$100 | $700-2,000 |
| 3 | 10k-100k | ~$300-500 | $25,000-80,000 |
| 4 (Token) | 100k+ | ~$1,000-3,000 | $280,000-1,000,000 |

See [MONETIZATION.md](./docs/MONETIZATION.md) for details.

---

## 📦 Deployment

### Frontend (Vercel)

1. Push the repo to GitHub (already done if you're reading this)
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Set the root directory to `apps/web`
4. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `NEXT_PUBLIC_SENTRY_DSN`
5. Deploy

### Backend (Fly.io)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# From the apps/api directory
cd apps/api
fly launch

# Set secrets
fly secrets set BOT_TOKEN=xxx
fly secrets set DATABASE_URL=xxx
fly secrets set UPSTASH_REDIS_REST_URL=xxx
fly secrets set UPSTASH_REDIS_REST_TOKEN=xxx
fly secrets set FRONTEND_URL=https://your-app.vercel.app

# Deploy
fly deploy
```

See [ARCHITECTURE.md §8](./docs/ARCHITECTURE.md) for full deployment guide.

---

## 🛡️ Anti-cheat

The backend enforces 6 layers of anti-cheat (see [VISION.md §14](./docs/VISION.md)):

1. **Telegram initData validation** (HMAC-SHA256) — can't impersonate users
2. **Rate limiting** (Upstash) — max 5 taps/sec per user
3. **Energy validation** (server-side) — can't farm infinite energy
4. **Pattern detection** (interval analysis) — catches bots
5. **Trust score** (B2B tasks) — gold standard + scoring
6. **Cash-out validation** (multi-criteria) — anti-fraud for real money withdrawals

---

## 📜 License

[MIT](./LICENSE) — fork, modify, deploy, sell. Just don't commit secrets.

---

## 🙏 Credits

- Architecture and inspiration: [tungulin/quackup-app](https://github.com/tungulin/quackup-app) (MIT)
- Design patterns: [Kennix88/Token-Giver](https://github.com/Kennix88/Token-Giver) (MIT)
- Crypto ops: [SyntaxByte-Solution/tap-mini-app](https://github.com/SyntaxByte-Solution/tap-mini-app) (ISC)

---

## 🆘 Need help?

- Read the docs in `/docs/`
- Check the [VISION.md](./docs/VISION.md) for the why
- Check the [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the how
- Check the [MONETIZATION.md](./docs/MONETIZATION.md) for the business
