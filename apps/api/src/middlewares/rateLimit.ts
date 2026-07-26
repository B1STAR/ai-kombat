/**
 * Rate limiting middleware using ioredis (local Redis) + rate-limiter-flexible.
 * Fail-open: si Redis est injoignable, la requête passe (warn loggé une seule fois).
 */
import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterMemory, type RateLimiterAbstract } from 'rate-limiter-flexible';
import type { Context, Next } from 'hono';
import { env } from '../lib/env';
import { RateLimitError } from '../lib/errors';
import { logger } from '../lib/logger';

// --- Client Redis (connexion lazy, reconnect automatique) ---
const redisClient = new Redis(env.REDIS_URL, {
  enableOfflineQueue: false,   // ne pas accumuler les cmds quand Redis est down
  maxRetriesPerRequest: 1,     // timeout rapide pour le fail-open
  lazyConnect: true,
});

redisClient.on('connect', () => logger.info('Redis connected — rate limiting active'));
redisClient.on('error', (err) => logger.warn({ err: err.message }, 'Redis error — rate limiting in memory fallback'));

// Tentative de connexion au démarrage (non bloquante)
redisClient.connect().catch(() => {
  logger.warn('Redis unreachable at startup — using in-memory fallback');
});

// --- Fabrique de limiteur (Redis ou mémoire selon disponibilité) ---
const makeLimiter = (
  keyPrefix: string,
  points: number,
  duration: number, // secondes
): RateLimiterAbstract => {
  const opts = { keyPrefix, points, duration };
  try {
    return new RateLimiterRedis({ storeClient: redisClient, ...opts,
      insuranceLimiter: new RateLimiterMemory(opts), // fallback mémoire automatique
    });
  } catch {
    return new RateLimiterMemory(opts);
  }
};

// --- Définition des limites ---
const limits = {
  tap:     makeLimiter('rl:tap',     5,   1),    // 5 req / 1 s
  quest:   makeLimiter('rl:quest',   10,  60),   // 10 req / 1 min
  ad:      makeLimiter('rl:ad',      3,   3600), // 3 req / 1 h
  general: makeLimiter('rl:general', 100, 60),   // 100 req / 1 min
} as const;

// --- Middleware exporté ---
export const rateLimit = (type: keyof typeof limits) => {
  return async (c: Context, next: Next) => {
    const user = c.get('telegramUser');
    if (!user) { await next(); return; }

    const limiter = limits[type];

    try {
      const res = await limiter.consume(`${type}:${user.id}`);
      c.header('X-RateLimit-Remaining', String(res.remainingPoints));
      c.header('X-RateLimit-Reset', String(Date.now() + res.msBeforeNext));
    } catch (err: unknown) {
      // RateLimiterRes thrown when limit exceeded
      if (err && typeof err === 'object' && 'remainingPoints' in err) {
        const res = err as { msBeforeNext: number };
        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${Math.ceil(res.msBeforeNext / 1000)}s`
        );
      }
      // Autre erreur (Redis down, timeout) → fail-open
      logger.debug({ type }, 'Rate limiter error, failing open');
    }

    await next();
  };
};
