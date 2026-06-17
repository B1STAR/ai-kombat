# 🆕 Architecture Addendum — Monétisation, Datasets B2B, Cash-out

> **Ce document complète [ARCHITECTURE.md](./ARCHITECTURE.md)** avec les ajouts de la phase monétisation. À fusionner dans le doc principal quand on passe en production.

---

## A. Nouveaux endpoints API

### Ads (Phase 2+)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ads/reward` | User | L'user a vu une pub → créditer des coins |
| `GET` | `/api/ads/available` | User | Liste des pubs rewarded disponibles |

### Datasets B2B — API publique pour les clients

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/datasets/jobs` | API key | Créer un job d'annotation |
| `GET` | `/api/v1/datasets/jobs/:id` | API key | Status d'un job |
| `GET` | `/api/v1/datasets/jobs/:id/progress` | API key | Progression en live |
| `GET` | `/api/v1/datasets/jobs/:id/results` | API key | Télécharger les résultats (CSV/JSON) |
| `GET` | `/api/v1/account/balance` | API key | Solde du client B2B |
| `POST` | `/api/v1/account/credit` | API key | Ajouter du crédit (Stripe/USDC/TON) |
| `POST` | `/api/v1/account/webhook` | (Stripe) | Confirme un paiement |

### Datasets — Admin (interne)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/datasets/jobs` | Admin | Liste tous les jobs |
| `POST` | `/api/admin/datasets/jobs/:id/cancel` | Admin | Annuler un job |
| `POST` | `/api/admin/datasets/gold-standards` | Admin | Ajouter un gold standard |
| `GET` | `/api/admin/datasets/stats` | Admin | Métriques : tasks/jour, qualité, etc. |

### Sponsorships (Phase 2+)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/sponsorships/active` | User | Quêtes sponsorisées actives |
| `POST` | `/api/sponsorships/:id/complete` | User | Valide la quête (vérif via Telegram API) |
| `POST` | `/api/admin/sponsorships` | Admin | Créer un sponsorship |

### Cash-out (Phase 4+)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/cashout/request` | User | Initie une demande de cash-out |
| `GET` | `/api/cashout/history` | User | Historique des cash-outs du user |
| `GET` | `/api/cashout/limits` | User | Plafonds restants pour le user |
| `POST` | `/api/admin/cashouts/:id/process` | Admin | Valide manuellement un cash-out |

