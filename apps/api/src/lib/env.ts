/**
 * Environment variables validation.
 * Throws on startup if required vars are missing.
 */
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

// Upstash requires an HTTPS REST URL, not a redis:// protocol URL.
// If the configured URL uses redis://, treat it as not set (local Redis is not compatible).
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const isUpstashConfigured =
  upstashUrl && upstashUrl.startsWith('https://');

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_URL: z.string().url().default('http://localhost:3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_BOT_USERNAME: z.string().default('AIKombatBot'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Cache (Upstash) — only valid if HTTPS REST URL, not local redis://
  UPSTASH_REDIS_REST_URL: isUpstashConfigured
    ? z.string().url()
    : z.string().optional().transform(() => undefined),
  UPSTASH_REDIS_REST_TOKEN: isUpstashConfigured
    ? z.string().min(1)
    : z.string().optional().transform(() => undefined),

  // Auth
  JWT_SECRET: z.string().min(16).default('change-me-in-production-please-use-a-long-random-string'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  LOGFLARE_API_KEY: z.string().optional(),

  // Ads (Phase 2+)
  ADSGRAM_BLOCK_ID: z.string().optional(),

  // Payments (Phase 3+)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
