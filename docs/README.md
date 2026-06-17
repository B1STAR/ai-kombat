# 📚 AI Kombat — Documentation

> **Projet** : AI Kombat — un tap-to-earn Telegram Mini App sur le thème de l'IA
> **Statut** : v1.0 — Vision, architecture, monétisation consolidées
> **Date** : Juin 2026

---

## 📖 Sommaire

| Document | Description | Pour qui ? | Lignes |
|---|---|---|---|
| **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** | Résumé en 1 page (style pitch deck) | Investisseurs, partenaires, toi dans 6 mois | 105 |
| **[VISION.md](./VISION.md)** | Game Design Document complet : concept, mécaniques, économie, gamification, anti-cheat, roadmap, **plan datasets B2B** | Tout le monde, à lire en premier | 1500+ |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Spécifications techniques de base : stack, DB schema, API, auth, anti-cheat, déploiement, coûts | Développeurs | 1200+ |
| **[ARCHITECTURE_ADDENDUM.md](./ARCHITECTURE_ADDENDUM.md)** | Compléments architecture : endpoints ads/datasets/cashout/token, migrations 011-014, code trust score | Développeurs (Phase 2+) | 400+ |
| **[MONETIZATION.md](./MONETIZATION.md)** | Plan monétisation & cash-out détaillé : 6 sources de revenue, système de récompenses réelles, **plan datasets B2B complet**, ratios de sécurité | Business, finance, toi | 1100+ |

---

## 🎯 Le projet en 30 secondes

**AI Kombat** = un jeu **Telegram Mini App** où chaque tap est présenté comme un entraînement d'IA. Le joueur fait évoluer une IA personnelle à travers 100 niveaux, achète des modules (GPU, NLP, Vision, Code, Voice, Reasoning, etc.), accomplit des quêtes qui correspondent à des vrais cas d'usage de l'IA.

**Différenciation vs Hamster Kombat** :
- 3 monnaies (Coins, Gems, $AIK token) au lieu d'1 → économie plus stable
- Anti-cheat à 6 couches (vs quasi-aucun)
- Narratif IA engageant (vs hamster crypto)
- Système de quêtes "métier IA" + **vente de datasets aux entreprises** (notre moat à long terme)
- **Cash-out réel en €/$** possible dès la Phase 4 (vs airdrop unique d'Hamster)

**Stack** : Next.js 14 + Bun + Hono + Postgres (Supabase) + Redis (Upstash) + TON (Phase 4)

**Coût initial** : **0€/mois** (tous les services ont un free tier)

---

## 🆕 Ce qui a changé dans cette v1.0

Ajouts par rapport à la v0.1 :

1. **MONETIZATION.md** (1100+ lignes) : le plan monétisation complet avec 6 sources de revenue, système de cash-out en 3 niveaux, ratios de sécurité économique, et le plan détaillé des datasets B2B
2. **ARCHITECTURE_ADDENDUM.md** : 4 nouvelles migrations DB (datasets, ads, cash-out, token) + 30+ nouveaux endpoints API
3. **Section 18 du VISION.md** : Le Plan Datasets B2B — le moat stratégique (1M annotateurs vs 100k pour Scale AI)
4. **Section 17 du VISION.md** : Le modèle économique révisé avec les 3 piliers de monétisation
5. **Exemples de code** : trust score, distribution des tâches, validation triple-vote, anti-fraude cash-out

## ✅ Décisions prises

| Décision | Choix |
|---|---|
| Nom de code | **AI Kombat** (proposition) |
| Stack back | **Bun + Hono** (moderne, rapide, TS natif) |
| Stack front | **Next.js 14 + Tailwind + shadcn/ui** |
| DB | **Supabase (Postgres)** |
| Cache | **Upstash (Redis)** |
| Front hosting | **Vercel** |
| Back hosting | **Fly.io** (3 VM gratuites) |
| Bot | **Telegraf** (même process que l'API) |
| Auth | **Validation HMAC Telegram officielle** |
| Smart contract | **Tact sur TON** (Phase 4) |
| Token | **$AIK** (Phase 4) |
| Économie | **3 monnaies** (Coins, Gems, $AIK) |
| Anti-cheat | **6 couches** (dès le jour 1) + **trust score** pour B2B |
| Publicité | **Adsgram** (Phase 2) |
| Cash-out | **3 niveaux** (coins, $AIK, € via Telegram Wallet) |
| Sources de revenu | **6** : ads rewarded, quêtes sponsored, datasets B2B, in-app, contenu, token |
| Repo de référence | `tungulin/quackup-app` (seul prod-ready) |
| Quêtes IA réelles | **Phase 1 = gamifié, Phase 2+ = vraies micro-tâches** |

---

## 🚀 Prochaines étapes

1. **Lire `EXECUTIVE_SUMMARY.md`** d'abord (5 min)
2. **Lire `VISION.md`** en entier pour valider la vision (30 min)
3. **Lire `MONETIZATION.md`** pour comprendre comment on gagne de l'argent (30 min)
4. **Lire `ARCHITECTURE.md`** + `ARCHITECTURE_ADDENDUM.md` pour comprendre comment on construit (1-2h)
5. **Si OK**, créer le bot Telegram via @BotFather (10 min)
6. **Créer les comptes** : Supabase + Upstash + Vercel + Fly.io (30 min)
7. **Me dire "GO"** et je te scaffold le code starter (fork de quackup, adapté, avec Bun + Hono + Supabase + la nouvelle DB schema)

---

## 📊 Métriques cibles (Phase 4 = Airdrop)

- **100k+ DAU** (Daily Active Users)
- **Rétention D7** > 50%
- **Viral coefficient (K)** > 1.0
- **Revenue** : 8-15k€/mois à 100k DAU, 80-150k€/mois à 1M DAU
- **Cash-out aux joueurs** : 1-5€ par joueur actif par mois (c'est ce qu'aucun concurrent ne fait)
- **Market cap $AIK** > 1M$

---

## 🛡️ Invariants économiques à JAMAIS briser

1. **Ratio de couverture** : `revenu_externe_30j / cash-outs_30j > 1.5`
2. **Plafond de distribution** : max 50% du revenu net aux joueurs
3. **Lockup du trésor** : minimum 6 mois de cash-out en réserve sur multisig

Tant que ces 3 règles sont respectées, le projet est viable à long terme.

---

*Pour toute question ou modification, contacter l'équipe de développement.*
