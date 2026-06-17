# 🚀 AI KOMBAT — Vision & Game Design Document

> **Date** : Juin 2026
> **Statut** : Document fondateur (v0.1)
> **Auteur** : Mavis (consolidation d'une discussion exploratoire)
> **Nom de code** : **AI Kombat** *(proposition — ouvert au changement)*

---

## Table des matières

1. [Vision & positionnement](#1-vision--positionnement)
2. [Analyse concurrentielle](#2-analyse-concurrentielle)
3. [Le concept en une phrase](#3-le-concept-en-une-phrase)
4. [Game design — les mécaniques](#4-game-design--les-mécaniques)
5. [L'économie à 3 monnaies](#5-léconomie-à-3-monnaies)
6. [Les "Modules IA" (équivalent des cartes Hamster)](#6-les-modules-ia-équivalent-des-cartes-hamster)
7. [Le méta-game : faire évoluer SON IA](#7-le-méta-game--faire-évoluer-son-ia)
8. [Les quêtes (engagement quotidien)](#8-les-quêtes-engagement-quotidien)
9. [Le social & la viralité](#9-le-social--la-viralité)
10. [Les erreurs de Hamster Kombat qu'on corrige](#10-les-erreurs-de-hamster-kombat-quon-corrige)
11. [Architecture technique](#11-architecture-technique)
12. [Schéma de base de données](#12-schéma-de-base-de-données)
13. [L'API (endpoints)](#13-lapi-endpoints)
14. [L'anti-cheat (la vraie différence)](#14-lanti-cheat-la-vraie-différence)
15. [Roadmap produit](#15-roadmap-produit)
16. [Métriques de succès](#16-métriques-de-succès)
17. [Modèle économique](#17-modèle-économique)
18. [Ce qu'on emprunte aux dépôts publics](#18-ce-quon-emprunte-aux-dépôts-publics)
19. [Ce qu'on construit from scratch](#19-ce-quon-construit-from-scratch)

---

## 1. Vision & positionnement

### Le pitch

**AI Kombat** est un jeu **tap-to-earn** dans Telegram, dans la veine de Hamster Kombat / Notcoin, où chaque tap est présenté comme **une action d'entraînement d'une intelligence artificielle personnelle**. Le joueur fait évoluer une IA qu'il possède, achète des "modules" qui l'améliorent, accomplit des "quêtes" qui correspondent à des **vrais cas d'usage de l'IA** (coder, générer, classifier, apprendre, rechercher…).

### La nuance fondamentale vs Hamster

| | Hamster Kombat | AI Kombat |
|---|---|---|
| Ce qu'on clique | Un hamster qui grossit | Une IA qui apprend |
| Ce qu'on achète | Cartes crypto abstraites | Modules IA concrets (Code, Vision, Voice, Research…) |
| Ce que ça "fait" | Rien (juste un compteur) | Le joueur **apprivoise l'univers de l'IA** (vocabulaire, capacités, métiers) |
| Public cible | Crypto-enthousiastes | Crypto-enthousiastes **+** étudiants/curieux de l'IA |
| Valeur de marque | "Deviens PDG crypto" | "Construis l'IA la plus puissante" |
| Narratif | Bourse crypto | Évolution technologique (du neurone à l'AGI) |

### La promesse (transparente)

**Phase 1 (MVP)** : on fait comme Hamster — le tap est symbolique, c'est juste de la progression fictive. **Le joueur le sait, on le lui dit explicitement dans l'UI** ("Chaque tap simule une opération d'entraînement de ton IA").

**Phase 2 (avec budget)** : on peut brancher de vraies micro-tâches d'entraînement IA (classification, annotation, validation de réponses), avec un vrai revenu redistributed aux joueurs. **Mais on ne bloque pas le lancement là-dessus.**

**Phase 3 (scale)** : on lance un vrai produit : l'IA du joueur devient un **assistant personnel** qu'il peut utiliser (génération de texte, de code, d'images) en dépensant ses tokens.

> 💡 C'est la même stratégie que **duolingo qui te promet de parler la langue** (mais t'apprend pas vraiment) ou **Strava qui te promet la performance** (mais t'as juste un compteur). Le **storytelling est la valeur ajoutée**, pas la fonction technique.

---

## 2. Analyse concurrentielle

### Dépôts publics analysés (8 candidats)

| Dépôt | Type | Verdict |
|---|---|---|
| `tungulin/quackup-app` | **Front + Back complet** (Node/TS, Postgres, Knex) | ⭐⭐⭐ **LE SEUL dépôt prod-ready** — on s'en inspire fortement |
| `Kennix88/Token-Giver` | Front Next.js complet, back séparé | ⭐⭐ Beaux composants UI à piquer (Tasks, Friends, Leaders) |
| `SyntaxByte-Solution/tap-mini-app` | Front + Back + ABI ERC20 (BSC/SOL) | ⭐⭐ Firebase NoSQL, mais bonne référence crypto |
| `tanghong1992/Tele-mini-app` | Boilerplate Next.js vide | ⭐ Rien d'utile |
| `nikandr-surkov/Hamster-Kombat-Telegram-Mini-App-Clone` | Maquette UI statique | ⭐ Design à piquer, zéro logique |
| `Malith-Rukshan/NotCoin-Mini-App-Clone` | Idem | ⭐ Idem |
| `w3laba/Clicker-Tap-Mini-App` | Vitrine commerciale ($500) | ❌ Zéro code |
| `XerxesCoder/Telegram-Mini-App-clone` | Vitrine commerciale | ❌ Zéro code |

### Conclusion de l'analyse

> **Aucun dépôt public ne fournit un produit complet clé-en-main.** Le seul à avoir un vrai backend structuré (`quackup`) reste un clone P2E générique (jeu de canards). **Notre différentiation repose sur 3 piliers qu'aucun dépôt n'a implémentés** :
> 1. Le **narratif IA** (vs hamster, vs duck, vs coin)
> 2. L'**économie à 3 monnaies** (vs mono-devise qui s'effondre)
> 3. L'**anti-cheat robuste** (vs backends Firebase NoSQL qu'on triche en 5 min)

---

## 3. Le concept en une phrase

> **Tu possèdes une IA. Chaque tap l'entraîne. Chaque quête lui apprend un nouveau domaine (code, vision, voix, recherche, médecine…). Plus elle est entraînée, plus elle gagne de l'argent en ta faveur. Le but : la faire passer du stade "neurone naissant" à "AGI".**

---

## 4. Game design — les mécaniques

### Le cœur : le **tap-to-train**

| Élément | Valeur |
|---|---|
| Énergie de départ | 1000 |
| Énergie max (niveau 1) | 1500 |
| Coût en énergie par tap | 1 |
| Coins gagnés par tap | 1 (de base) |
| Multiplicateur par module | Variable (voir §6) |
| Regen énergie | +1 toutes les 3 secondes |
| Pleine regen | 1h30 si on a tout dépensé |
| Tap max/sec | 5 (rate limit serveur) |

### La courbe d'énergie

```
Énergie
   1500 ┤━━━━━━━━━━━●  ← niveau max atteint
        │           ╲
   1000 ┤━━━━━━━━━━━●  ← niveau de départ
        │           ╲
        │            ╲
      0 ┤━━━━━━━━━━━━━●  ← reset
        └──────────────── temps
        0s          1h30
```

### Le "feeling" du tap

À chaque tap :
- Animation visuelle sur l'IA centrale (particule, onde, glow)
- Compteur "+N coins" qui s'envole
- Barre d'XP de l'IA qui se remplit
- Vibration haptique courte (si supporté)
- Son "pop" (optionnel, désactivable)

### L'IA centrale (visuel)

L'avatar évolue au fur et à mesure :
- **Niveau 1-5** : un petit neurone pulsant
- **Niveau 6-10** : un réseau de 3 neurones connectés
- **Niveau 11-20** : un mini-cerveau stylisé (SVG/Canvas)
- **Niveau 21-30** : un robot humanoïde
- **Niveau 30+** : forme abstraite, presque mystique (cerveau + halo)

**C'est le centre visuel de l'app.** L'évolution est **permanente et visible**.

---

## 5. L'économie à 3 monnaies

> **C'est notre correctif principal au bug d'Hamster Kombat** (1 seule monnaie → inflation → effondrement).

### Monnaie 1 : **Coins** 🪙 (la monnaie de base)

- **Obtention** : tap, quêtes, daily reward, achievements
- **Dépense** : acheter des Modules IA, payer les boosts d'énergie
- **Ratio** : 1 tap = 1 coin (multiplicateur possible via modules)
- **Sink** : très important, c'est ce qui équilibre l'économie
- **Stockage** : en DB (Postgres)

### Monnaie 2 : **Gems** 💎 (la monnaie premium)

- **Obtention** : achat in-app (€), achievements rares, leveling up
- **Dépense** : skip cooldown, multiplier 2x, acheter des modules exclusifs, reskinner l'IA
- **Ratio** : 1€ ≈ 100 gems (à ajuster)
- **Sink** : recharger l'énergie instantanément, ouvrir des "AI Crates"
- **Stockage** : en DB

### Monnaie 3 : **$AIK Token** (la crypto on-chain)

- **Obtention** : conversion de coins au rate 1000 coins = 1 $AIK (phase 4)
- **Dépense** : gouvernance, vote sur l'évolution du jeu, achat de NFT d'IA
- **Stack** : TON (The Open Network) — gratuit à déployer, intégré à Telegram
- **Phase d'intro** : 1 an après le MVP, quand on a 100k+ users

### Le flux économique

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  JOUEUR                                                     │
│     │                                                       │
│     ├──→ [TAP] ──→ +Coins                                   │
│     │                                                       │
│     ├──→ [ACHÈTE MODULE] ──→ -Coins (sink #1)               │
│     │                                                       │
│     ├──→ [BOOST ÉNERGIE] ──→ -Coins ou -Gems (sink #2)      │
│     │                                                       │
│     ├──→ [ACHAT IN-APP] ──→ +Gems (revenue pour nous)       │
│     │                                                       │
│     └──→ [CONVERSION FINALE] ──→ Coins → $AIK Token ──┐     │
│                                                        │     │
│  Vrai cycle économique :                               │     │
│     - Les Coins SONT créés par le tap                 │     │
│     - Les Coins SONT détruits par l'achat              │     │
│     - L'équilibre vient des SINKS forts               │     │
│     - $AIK est OPTIONNEL, ne casse pas le jeu          │     │
│                                                          │     │
└─────────────────────────────────────────────────────────────┘
```

### Pourquoi 3 monnaies résout le problème d'Hamster

| Problème Hamster | Comment on le corrige |
|---|---|
| Inflation des coins | Les coins sont **détruits** à chaque module acheté, **et** les modules donnent un **plafond de gain/h** (anti-inflation) |
| Pas de revenue pendant l'airdrop | On a déjà les **achats in-app** en gems qui rapportent AVANT le token |
| Airdrop injuste | La conversion coin→token est **pondérée** par les contributions réelles (quêtes faites) |
| Le token n'a aucune utilité | $AIK a 3 utilités : gouvernance, NFT d'IA, accès premium |

---

## 6. Les "Modules IA" (équivalent des cartes Hamster)

### Catégories de modules

| Catégorie | Effet | Exemples |
|---|---|---|
| 🧠 **Puissance de calcul** | +X coins/h (passif) | GPU V1, GPU V2, GPU V3, Cluster, Quantum Core |
| 💻 **Modules spécialisés** | Débloquent des quêtes mieux payées | NLP, Vision, Code, Voice, Reasoning |
| 🔬 **Datasets** | Augmentent la précision (cosmétique) | Wikipedia, ArXiv, GitHub, StackOverflow, MedPub |
| ⚡ **Algorithmes** | Réduisent le coût en énergie | Optimizer, Backprop, Transformer, RLHF |
| 🛡️ **Sécurité** | Anti-ban, anti-cheat renforcé | Encryption, Validator, Auditor |

### Le système d'achat (Hamster-like)

Chaque module a :
- Un **coût de base** (ex: 5000 coins)
- Un **multiplicateur de coût** par niveau (ex: ×1.5)
- Un **profit/h** affiché clairement
- Un **temps de payback** calculé en temps réel ("Rentable en 2h 14min")
- Un **niveau d'IA minimum** requis pour l'acheter

### Le méta-arbre de progression

```
                     ┌─ 🧠 GPT Core (Légendaire)
                     │     coût: 1M coins
                     │     effet: +50k coins/h
                     │     requiert: tous les autres modules
                     │
        ┌─ NLP Module ─┼─ Vision Module ─┐
        │              │                  │
   Code Module    Reasoning Module    Voice Module
   (5k coins)     (10k coins)         (8k coins)
        │              │                  │
        └──────────────┴──────────────────┘
                       │
                  Base GPU V3
                  (requis pour tout)
                  2k coins
                       │
                  Base GPU V2
                  500 coins
                       │
                  Base GPU V1
                  100 coins (défaut)
```

Le joueur voit son arbre se remplir visuellement. **L'objectif** est le **GPT Core** (le boss final = 1M coins, plusieurs semaines de farm).

---

## 7. Le méta-game : faire évoluer SON IA

### Les niveaux d'IA (le truc cool qui différencie)

L'IA du joueur a un **niveau d'intelligence** (0 à 100) qui monte avec :
- L'XP gagnée par les taps
- Les quêtes accomplies
- Les modules débloqués

### Niveaux & paliers

| Niveau | Nom | Description affichée | Bonus débloqué |
|---|---|---|---|
| 0-4 | Novice | "Un petit neurone curieux" | — |
| 5-9 | Apprenti | "Elle commence à comprendre le monde" | Débloque le module "Datasets" |
| 10-19 | Initié | "Elle peut tenir une conversation basique" | Débloque les quêtes intermédiaires |
| 20-29 | Confirmé | "Elle t'aide dans tes tâches quotidiennes" | Débloque les quêtes premium |
| 30-39 | Expert | "Elle raisonne, génère, code" | Débloque le module "Reasoning" |
| 40-49 | Maître | "Elle a lu plus que n'importe quel humain" | Débloque le module "AGI Fragment" |
| 50-69 | Légende | "Elle tutoie les sommets de l'IA" | Skin doré, animations uniques |
| 70-99 | Transcendant | "Elle dépasse l'entendement humain" | Accès au mode "conseil IA" (mini chatbot en jeu) |
| 100 | **AGI** | "Artificial General Intelligence atteinte" | **Hall of Fame** permanent, NFT unique, fin du méta-game |

### Le visuel qui évolue

À chaque palier majeur, **l'avatar de l'IA change visuellement** (SVG/Canvas avec animation). C'est ce qui crée le **dopamine** et le FOMO (fear of missing out).

---

## 8. Les quêtes (engagement quotidien)

### Type 1 : Quêtes gratuites (engagement pur)

| Quête | Récompense | Fréquence |
|---|---|---|
| "Connecte-toi aujourd'hui" | +100 coins | Quotidien |
| "Fais 100 taps aujourd'hui" | +50 coins | Quotidien |
| "Fais 500 taps aujourd'hui" | +200 coins | Quotidien |
| "Fais 1000 taps aujourd'hui" | +500 coins | Quotidien |
| "Streak 3 jours" | +1000 coins | Tous les 3 jours |
| "Streak 7 jours" | +5000 coins | Hebdomadaire |
| "Invite 1 ami" | +2000 coins + 10% gains à vie | Unique |
| "Abonne-toi à notre channel" | +500 coins | Unique |

### Type 2 : Quêtes "métier IA" (notre originalité)

| Quête | Ce que le joueur fait | Récompense |
|---|---|---|
| "Entraîne ton IA à reconnaître des images" | 20 images à classer (QCM) | +300 coins |
| "Aide ton IA à apprendre un nouveau texte" | Lire 5 phrases et les noter (1-5 étoiles) | +200 coins |
| "Pose une question à ton IA et note sa réponse" | 1 question libre + note | +100 coins |
| "Évalue 3 réponses de l'IA sur la précision" | 3 QCM "Vrai / Faux" | +250 coins |
| "Apprends une acronyme à ton IA" | Mémoriser un mot technique via un mini-jeu | +150 coins |

> **Phase 1** : ces quêtes sont des **mini-jeux gamifiés** (pas de vraie IA derrière, juste du contenu statique en DB).
> **Phase 2** : on branche des vrais datasets si on a le budget.

### Type 3 : Quêtes sponsorisées (revenue)

- Marque X paie pour que 10 000 joueurs classent leurs images
- Tu redistribues 50% aux joueurs, tu gardes 50% en marge
- C'est le **vrai business model** à terme

---

## 9. Le social & la viralité

### Système de referral

- Chaque joueur a un **lien unique** (`t.me/aikombat_bot?start=ref_USERID`)
- Quand un filleul s'inscrit : **+2000 coins** pour le parrain **+ 10% de ses gains à vie**
- Le filleul reçoit aussi **+500 coins de bienvenue**
- **Code anti-abus** : le filleul doit faire 100 taps avant que le parrain soit crédité

### Clans (Phase 2)

- Les joueurs forment des clans (5-50 membres)
- Les gains du clan sont **mutualisés** pour acheter des modules partagés
- Leaderboard des clans (hebdomadaire)
- Bonus de pool : le clan qui atteint un palier X reçoit une récompense

### Leaderboards

- **Daily** : top 100 joueurs aujourd'hui
- **Weekly** : top 100 cette semaine
- **All-time** : top 1000 de tous les temps
- **By clan** : top 50 clans
- **By country** : top 100 par pays (pour l'e-sport gamification)

### Achievements

- "Premier tap"
- "1000 taps"
- "100k taps"
- "Premier module acheté"
- "Tous les modules niveau 1"
- "Streak 30 jours"
- "10 amis invités"
- "100 amis invités"
- "IA niveau 10 / 25 / 50 / 100"
- "Première quête accomplie"

Chaque achievement = badge visible + petit bonus en coins/gems.

---

## 10. Les erreurs de Hamster Kombat qu'on corrige

### Erreur 1 : Pas d'utilité réelle du token $HMSTR

**Notre fix** : $AIK a **3 utilités concrètes** :
- Vote sur l'évolution du jeu (gouvernance)
- Achat de NFT d'IA custom
- Accès à des fonctionnalités premium futures

### Erreur 2 : Effondrement économique post-airdrop

**Notre fix** : Économie à 3 monnaies avec **sinks forts** (modules chers, gems pour skip), donc l'économie ne s'effondre pas après le token.

### Erreur 3 : Le bot farming qui a ruiné l'expérience

**Notre fix** : **Anti-cheat dès le jour 1** (voir §14) — validation serveur de chaque tap, détection de patterns, ban auto.

### Erreur 4 : Pas de transparence sur les promesses

**Notre fix** : L'UI dit **explicitement** "ceci est une simulation, chaque tap est symbolique" en petit disclaimer. La promesse d'évolution d'IA est **un narrative**, on est honnête là-dessus.

### Erreur 5 : Le jeu meurt après l'airdrop

**Notre fix** : Le jeu a une **fin naturelle** (atteindre AGI) + un **mode infini** post-AGI (PvP, missions communautaires, IA-vs-IA). Le token, c'est l'addon, pas le but.

### Erreur 6 : Aucun ajout de valeur au monde réel

**Notre fix (Phase 3)** : Les quêtes peuvent devenir de vrais datasets vendus à des labos, ou de vraies validations de réponses IA. **Mais honnêtement, c'est optionnel.**

---

## 11. Architecture technique

### Stack finale retenue

| Couche | Technologie | Pourquoi |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR rapide, ecosystem mature, facile à déployer sur Vercel |
| **UI** | Tailwind CSS + shadcn/ui | Moderne, customisable, accessible |
| **State** | Zustand ou Redux Toolkit | Simple pour gérer l'état du joueur |
| **Animations** | Framer Motion | Pour les transitions, l'IA qui pulse, etc. |
| **Backend** | **Bun + Hono** | 3× plus rapide que Node, TypeScript natif, simple |
| **Database** | **Supabase (Postgres managé)** | Gratuit au début, scale-up facile, dashboard UI inclus |
| **Cache / Queue** | Upstash (Redis serverless) | Gratuit au début, scale-up, idéal pour le rate-limiting et les leaderboards |
| **Bot Telegram** | `telegraf` (Node) | Le plus mature, simple à intégrer |
| **Auth** | `@telegram-apps/init-data-node` | Validation HMAC officielle Telegram |
| **Déploiement front** | Vercel | Gratuit au début, edge functions |
| **Déploiement back** | Railway / Fly.io (5-10€/mois) | Simple, scale-up facile, HTTPS inclus |
| **Monitoring** | Sentry + Logflare (gratuits) | Pour voir les erreurs, les perfs |
| **Smart contract (Phase 3)** | Tact (langage TON) ou Solidity (EVM) | Selon la chaîne qu'on choisit (TON recommandé pour Telegram) |
| **Stockage fichiers** | Supabase Storage ou Cloudflare R2 | Pour les assets, screenshots, etc. |

### Structure du repo (monorepo)

```
/ai-kombat/
├── /apps/
│   ├── /web/                    # Next.js 14 (Telegram Mini App)
│   │   ├── /app/
│   │   │   ├── /game/           # Page principale du tap
│   │   │   ├── /ai/             # Arbre d'évolution de l'IA
│   │   │   ├── /tasks/          # Tâches IA
│   │   │   ├── /quests/         # Quêtes quotidiennes
│   │   │   ├── /friends/        # Système de referral
│   │   │   ├── /leaders/        # Leaderboard
│   │   │   ├── /shop/           # Boutique de modules
│   │   │   ├── /airdrop/        # Page d'info token
│   │   │   └── /settings/       # Profil, langue, son
│   │   ├── /components/
│   │   ├── /lib/                # SDK Telegram, hooks
│   │   ├── /styles/
│   │   └── /public/             # Assets (avatars IA, sons, etc.)
│   │
│   └── /api/                    # Backend Hono + Bun
│       ├── /src/
│       │   ├── /routes/
│       │   │   ├── /auth.ts
│       │   │   ├── /tap.ts
│       │   │   ├── /ai.ts
│       │   │   ├── /modules.ts
│       │   │   ├── /quests.ts
│       │   │   ├── /tasks.ts
│       │   │   ├── /referral.ts
│       │   │   ├── /leaderboard.ts
│       │   │   └── /shop.ts
│       │   ├── /controllers/
│       │   ├── /middlewares/    # auth, rateLimit, antiCheat
│       │   ├── /services/       # Logique métier
│       │   ├── /db/             # Knex + migrations
│       │   ├── /workers/        # Cron jobs
│       │   ├── /bot/            # Bot Telegraf
│       │   └── /index.ts
│       ├── /migrations/
│       └── /package.json
│
├── /packages/
│   ├── /shared-types/           # Types partagés front/back
│   └── /ai-content/             # Contenu des tâches/quêtes
│
├── /admin/                      # Admin panel (Next.js séparé)
│   └── /src/
│       ├── /users/
│       ├── /tasks/
│       └── /metrics/
│
├── /contracts/                  # Smart contracts (Phase 3)
│   └── /sources/
│       └── aik-token.tact
│
├── /docs/                       # Documentation
│   ├── VISION.md                # ← ce document
│   ├── ARCHITECTURE.md
│   └── API.md
│
├── /scripts/                    # Scripts utilitaires
└── package.json                 # Workspace root (npm ou bun workspaces)
```

---

## 12. Schéma de base de données

### Tables principales (Postgres via Supabase)

```sql
-- ============================================
-- 1. USERS (le joueur)
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
    
    -- Économie
    coin_balance BIGINT DEFAULT 0,
    gem_balance INTEGER DEFAULT 0,
    
    -- Énergie
    energy INTEGER DEFAULT 1000,
    max_energy INTEGER DEFAULT 1500,
    last_energy_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- IA personnelle
    ai_name VARCHAR(50) DEFAULT 'My AI',
    ai_level INTEGER DEFAULT 0,
    ai_xp INTEGER DEFAULT 0,
    ai_type VARCHAR(50) DEFAULT 'novice',
    
    -- Stats
    total_taps BIGINT DEFAULT 0,
    total_earned_coins BIGINT DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Referral
    referred_by BIGINT REFERENCES users(telegram_id),
    referral_count INTEGER DEFAULT 0,
    
    -- Quêtes
    daily_streak INTEGER DEFAULT 0,
    last_daily_claim TIMESTAMP WITH TIME ZONE,
    
    -- Meta
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
-- 2. MODULES IA (le catalogue des améliorations)
-- ============================================
CREATE TABLE ai_modules (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,  -- 'gpu_v1', 'nlp_module', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,  -- 'compute', 'specialty', 'dataset', 'algorithm', 'security'
    icon_url TEXT,
    
    -- Coût et progression
    base_cost BIGINT NOT NULL,
    cost_multiplier DECIMAL(3,2) DEFAULT 1.50,
    max_level INTEGER DEFAULT 10,
    
    -- Effets
    coins_per_hour_bonus INTEGER DEFAULT 0,
    energy_max_bonus INTEGER DEFAULT 0,
    energy_regen_bonus INTEGER DEFAULT 0,
    tap_multiplier_bonus DECIMAL(3,2) DEFAULT 1.0,
    
    -- Prérequis
    min_ai_level INTEGER DEFAULT 0,
    required_module_code VARCHAR(50),
    
    -- Méta
    rarity VARCHAR(20) DEFAULT 'common',  -- 'common', 'rare', 'epic', 'legendary'
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. USER MODULES (ce que le joueur a acheté)
-- ============================================
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
-- 4. USER ACHIEVEMENTS
-- ============================================
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    criteria JSONB NOT NULL  -- { type: 'taps', target: 1000 }
);

CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 5. QUESTS
-- ============================================
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,  -- 'daily', 'weekly', 'one_time', 'sponsored'
    category VARCHAR(50),  -- 'training', 'social', 'streak', 'ai_task'
    
    -- Objectif
    target_count INTEGER DEFAULT 1,
    target_action VARCHAR(50),  -- 'tap', 'invite_friend', 'complete_ai_task', etc.
    
    -- Récompense
    reward_coins INTEGER DEFAULT 0,
    reward_gems INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    
    -- Conditions
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
-- 6. AI TASKS (les quêtes "métier IA")
-- ============================================
CREATE TABLE ai_tasks (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,  -- 'image_classification', 'text_rating', 'qcm', 'translation'
    question TEXT NOT NULL,
    payload JSONB NOT NULL,  -- { image_url, options, correct_answer, etc. }
    difficulty VARCHAR(20) DEFAULT 'easy',  -- 'easy', 'medium', 'hard'
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
-- 7. TRANSACTIONS (historique économique)
-- ============================================
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- 'tap_earn', 'module_buy', 'energy_boost', 'quest_reward', 'referral_bonus'
    currency VARCHAR(10) NOT NULL,  -- 'coin', 'gem', 'aikon'
    amount BIGINT NOT NULL,  -- positif = gain, négatif = dépense
    balance_after BIGINT NOT NULL,
    related_entity_type VARCHAR(50),  -- 'module', 'quest', 'task'
    related_entity_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- 8. ANTI-CHEAT LOGS
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
-- 9. REFERRALS (détail)
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
-- 10. DAILY REWARDS
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
-- 11. IN-APP PURCHASES (gems achetés en €)
-- ============================================
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    product_code VARCHAR(50) NOT NULL,  -- 'gems_100', 'gems_500', 'premium_pass'
    amount_eur DECIMAL(10,2) NOT NULL,
    gems_credited INTEGER NOT NULL,
    payment_provider VARCHAR(50),  -- 'stripe', 'telegram_payments', 'crypto'
    provider_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'completed', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Schéma résumé (vue d'ensemble)

```
┌──────────┐     ┌────────────────┐     ┌──────────┐
│  USERS   │────→│  USER_MODULES  │←────│AI_MODULES│
└────┬─────┘     └────────────────┘     └──────────┘
     │
     ├──→ USER_QUESTS ←──── QUESTS
     │
     ├──→ USER_TASK_SUBMISSIONS ←──── AI_TASKS
     │
     ├──→ TRANSACTIONS (log économique)
     │
     ├──→ TAP_EVENTS (anti-cheat)
     │
     ├──→ REFERRALS
     │
     ├──→ DAILY_REWARDS
     │
     ├──→ USER_ACHIEVEMENTS ←──── ACHIEVEMENTS
     │
     └──→ PURCHASES (in-app €)
```

---

## 13. L'API (endpoints)

### Auth

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/auth/init` | `{ initData: string }` | Init depuis Telegram, crée/retourne le user |

### Tap

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/api/tap` | `{ count: number }` | Valide un batch de taps (rate-limited) |
| `GET` | `/api/tap/stats` | — | Stats globales (pour le leaderboard) |

### IA

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/ai` | — | État de l'IA du joueur (niveau, XP, avatar) |
| `POST` | `/api/ai/rename` | `{ name: string }` | Renommer l'IA |

### Modules

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/modules` | — | Liste tous les modules dispo |
| `GET` | `/api/modules/owned` | — | Modules possédés par le joueur |
| `POST` | `/api/modules/buy` | `{ moduleId: number }` | Acheter un module |
| `POST` | `/api/modules/upgrade` | `{ moduleId: number }` | Upgrader un module (niveau suivant) |

### Quêtes

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/quests/active` | — | Quêtes actives du joueur |
| `POST` | `/api/quests/claim` | `{ questId: number }` | Réclamer la récompense |
| `GET` | `/api/quests/daily` | — | Reset quotidien |

### Tâches IA

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/tasks/next` | `?type=image_qcm` | Récupère une tâche |
| `POST` | `/api/tasks/submit` | `{ taskId, answer }` | Soumet une réponse |
| `GET` | `/api/tasks/stats` | — | Stats du joueur sur les tâches |

### Referral

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/referral/link` | — | Lien unique de parrainage |
| `GET` | `/api/referral/list` | — | Liste des filleuls |
| `POST` | `/api/referral/claim` | — | Réclame la récompense filleul |

### Leaderboard

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/leaderboard/global?limit=100` | — | Top mondial |
| `GET` | `/api/leaderboard/friends` | — | Top amis |
| `GET` | `/api/leaderboard/country?code=FR` | — | Top par pays |

### Shop (gems)

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/shop/offers` | — | Offres de gems disponibles |
| `POST` | `/api/shop/checkout` | `{ productId, paymentData }` | Initie un paiement |
| `POST` | `/api/shop/webhook` | (webhook Stripe) | Confirme un paiement |

### Admin (protégé)

| Méthode | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | — | Liste des users |
| `POST` | `/api/admin/users/:id/ban` | `{ reason }` | Ban un user |
| `POST` | `/api/admin/modules` | `{ ... }` | Créer un module |
| `POST` | `/api/admin/quests` | `{ ... }` | Créer une quête |
| `GET` | `/api/admin/metrics` | — | Métriques globales |
| `GET` | `/api/admin/anti-cheat/logs` | — | Logs suspects |

---

## 14. L'anti-cheat (la vraie différence)

> **Hamster Kombat a perdu des millions à cause des bots.** Nous, on sera **les plus propres du marché**.

### Les 6 couches de défense

#### Couche 1 : Validation Telegram côté serveur

```typescript
import { validate, parse } from '@telegram-apps/init-data-node';

const initData = req.headers['authorization']?.replace('tma ', '');
validate(initData, process.env.BOT_TOKEN, { expiresIn: 0 }); // HMAC-SHA256
```

→ Empêche d'usurper un `telegram_id`. Sans ça, un bot peut se faire passer pour n'importe quel user.

#### Couche 2 : Rate limiting par user

```typescript
// max 5 taps par seconde par user
const tapLimiter = rateLimit({
  windowMs: 1000,
  limit: 5,
  keyGenerator: (req) => req.user.telegramId,
});
```

→ Empêche les taps à fréquence inhumaine.

#### Couche 3 : Validation de l'énergie

```typescript
// Le serveur vérifie qu'on a assez d'énergie
if (user.energy < tapCount) {
  throw new Error('Insufficient energy');
}
// Et que l'energie regen correspond au temps écoulé
const expectedEnergy = calculateRegen(user, timeSinceLastTap);
if (user.energy > expectedEnergy + tapCount) {
  flagSuspicious(user, 'energy_mismatch');
}
```

→ Empêche de tricher sur son solde d'énergie.

#### Couche 4 : Détection de patterns

- **Intervalle constant entre taps** (humain = variable, bot = régulier)
- **Mêmes coordonnées de clic** (humain = varie, bot = centre exact)
- **Volume quotidien > 99e percentile** (auto-flag)
- **Taux de réussite des tâches IA** (humain = ~80%, bot = 100% ou 0%)

#### Couche 5 : Validation des tâches IA (à 3 votes)

Pour les vraies tâches (Phase 2), chaque réponse est validée par **3 autres joueurs**. Si 2/3 sont d'accord, c'est validé. Sinon, la tâche est mise en "litige".

#### Couche 6 : Système de réputation

Chaque user a un **trust score** (0-100). En dessous de 30, les gains sont divisés par 10. En dessous de 10, le compte est shadow-banned (les gains ne sont pas crédités mais l'user ne le sait pas tout de suite).

### Stack technique anti-cheat

| Outil | Usage |
|---|---|
| **Upstash Ratelimit** | Rate limiting distribué (gratuit jusqu'à 10k req/j) |
| **Postgres** | Log de tous les taps (`tap_events`) |
| **Cloudflare Turnstile** | CAPTCHA invisible pour actions sensibles (tâches IA, gros achats) |
| **Sentry** | Monitoring des patterns anormaux |

---

## 15. Roadmap produit

### Phase 0 : Setup (1 semaine)

- [ ] Créer le repo monorepo
- [ ] Setup Supabase + Upstash
- [ ] Setup le bot Telegram via @BotFather
- [ ] Setup Vercel + Railway
- [ ] Setup le monitoring (Sentry)

### Phase 1 : MVP (4-6 semaines) — *"jouable avec 100 users"*

- [ ] Auth Telegram ✅
- [ ] Tap endpoint + energy system ✅
- [ ] Affichage des gains ✅
- [ ] 3 modules de base (GPU V1, NLP, Code) ✅
- [ ] 5 quêtes quotidiennes ✅
- [ ] 1 quête "métier IA" (QCM simple) ✅
- [ ] Leaderboard basique ✅
- [ ] Referral (1 niveau) ✅
- [ ] Anti-cheat couches 1-3 ✅
- [ ] UI propre (style cyberpunk IA) ✅

**KPI de succès Phase 1** : 100 joueurs actifs quotidiens, rétention D7 > 20%

### Phase 2 : Engagement (4-6 semaines) — *"jouable avec 10k users"*

- [ ] Toutes les quêtes "métier IA" (5-10 types)
- [ ] Achievements + badges
- [ ] Streak system
- [ ] Clans (lite)
- [ ] Anti-cheat couche 4-5
- [ ] Admin panel
- [ ] Bot Telegram avec /start, /help, /stats

**KPI de succès Phase 2** : 10k joueurs actifs quotidiens, rétention D30 > 10%

### Phase 3 : Monétisation (4-6 semaines) — *"premier € qui rentre"*

- [ ] Achats in-app (gems) via Telegram Payments ou Stripe
- [ ] Premium pass (abonnement mensuel)
- [ ] Quêtes sponsorisées
- [ ] Ads (optionnel, dans l'admin panel)

**KPI de succès Phase 3** : 1000€/mois de revenue

### Phase 4 : Token & scale (8-12 semaines) — *"prêt pour l'airdrop"*

- [ ] Smart contract $AIK (TON)
- [ ] Conversion coins → $AIK
- [ ] White paper
- [ ] Audit de sécurité
- [ ] Listing DEX (STON.fi pour TON, Uniswap pour EVM)
- [ ] Site marketing
- [ ] Campagne d'influence Telegram

**KPI de succès Phase 4** : 100k+ joueurs actifs quotidiens, market cap $AIK > 1M$

---

## 16. Métriques de succès

### Métriques produit (à tracker dès le jour 1)

| Métrique | Cible Phase 1 | Cible Phase 2 | Cible Phase 3 |
|---|---|---|---|
| **DAU** (Daily Active Users) | 100 | 10k | 100k |
| **MAU** (Monthly Active Users) | 500 | 50k | 500k |
| **Rétention D1** | 50% | 60% | 70% |
| **Rétention D7** | 20% | 35% | 50% |
| **Rétention D30** | 5% | 15% | 25% |
| **Taps/user/jour** | 100 | 200 | 300 |
| **Taux de conversion quête** | 30% | 50% | 60% |
| **Viral coefficient (K)** | 0.3 | 0.6 | 1.0+ |

### Métriques économiques

| Métrique | Cible |
|---|---|
| **ARPU** (Average Revenue Per User) | 0.10€/mois |
| **Conversion freemium → payant** | 2% |
| **LTV** (Lifetime Value) | 1€ |
| **CAC** (Customer Acquisition Cost) | 0.20€ |
| **LTV/CAC ratio** | > 5 |

### Métriques techniques

| Métrique | Cible |
|---|---|
| **P95 latency tap** | < 100ms |
| **Uptime** | 99.5% |
| **Taux d'erreur** | < 1% |
| **Taux de faux positifs anti-cheat** | < 0.1% |

---

## 17. Modèle économique

> **Pour le plan détaillé, voir [MONETIZATION.md](./MONETIZATION.md).**

### Sources de revenue (par phase)

| Source | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| **Ads rewarded (Adsgram + Telegram Ads)** | ❌ | 🟡 | ✅ | ✅ |
| **Quêtes sponsorisées (chaînes Telegram)** | ❌ | 🟡 | ✅ | ✅ |
| **Quêtes B2B (vente de datasets)** | ❌ | ❌ | 🟡 | ✅ |
| **Achats in-app (gems) + Premium pass** | ❌ | 🟡 | ✅ | ✅ |
| **Channel YouTube + contenu sponsorisé** | ❌ | 🟡 | ✅ | ✅ |
| **Token $AIK (taxes + appreciation)** | ❌ | ❌ | 🟡 | ✅ |

### Les 3 piliers de la monétisation

1. **🟢 Publicité rewarded** (Adsgram) — Phase 2, $0.01-0.02 par vue
2. **🟢 Vente de datasets IA aux entreprises** (B2B) — Phase 3, $0.02-0.10 par tâche
3. **🟢 Token $AIK** avec buyback & burn — Phase 4, appreciation + utilité

### Le cash-out réel (différenciation vs Hamster)

- **Niveau 1** (Phase 1+) : coins du jeu, illimité, pas de cash-out
- **Niveau 2** (Phase 4+) : conversion coins → $AIK, 1x/semaine, max $5
- **Niveau 3** (Phase 4+) : cash-out réel en €/$ via Telegram Wallet, 1x/mois, max $50-200, KYC

### Les invariants de sécurité économique

1. **Ratio de couverture** : `revenu_externe_30j / cash-outs_30j > 1.5` en permanence
2. **Plafond de distribution** : max 50% du revenu net aux joueurs
3. **Lockup du trésor** : minimum 6 mois de cash-out en réserve sur multisig

### Projections (à 100k DAU)

- Ads rewarded (Adsgram) : **$5-15k/mois**
- Quêtes sponsorisées : **$10-30k/mois**
- Vente de datasets B2B : **$5-20k/mois**
- Achats in-app (gems) + Premium : **$5-15k/mois**
- Token (taxes + appreciation) : **$100-500k/mois** (variable)
- **Total : $25-80k/mois de cash + $100-500k/mois de token value**

### À 1M DAU

- **$280k-1M/mois** de revenu total
- Cash-out aux joueurs : **$100-500k/mois** ($1-5/user/mois)
- Market cap $AIK : **$10-100M+**
- Levée de fonds VC possible (seed/series A)

---

## 18. 🆕 Le Plan Datasets (B2B) — le moat stratégique

> **Le plan complet est dans [MONETIZATION.md §5](./MONETIZATION.md).**

### La thèse

À long terme, **les données d'entraînement IA sont un marché de multi-milliards** (Scale AI valorisé $14B, Toloka des centaines de millions). AI Kombat peut devenir **un concurrent crédible** grâce à :

- **1M+ de "travailleurs" motivés** par les coins (vs Scale AI qui galère à recruter)
- **Boucle de gamification** qui améliore la rétention des annotateurs
- **Quality control par triple-vote + gold standards + trust score**
- **Coût marginal quasi-nul** (le serveur + la DB, c'est tout)

### Le pipeline

```
Client B2B (startup IA)
  → Crée un job via notre API REST
    → On distribue les tâches à 3 joueurs par item
      → Triple-vote + gold standard (5% de tâches pièges)
        → Si confiance ≥ 66% → validé
        → Si confiance < 66% → re-vote avec 3 autres joueurs
          → Dataset validé
            → Client télécharge via API
```

### Les 8 types de datasets supportés (Phase 2-3)

- Image classification (QCM)
- Sentiment analysis (positif/négatif/neutre)
- Bounding boxes (dessiner un rectangle)
- OCR correction (corriger du texte)
- Chatbot rating (RLHF : la réponse est bonne ?)
- Code review (ce code a un bug ?)
- Translation validation (la traduction est correcte ?)
- Audio transcription (transcrire un son)

### Pricing (vs Scale AI, le leader du marché)

| Volume | Notre prix | Scale AI | Économie client |
|---|---|---|---|
| < 1 000 tâches | $0.10 | $0.15-0.30 | 50-66% |
| 1k - 10k | $0.05 | $0.10-0.20 | 50-75% |
| 10k - 100k | $0.03 | $0.08-0.15 | 60-80% |
| > 100k | $0.02 | $0.05-0.10 | 60-80% |

### Notre marge

- On paie le joueur ~$0.005 par tâche (en coins)
- On facture $0.02-0.10 au client B2B
- **Marge : 50-90%** selon le volume

### Projection revenus datasets

| DAU | Tasks/jour | Revenue/mois |
|---|---|---|
| 1k | 1 000 | $50-200 |
| 10k | 10 000 | $1 500-9 000 |
| 100k | 100 000 | $15 000-90 000 |
| 1M | 1 000 000 | $150 000-900 000 |

### Le moat compétitif

À 1M DAU, **on a 1M d'annotateurs** vs Scale AI qui a 100k freelancers. Nos datasets sont :
- **Moins chers** (50-80% moins cher que Scale AI)
- **Plus rapides** (24-48h vs 2-7 jours)
- **Plus fiables** (triple-vote + gold standard, on garantit >90% inter-annotator agreement)
- **Plus diversifiés** (multilingue, multi-domaine, 24/7)

**C'est la différenciation à long terme vs tous les concurrents Hamster-like.** Aucun d'eux n'a ce pipeline.

### L'API B2B (pour les clients)

```typescript
// POST /api/v1/datasets/jobs
// Authentification : API key
{
  "name": "Product Classification 10k",
  "type": "image_classification",
  "items": [
    { "id": "img_001", "url": "https://..." },
    // ... jusqu'à 1M items
  ],
  "schema": {
    "question": "De quelle catégorie est ce produit ?",
    "options": ["Vêtements", "Meuble", "Tech", "Jeu", "Aliment"]
  },
  "quality": {
    "votes_per_item": 3,
    "min_confidence": 0.66,
    "trusted_workers_only": true
  },
  "budget_usd": 1000,
  "deadline_days": 7
}
```

### Le quality control (les 3 systèmes)

1. **Triple vote** : chaque item est vu par 3 joueurs différents, on prend la majorité
2. **Gold standards** : 5% de tâches "pièges" dont on connaît la réponse, on détecte les tricheurs
3. **Trust score** : 0-100 par joueur, basé sur son taux de réussite aux gold standards. <30 = ne peut plus faire de tâches B2B

### Le go-to-market B2B

**Phase 2** : Outbound direct vers 50 startups IA françaises/européennes, 5-10 POC gratuits, 2-3 clients payants

**Phase 3** : Site marketing "AI Kombat Datasets", case studies, présence sur Product Hunt / Hacker News

**Phase 4** : Partenariats avec Scale AI / Toloka (revendre en marque blanche), levées de fonds

### Pourquoi c'est le moat

À 1M DAU, **on a 1M d'annotateurs** qui peuvent être activés en quelques minutes. Scale AI met 6 mois à onboarder 10 000 freelancers. **On a 100× plus de capacité, à 80% moins cher.**

Aucun concurrent Hamster-like n'a ce pipeline. C'est ce qui transforme AI Kombat de "jeu viral" à "vrai business IA".

---

## 19. Ce qu'on emprunte aux dépôts publics

### De `tungulin/quackup-app` (le diamant brut)

| Composant | Fichier source | Ce qu'on en fait |
|---|---|---|
| Auth middleware | `app/middlewares/authenticate.ts` | On l'adapte tel quel (validation HMAC Telegram) |
| Rate limiter | `app/middlewares/limiter.ts` | On l'adapte avec Upstash |
| Structure controllers/routes | tout `app/` | On garde le pattern modulaire |
| Migrations Knex | `migrations/20240704025206_main.ts` | On l'adapte avec nos nouvelles tables |
| Cron reward | `app/libs/cron/reward.ts` | On l'adapte pour les récompenses passives des modules |
| Bot Telegraf setup | `app.ts` (lignes `bot.start`) | On garde, on personnalise les messages |
| Yup validation | `app/libs/validation/yup.ts` | On garde pour valider les inputs |
| Helpers structure | `app/helpers/` | On garde le pattern |

### De `Kennix88/Token-Giver`

| Composant | Fichier source | Ce qu'on en fait |
|---|---|---|
| Pages Friends, Leaders, Tasks | `src/app/(telegram)/game/*` | On adapte la structure pour notre UX |
| Composants (BoostButton, FriendsList, TasksList) | `src/components/` | On garde l'inspiration visuelle |
| Intégration TON Connect | `@tonconnect/ui-react` | On l'intègre Phase 4 pour le wallet |

### De `SyntaxByte-Solution/tap-mini-app`

| Composant | Fichier source | Ce qu'on en fait |
|---|---|---|
| Pattern crypto operations | `server/cryptoOperations-bsc.js` | À étudier pour le smart contract Phase 4 |
| ABI ERC20 | `server/abi/erc20.json` | Référence pour l'ABI de notre token (si EVM) |

### De `mudachyo/Hamster-Kombat`

- ❌ **Rien.** Le MITM via `mudachyo.codes` est inacceptable.

### De `nikandr-surkov/Hamster-Kombat-Telegram-Mini-App-Clone`

| Composant | Ce qu'on en fait |
|---|---|
| Palette de couleurs (`#1d2025`, `#272a2f`, `#f3ba2f`) | On garde l'inspiration, on adapte à notre thème (cyan/violet futuriste) |
| Animation 3D sur le hamster | On l'adapte à notre IA centrale |
| Pattern "levelNames" + "levelMinPoints" | On garde, on l'étend pour nos 100 niveaux d'IA |

---

## 20. Ce qu'on construit from scratch

> **C'est la valeur unique de notre produit.** Personne d'autre n'a fait ça.

| Composant | Pourquoi from scratch |
|---|---|
| 🧠 Le **narratif IA** (l'avatar qui évolue, les 100 niveaux) | C'est notre différentiation, pas dans les autres repos |
| 💰 L'**économie à 3 monnaies** | Hamster avait 1, c'est son point faible |
| 🛡️ L'**anti-cheat à 6 couches** | Quackup n'a que 2 couches |
| 🧩 Les **quêtes "métier IA"** (image QCM, code review, etc.) | Notre USP (Unique Selling Point) |
| 🏆 Le **système de clans** | Pas implémenté dans les autres |
| 📊 L'**admin panel** | Rarement open-source |
| 📈 Les **analytics et métriques** | À construire sur mesure |
| 🪙 Le **smart contract $AIK** | Phase 4, on l'écrira nous-mêmes |
| 🤖 Le **système de tâches IA crowdsourcées** (Phase 2-3) | C'est ce qui peut faire la différence vs Hamster |

---

## 📌 Résumé exécutif

> **AI Kombat** est un **clone évolué d'Hamster Kombat** qui transpose la mécanique de **tap-to-earn** à l'univers de l'**intelligence artificielle**. Il corrige les 6 erreurs fatales d'Hamster (token inutile, économie instable, anti-cheat faible, etc.) en s'appuyant sur un **monorepo moderne** (Bun + Hono + Supabase + Next.js + TON), une **économie à 3 monnaies** équilibrée, et un **narratif IA** engageant. Le MVP peut être livré en **6-8 semaines** par un dev full-stack, et le **scale à 100k+ users** est gérable avec l'infra serverless moderne. La **différenciation** repose sur un **anti-cheat de niveau entreprise** et un **système de quêtes "métier IA"** unique, qui pourra éventuellement devenir un vrai business de micro-tâches d'entraînement IA.

---

## 📚 Documents complémentaires

- [x] **[VISION.md](./VISION.md)** — Ce document (Game Design Document)
- [x] **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Détails techniques (config, env, déploiement)
- [x] **[MONETIZATION.md](./MONETIZATION.md)** — Plan monétisation & cash-out détaillé
- [x] **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** — Résumé 1 page
- [ ] **API.md** — Spec OpenAPI complète
- [ ] **GAMEPLAY.md** — Walkthrough complet des écrans
- [ ] **TOKENOMICS.md** — White paper simplifié du token $AIK
- [ ] **MARKETING.md** — Stratégie de lancement

---

*Document maintenu par Mavis — toute modification doit être tracée ici.*