### Token (Phase 4+)

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/token/convert` | User | Convertit des coins en $AIK (1x/sem, max $5) |
| `POST` | `/api/token/stake` | User | Stake des $AIK |
| `POST` | `/api/token/unstake` | User | Unstake |
| `GET` | `/api/token/balance` | User | Balance on-chain du user |
| `GET` | `/api/token/history` | User | Historique des transactions token |
| `GET` | `/api/token/staking-rewards` | User | Rewards accumulés |

---

## B. Nouvelles tables DB (Migrations 011-014)

### Migration 011 : DATASETS B2B

```sql
CREATE TABLE dataset_jobs (
    id VARCHAR(50) PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    schema JSONB NOT NULL,
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
    payload JSONB NOT NULL,
    correct_answer JSONB,
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
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration 012 : ADS & SPONSORSHIPS

```sql
CREATE TABLE ad_views (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    ad_id VARCHAR(100) NOT NULL,
    ad_type VARCHAR(50) NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    revenue_usd DECIMAL(10,4),
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
    required_actions JSONB,
    reward_coins INTEGER,
    max_completions INTEGER,
    current_completions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Migration 013 : CASH-OUT (Phase 4)

```sql
CREATE TABLE cashouts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    aik_amount DECIMAL(20,8) NOT NULL,
    ton_amount DECIMAL(20,8),
    eur_amount DECIMAL(10,2),
    tx_hash VARCHAR(255),
    wallet_address VARCHAR(100),
    kyc_status VARCHAR(20) DEFAULT 'pending',
    kyc_provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_cashouts_user_id ON cashouts(user_id, created_at DESC);
```

### Migration 014 : TOKEN (Phase 4)

```sql
CREATE TABLE token_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    tx_hash VARCHAR(255) UNIQUE,
    type VARCHAR(50) NOT NULL,
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

---

## C. Code : Trust score & anti-fraude datasets

```typescript
// apps/api/src/datasets/trust.service.ts
import { db } from '../db/knex';

export const updateTrustScore = async (userId: number, goldStandardPassed: boolean) => {
  const trust = await db('user_trust').where('user_id', userId).first();
  
  if (!trust) {
    await db('user_trust').insert({
      user_id: userId,
      trust_score: 50,
      gold_standard_passed: goldStandardPassed ? 1 : 0,
      gold_standard_failed: goldStandardPassed ? 0 : 1,
    });
    return;
  }
  
  if (goldStandardPassed) {
    await db('user_trust')
      .where('user_id', userId)
      .increment('gold_standard_passed', 1)
      .increment('trust_score', 1);
  } else {
    await db('user_trust')
      .where('user_id', userId)
      .increment('gold_standard_failed', 1)
      .decrement('trust_score', 5);
    
    const total = trust.gold_standard_failed + 1 + trust.gold_standard_passed;
    if (total >= 10 && (trust.gold_standard_failed + 1) / total > 0.3) {
      await db('user_trust')
        .where('user_id', userId)
        .update({ is_shadow_banned: true, last_strike_at: new Date() });
      
      console.warn(`🚨 User ${userId} shadow-banned: high gold standard failure rate`);
    }
  }
};

export const canUserDoB2BTasks = async (userId: number): Promise<boolean> => {
  const trust = await db('user_trust').where('user_id', userId).first();
  if (!trust) return true;
  return trust.trust_score >= 30 && !trust.is_shadow_banned;
};
```

## D. Code : Distribution des tâches (pipeline datasets)

```typescript
// apps/api/src/datasets/distribution.service.ts
import { db } from '../db/knex';
import { canUserDoB2BTasks } from './trust.service';

export const distributeNextItem = async (userId: number) => {
  // 1. Vérifier que le user peut faire des tâches B2B
  if (!(await canUserDoB2BTasks(userId))) {
    return null;
  }
  
  // 2. 5% du temps, distribuer un gold standard
  const isGoldStandard = Math.random() < 0.05;
  
  if (isGoldStandard) {
    return await db('dataset_items')
      .where({ is_gold_standard: true, status: 'pending' })
      .whereNotExists(function() {
        this.select('*').from('dataset_votes')
          .whereRaw('dataset_votes.item_id = dataset_items.id')
          .where('user_id', userId);
      })
      .orderByRaw('RANDOM()')
      .first();
  }
  
  // 3. Sinon, item normal d'un job actif
  return await db('dataset_items')
    .join('dataset_jobs', 'dataset_jobs.id', 'dataset_items.job_id')
    .where('dataset_jobs.status', 'running')
    .whereIn('dataset_items.status', ['pending', 'voting'])
    .whereNotExists(function() {
      this.select('*').from('dataset_votes')
        .whereRaw('dataset_votes.item_id = dataset_items.id')
        .where('user_id', userId);
    })
    .orderByRaw('RANDOM()')
    .first();
};
```

## E. Code : Validation des votes (triple-vote + résolution)

```typescript
// apps/api/src/datasets/validation.service.ts
export const processVote = async (itemId: number, userId: number, answer: any) => {
  const item = await db('dataset_items').where('id', itemId).first();
  const job = await db('dataset_jobs').where('id', item.job_id).first();
  
  let isCorrect = null;
  if (item.is_gold_standard) {
    isCorrect = JSON.stringify(answer) === JSON.stringify(item.correct_answer);
    await updateTrustScore(userId, isCorrect);
  }
  
  await db('dataset_votes').insert({
    item_id: itemId,
    user_id: userId,
    answer,
    is_correct: isCorrect,
  });
  
  const votes = await db('dataset_votes').where('item_id', itemId);
  
  if (votes.length >= job.votes_per_item) {
    await resolveItemVotes(itemId, job);
  }
  
  await updateJobProgress(job.id);
  
  return { success: true };
};

const resolveItemVotes = async (itemId: number, job: any) => {
  const votes = await db('dataset_votes').where('item_id', itemId);
  
  const groups: Record<string, any[]> = {};
  for (const vote of votes) {
    const key = JSON.stringify(vote.answer);
    if (!groups[key]) groups[key] = [];
    groups[key].push(vote);
  }
  
  const majority = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0];
  const confidence = majority[1].length / votes.length;
  
  if (confidence >= job.min_confidence) {
    await db('dataset_items')
      .where('id', itemId)
      .update({
        status: 'validated',
        final_answer: JSON.parse(majority[0]),
        confidence,
        votes_count: votes.length,
      });
  } else {
    await db('dataset_items')
      .where('id', itemId)
      .update({ status: 'disputed', votes_count: votes.length });
  }
};
```

## F. Code : Anti-fraude cash-out

```typescript
// apps/api/src/services/cashout.service.ts
export const validateCashoutRequest = async (userId: number, amount: number) => {
  // 1. Ancienneté minimum 30 jours
  const user = await db('users').where('telegram_id', userId).first();
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (accountAgeDays < 30) throw new Error('Account too young (min 30 days)');
  
  // 2. Trust score minimum
  const trust = await db('user_trust').where('user_id', userId).first();
  if (trust && (trust.trust_score < 50 || trust.is_shadow_banned)) {
    throw new Error('Trust score too low');
  }
  
  // 3. Plafond mensuel
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthCashouts = await db('cashouts')
    .where('user_id', userId)
    .where('created_at', '>=', monthStart)
    .where('status', '!=', 'failed')
    .sum('eur_amount as total')
    .first();
  
  const monthlyLimit = 200;
  if ((monthCashouts?.total || 0) + amount > monthlyLimit) {
    throw new Error(`Monthly limit exceeded (${monthLimit}€)`);
  }
  
  // 4. Pas de cash-out en doublon
  const pending = await db('cashouts')
    .where('user_id', userId)
    .whereIn('status', ['pending', 'processing'])
    .first();
  if (pending) throw new Error('A cashout is already pending');
  
  // 5. Ratio de couverture (anti-bankrupt)
  const metrics = await getEconomicMetrics();
  if (metrics.coverageRatio < 1.5) {
    throw new Error('Cashouts temporarily paused for safety');
  }
  
  return true;
};
```

## G. Variables d'env à ajouter

```bash
# === ADSGRAM (Phase 2) ===
ADSGRAM_BLOCK_ID=your-block-id-here

# === DATASETS B2B (Phase 2-3) ===
DATASETS_API_KEY_SALT=random-salt-for-internal-keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# === KYC (Phase 4) ===
SUMSUB_API_KEY=...
SUMSUB_API_SECRET=...
KYC_WEBHOOK_URL=https://api.aikombat.app/api/kyc/webhook

# === TOKEN (Phase 4) ===
TON_NETWORK=mainnet  # ou 'testnet' en dev
TON_API_KEY=...
AIK_TOKEN_ADDRESS=EQ...  # Adresse du contrat $AIK
TON_WALLET_MULTISIG=EQ...  # Wallet multisig du projet

# === CASH-OUT (Phase 4) ===
CASHOUT_MIN_ACCOUNT_AGE_DAYS=30
CASHOUT_MONTHLY_LIMIT_EUR=200
CASHOUT_PROCESSING_DELAY_DAYS=7
```

## H. Coûts additionnels (Phase 4)

| Service | Plan | Coût/mois |
|---|---|---|
| Sumsub (KYC) | Pay-per-check | $1-3 par KYC |
| TON API (RPC) | Free tier OK | 0€ (jusqu'à 10k req/j) |
| Stripe (paiements €) | 2.9% + 0.30€ par transaction | Variable |
| Smart contract audit | One-shot | $5-20k (à faire avant le listing) |
| **Total Phase 4 additionnel** | | **$5-20k one-shot + $1-3/vérif KYC** |

---

*Document maintenu par Mavis — addendum à [ARCHITECTURE.md](./ARCHITECTURE.md).*
