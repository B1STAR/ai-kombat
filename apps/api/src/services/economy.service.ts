/**
 * Economy service: handles coins/gems balance, energy regen, AI leveling.
 *
 * AUDIT FIX (2026-06-17) — Problem #7:
 * getPassiveIncomePerHour() was being called on EVERY tap request, triggering a
 * JOIN + SUM query on user_modules at high frequency. With 1000+ concurrent
 * tappers this creates significant DB load.
 *
 * Fix: result is now cached in Redis with a 5-minute TTL.
 * Cache key: passive_income:<userId>
 * Invalidation: any buyModule() or module upgrade clears the key.
 * Fallback: if Redis is unavailable (dev / cold start), falls through to DB.
 *
 * addXp() now accepts an optional Knex.Transaction so it can be called
 * inside the atomic tap transaction.
 */
import { Redis } from '@upstash/redis';
import { db } from '../db/knex';
import { spendCoins, getUserByTelegramId, type User } from './user.service';
import type { Knex } from 'knex';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

// ── Redis client (same instance used by rateLimit, reused here)
let redis: Redis | null = null;
try {
  // Redis.fromEnv() throws if env vars are missing — catch gracefully
  redis = Redis.fromEnv();
} catch {
  logger.warn('Upstash Redis not configured — passive income cache disabled (dev mode)');
}

const PASSIVE_INCOME_TTL_SECONDS = 5 * 60; // 5 minutes
const passiveIncomeCacheKey = (userId: number) => `passive_income:${userId}`;

// ============================================
// LEVEL CURVE
// ============================================
const xpPerLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level)); // 100, 150, 225, 337, ...
};

const aiTypeForLevel = (level: number): string => {
  if (level < 5) return 'novice';
  if (level < 10) return 'apprentice';
  if (level < 20) return 'initiate';
  if (level < 30) return 'confirmed';
  if (level < 40) return 'expert';
  if (level < 50) return 'master';
  if (level < 70) return 'legend';
  if (level < 100) return 'transcendent';
  return 'agi';
};

/**
 * Add XP to a user and check for level-up.
 * Accepts an optional transaction so it can be called atomically inside tap.ts.
 */
export const addXp = async (
  userId: number,
  xpGained: number,
  trx?: Knex.Transaction,
): Promise<{ leveledUp: boolean; newLevel: number }> => {
  const query = trx || db;
  const user = await query<User>('users').where({ telegram_id: userId }).first();
  if (!user) throw new Error('User not found');

  const newXp = user.ai_xp + xpGained;
  let newLevel = user.ai_level;
  let leveledUp = false;

  while (newXp >= xpPerLevel(newLevel + 1) && newLevel < 100) {
    newLevel++;
    leveledUp = true;
  }

  await query('users')
    .where({ telegram_id: userId })
    .update({
      ai_xp: newXp,
      ai_level: newLevel,
      ai_type: aiTypeForLevel(newLevel),
    });

  return { leveledUp, newLevel };
};

// ============================================
// MODULES
// ============================================
export const buyModule = async (userId: number, moduleId: number): Promise<User> => {
  return await db.transaction(async (trx) => {
    const moduleData = await trx('ai_modules').where({ id: moduleId }).first();
    if (!moduleData) throw new Error('Module not found');
    if (!moduleData.is_active) throw new Error('Module not available');

    const user = await trx('users').where({ telegram_id: userId }).forUpdate().first();
    if (!user) throw new Error('User not found');

    if (user.ai_level < moduleData.min_ai_level) {
      throw new Error(`AI level ${moduleData.min_ai_level} required`);
    }

    const existing = await trx('user_modules')
      .where({ user_id: userId, module_id: moduleId })
      .first();

    let cost: number;
    let newLevel: number;

    if (existing) {
      newLevel = existing.level + 1;
      if (newLevel > moduleData.max_level) throw new Error('Module max level reached');
      cost = Math.floor(moduleData.base_cost * Math.pow(moduleData.cost_multiplier, newLevel - 1));

      // Atomic spend (TOCTOU-safe)
      const newBalance = await spendCoins(userId, cost, 'module_buy',
        { type: 'module', id: moduleId }, trx);
      if (newBalance === null) throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');

      await trx('user_modules')
        .where({ user_id: userId, module_id: moduleId })
        .update({ level: newLevel });
    } else {
      newLevel = 1;
      cost = moduleData.base_cost;

      if (moduleData.required_module_code) {
        const required = await trx('ai_modules')
          .where({ code: moduleData.required_module_code })
          .first();
        if (required) {
          const hasRequired = await trx('user_modules')
            .where({ user_id: userId, module_id: required.id })
            .first();
          if (!hasRequired) throw new Error(`Requires ${moduleData.required_module_code} first`);
        }
      }

      // Atomic spend (TOCTOU-safe)
      const newBalance = await spendCoins(userId, cost, 'module_buy',
        { type: 'module', id: moduleId }, trx);
      if (newBalance === null) throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');

      await trx('user_modules').insert({ user_id: userId, module_id: moduleId, level: 1 });
    }

    // ── Invalidate passive income cache after any module change
    if (redis) {
      await redis.del(passiveIncomeCacheKey(userId));
    }

    const updated = await trx('users').where({ telegram_id: userId }).first();
    return updated;
  });
};

/**
 * Returns the user's passive income per hour (coins/h from owned modules).
 *
 * Result is cached in Redis for 5 minutes to avoid a DB JOIN on every tap.
 * Cache is invalidated by buyModule() after every purchase or upgrade.
 */
export const getPassiveIncomePerHour = async (userId: number): Promise<number> => {
  const cacheKey = passiveIncomeCacheKey(userId);

  // Try Redis cache first
  if (redis) {
    try {
      const cached = await redis.get<number>(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err, userId }, 'Redis cache read failed, falling back to DB');
    }
  }

  // Cache miss or Redis unavailable — query DB
  const result = await db('user_modules')
    .where({ user_id: userId })
    .join('ai_modules', 'ai_modules.id', 'user_modules.module_id')
    .sum(db.raw('ai_modules.coins_per_hour_bonus * user_modules.level as total'))
    .first();

  const income = Number(result?.total || 0);

  // Populate cache
  if (redis) {
    redis.setex(cacheKey, PASSIVE_INCOME_TTL_SECONDS, income)
      .catch((err) => logger.warn({ err, userId }, 'Redis cache write failed'));
  }

  return income;
};
