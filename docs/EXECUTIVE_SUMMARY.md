# 🎯 AI Kombat — Executive Summary (1 page)

> **Pour investisseurs, partenaires, ou toi-même dans 6 mois quand t'auras oublié pourquoi t'as commencé.**

---

## Le pitch

**AI Kombat** est un jeu **Telegram Mini App** (gratuit, accessible à 1 milliard d'utilisateurs Telegram) où chaque tap est présenté comme un entraînement d'**intelligence artificielle personnelle**. Inspiré du succès d'Hamster Kombat (250M+ users en 2024), mais avec **3 innovations majeures** :

1. **Un narratif IA engageant** au lieu d'un hamster crypto — évolution de "neurone" à "AGI" avec un avatar qui se transforme visuellement
2. **Une économie à 3 monnaies** (Coins, Gems, $AIK token) qui résout l'inflation mortelle d'Hamster
3. **Un anti-cheat de niveau entreprise** qui empêche le farming par les bots (le problème #1 d'Hamster)

## Le marché

- **Telegram** = 900M+ utilisateurs actifs, 50%+ en crypto-friendly
- **Hamster Kombat** a prouvé la demande : 250M d'inscriptions, $HMSTR listé sur Binance en septembre 2024
- **Notcoin** : 35M+ joueurs pré-airdrop
- **Mais** : tous ces projets ont eu les mêmes problèmes (bots, économie instable, mort post-airdrop)

**Notre fenêtre** : lancer une version **2.0** du tap-to-earn Telegram, en corrigeant les erreurs d'Hamster, avec un narrative IA qui parle à un public plus large que la crypto.

## Le produit

**3 écrans principaux** :
- **L'IA centrale** : une animation vivante que le joueur fait évoluer
- **Le tap** : gagne des coins, augmente l'énergie, monte en XP
- **L'arbre d'évolution** : achète des modules (GPU, NLP, Code, Vision, Voice, Reasoning) pour débloquer des capacités et augmenter le passive income

**Engagement** : quêtes quotidiennes, achievements, streaks, leaderboards, clans, referral
**Monétisation** : achats in-app (gems), premium pass, quêtes sponsorisées, token on-chain (Phase 4)

## La stack

| | Choix | Pourquoi |
|---|---|---|
| **Backend** | Bun + Hono + TypeScript | 3× plus rapide que Node, TS natif |
| **DB** | Supabase (Postgres) | Gratuit, scale-up, UI incluse |
| **Cache** | Upstash (Redis) | Rate limiting distribué |
| **Front** | Next.js 14 + Tailwind | SSR, ecosystem mature, Vercel |
| **Hosting** | Vercel + Fly.io | 0€ au début, scale progressif |
| **Smart contract** | Tact sur TON | Intégré Telegram, frais ultra-bas |

## Le modèle économique

À 100k DAU (cible Phase 4) :
- 2% conversion freemium → payant × 0.50€/mois = **1000€/mois**
- Premium pass : 1000 abonnés × 5€/mois = **5000€/mois**
- Quêtes sponsorisées : **2000-10000€/mois**
- **Total : 8-15k€/mois**

À 1M DAU (cible année 2) :
- **80-150k€/mois**, soit **1-2M€/an**
- Levée de fonds VC possible à ce stade

## La roadmap

| Phase | Durée | Cible |
|---|---|---|
| **Phase 0** | 1 sem | Setup (Supabase, Fly, Vercel, Bot) |
| **Phase 1 : MVP** | 6-8 sem | 100 joueurs actifs, jeu jouable |
| **Phase 2 : Engagement** | 4-6 sem | 10k joueurs, rétention D7 > 35% |
| **Phase 3 : Monétisation** | 4-6 sem | 1k€/mois de revenue |
| **Phase 4 : Token & scale** | 8-12 sem | 100k+ DAU, $AIK listé sur DEX |

**Total Phase 1** : 10-12 semaines pour un MVP déployé.

## Les avantages compétitifs

| | Hamster | Concurrents | Nous |
|---|---|---|---|
| Narratif IA | ❌ | ❌ | ✅ |
| Économie 3 monnaies | ❌ | ❌ | ✅ |
| Anti-cheat 6 couches | ❌ | ❌ | ✅ |
| Quêtes "métier IA" | ❌ | ❌ | ✅ |
| Coût initial | (privé) | (privé) | **0€** |
| Time-to-market | (privé) | (privé) | **3 mois** |

## Ce dont on a besoin

- **Rien pour démarrer** : tous les outils ont un free tier
- **2-4 semaines de temps** pour le dev (1 personne full-stack expérimentée)
- **1000€ de budget marketing** (premiers influenceurs Telegram) à partir du mois 3
- **50€/mois d'infra** à partir de 10k users

## Les risques

| Risque | Mitigation |
|---|---|
| Telegram change ses règles | Diversifier (site web standalone) |
| Le marché crypto s'effondre | Le jeu marche sans token (quêtes + ads) |
| Les bots reviennent | Anti-cheat à 6 couches + ML + curation humaine |
| Hamster sort une v2 | On a un narratif différent, on peut pivoter |
| Faible rétention | Streaks, quêtes quotidiennes, achievements |

## Conclusion

**AI Kombat est une opportunité de reproduire le succès viral d'Hamster Kombat, mais en mieux.** Le projet peut démarrer à 0€ de coût, en 3 mois, par un dev full-stack, et vise un marché de 900M d'utilisateurs Telegram. La différenciation (narratif IA, économie 3 monnaies, anti-cheat) est défendable. Le risque principal est l'exécution — mais la stack technique est éprouvée (on a 1 repo public prod-ready à forker), le marché est validé (Hamster, Notcoin), et le concept est simple à expliquer.

**Verdict** : GO. À exécuter.

---

*Document synthétique. Pour la version complète, lire [VISION.md](./VISION.md) et [ARCHITECTURE.md](./ARCHITECTURE.md).*
