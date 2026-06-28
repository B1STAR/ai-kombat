/**
 * Rate limiting middleware using Upstash Redis.
 * Falls back silently (skip) if Upstash is not configured or URL is localhost.
 * Fail-open: si Redis injoignable, la requete passe (warn log une seule fois).
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Context, Next } from 'hono';
import { env } from '../lib/env';
import { RateLimitError } from '../lib/errors';
import { logger } from '../lib/logger';

// Ne pas initialiser Upstash si l'URL est absente ou pointe sur localhost
const upstashUrl = env.UPSTASH_REDIS_REST_URL ?? '';
const upstashToken = env.UPSTASH_REDIS_REST_TOKEN ?? '';
const isValidUpstash =
  upstashUrl.startsWith('https://') &&
  !upstashUrl.includes('localhost') &&
  !upstashUrl.includes('127.0.0.1') &&
  upstashToken.length > 0;

let redis: Redis | null = null;
if (isValidUpstash) {
  try {
    redis = new Redis({ url: upstashUrl, token: upstashToken });
    logger.info('Upstash Redis rate limiter enabled');
  } catch (e) {
    logger.warn('Upstash Redis init failed, rate limiting disabled');
  }
} else {
  logger.info('Upstash Redis not configured, rate limiting skipped');
}

const limits = {
  tap: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 s'),
    analytics: true,
  }) : null,
  quest: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }) : null,
  ad: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
  }) : null,
  general: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }) : null,
};

export const rateLimit = (type: keyof typeof limits) => {
  return async (c: Context, next: Next) => {
    const user = c.get('telegramUser');
    if (!user) { await next(); return; }

    const limiter = limits[type];
    if (!limiter) { await next(); return; }

    try {
      const { success, remaining, reset } = await limiter.limit(`${type}:${user.id}`);
      if (!success) {
        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${Math.floor((reset - Date.now()) / 1000)}s`
        );
      }
      c.header('X-RateLimit-Remaining', remaining.toString());
      c.header('X-RateLimit-Reset', reset.toString());
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      // Redis injoignable -> fail-open silencieux (pas de log warn repetitif)
      logger.debug({ type }, 'Rate limiter unreachable, failing open');
    }

    await next();
  };
};
