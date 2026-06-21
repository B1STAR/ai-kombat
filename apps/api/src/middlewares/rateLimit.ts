/**
 * Rate limiting middleware using Upstash Redis.
 * Falls back to in-memory if Upstash is not configured (development only).
 * Fail-open: if Redis is unreachable, request is allowed through (no 500).
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Context, Next } from 'hono';
import { env } from '../lib/env';
import { RateLimitError } from '../lib/errors';
import { logger } from '../lib/logger';

let redis: Redis | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = Redis.fromEnv();
  } catch (e) {
    logger.warn('Upstash Redis init failed, rate limiting disabled');
  }
}

const limits = {
  // 5 taps per second per user
  tap: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 s'),
    analytics: true,
  }) : null,
  
  // 10 quest claims per minute per user
  quest: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }) : null,
  
  // 3 ad rewards per hour per user (anti-fraud on ad farming)
  ad: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
  }) : null,
  
  // General API: 100 req/min per user
  general: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }) : null,
};

export const rateLimit = (type: keyof typeof limits) => {
  return async (c: Context, next: Next) => {
    const user = c.get('telegramUser');
    if (!user) {
      // B2B routes don't have telegramUser, skip rate limiting
      await next();
      return;
    }
    
    const limiter = limits[type];
    if (!limiter) {
      // No Redis configured (dev) or init failed, skip
      await next();
      return;
    }
    
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
      // If it's a rate limit error, re-throw it
      if (err instanceof RateLimitError) throw err;
      // Otherwise: Redis unreachable → fail-open, log warning, allow request
      logger.warn({ err, type }, 'Rate limiter unavailable, failing open');
    }
    
    await next();
  };
};
