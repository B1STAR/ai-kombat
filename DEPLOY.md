# Deploy en 1 commande

## Prérequis
- Ubuntu 22.04, Node 20+, Bun, PM2, nginx avec SSL (certbot)

## Installation complète
```bash
git clone https://github.com/B1STAR/ai-kombat
cd ai-kombat
cp apps/api/.env.example apps/api/.env        # éditer les vraies valeurs
cp apps/web/.env.local.example apps/web/.env.local
bun install
cd apps/web && bun run build && cd ../..
pm2 start apps/api/ecosystem.config.cjs
pm2 start apps/web/ecosystem.config.cjs
sudo cp infra/nginx/ai-kombat.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload
```

## Variables à changer
- `apps/api/.env` : DATABASE_URL, BOT_TOKEN, JWT_SECRET, FRONTEND_URL
- `apps/web/.env.local` : NEXT_PUBLIC_API_URL
