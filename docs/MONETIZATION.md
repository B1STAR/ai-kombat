# 💰 AI Kombat — Monétisation & Récompenses Réelles

> **Document opérationnel** : comment on gagne de l'argent, comment on le distribue aux joueurs, et comment on évite la mort du projet.
> **Date** : Juin 2026
> **Statut** : v1.0 — Plan définitif

---

## Table des matières

1. [Philosophie & invariants](#1-philosophie--invariants)
2. [Les 6 sources de revenue](#2-les-6-sources-de-revenue)
3. [Le système de récompenses réelles (cash-out)](#3-le-système-de-récompenses-réelles-cash-out)
4. [L'économie à 3 monnaies revisitée](#4-léconomie-à-3-monnaies-revisitée)
5. [🆕 Le plan DATASETS — le moat stratégique](#5--le-plan-datasets--le-moat-stratégique)
6. [Le système publicitaire intégré](#6-le-système-publicitaire-intégré)
7. [Le modèle token $AIK](#7-le-modèle-token-aik)
8. [Le contenu organique (YouTube, Telegram)](#8-le-contenu-organique-youtube-telegram)
9. [Les ratios de sécurité économique](#9-les-ratios-de-sécurité-économique)
10. [La roadmap monétisation](#10-la-roadmap-monétisation)
11. [Les pièges à éviter](#11-les-pièges-à-éviter)
12. [Modifications à appliquer aux autres docs](#12-modifications-à-appliquer-aux-autres-docs)

---

## 1. Philosophie & invariants

### Le principe fondamental

> **On ne paie jamais un joueur avec l'argent d'un autre joueur.** Tout cash-out doit être couvert par un **revenu externe réel** (pub, B2B, vente de data).

### Les 3 invariants à ne JAMAIS briser

1. **Ratio de couverture** : `revenu_externe_30j / cash-outs_30j > 1.5` en permanence
2. **Plafond de distribution** : on ne distribue jamais plus de 50% de nos revenus nets aux joueurs
3. **Lockup du trésor** : minimum 6 mois de cash-out en réserve sur un multisig (jamais tout déployer)

### Le cercle vertueux

```
Revenue externe (pub + B2B + data + token)
        │
        ▼
   Trésorerie (50%)
        │
        ├─→ Cash-out joueurs (40%) ─→ Cash-out réel en €
        │                                  │
        │                                  ▼
        │                          Joueurs contents
        │                                  │
        │                                  ▼
        │                          Plus de joueurs
        │                                  │
        └──────────────────┐              │
                           ▼              │
                    Marketing/Cont. (10%) │
                           │              │
                           └──────────────┘
                                  │
                                  ▼
                            Plus de revenu
```

**Pourquoi ça marche** : contrairement à un Ponzi où les nouveaux paient pour les anciens, ici **chaque nouveau joueur génère PLUS de valeur externe** (plus de data, plus d'attention pour les pubs, plus de B2B).

---

## 2. Les 6 sources de revenue

| # | Source | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|
| 1 | **Ads rewarded (Adsgram + Telegram Ads)** | ❌ | 🟡 | ✅ | ✅ |
| 2 | **Quêtes sponsorisées (chaînes Telegram)** | ❌ | 🟡 | ✅ | ✅ |
| 3 | **Quêtes B2B (vente de datasets)** | ❌ | ❌ | 🟡 | ✅ |
| 4 | **Achats in-app (gems) + Premium pass** | ❌ | 🟡 | ✅ | ✅ |
| 5 | **Channel YouTube + contenu sponsorisé** | ❌ | 🟡 | ✅ | ✅ |
| 6 | **Token $AIK (taxes + appreciation)** | ❌ | ❌ | 🟡 | ✅ |

### Distribution des revenus

| Source | % au joueur | % trésorerie | % ops/marketing |
|---|---|---|---|
| Ads rewarded | 60% | 30% | 10% |
| Quêtes sponsorisées | 80% (en coins) | 15% | 5% |
| Vente de datasets | 50% (cash) | 40% | 10% |
| Achats in-app (gems) | 0% (déjà dépensé) | 70% | 30% |
| Premium pass | 0% | 70% | 30% |
| Channel YouTube | 0% | 80% | 20% |
| Token (taxes) | 30% (aux stakers) | 60% | 10% |

---

## 3. Le système de récompenses réelles (cash-out)

> **C'est le point #1 de différenciation vs Hamster / Notcoin.** Le joueur peut gagner de l'argent réel **dès la Phase 2**, pas juste à l'airdrop.

### 3 niveaux de récompenses

#### Niveau 1 : **Coins du jeu** (gratuit, illimité, tout le temps)

- Source : tap, quêtes, daily, achievements
- **Pas de cash-out** possible (c'est de la monnaie interne)
- Sert à acheter modules, boosts
- Visible immédiatement

#### Niveau 2 : **$AIK token** (hebdomadaire, après Phase 4)

- 1 fois/semaine, le joueur peut **convertir** ses coins en $AIK
- **Taux** : 1000 coins = 1 $AIK (ajusté dynamiquement par un oracle)
- **Plafond hebdo** : équivalent $5 en $AIK
- Le $AIK est transféré sur le **Telegram Wallet** du joueur
- Cumulable, le joueur peut le garder pour spéculer OU le vendre

#### Niveau 3 : **Cash-out réel en €/$** (mensuel, avec KYC)

- Le joueur peut **convertir** $AIK → TON → €
- Via **Telegram Wallet** (déjà intégré) ou via exchange externe
- **Plafond mensuel** : $50 (Phase 3), $200 (Phase 4)
- **KYC obligatoire** (intégré Telegram Wallet ou via Sumsub)
- Délai : 7-14 jours (anti-fraude)

### Le flow visuel

```
Joueur joue (Phase 1-2)
       │
       ▼
   Gagne coins
       │
       ▼
   Achète modules, boost (sink)
       │
       ▼
   Atteint 10 000 coins (= 10 $AIK)
       │
       ▼
   [Phase 4+] Une fois/semaine, clique "Convertir"
       │
       ▼
   10 $AIK → son Telegram Wallet
       │
       ├─→ Hold (espère appreciation)
       │
       └─→ [Une fois/mois] "Cash out"
              │
              ▼
         $AIK → TON (via DEX)
              │
              ▼
         TON → € (via Telegram Wallet ou Cex)
              │
              ▼
         Retrait vers carte bancaire
         (Telegram Wallet supporte déjà ça)
```

### Conditions anti-abus

Pour **Niveau 2** (conversion coins → $AIK) :
- ✅ Compte > 7 jours
- ✅ Minimum 1000 taps
- ✅ 0 strike anti-cheat
- ✅ A fait au moins 1 quête sponsorisée ou B2B
- ✅ Trust score > 30/100

Pour **Niveau 3** (cash-out €) :
- ✅ Compte > 30 jours
- ✅ Trust score > 50/100
- ✅ A staké ses $AIK pendant au moins 7 jours
- ✅ KYC validé
- ✅ Plafond mensuel non atteint
- ✅ 1 cash-out par wallet Telegram

### Le tableau des récompenses par action (Phase 3-4)

| Action | Récompense | Coût pour nous | Marge |
|---|---|---|---|
| Tap | +1 coin | $0 | — |
| 100 taps (daily) | +50 coins | $0 | — |
| 1 quête sponsored | +200-500 coins | $0.02-0.05 (rev share) | 80% |
| 1 quête B2B (image QCM) | +100 coins + 0.05 $AIK | $0.005 (part joueur) | 50% |
| 1 pub rewarded (30s) | +100 coins | $0.01-0.02 | 60% |
| Achat in-app 5€ (500 gems) | 500 gems + 50 $AIK bonus | $1.25 (coût $AIK) | 75% |
| Premium pass 5€/mois | Bonus +20% gains | $0.50 (valeur bonus) | 90% |
| 1 ami invité | +2000 coins + 10% gains à vie | Variable | 80% |

### Le calcul de viabilité (Phase 3, 10k DAU)

```
10 000 DAU
× 60% font des quêtes B2B (3/jour) = 6 000 users × 3 = 18 000 tâches/jour
× $0.005 par tâche = $90/jour de "data revenue"

10 000 DAU
× 5% regardent 2 pubs rewarded/jour = 500 users × 2 = 1 000 vues
× $0.015 par vue = $15/jour de "ad revenue"

10 000 DAU
× 3% achètent le premium pass ($5/mois) = 300 users × $5 = $1 500/mois

Total revenue Phase 3 = $90×30 + $15×30 + $1 500 = $4 650/mois

Distribution aux joueurs (cash-out réel) :
- Max 50% du revenu net = $2 325/mois
- 10k DAU → $0.23/user/mois
- C'est petit mais c'est RÉEL, pas une promesse d'airdrop
```

À Phase 4 (100k DAU), on multiplie par ~10, et on ajoute le token = **$100k+/mois** de cash-out possibles.

---

## 4. L'économie à 3 monnaies revisitée

### Pourquoi 3 monnaies résout le problème d'Hamster

| Problème Hamster | Comment on le corrige |
|---|---|
| Inflation des coins | Coins créés par le tap, **détruits** par les achats de modules, **convertis** en $AIK |
| Airdrop injuste | Conversion coin→$AIK pondérée par les **contributions réelles** (quêtes accomplies, pas juste présence) |
| Token inutile | $AIK a 4 utilités : gouvernance, staking (gain passif), NFT d'IA, cash-out |
| Le jeu meurt après l'airdrop | $AIK continue d'exister dans l'économie (cash-out quotidien, staking) |

### Le tableau des 3 monnaies

| Monnaie | Symbole | Type | Création | Destruction | Conversion |
|---|---|---|---|---|---|
| **Coins** | 🪙 | Off-chain (DB) | Tap, quêtes, daily | Achat modules, boost énergie, conversion $AIK | 1000 coins = 1 $AIK |
| **Gems** | 💎 | Off-chain (DB) | Achat in-app (€) | Skip cooldown, multiplier 2x, AI Crates | Pas convertible en $AIK (c'est un bonus) |
| **$AIK** | 🪙 | On-chain (TON) | Conversion de coins | Cash-out, frais de transaction, NFTs | Vendu sur DEX, converti en TON/€ |

### Le flux de valeur

```
         EXTERNE (€/$)
              │
              │  Achats in-app
              ▼
         ┌─────────┐
         │  GEMS   │ (dépensés pour des boosts, ne sortent pas)
         └─────────┘
              │
              │ (50% du CA va en réalité à...)
              ▼
         ┌─────────┐
         │TRÉSORERIE│
         └────┬────┘
              │
              ├─→ 40% → Distribution joueurs (cash-out)
              │
              ├─→ 30% → Réinvestissement (marketing, contenu)
              │
              └─→ 30% → Réserve (6 mois de cash-out)
              
         EXTERNE (€/$ via pub + B2B)
              │
              ├─→ Publicité Adsgram
              │
              └─→ Vente de datasets
                     │
                     ▼
              ┌──────────────┐
              │ REVENUE EXTERNE│
              └──────┬───────┘
                     │
                     ├─→ 60% aux joueurs (en coins + $AIK)
                     │
                     └─→ 40% trésorerie

         JOUEUR
              │
              │  Joue
              ▼
         ┌─────────┐
         │  COINS  │ (gagnés en jouant)
         └────┬────┘
              │
              ├─→ Achète modules/boosts (sink #1)
              │
              └─→ Convertit en $AIK (1x/sem, max $5)
                            │
                            ▼
                     ┌─────────┐
                     │  $AIK   │ (on-chain TON)
                     └────┬────┘
                          │
                          ├─→ Hold (espère appreciation)
                          │
                          ├─→ Stake (gains passifs)
                          │
                          └─→ Cash-out 1x/mois (max $50-200)
                                │
                                ▼
                          $AIK → TON → € (Telegram Wallet)
```

### Le buyback & burn — le mécanisme qui fait monter le token

**20% de tout le revenu externe (pub + B2B + premium)** est utilisé pour :
1. **Acheter des $AIK** sur le marché (DEX)
2. **Brûler ces $AIK** (envoyer à une adresse dead)

**Effet** :
- L'offre de $AIK **diminue** au fil du temps
- La demande reste stable ou augmente (utilité du token)
- → Le prix monte mécaniquement
- → Les holders (joueurs) sont contents
- → Plus de gens veulent jouer pour avoir des $AIK

**C'est un modèle sain** : ce n'est pas un Ponzi, c'est un vrai **déflationniste** comme Ethereum après EIP-1559.

---

## 5. 🆕 Le plan DATASETS — le moat stratégique

> **C'est la pièce maîtresse à long terme. C'est ce qui transforme AI Kombat de "jeu viral" à "vrai business IA".**

### La thèse

L'économie de l'IA a **un goulot d'étranglement** : les données d'entraînement de qualité. Scale AI, Surge, Toloka, Remotasks, Labelbox = **multi-milliards de dollars** de business.

**Problème actuel de ces boîtes** :
- Quality control pourri (annotateurs random qui s'en foutent)
- Latence de plusieurs jours
- Coût élevé ($0.10-1 par tâche)
- Pas d'engagement long terme

**Notre avantage** :
- On a 1M de "travailleurs" motivés (les joueurs veulent leurs coins)
- Boucle de gamification naturelle (les joueurs restent)
- Outils de quality control intégrés (3 votes par tâche, trust score, achievements)
- Coût marginal quasi-nul (le serveur + la DB)

### Comment on structure le pipeline de datasets

#### Le flow de bout en bout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  CLIENT B2B (ex: startup qui fine-tune un modèle vision)        │
│                                                                 │
│  "Je veux 10 000 images de produits e-commerce classifiées      │
│   en 5 catégories"                                              │
│                                                                 │
│  Budget : $1 000 (vs $3 000 chez Scale AI)                      │
│                                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  NOTRE API DATASETS (/api/datasets/jobs)                        │
│                                                                 │
│  Le client upload ses images + le schéma de classification       │
│  Il choisit le niveau de qualité (1, 2 ou 3 votes par tâche)   │
│  Il paie en USDC ou en TON                                      │
│                                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  NOTRE BACKEND                                                  │
│                                                                 │
│  1. Crée un "DatasetJob" en DB                                  │
│  2. Distribue les tâches à 3 joueurs différents par image       │
│  3. Chaque joueur voit la quête dans l'app                      │
│  4. Collecte les 3 votes                                        │
│  5. Calcule la "confiance" (majority vote)                      │
│  6. Si confiance < seuil → la tâche est "à re-voter"           │
│  7. Sinon, la tâche est validée, ajoutée au dataset final       │
│                                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  JOUEUR                                                         │
│                                                                 │
│  Voit une quête :                                               │
│  "📦 Classifie cette image de produit"                          │
│  [Image]  👕 Vêtements  🪑 Meuble  📱 Tech  🎮 Jeu  🍕 Aliment  │
│                                                                 │
│  Récompense : 100 coins + 0.05 $AIK                             │
│  Temps : 10 secondes                                            │
│                                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT B2B                                                     │
│                                                                 │
│  Reçoit le dataset validé via notre API :                       │
│  https://api.aikombat.app/v1/datasets/abc123/results.csv        │
│                                                                 │
│  Format : { image_url, label, confidence, votes_count }         │
│                                                                 │
│  Peut aussi interroger en live via notre dashboard              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Les 6 types de datasets qu'on peut gérer (Phase 2-3)

| Type | Description | Difficulté | Prix client (vs Scale) | Marge |
|---|---|---|---|---|
| **Image classification** | QCM sur des images | 🟢 Easy | 60% du prix Scale | 50% |
| **Text sentiment** | "Cette review est positive ?" | 🟢 Easy | 60% | 50% |
| **Bounding boxes** | Dessiner un rectangle sur l'objet | 🟡 Medium | 50% | 60% |
| **OCR correction** | Corriger le texte reconnu | 🟡 Medium | 50% | 60% |
| **Chatbot rating** | "Cette réponse IA est bonne ?" | 🟡 Medium | 60% | 50% |
| **Code review** | "Ce code a un bug ?" | 🔴 Hard | 50% | 60% |
| **Translation validation** | "Cette traduction est correcte ?" | 🟡 Medium | 60% | 50% |
| **Audio transcription** | Transcrire un son | 🟡 Medium | 50% | 60% |

### L'API B2B (pour les clients)

```typescript
// POST /api/v1/datasets/jobs
// Authentification : API key
{
  "name": "Product Classification 10k",
  "type": "image_classification",
  "items": [
    { "id": "img_001", "url": "https://..." },
    { "id": "img_002", "url": "https://..." },
    // ... 10000 items
  ],
  "schema": {
    "question": "De quelle catégorie est ce produit ?",
    "options": ["Vêtements", "Meuble", "Tech", "Jeu", "Aliment"]
  },
  "quality": {
    "votes_per_item": 3,
    "min_confidence": 0.66,  // 2/3 votes identiques
    "trusted_workers_only": true  // trust score > 50
  },
  "budget_usd": 1000,
  "deadline_days": 7
}

// Response
{
  "job_id": "ds_abc123",
  "estimated_completion": "2026-06-22T00:00:00Z",
  "estimated_cost_usd": 600,  // notre prix
  "tracking_url": "https://aikombat.app/admin/datasets/ds_abc123"
}
```

### Le modèle de quality control

#### 3 systèmes de validation

**1. Triple vote (la base)**

Chaque tâche est présentée à 3 joueurs différents. Si 2/3 sont d'accord → validé. Sinon → re-vote avec 3 autres joueurs.

**2. Gold standard (les tâches pièges)**

On injecte **5-10% de tâches dont on connaît la réponse** (gold standard). Si un joueur se trompe sur 30%+ de ces tâches → **strike anti-cheat**, et ses votes sont invalidés.

```typescript
// Table gold_standard_tasks
CREATE TABLE gold_standard_tasks (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50),
    question TEXT,
    correct_answer JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

// Pendant la distribution des tâches :
// 5% du temps → on distribue une gold standard
// Si le user se trompe → strike
```

**3. Trust score (la réputation)**

Chaque joueur a un **trust score** (0-100) basé sur :
- Son taux de réussite sur les gold standards
- Son ancienneté
- Son nombre de tâches accomplies
- Ses strikes anti-cheat

```typescript
// Table user_trust
CREATE TABLE user_trust (
    user_id BIGINT PRIMARY KEY,
    trust_score INTEGER DEFAULT 50,
    gold_standard_passed INTEGER DEFAULT 0,
    gold_standard_failed INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);
```

**Logique** :
- Trust score < 30 → ne peut pas faire de tâches B2B
- Trust score < 10 → shadow ban (gagne pas de coins, sans le savoir)
- Trust score > 70 → a accès aux tâches les mieux payées

### Le plan de monétisation datasets (timeline)

| Phase | Quand | Action | Revenue/mois |
|---|---|---|---|
| **Phase 2** | Mois 3-4 | Lancer 1 type de tâche (image classification) avec 100 tasks/jour | $50-200 |
| **Phase 2** | Mois 4-5 | Ajouter 2 types, monter à 1000 tasks/jour | $500-1500 |
| **Phase 3** | Mois 6-8 | Site marketing "AI Kombat Datasets", contact direct B2B | $5-20k |
| **Phase 3** | Mois 8-12 | Scale à 10k+ tasks/jour, 5+ types de tâches | $20-50k |
| **Phase 4** | Mois 12+ | Devenir une alternative crédible à Scale AI en Europe | $100-500k |

### La stratégie d'acquisition B2B

**Phase 2-3** : outbound direct
- Tu cibles 50 startups IA françaises/européennes
- Tu leur envoies un email : "On peut vous faire 10k annotations en 48h pour 30% moins cher que Scale AI. Voici un POC gratuit de 100 tâches."
- Tu fais 5-10 POC gratuits → 2-3 deviennent clients payants

**Phase 3-4** : inbound via contenu
- Tu publies des case studies sur un blog
- Tu fais un thread Twitter : "On a annoté 1M d'images avec un jeu Telegram"
- Tu participes à des confs IA (NeurIPS, ICML)

**Pricing** :
| Volume | Prix par tâche (image classification) | Notre coût (joueurs) | Marge |
|---|---|---|---|
| < 1 000 | $0.10 | $0.005 | 95% |
| 1 000 - 10 000 | $0.05 | $0.005 | 90% |
| 10 000 - 100 000 | $0.03 | $0.004 | 87% |
| > 100 000 | $0.02 | $0.003 | 85% |

### Les fichiers à ajouter au monorepo

```
/apps/api/src/
├── /datasets/
│   ├── jobs.controller.ts          # CRUD des jobs B2B
│   ├── jobs.service.ts
│   ├── jobs.routes.ts
│   ├── distribution.service.ts     # Distribue les tâches aux joueurs
│   ├── validation.service.ts       # Triple vote, gold standard
│   ├── gold-standard.service.ts
│   ├── trust.service.ts
│   ├── /b2b/                       # API externe (auth API key)
│   │   ├── auth.ts
│   │   └── routes.ts
│   └── /admin/                     # Dashboard admin
│       └── routes.ts
```

### Les nouvelles tables DB (à ajouter à ARCHITECTURE.md)

```sql
-- ============================================
-- MIGRATION 011 : DATASETS B2B
-- ============================================
CREATE TABLE dataset_jobs (
    id VARCHAR(50) PRIMARY KEY,  -- ds_abc123
    client_id BIGINT REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'image_classification', 'sentiment', etc.
    schema JSONB NOT NULL,  -- { question, options, ... }
    total_items INTEGER NOT NULL,
    completed_items INTEGER DEFAULT 0,
    votes_per_item INTEGER DEFAULT 3,
    min_confidence DECIMAL(3,2) DEFAULT 0.66,
    budget_usd DECIMAL(10,2),
    cost_usd DECIMAL(10,2),  -- what we pay out
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'cancelled'
    progress_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    deadline_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE dataset_items (
    id BIGSERIAL PRIMARY KEY,
    job_id VARCHAR(50) REFERENCES dataset_jobs(id) ON DELETE CASCADE,
    external_id VARCHAR(255),  -- client's ID
    payload JSONB NOT NULL,  -- { image_url, ... }
    correct_answer JSONB,  -- for gold standards
    is_gold_standard BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'voting', 'validated', 'disputed'
    final_answer JSONB,
    confidence DECIMAL(3,2),
    votes_count INTEGER DEFAULT 0
);

CREATE TABLE dataset_votes (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT REFERENCES dataset_items(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    answer JSONB,
    is_correct BOOLEAN,
    time_spent_ms INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(item_id, user_id)  -- Un user vote 1 fois par item
);

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

-- Index pour la performance
CREATE INDEX idx_dataset_items_job_id ON dataset_items(job_id);
CREATE INDEX idx_dataset_items_status ON dataset_items(status);
CREATE INDEX idx_dataset_votes_item_id ON dataset_votes(item_id);
CREATE INDEX idx_dataset_votes_user_id ON dataset_votes(user_id);
```

### Les nouveaux endpoints API (à ajouter à ARCHITECTURE.md)

**API B2B (clients externes)** :

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/datasets/jobs` | Créer un nouveau job |
| `GET` | `/api/v1/datasets/jobs/:id` | Status d'un job |
| `GET` | `/api/v1/datasets/jobs/:id/results` | Télécharger les résultats |
| `GET` | `/api/v1/datasets/jobs/:id/progress` | Progression en live |
| `GET` | `/api/v1/account/balance` | Solde du client |
| `POST` | `/api/v1/account/credit` | Ajouter du crédit |

**API Admin (interne)** :

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/datasets/jobs` | Liste tous les jobs |
| `POST` | `/api/admin/datasets/jobs/:id/cancel` | Annuler un job |
| `POST` | `/api/admin/datasets/gold-standards` | Ajouter des gold standards |
| `GET` | `/api/admin/datasets/stats` | Métriques globales |

**API Joueurs (déjà couvert)** :

- `GET /api/tasks/next` : récupère une tâche (maintenant mixe quêtes + datasets B2B)
- `POST /api/tasks/submit` : soumet un vote

### Le pipeline de distribution des tâches

```typescript
// apps/api/src/datasets/distribution.service.ts
import { db } from '../db/knex';
import { getUserTrustScore } from './trust.service';

export const distributeNextItem = async (userId: number): Promise<DatasetItem | null> => {
  // 1. Vérifier que le user peut faire des tâches (trust score > 30)
  const trust = await getUserTrustScore(userId);
  if (trust.trust_score < 30 || trust.is_shadow_banned) {
    return null;
  }
  
  // 2. Trouver un item :
  //    - Actif (job en cours)
  //    - Pas encore voté par ce user
  //    - Avec le moins de votes actuellement (< votes_per_item)
  //    - 5% du temps, prendre un gold standard
  const isGoldStandard = Math.random() < 0.05;
  
  let item;
  if (isGoldStandard) {
    item = await db('dataset_items')
      .where({ is_gold_standard: true, status: 'pending' })
      .whereNotExists(function() {
        this.select('*').from('dataset_votes').whereRaw('dataset_votes.item_id = dataset_items.id').where('user_id', userId);
      })
      .orderByRaw('RANDOM()')
      .first();
  } else {
    item = await db('dataset_items')
      .join('dataset_jobs', 'dataset_jobs.id', 'dataset_items.job_id')
      .where('dataset_jobs.status', 'running')
      .whereIn('dataset_items.status', ['pending', 'voting'])
      .whereNotExists(function() {
        this.select('*').from('dataset_votes').whereRaw('dataset_votes.item_id = dataset_items.id').where('user_id', userId);
      })
      .orderByRaw('RANDOM()')
      .first();
  }
  
  return item;
};
```

### Le pipeline de validation

```typescript
// apps/api/src/datasets/validation.service.ts
export const processVote = async (itemId: number, userId: number, answer: any) => {
  // 1. Enregistrer le vote
  const item = await db('dataset_items').where('id', itemId).first();
  const job = await db('dataset_jobs').where('id', item.job_id).first();
  
  let isCorrect = null;
  if (item.is_gold_standard) {
    isCorrect = JSON.stringify(answer) === JSON.stringify(item.correct_answer);
    
    // Update trust score
    if (isCorrect) {
      await db('user_trust')
        .where('user_id', userId)
        .increment('gold_standard_passed', 1)
        .increment('trust_score', 1);
    } else {
      await db('user_trust')
        .where('user_id', userId)
        .increment('gold_standard_failed', 1)
        .decrement('trust_score', 5);
      
      // Strike si trop d'échecs
      const trust = await db('user_trust').where('user_id', userId).first();
      if (trust.gold_standard_failed > 10 && 
          trust.gold_standard_failed / (trust.gold_standard_passed + trust.gold_standard_failed) > 0.3) {
        await flagUserForReview(userId, 'high_gold_standard_failure_rate');
      }
    }
  }
  
  await db('dataset_votes').insert({
    item_id: itemId,
    user_id: userId,
    answer,
    is_correct: isCorrect,
  });
  
  // 2. Vérifier si on a assez de votes pour valider
  const votes = await db('dataset_votes').where('item_id', itemId);
  
  if (votes.length >= job.votes_per_item) {
    await resolveItemVotes(itemId, job);
  }
  
  // 3. Update la progression du job
  await updateJobProgress(job.id);
  
  return { success: true };
};

const resolveItemVotes = async (itemId: number, job: any) => {
  const votes = await db('dataset_votes').where('item_id', itemId);
  
  // Grouper par réponse
  const groups: Record<string, any[]> = {};
  for (const vote of votes) {
    const key = JSON.stringify(vote.answer);
    if (!groups[key]) groups[key] = [];
    groups[key].push(vote);
  }
  
  // Trouver la majorité
  const majority = Object.entries(groups).sort((a, b) => b[1].length - a[1].length)[0];
  const confidence = majority[1].length / votes.length;
  
  if (confidence >= job.min_confidence) {
    // Validé
    await db('dataset_items')
      .where('id', itemId)
      .update({
        status: 'validated',
        final_answer: JSON.parse(majority[0]),
        confidence,
        votes_count: votes.length,
      });
  } else {
    // Disputé → re-vote
    await db('dataset_items')
      .where('id', itemId)
      .update({
        status: 'disputed',
        votes_count: votes.length,
      });
    // (Les votes précédents sont gardés, on ajoute 3 nouveaux votants)
  }
};
```

### Le marketing B2B — le pitch deck en 1 page

**"AI Kombat Datasets — Crowdsourced AI training data, 50% cheaper than Scale AI"**

- **The problem** : High-quality labeled data is the bottleneck of every AI project. Scale AI charges $0.10-1 per task, has 2-7 day latency, and inconsistent quality.
- **Our solution** : 1M+ engaged "annotators" through a gamified Telegram app. Triple-vote validation, gold standard checks, trust scoring.
- **Why us** : 70% cheaper, 24-48h turnaround, quality guaranteed (we refund if <90% inter-annotator agreement).
- **Pricing** : from $0.02/task for image classification, $0.05 for bounding boxes.
- **Tech** : REST API, real-time progress tracking, CSV/JSON export, webhooks.

**Canaux d'acquisition** :
- Outbound email vers startups IA (France, EU, US)
- Présence sur Product Hunt, Hacker News
- Conférences IA (NeurIPS, ICML)
- Partenariats avec incubateurs (Y Combinator, Station F)

---

## 6. Le système publicitaire intégré

### Setup technique

```bash
# Côté front (Next.js)
npm install adsgram-react
```

```typescript
// apps/web/components/AdsgramAd.tsx
'use client';
import { useState } from 'react';
import Script from 'next/script';
import { useStore } from '@/lib/store';

declare global {
  interface Window {
    AdsgramSDK?: any;
  }
}

export const AdsgramAd = ({ blockId, rewardCoins = 100 }: { blockId: string; rewardCoins?: number }) => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { addCoins, telegramUser } = useStore();
  
  const showAd = async () => {
    if (!window.AdsgramSDK) return;
    
    setLoading(true);
    const AdController = window.AdsgramSDK.init({ blockId });
    
    AdController.show().then(async (result: any) => {
      if (result.done) {
        // L'user a vu la pub jusqu'au bout
        setCompleted(true);
        
        // On demande au serveur de créditer
        try {
          const res = await fetch('/api/ads/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              adId: blockId,
              adType: 'adsgram',
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            addCoins(data.coinsEarned);
          }
        } catch (e) {
          console.error('Failed to credit ad reward', e);
        }
      }
    }).finally(() => {
      setLoading(false);
    });
  };
  
  return (
    <>
      <Script 
        src="https://adsgram.ai/static/adsgram-sdk.js"
        onLoad={() => console.log('Adsgram loaded')}
      />
      <button 
        onClick={showAd} 
        disabled={loading}
        className="ads-button"
      >
        {loading ? '⏳' : '📺'} Watch ad (+{rewardCoins} coins)
      </button>
    </>
  );
};
```

```typescript
// apps/api/src/routes/ads.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';

const ads = new Hono();

ads.post('/reward', authMiddleware, rateLimit({ windowMs: 60_000, limit: 3 }), async (c) => {
  const user = c.get('telegramUser');
  const { adId, adType } = await c.req.json();
  
  // Vérifier qu'on n'a pas déjà récompensé cette pub
  const existing = await db('ad_views')
    .where({ user_id: user.id, ad_id: adId, ad_type: adType })
    .where('created_at', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
    .first();
  
  if (existing) {
    return c.json({ error: 'Ad already viewed in last 24h' }, 400);
  }
  
  // Logger la vue
  await db('ad_views').insert({
    user_id: user.id,
    ad_id: adId,
    ad_type: adType,
  });
  
  // Créditer les coins
  const coinsReward = 100;
  await db('users')
    .where('telegram_id', user.id)
    .increment('coin_balance', coinsReward);
  
  // Logger la transaction
  await db('transactions').insert({
    user_id: user.id,
    type: 'ad_reward',
    currency: 'coin',
    amount: coinsReward,
  });
  
  return c.json({ success: true, coinsEarned: coinsReward });
});

export default ads;
```

### Les formats d'ads

| Format | Placement | Fréquence | Récompense user | Notre revenu/vue |
|---|---|---|---|---|
| Rewarded video | Bouton "Regarder une pub" | À la demande | +100 coins | $0.01-0.02 |
| Interstitial | Entre 2 écrans | 1 / 5 min | 0 | $0.005-0.01 |
| Banner | Bas d'écran | Toujours | 0 | $0.001-0.003 |
| Sponsored quest | Page des quêtes | 3-5 / jour | +200-500 coins | $0.05-0.15 |

### Les emplacements dans l'UI

```
┌──────────────────────────────────────────────┐
│ Header (solde coins, level IA)               │
├──────────────────────────────────────────────┤
│                                              │
│         IA centrale (le visuel)              │
│                                              │
│        [ Tap to train ]                      │
│                                              │
├──────────────────────────────────────────────┤
│ 📺 Watch ad for +100 coins  [Watch]         │  ← Rewarded
├──────────────────────────────────────────────┤
│ Coin balance : 12 350                        │
│                                              │
│ Energy ████████████░░░  1234/1500            │
│ XP    ██████░░░░░░░░░  6 200/10 000         │
│                                              │
│ Profit / hour : 1 200 coins                  │
├──────────────────────────────────────────────┤
│ [Home]  [Quests]  [AI]  [Friends]  [Shop]    │
└──────────────────────────────────────────────┘
```

### Le tableau des revenus publicitaires projetés

| DAU | Vues/jour (3/user) | CPM moyen | Revenue/mois |
|---|---|---|---|
| 1 000 | 3 000 | $0.01 | $900 |
| 10 000 | 30 000 | $0.01 | $9 000 |
| 100 000 | 300 000 | $0.01 | $90 000 |
| 1 000 000 | 3 000 000 | $0.01 | $900 000 |

---

## 7. Le modèle token $AIK

### Le smart contract (Tact pour TON)

```tact
// contracts/aik-token.tact
import "@stdlib/deploy";
import "@stdlib/ownable";

message BuybackAndBurn {
    amount: Int as coins;
}

contract AikToken with Deployable, Ownable {
    totalSupply: Int as coins;
    owner: Address;
    burnAddress: Address;
    
    init() {
        self.totalSupply = 1_000_000_000 * 1_000_000_000; // 1B tokens, 9 decimals
        self.owner = sender();
        self.burnAddress = address("0:0000000000000000000000000000000000000000000000000000000000000000");
    }
    
    // Buyback & burn : appelé par le backend via multisig
    receive(msg: BuybackAndBurn) {
        require(sender() == self.owner, "Only owner");
        // Le owner envoie déjà les tokens à burn avec le message
        // Cette fonction met juste à jour le tracking
    }
    
    // Burn des tokens (envoyés à la burn address)
    receive() {
        // Si le sender == burnAddress, on a "perdu" les tokens
        // C'est juste un record-keeping
    }
}
```

### Le tokenomics (révisé)

| Allocation | % | Vesting |
|---|---|---|
| **Récompenses joueurs (cash-out)** | 50% | Libéré sur 4 ans |
| **Trésorerie** | 20% | 6 mois cliff, puis 36 mois linear |
| **Équipe** | 15% | 12 mois cliff, puis 36 mois linear |
| **Liquidité DEX** | 10% | Au listing |
| **Marketing** | 5% | Au listing |

### Le calendrier

| Événement | Quand | Effet sur le prix |
|---|---|---|
| **Lancement $AIK** (Phase 4) | Mois 12 | Prix initial ~$0.001 |
| **Premier listing DEX** (STON.fi) | Mois 12 | Volume de trading démarre |
| **Buyback #1** (1% supply) | Mois 13 | +5-10% prix |
| **Premier cash-out réel** | Mois 13-14 | Pression vendeuse initiale, se stabilise |
| **Telegram Wallet listing** | Mois 15-18 | Adoption massive |
| **Top 10 CEX listing** | Mois 18-24 | ×10-100 volume |

### Les sources de demande de $AIK

1. **Utilité** : gouvernance, NFT d'IA, premium features
2. **Speculation** : les gens achètent en espérant que ça monte
3. **Staking** : tu dois acheter des $AIK pour les staker et gagner des rewards
4. **Cash-out** : les joueurs veulent retirer, donc ils achètent (effet de rareté)

### Le pool de liquidité

À éviter : le "rug pull" classique. On lock le LP sur 2 ans via Unicrypt ou équivalent TON.

---

## 8. Le contenu organique (YouTube, Telegram)

### La chaîne Telegram `@AIKombat`

**Objectif** : 100k abonnés en 6 mois (organique)

**Contenu** :
- Updates du jeu (1-2x/semaine)
- Mèmes crypto (quotidien)
- Annonces des nouvelles quêtes
- AMA (Ask Me Anything) hebdo
- Concours (raids, giveaways)

**Revenue** : indirect (pas de pub Telegram sur les chaînes, mais ça drive les quêtes sponsorisées)

### La chaîne YouTube "AI Kombat"

**Objectif** : 50k abonnés en 12 mois

**Format de vidéos** :
- **"AI Kombat Weekly Recap"** (5 min) : best of la semaine
- **"AI Tutorial"** (10 min) : comment utiliser GPT-4, fine-tuner un modèle
- **"Player Spotlight"** (3 min) : profil d'un top joueur
- **"AI News"** (8 min) : résumé de l'actu IA

**Outils pour être seul** :
- Script : GPT-4 (toi tu valides)
- Voix : ElevenLabs (à $5-22/mois)
- Montage : CapCut / DaVinci Resolve (gratuit)
- Thumbnails : Canva + Midjourney

**Revenue YouTube** :
- 50k abonnés × 200k vues/mois × $3 CPM = **$600/mois** Adsense
- + Sponsorings crypto : **$500-3000/vidéo** à ce niveau

### Le funnel contenu → jeu

```
YouTube/Telegram
       │
       │ CTA : "Rejoins AI Kombat"
       ▼
Telegram Bot @AIKombatBot
       │
       ▼
Mini App (jeu)
       │
       ▼
Rétention + Cash-out
       │
       ▼
Joueur actif
       │
       └─→ Partage son code referral
              │
              ▼
          Nouveau joueur
```

---

## 9. Les ratios de sécurité économique

### Les 5 KPIs à monitorer en temps réel

#### 1. Ratio de couverture

```
revenu_externe_30j / cash-outs_30j > 1.5
```

- 🟢 > 1.5 : sain
- 🟡 1.0-1.5 : surveille de près
- 🔴 < 1.0 : danger, réduire les récompenses

#### 2. Burn rate (vitesse à laquelle on perd la trésorerie)

```
trésorerie_actuelle / cash-out_moyen_mensuel > 6
```

- 🟢 > 6 mois de runway
- 🟡 3-6 mois
- 🔴 < 3 mois : lever des fonds ou pivoter

#### 3. LTV / CAC ratio

```
(Lifetime Value par joueur) / (Coût d'acquisition) > 3
```

#### 4. Taux de conversion (gratuit → payant)

```
joueurs_payants / joueurs_actifs > 2%
```

#### 5. Rétention D7 (joueurs qui reviennent après 7 jours)

```
joueurs_actifs_j7 / joueurs_inscrits_j0 > 20%
```

### Le dashboard admin (à construire Phase 3)

```
┌─────────────────────────────────────────────────────────────┐
│ AI Kombat — Admin Dashboard                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REVENUE (30 jours)                  CASH-OUT (30 jours)   │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │ Adsgram      │  $4 500            │ Joueurs      │ $2 800│
│  │ Sponsored    │  $2 100            │ Stakers      │   $400│
│  │ Datasets     │  $8 700            │              │       │
│  │ Premium      │  $1 800            │              │       │
│  │ ─────────────│                    │              │       │
│  │ TOTAL        │ $17 100            │ TOTAL        │ $3 200│
│  └──────────────┘                    └──────────────┘       │
│                                                             │
│  RATIO DE COUVERTURE : 5.3  🟢                             │
│  BURN RATE : 14 mois  🟢                                   │
│  TRÉSORERIE : $44 800                                       │
│                                                             │
│  JOUEURS ACTIFS                                              │
│  DAU : 12 340        WAU : 47 200        MAU : 89 100       │
│                                                             │
│  RÉTENTION                                                   │
│  D1 : 65%  D7 : 38%  D30 : 18%                             │
│                                                             │
│  ANTI-CHEAT                                                 │
│  Comptes bannis : 234 (1.7%)                                │
│  Strikes émis : 1 204 (8.7%)                                │
│  Trust score moyen : 64/100                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Les alertes automatiques

| Alerte | Seuil | Action |
|---|---|---|
| Ratio de couverture < 1.5 | Critique | Réduire les récompenses de 20% |
| Burn rate < 6 mois | Attention | Notifier l'équipe, geler les embauches |
| Trésorerie < $5k | Critique | Pause du cash-out, mode survie |
| Taux de cash-out > 70% du revenu | Attention | Augmenter les sources de revenu (campagne pub) |
| Trust score moyen < 40 | Attention | Renforcer le gold standard, ban plus agressif |

---

## 10. La roadmap monétisation

### Phase 1 : Setup (Semaine 1-2)

- [ ] Créer la chaîne Telegram `@AIKombat`
- [ ] Setup Adsgram (créer un compte, obtenir un block ID)
- [ ] Préparer l'API `/api/ads/reward`
- [ ] Préparer l'API `/api/quests/sponsored` (admin only)
- [ ] Créer 2-3 partenariats informels avec des chaînes crypto

### Phase 2 : Premiers revenus (Mois 2-3)

- [ ] Lancer les rewarded videos (Adsgram)
- [ ] Lancer 3-5 quêtes sponsorisées manuelles
- [ ] Implémenter le tableau de bord admin basique
- [ ] Monitorer le ratio de couverture (1ers jours)
- [ ] Setup le YouTube channel, poster 2-3 vidéos

**Cible** : $500-2000/mois de revenu externe

### Phase 3 : Datasets B2B + Premium (Mois 4-6)

- [ ] Setup le système de datasets (DB, API, distribution, validation)
- [ ] Lancer 1 type de tâche (image classification) avec 100 tasks/jour
- [ ] Créer le site marketing "AI Kombat Datasets"
- [ ] Setup Stripe pour les achats in-app (gems)
- [ ] Lancer le Premium pass ($5/mois)
- [ ] Engagement d'un community manager ($1500/mois)
- [ ] Setup des alertes de monitoring économiques

**Cible** : $5-20k/mois de revenu, ratio de couverture > 3

### Phase 4 : Token + Scale (Mois 6-12)

- [ ] Audit du smart contract
- [ ] Lancement $AIK sur TON (gratuit, ~$5k de gaz)
- [ ] Listing sur STON.fi
- [ ] Setup du buyback & burn (automatisé)
- [ ] Lancement des quêtes B2B à grande échelle (10k+ tasks/jour)
- [ ] Cible 100k DAU
- [ ] Cash-out réel activé

**Cible** : $50-200k/mois de revenu, $1M+ market cap $AIK

### Phase 5 : Mature (Mois 12+)

- [ ] Top 10 CEX listing
- [ ] Équipe de 5-10 personnes
- [ ] Expansion internationale (10 langues)
- [ ] Partenariats stratégiques (Scale AI, Toloka, etc.)
- [ ] 1M+ DAU, $5M+ market cap

---

## 11. Les pièges à éviter

### Piège 1 : Le Ponzi déguisé

**Symptôme** : tu paies les cash-outs avec l'argent des nouveaux investisseurs, pas avec du revenu externe.

**Solution** : monitorer le ratio de couverture en temps réel. Si < 1.5, pause.

### Piège 2 : Le "rug pull" sur le token

**Symptôme** : l'équipe vend ses tokens au listing, le prix s'effondre.

**Solution** : vesting 36 mois pour l'équipe, multisig pour le trésor, contrat audité.

### Piège 3 : Le délit de jeu d'argent

**Symptôme** : ton jeu ressemble à un casino, le régulateur débarque.

**Solution** :
- Disclaimer légal clair : "ce n'est pas un jeu d'argent, c'est un jeu de skill"
- Les **coins** ne s'achètent pas en €, seulement les **gems**
- Le cash-out en € est **optionnel** et soumis à KYC
- Consulter un avocat crypto en Phase 3

### Piège 4 : Les bots de cash-out

**Symptôme** : des mecs créent 1000 comptes, farm, cash-out.

**Solution** :
- Anti-cheat à 6 couches
- 1 cash-out par wallet Telegram
- Trust score minimum pour cash-out
- KYC
- Plafond mensuel

### Piège 5 : L'inflation des coins

**Symptôme** : trop de coins créés, pas assez détruits → chaque coin vaut 0.

**Solution** : sinks forts (modules chers), plafond de gain/h, conversion en $AIK qui "détruit" les coins.

### Piège 6 : Le ratio qualité/prix qui se dégrade

**Symptôme** : tu vends des datasets de mauvaise qualité, tes clients B2B partent.

**Solution** : triple vote, gold standard, trust score, remboursement garanti si <90% inter-annotator agreement.

### Piège 7 : La dépendance à Telegram

**Symptôme** : Telegram change ses règles ou bloque ta mini-app.

**Solution** : avoir un site web standalone (même techno, juste sans le wrapper Telegram) en backup. 10% du trafic y passe déjà.

---

## 12. Modifications à appliquer aux autres docs

### À ajouter à `VISION.md`

Insérer après la **section 17 (Modèle économique)** une nouvelle section :

> ### Section 18 : Le Plan Monétisation Détaillé
> Référencer MONETIZATION.md

### À mettre à jour dans `VISION.md`

**Section 8 (Les quêtes)** — ajouter le type "sponsored" avec revenue share
**Section 16 (Métriques de succès)** — ajouter les ratios de couverture économiques
**Section 17 (Modèle économique)** — remplacer par le contenu de MONETIZATION.md

### À ajouter à `ARCHITECTURE.md`

**Section 4 (Schéma DB)** — ajouter les migrations 011-012 :
- `dataset_jobs`, `dataset_items`, `dataset_votes`, `user_trust`, `clients`, `client_payments`
- `ad_views`

**Section 5 (API REST)** — ajouter :
- `/api/ads/reward`
- `/api/v1/datasets/*` (B2B)
- `/api/admin/datasets/*`

**Section 7 (Anti-cheat)** — ajouter la couche 7 : trust score pour B2B

### À mettre à jour dans `ARCHITECTURE.md`

**Section 14 (Estimation des coûts)** — ajouter le coût Adsgram (gratuit, on est payé), Telegram Ads (gratuit), et la projection de revenue

---

## 📌 TL;DR

> **On a 6 sources de revenu, mais les 3 piliers sont : (1) la vente de datasets IA aux entreprises (B2B), (2) la publicité rewarded, et (3) le token $AIK avec un mécanisme de buyback & burn.**
>
> **Les joueurs peuvent gagner de l'argent réel dès la Phase 2 (via les quêtes sponsorisées et B2B), et dès la Phase 4 via le cash-out en €/$/crypto.**
>
> **Les invariants de sécurité : ratio de couverture > 1.5, plafond de distribution à 50% du revenu, lockup du trésor à 6 mois. Tant qu'on respecte ces 3 règles, le projet est viable à long terme.**
>
> **L'unité économique clé, c'est : 1 joueur actif = ~$0.10-0.30/mois de revenu. À 100k DAU, on est rentable. À 1M DAU, on est millionnaire.**

---

*Document maintenu par Mavis.*
