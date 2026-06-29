module.exports = {
  "apps": [
    {
      "name": "ai-kombat-api",
      "interpreter": "/home/ubuntu/.bun/bin/bun",
      "script": "src/index.ts",
      "cwd": "/home/ubuntu/ai-kombat/ai-kombat/apps/api",
      "env": {
        "DATABASE_URL": "postgresql://postgres.wiuddymahplqirdapwej:OkFqSbD2nBKRFs4@aws-1-eu-central-1.pooler.supabase.com:6543/postgres",
        "NODE_ENV": "production",
        "BOT_TOKEN": "8607727633:AAFY2ViFSTmt1keLQQUNf9hmLIG_Rszn5p0",
        "TELEGRAM_BOT_TOKEN": "8607727633:AAFY2ViFSTmt1keLQQUNf9hmLIG_Rszn5p0",
        "JWT_SECRET": "8563665670d0a87268ee7f3864af32383f2ef9685308aa5e70860b85c677c1c5",
        "UPSTASH_REDIS_URL": "redis://localhost:6379",
        "UPSTASH_REDIS_TOKEN": "",
        "PORT": "3001",
        "FRONTEND_URL": "https://groupeboaz.online"
      }
    }
  ]
}
