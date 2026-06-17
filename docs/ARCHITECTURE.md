# ⚙️ AI Kombat — Architecture Technique

> **Complément du VISION.md** — focus sur le **comment** on construit, pas le **quoi**.

---

## Table des matières

1. [Stack technique final](#1-stack-technique-final)
2. [Structure du monorepo](#2-structure-du-monorepo)
3. [Setup pas-à-pas](#3-setup-pas-à-pas)
4. [Schéma DB complet (SQL)](#4-schéma-db-complet-sql)
5. [API REST — endpoints détaillés](#5-api-rest--endpoints-détaillés)
6. [Auth Telegram — comment ça marche](#6-auth-telegram--comment-ça-marche)
7. [Anti-cheat — implémentation](#7-anti-cheat--implémentation)
8. [Déploiement](#8-déploiement)
9. [Variables d'environnement](#9-variables-denvironnement)
10. [Estimation des coûts](#10-estimation-des-coûts)

---

## 1. Stack technique final

| Couche | Techno | Pourquoi ce choix |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR, ecosystem mature, Vercel = 0 config |
| **UI** | Tailwind CSS + shadcn/ui + Framer Motion | Moderne, accessible, animable |
| **State client** | Zustand | Léger, simple (pas besoin de Redux) |
| **Backend** | **Bun + Hono** | 3× plus rapide que Node, TypeScript natif, idéal pour les API |
| **DB** | Supabase (Postgres managé) | Gratuit au début, UI intégrée, scale-up facile |
| **ORM** | Knex.js | Migrations SQL propres, léger |
| **Cache/Queue** | Upstash Redis | Rate limiting distribué, leaderboards |
| **Bot Telegram** | telegraf | Mature, simple, intégré au même process |
| **Auth** | @telegram-apps/init-data-node | Validation HMAC officielle |
| **Front hosting** | Vercel | Gratuit, edge, auto-deploy sur push |
| **Back hosting** | Fly.io | 3 VM gratuites, simple, HTTPS auto |
| **Monitoring** | Sentry (erreurs) + Logflare (logs) | Gratuit, indispensable |
| **Smart contract (P3)** | Tact (langage TON) | Recommandé pour TON, le plus naturel pour Telegram |

---

## 2. Structure du monorepo

```
ai-kombat/
├── apps/
│   ├── web/                          # Next.js 14 (Telegram Mini App)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Page d'accueil
│   │   │   ├── game/
│   │   │   │   └── page.tsx          # Le tap principal
│   │   │   ├── ai/
│   │   │   │   └── page.tsx          # Arbre d'évolution
│   │   │   ├── tasks/
│   │   │   │   └── page.tsx          # Tâches IA
│   │   │   ├── quests/
│   │   │   │   └── page.tsx          # Quêtes
│   │   │   ├── friends/
│   │   │   │   └── page.tsx          # Referral
│   │   │   ├── leaders/
│   │   │   │   └── page.tsx          # Leaderboard
│   │   │   ├── shop/
│   │   │   │   └── page.tsx          # Boutique modules
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # Boutons, modals, etc. (shadcn)
│   │   │   ├── ai/                   # AI central avatar
│   │   │   ├── tap/                  # Tap button + animations
│   │   │   ├── modules/              # Cards des modules IA
│   │   │   └── layout/               # NavBar, BottomNav
│   │   ├── lib/
│   │   │   ├── telegram.ts           # Init Telegram SDK
│   │   │   ├── api.ts                # Client API
│   │   │   ├── store.ts              # Zustand store
│   │   │   └── hooks/                # Custom hooks
│   │   ├── public/
│   │   │   ├── avatars/              # Avatars IA par niveau
│   │   │   ├── icons/
│   │   │   └── sounds/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.mjs
│   │   └── package.json
│   │
│   └── api/                          # Backend Bun + Hono
│       ├── src/
│       │   ├── index.ts              # Entry point
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── tap.ts
│       │   │   ├── ai.ts
│       │   │   ├── modules.ts
│       │   │   ├── quests.ts
│       │   │   ├── tasks.ts
│       │   │   ├── referral.ts
│       │   │   ├── leaderboard.ts
│       │   │   └── shop.ts
│       │   ├── controllers/
│       │   │   ├── user.controller.ts
│       │   │   ├── tap.controller.ts
│       │   │   ├── module.controller.ts
│       │   │   ├── quest.controller.ts
│       │   │   ├── task.controller.ts
│       │   │   └── referral.controller.ts
│       │   ├── services/
│       │   │   ├── user.service.ts
│       │   │   ├── economy.service.ts        # Calcul des gains, sinks
│       │   │   ├── module.service.ts
│       │   │   ├── task.service.ts
│       │   │   ├── anti-cheat.service.ts
│       │   │   └── leaderboard.service.ts
│       │   ├── middlewares/
│       │   │   ├── auth.ts                   # Validation Telegram
│       │   │   ├── rateLimit.ts              # Upstash rate limit
│       │   │   ├── antiCheat.ts              # Detection patterns
│       │   │   └── errorHandler.ts
│       │   ├── db/
│       │   │   ├── knex.ts                   # Knex instance
│       │   │   └── seeds/                    # Seed data
│       │   ├── workers/
│       │   │   ├── cron.ts                   # Crons setup
│       │   │   ├── energyRegen.ts            # Regen energy toutes les X sec
│       │   │   ├── passiveIncome.ts          # Coins/h des modules
│       │   │   └── dailyReset.ts             # Reset quêtes quotidiennes
│       │   ├── bot/
│       │   │   ├── index.ts                  # Telegraf setup
│       │   │   └── commands.ts               # /start, /help, /stats
│       │   ├── lib/
│       │   │   ├── env.ts                    # Validation env
│       │   │   ├── logger.ts                 # Pino logger
│       │   │   └── errors.ts                 # Custom errors
│       │   └── types/
│       │       ├── user.ts
│       │       ├── module.ts
│       │       └── api.ts
│       ├── migrations/
│       │   ├── 001_users.ts
│       │   ├── 002_modules.ts
│       │   ├── 003_quests.ts
│       │   ├── 004_tasks.ts
│       │   ├── 005_transactions.ts
│       │   └── 006_anti_cheat.ts
│       ├── seeds/
│       │   ├── ai_modules.ts
│       │   ├── quests.ts
│       │   └── ai_tasks.ts
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types.ts             # Types partagés front/back
│       │   ├── constants.ts         # Enums, magic numbers
│       │   └── utils.ts
│       └── package.json
│
├── admin/                            # Admin panel (Next.js)
│   ├── app/
│   │   ├── users/
│   │   ├── tasks/
│   │   ├── quests/
│   │   ├── metrics/
│   │   └── login/
│   └── package.json
│
├── contracts/                        # Phase 3
│   └── aik-token.tact
│
├── scripts/
│   ├── seed-db.sh
│   └── deploy.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docs/                             # Documentation
│   ├── VISION.md                    # ← Game design doc
│   ├── ARCHITECTURE.md              # ← ce fichier
│   └── API.md                       # Spec OpenAPI
│
├── docker-compose.yml                # Dev local
├── package.json                     # Root workspace
├── bun.lockb
└── README.md
```

---

## 3. Setup pas-à-pas

### Prérequis

- **Bun** (>= 1.0) — `curl -fsSL https://bun.sh/install | bash`
- **Node** (>= 20) — backup
- **Git**
- Un compte **Supabase** (gratuit)
- Un compte **Upstash** (gratuit)
- Un compte **Vercel** (gratuit)
- Un compte **Fly.io** (gratuit, faut carte bancaire mais on paie rien)
- Un bot Telegram créé via **@BotFather**

### Étape 1 : Créer le bot Telegram

1. Ouvre Telegram, cherche `@BotFather`
2. Envoie `/newbot`, donne un nom (`AI Kombat Bot`) et un username (`AIKombatBot`)
3. **Note le token** (genre `123456:ABC-DEF...`)
4. Crée la mini-app : `/newapp` → sélectionne ton bot → donne un titre → upload une image 640x360
5. Note l'URL de la mini-app

### Étape 2 : Setup Supabase

1. Crée un projet sur https://supabase.com
2. Note l'URL du projet et la `service_role` key (⚠️ jamais exposer au front)
3. Optionnel : installe le CLI Supabase (`npm i -g supabase`)
4. Crée les tables via la migration (cf. §4)

### Étape 3 : Setup Upstash

1. Crée un compte sur https://upstash.com
2. Crée une database Redis (région la plus proche)
3. Note `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`

### Étape 4 : Setup le repo

```bash
git clone <ton-repo>
cd ai-kombat
bun install              # installe toutes les deps du monorepo
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Remplir les .env
bun run db:migrate       # applique les migrations
bun run db:seed          # seed les modules de base
```

### Étape 5 : Lancer en local

```bash
# Terminal 1 : backend
cd apps/api
bun run dev              # http://localhost:3001

# Terminal 2 : frontend
cd apps/web
bun run dev              # http://localhost:3000
```

### Étape 6 : Tester dans Telegram

1. Tunnel l'app : `ngrok http 3000`
2. Va sur @BotFather, édite ton bot → "Bot Settings" → "Menu Button" → indique l'URL ngrok
3. Ouvre le bot, clique "Start", la mini-app s'ouvre

---

## 4. Schéma DB complet (SQL)

> Voir le **VISION.md §12** pour le schéma complet avec commentaires.
> Ci-dessous, la version SQL brute prête à coller dans Supabase.

```sql
-- ============================================
-- MIGRATION 001 : USERS
-- ============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    username VARCHAR(255),
    photo_url TEXT,
    language_code VARCHAR(10) DEFAULT 'en',
    is_premium BOOLEAN DEFAULT FALSE,
    coin_balance BIGINT DEFAULT 0,
    gem_balance INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 1000,
    max_energy INTEGER DEFAULT 1500,
    last_energy_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_name VARCHAR(50) DEFAULT 'My AI',
    ai_level INTEGER DEFAULT 0,
    ai_xp INTEGER DEFAULT 0,
    ai_type VARCHAR(50) DEFAULT 'novice',
    total_taps BIGINT DEFAULT 0,
    total_earned_coins BIGINT DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    referred_by BIGINT REFERENCES users(telegram_id),
    referral_count INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily_claim TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_coin_balance ON users(coin_balance DESC);
CREATE INDEX idx_users_ai_level ON users(ai_level DESC);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- ============================================
-- MIGRATION 002 : AI MODULES
-- ============================================
CREATE TABLE ai_modules (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon_url TEXT,
    base_cost BIGINT NOT NULL,
    cost_multiplier DECIMAL(3,2) DEFAULT 1.50,
    max_level INTEGER DEFAULT 10,
    coins_per_hour_bonus INTEGER DEFAULT 0,
    energy_max_bonus INTEGER DEFAULT 0,
    energy_regen_bonus INTEGER DEFAULT 0,
    tap_multiplier_bonus DECIMAL(3,2) DEFAULT 1.0,
    min_ai_level INTEGER DEFAULT 0,
    required_module_code VARCHAR(50),
    rarity VARCHAR(20) DEFAULT 'common',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_modules (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES ai_modules(id),
    level INTEGER DEFAULT 1,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX idx_user_modules_user_id ON user_modules(user_id);

-- ============================================
-- MIGRATION 003 : QUESTS
-- ============================================
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    target_count INTEGER DEFAULT 1,
    target_action VARCHAR(50),
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    min_ai_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_quests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quests(id),
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id, started_at)
);

CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_user_quests_incomplete ON user_quests(user_id, is_completed) WHERE is_completed = FALSE;

-- ============================================
-- MIGRATION 004 : AI TASKS
-- ============================================
CREATE TABLE ai_tasks (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    payload JSONB NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'easy',
    reward_coins INTEGER DEFAULT 50,
    reward_xp INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_task_submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    task_id BIGINT NOT NULL REFERENCES ai_tasks(id),
    answer JSONB,
    is_correct BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_submissions_user_id ON user_task_submissions(user_id);
CREATE INDEX idx_user_submissions_task_id ON user_task_submissions(task_id);

-- ============================================
-- MIGRATION 005 : TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id, created_at DESC);

-- ============================================
-- MIGRATION 006 : ANTI-CHEAT
-- ============================================
CREATE TABLE tap_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    count INTEGER NOT NULL,
    duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    suspicious BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_tap_events_user_id ON tap_events(user_id, server_timestamp DESC);
CREATE INDEX idx_tap_events_suspicious ON tap_events(suspicious) WHERE suspicious = TRUE;

-- ============================================
-- MIGRATION 007 : REFERRALS
-- ============================================
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    referred_id BIGINT UNIQUE NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    bonus_paid BOOLEAN DEFAULT FALSE,
    bonus_paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MIGRATION 008 : ACHIEVEMENTS
-- ============================================
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    criteria JSONB NOT NULL
);

CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- MIGRATION 009 : DAILY REWARDS
-- ============================================
CREATE TABLE daily_rewards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    coins_earned INTEGER NOT NULL,
    gems_earned INTEGER DEFAULT 0,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_rewards_user_id ON daily_rewards(user_id, claimed_at DESC);

-- ============================================
-- MIGRATION 010 : PURCHASES
-- ============================================
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    product_code VARCHAR(50) NOT NULL,
    amount_eur DECIMAL(10,2) NOT NULL,
    gems_credited INTEGER NOT NULL,
    payment_provider VARCHAR(50),
    provider_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRIGGERS : updated_at auto
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- MIGRATION 011 : DATASETS B2B (Phase 2-3)
-- ============================================
-- Voir MONETIZATION.md §5 pour les détails complets.

CREATE TABLE dataset_jobs (
    id VARCHAR(50) PRIMARY KEY,  -- ex: ds_abc123
    client_id BIGINT REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'image_classification', 'sentiment', 'bounding_box', etc.
    schema JSONB NOT NULL,  -- { question, options, ... }
    total_items INTEGER NOT NULL,
    completed_items INTEGER DEFAULT 0,
    votes_per_item INTEGER DEFAULT 3,
    min_confidence DECIMAL(3,2) DEFAULT 0.66,
    budget_usd DECIMAL(10,2),
    cost_usd DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    progress_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    deadline_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE dataset_items (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES dataset_jobs(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    payload JSONB NOT NULL,  -- { image_url, ... }
    correct_answer JSONB,  -- pour les gold standards
    is_gold_standard BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    final_answer JSONB,
    confidence DECIMAL(3,2),
    votes_count INTEGER DEFAULT 0
);

CREATE INDEX idx_dataset_items_job_id ON dataset_items(job_id);
CREATE INDEX idx_dataset_items_status ON dataset_items(status);

CREATE TABLE dataset_votes (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT REFERENCES dataset_items(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    answer JSONB,
    is_correct BOOLEAN,
    time_spent_ms INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, user_id)
);

CREATE INDEX idx_dataset_votes_user_id ON dataset_votes(user_id);

CREATE TABLE user_trust (
    user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
    trust_score INTEGER DEFAULT 50,
    gold_standard_passed INTEGER DEFAULT 0,
    gold_standard_failed INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    last_strike_at TIMESTAMP WITH TIME ZONE,
    is_shadow_banned BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    total_spent_usd DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_payments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id),
    amount_usd DECIMAL(10,2),
    payment_method VARCHAR(50),  -- 'stripe', 'usdc', 'ton'
    transaction_id VARCHAR(255),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MIGRATION 012 : ADS & SPONSORSHIPS
-- ============================================
CREATE TABLE ad_views (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    ad_id VARCHAR(100) NOT NULL,
    ad_type VARCHAR(50) NOT NULL,  -- 'adsgram', 'telegram_ads', 'sponsored_quest'
    reward_coins INTEGER DEFAULT 0,
    revenue_usd DECIMAL(10,4),  -- ce qu'on a gagné
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ad_views_user_id ON ad_views(user_id, created_at DESC);

CREATE TABLE sponsorships (
    id BIGSERIAL PRIMARY KEY,
    sponsor_name VARCHAR(255) NOT NULL,
    channel_username VARCHAR(100),
    channel_url TEXT,
    cost_usd DECIMAL(10,2),
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    required_actions JSONB,  -- {subscribe: true, like: true, ...}
    reward_coins INTEGER,
    max_completions INTEGER,
    current_completions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MIGRATION 013 : CASH-OUT (Phase 4)
-- ============================================
CREATE TABLE cashouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    aik_amount DECIMAL(20,8) NOT NULL,
    ton_amount DECIMAL(20,8),
    eur_amount DECIMAL(10,2),
    tx_hash VARCHAR(255),
    wallet_address VARCHAR(100),
    kyc_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
    kyc_provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_cashouts_user_id ON cashouts(user_id, created_at DESC);

-- ============================================
-- MIGRATION 014 : TOKEN (Phase 4)
-- ============================================
CREATE TABLE token_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    tx_hash VARCHAR(255) UNIQUE,
    type VARCHAR(50) NOT NULL,  -- 'convert', 'cashout', 'stake', 'unstake', 'reward', 'burn'
    amount DECIMAL(20,8) NOT NULL,
    from_address VARCHAR(100),
    to_address VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_token_tx_user_id ON token_transactions(user_id, created_at DESC);

CREATE TABLE stakes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    staked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unstaked_at TIMESTAMP WITH TIME ZONE,
    rewards_earned DECIMAL(20,8) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_stakes_user_id ON stakes(user_id, is_active);
```

### Seed data (à insérer en phase 1)

```sql
-- Modules de base
INSERT INTO ai_modules (code, name, description, category, base_cost, cost_multiplier, coins_per_hour_bonus, rarity, display_order) VALUES
('gpu_v1', 'GPU V1', 'Le calcul de base', 'compute', 100, 1.5, 50, 'common', 1),
('gpu_v2', 'GPU V2', 'Plus rapide', 'compute', 1000, 1.5, 250, 'common', 2),
('gpu_v3', 'GPU V3', 'Puissant', 'compute', 10000, 1.6, 1000, 'rare', 3),
('nlp_module', 'Module NLP', 'Ton IA apprend à comprendre le langage', 'specialty', 5000, 1.7, 500, 'rare', 10),
('vision_module', 'Module Vision', 'Ton IA apprend à voir', 'specialty', 8000, 1.7, 800, 'rare', 11),
('code_module', 'Module Code', 'Ton IA apprend à coder', 'specialty', 12000, 1.8, 1200, 'epic', 12),
('voice_module', 'Module Voice', 'Ton IA apprend à parler', 'specialty', 15000, 1.8, 1500, 'epic', 13),
('reasoning_module', 'Module Raisonnement', 'Ton IA apprend à réfléchir', 'specialty', 30000, 1.9, 3000, 'legendary', 14),
('gpt_core', 'GPT Core', 'Le saint graal', 'compute', 1000000, 2.0, 50000, 'legendary', 99);

-- Quêtes quotidiennes
INSERT INTO quests (code, name, description, type, target_count, target_action, reward_coins, is_active) VALUES
('daily_login', 'Connexion quotidienne', 'Connecte-toi aujourd''hui', 'daily', 1, 'login', 100, TRUE),
('tap_100', '100 taps', 'Fais 100 taps aujourd''hui', 'daily', 100, 'tap', 50, TRUE),
('tap_500', '500 taps', 'Fais 500 taps aujourd''hui', 'daily', 500, 'tap', 200, TRUE),
('tap_1000', '1000 taps', 'Fais 1000 taps aujourd''hui', 'daily', 1000, 'tap', 500, TRUE),
('first_ai_task', 'Première tâche IA', 'Accomplis ta première tâche IA', 'one_time', 1, 'complete_ai_task', 100, TRUE);

-- Achievements
INSERT INTO achievements (code, name, description, reward_coins, criteria) VALUES
('first_tap', 'Premier tap', 'Tu as fait ton premier tap', 10, '{"type": "taps", "target": 1}'),
('tap_1k', '1 000 taps', '1 000 taps effectués', 100, '{"type": "taps", "target": 1000}'),
('tap_10k', '10 000 taps', '10 000 taps effectués', 500, '{"type": "taps", "target": 10000}'),
('tap_100k', '100 000 taps', '100 000 taps effectués', 5000, '{"type": "taps", "target": 100000}'),
('first_module', 'Premier module', 'Premier module acheté', 200, '{"type": "modules_bought", "target": 1}'),
('ai_level_10', 'IA niveau 10', 'Ton IA a atteint le niveau 10', 1000, '{"type": "ai_level", "target": 10}'),
('ai_level_25', 'IA niveau 25', 'Ton IA a atteint le niveau 25', 5000, '{"type": "ai_level", "target": 25}'),
('first_referral', 'Premier ami invité', 'Tu as invité ton premier ami', 2000, '{"type": "referrals", "target": 1}'),
('streak_7', 'Streak 7 jours', 'Connecté 7 jours d''affilée', 1000, '{"type": "streak", "target": 7}');
```

---

## 5. API REST — endpoints détaillés

> Tous les endpoints nécessitent un header `Authorization: tma <initData>` (sauf `/api/auth/init` qui init l'auth, et `/api/shop/webhook`).

### POST /api/auth/init

**Body** : `{ initData: string }`

**Response** :
```json
{
  "user": {
    "telegramId": 123456789,
    "firstName": "John",
    "coinBalance": 0,
    "gemBalance": 0,
    "aiLevel": 0,
    "aiName": "My AI"
  },
  "modules": [...],
  "activeQuests": [...]
}
```

**Logique** :
1. Valide `initData` avec HMAC
2. Parse les données Telegram
3. UPSERT dans `users`
4. Retourne l'état complet

### POST /api/tap

**Body** : `{ count: number }` (max 60)

**Response** :
```json
{
  "newBalance": 1050,
  "energySpent": 50,
  "newEnergy": 950,
  "coinsEarned": 50,
  "xpGained": 5,
  "aiLevelUp": false
}
```

**Logique** :
1. Vérifie le rate limit (5 taps/sec/user)
2. Vérifie l'énergie disponible
3. Calcule le multiplicateur (modules achetés)
4. Update `users` (balance, energy, ai_xp, total_taps)
5. Log dans `tap_events`
6. Trigger check d'anti-cheat (intervalle, volume)
7. Retourne l'état

### GET /api/ai

**Response** :
```json
{
  "aiName": "My AI",
  "aiLevel": 15,
  "aiXp": 1234,
  "aiXpToNextLevel": 2000,
  "aiType": "Confirmed",
  "avatarUrl": "/avatars/level-15.svg"
}
```

### GET /api/modules

**Response** :
```json
{
  "modules": [
    {
      "id": 1,
      "code": "gpu_v1",
      "name": "GPU V1",
      "category": "compute",
      "currentLevel": 3,
      "nextLevelCost": 2500,
      "coinsPerHourBonus": 150,
      "isOwned": true,
      "isAvailable": true
    }
  ]
}
```

### POST /api/modules/buy

**Body** : `{ moduleId: number }`

**Response** :
```json
{
  "success": true,
  "newBalance": 7500,
  "module": {
    "id": 1,
    "code": "gpu_v1",
    "level": 1
  }
}
```

**Logique** :
1. Vérifie que le user a assez de coins
2. Vérifie que le module est dispo (min_ai_level, required_module)
3. Déduit le coût, ajoute le module à `user_modules`
4. Log la transaction

### GET /api/quests/active

**Response** :
```json
{
  "daily": [...],
  "weekly": [...],
  "oneTime": [...]
}
```

### POST /api/quests/claim

**Body** : `{ questId: number }`

**Response** :
```json
{
  "success": true,
  "rewards": {
    "coins": 100,
    "gems": 0,
    "xp": 10
  }
}
```

### GET /api/tasks/next

**Query** : `?type=image_qcm` (optionnel)

**Response** :
```json
{
  "task": {
    "id": 123,
    "type": "image_qcm",
    "question": "Que vois-tu sur cette image ?",
    "imageUrl": "https://...",
    "options": ["Un chat", "Un chien", "Un oiseau"],
    "rewardCoins": 50,
    "rewardXp": 10
  }
}
```

### POST /api/tasks/submit

**Body** : `{ taskId: number, answer: string }`

**Response** :
```json
{
  "isCorrect": true,
  "rewards": {
    "coins": 50,
    "xp": 10
  }
}
```

### GET /api/leaderboard/global?limit=100

**Response** :
```json
{
  "users": [
    { "telegramId": 123, "firstName": "Alice", "aiLevel": 50, "totalCoins": 1000000 },
    ...
  ],
  "myRank": 1234
}
```

### POST /api/referral/claim

**Body** : `{ referredId: number }`

**Response** :
```json
{
  "success": true,
  "rewards": { "coins": 2000 }
}
```

---

## 6. Auth Telegram — comment ça marche

### Le flow

```
1. User ouvre la mini-app Telegram
2. Telegram génère un "initData" (string encodé)
3. Le front envoie ce initData à /api/auth/init
4. Le back valide le HMAC avec le BOT_TOKEN
5. Si valide, le back identifie/crée le user
6. Le back renvoie un JWT (ou utilise des sessions via Telegram initData à chaque requête)
```

### Le code (Hono middleware)

```typescript
// apps/api/src/middlewares/auth.ts
import { validate, parse } from '@telegram-apps/init-data-node';
import type { Context, Next } from 'hono';

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('authorization');
  
  if (!authHeader || !authHeader.startsWith('tma ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  
  const initData = authHeader.substring(4);
  
  try {
    // Validation HMAC officielle
    validate(initData, process.env.BOT_TOKEN!, { expiresIn: 0 });
    
    // Parse pour extraire le user
    const parsed = parse(initData);
    
    if (!parsed.user) {
      return c.json({ error: 'No user in initData' }, 401);
    }
    
    // Inject dans le context
    c.set('telegramUser', parsed.user);
    c.set('initData', initData);
    
    await next();
  } catch (error: any) {
    return c.json({ error: 'Invalid initData', details: error.message }, 401);
  }
};
```

### Le code (route auth)

```typescript
// apps/api/src/routes/auth.ts
import { Hono } from 'hono';
import { db } from '../db/knex';

const auth = new Hono();

auth.post('/init', async (c) => {
  // Note: pas d'authMiddleware ici, on init justement l'auth
  const { initData } = await c.req.json();
  
  // Validation HMAC
  validate(initData, process.env.BOT_TOKEN!, { expiresIn: 0 });
  const parsed = parse(initData);
  
  if (!parsed.user) {
    return c.json({ error: 'No user' }, 400);
  }
  
  // UPSERT dans users
  const [user] = await db('users')
    .insert({
      telegram_id: parsed.user.id,
      first_name: parsed.user.firstName,
      last_name: parsed.user.lastName,
      username: parsed.user.username,
      photo_url: parsed.user.photoUrl,
      is_premium: parsed.user.isPremium,
      language_code: parsed.user.languageCode,
    })
    .onConflict('telegram_id')
    .merge()
    .returning('*');
  
  // Charger les modules, quêtes, etc.
  const modules = await db('user_modules').where({ user_id: user.telegram_id });
  const activeQuests = await db('user_quests')
    .where({ user_id: user.telegram_id, is_completed: false });
  
  return c.json({ user, modules, activeQuests });
});

export default auth;
```

### Le code (front, init Telegram)

```typescript
// apps/web/lib/telegram.ts
import { retrieveLaunchParams, type LaunchParams } from '@telegram-apps/sdk';

export const getTelegramInitData = (): string => {
  const params: LaunchParams = retrieveLaunchParams();
  return params.tgWebAppData || '';
};

export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
};

// Init l'app Telegram
export const initTelegram = () => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  }
};
```

---

## 7. Anti-cheat — implémentation

### 7.1. Rate limiting (Upstash)

```typescript
// apps/api/src/middlewares/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Context, Next } from 'hono';

const redis = Redis.fromEnv();

const tapLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 s'),  // 5 taps par seconde
  analytics: true,
});

const questLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 quêtes par minute
  analytics: true,
});

export const tapRateLimit = async (c: Context, next: Next) => {
  const user = c.get('telegramUser');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const { success, remaining, reset } = await tapLimiter.limit(`tap:${user.id}`);
  
  if (!success) {
    return c.json({ 
      error: 'Rate limit exceeded', 
      retryAfter: Math.floor((reset - Date.now()) / 1000)
    }, 429);
  }
  
  await next();
};
```

### 7.2. Anti-cheat service

```typescript
// apps/api/src/services/anti-cheat.service.ts
import { db } from '../db/knex';

interface TapEvent {
  count: number;
  clientTimestamp: Date;
}

export const checkTapPattern = async (userId: number, event: TapEvent) => {
  // 1. Vérifier le volume quotidien
  const todayCount = await db('tap_events')
    .where('user_id', userId)
    .where('server_timestamp', '>=', db.raw("CURRENT_DATE"))
    .sum('count as total')
    .first();
  
  if (todayCount?.total > 50000) {
    await flagUser(userId, 'excessive_volume', { todayCount });
    return false;
  }
  
  // 2. Vérifier l'intervalle entre taps
  const lastTaps = await db('tap_events')
    .where('user_id', userId)
    .orderBy('server_timestamp', 'desc')
    .limit(10);
  
  if (lastTaps.length >= 2) {
    const intervals: number[] = [];
    for (let i = 0; i < lastTaps.length - 1; i++) {
      const diff = new Date(lastTaps[i].server_timestamp).getTime() - 
                   new Date(lastTaps[i+1].server_timestamp).getTime();
      intervals.push(diff);
    }
    
    // Si l'écart-type des intervalles est trop faible → bot
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 20 && mean < 200) {  // Intervalle ultra-régulier + rapide
      await flagUser(userId, 'suspicious_pattern', { mean, stdDev });
      return false;
    }
  }
  
  return true;
};

const flagUser = async (userId: number, reason: string, metadata: any) => {
  console.warn(`🚨 User ${userId} flagged: ${reason}`, metadata);
  
  // Marquer l'event comme suspect
  await db('tap_events')
    .insert({
      user_id: userId,
      count: 0,
      client_timestamp: new Date(),
      suspicious: true,
    });
  
  // TODO: notifier l'admin panel
  // TODO: après 3 flags → ban auto
};
```

### 7.3. Energy regen (validation côté serveur)

```typescript
// apps/api/src/services/economy.service.ts
export const calculateValidEnergy = (user: any, now: Date = new Date()): number => {
  const lastUpdate = new Date(user.last_energy_update);
  const secondsPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
  const regenAmount = secondsPassed * (1 + (user.energy_regen_bonus || 0));  // 1 par sec + bonus
  
  return Math.min(user.energy + regenAmount, user.max_energy);
};
```

---

## 8. Déploiement

### Front (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod
```

**Variables d'env Vercel** :
- `NEXT_PUBLIC_API_URL` : URL du backend (ex: `https://api.aikombat.app`)
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` : `@AIKombatBot`

### Back (Fly.io)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Init
cd apps/api
fly launch

# Set env
fly secrets set BOT_TOKEN=123:abc...
fly secrets set DATABASE_URL=postgresql://...
fly secrets set UPSTASH_REDIS_REST_URL=https://...
fly secrets set UPSTASH_REDIS_REST_TOKEN=...
fly secrets set FRONTEND_URL=https://aikombat.app

# Deploy
fly deploy
```

**fly.toml** (déjà préparé) :
```toml
app = "ai-kombat-api"
primary_region = "cdg"

[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 3001
  protocol = "tcp"
  
  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true
    
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[env]
  PORT = "3001"
  NODE_ENV = "production"
```

### Cron jobs (Fly.io machine séparée)

Pour les workers, créer une **2ème machine** qui tourne toujours (sans port HTTP) :

```toml
# fly.workers.toml
app = "ai-kombat-workers"

[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 3002
  protocol = "tcp"
  
  # Pas de ports publics, c'est un worker
```

```typescript
// apps/api/src/workers/cron.ts
import { energyRegen } from './energyRegen';
import { passiveIncome } from './passiveIncome';
import { dailyReset } from './dailyReset';

export const startCrons = () => {
  // Toutes les 10 secondes : regen d'énergie
  setInterval(energyRegen, 10000);
  
  // Toutes les minutes : passive income (coins/h des modules)
  setInterval(passiveIncome, 60000);
  
  // Tous les jours à 00:00 UTC : reset des quêtes daily
  setInterval(dailyReset, 24 * 60 * 60 * 1000);
  
  console.log('✅ Crons started');
};
```

---

## 9. Variables d'environnement

### `apps/api/.env`

```bash
# === SERVER ===
NODE_ENV=development
PORT=3001

# === TELEGRAM ===
# Token du bot (obtenu via @BotFather)
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# === DATABASE (Supabase) ===
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# === CACHE (Upstash) ===
UPSTASH_REDIS_REST_URL=https://[region]-upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# === SECURITY ===
# Secret pour les JWT (génère un truc random)
JWT_SECRET=change-me-in-production

# === MONITORING ===
SENTRY_DSN=https://...@sentry.io/...
LOGFLARE_API_KEY=...

# === FRONT ===
FRONTEND_URL=http://localhost:3000

# === PAYMENTS (Phase 3) ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### `apps/web/.env.local`

```bash
# === API ===
NEXT_PUBLIC_API_URL=http://localhost:3001

# === TELEGRAM ===
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=AIKombatBot
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=123456:ABC-DEF...  # Optionnel, pour les WebApp init

# === MONITORING ===
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 10. Estimation des coûts

### Phase 1 : MVP (0 → 100 users actifs)

| Service | Plan | Coût |
|---|---|---|
| Vercel | Hobby (gratuit) | 0€ |
| Fly.io | Free tier (3 VM) | 0€ |
| Supabase | Free tier (500 MB) | 0€ |
| Upstash | Free tier (10k req/j) | 0€ |
| Sentry | Free tier (5k events/mois) | 0€ |
| **Total** | | **0€/mois** |

### Phase 2 : 0 → 10k users actifs

| Service | Plan | Coût |
|---|---|---|
| Vercel | Pro | 20€/mois |
| Fly.io | Pay-as-you-go | 10-30€/mois |
| Supabase | Pro (8 GB) | 25€/mois |
| Upstash | Pay-as-you-go | 10-20€/mois |
| Sentry | Team | 26€/mois |
| **Total** | | **~100€/mois** |

### Phase 3 : 10k → 100k users actifs

| Service | Plan | Coût |
|---|---|---|
| Vercel | Pro | 20€/mois |
| Fly.io | Performance | 50-100€/mois |
| Supabase | Pro (32 GB) + read replicas | 100-200€/mois |
| Upstash | Pro | 50-100€/mois |
| Sentry | Team | 26€/mois |
| Cloudflare Pro | CDN | 20€/mois |
| **Total** | | **300-500€/mois** |

### Phase 4 : 100k+ users

À ce stade, le projet est **rentable** (revenue > coût), on peut investir dans :
- Migration vers un vrai cloud (AWS/GCP)
- Workers dédiés pour les crons
- CDN mondial (Cloudflare Pro ou AWS CloudFront)
- Coût estimé : **1000-3000€/mois**

---

## 📌 TL;DR

> **Setup en 1 jour** : Vercel + Fly.io + Supabase + Upstash = 100% gratuit pour le MVP.
> **Premier € de revenu** possible dès la phase 3 (mois 4-6).
> **Scale à 100k users** pour ~300-500€/mois de cloud.
> **Tout est documenté**, suffit de suivre ce doc.

---

*Document maintenu par Mavis.*
