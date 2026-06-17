/**
 * Tap routes: /api/tap/*
 * POST /api/tap - Validate a batch of taps
 *
 * AUDIT FIX (2026-06-17):
 * - Bug #1: Entire route is now inside a db.transaction() with FOR UPDATE
 *   Prevents race condition where parallel requests overdraft energy.
 * - Bug #2: Core economic ops (energy + coins) are atomic inside the transaction.
 *   total_taps / total_earned_coins are updated best-effort OUTSIDE the tx
 *   (analyst data, acceptable eventual consistency per designer spec).
 * - Bug #3: Anti-cheat now uses durationMs/count (declared taps/sec) instead
 *   of server_timestamp stdDev (useless for batched requests).
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { detectSuspiciousPattern, logTapEvent } from '../middlewares/antiCheat';
import { db } from '../db/knex';
import { addCoins, calculateValidEnergy, getUserByTelegramId } from '../services/user.service';
import { addXp, getPassiveIncomePerHour } from '../services/economy.service';
import { NotFoundError, AppError } from '../lib/errors';
import { logger } from '../lib/logger';

const tap = new Hono();

const tapSchema = z.object({
  count: z.number().int().min(1).max(60),
  clientTimestamp: z.string(), // ISO 8601
  durationMs: z.number().min(0).optional(),
});

tap.post(
  '/',
  authMiddleware,
  rateLimit('tap'),
  zValidator('json', tapSchema),
  async (c) => {
    const telegramUser = c.get('telegramUser');
    const { count, clientTimestamp, durationMs } = c.req.valid('json');

    // ── Anti-cheat: run BEFORE the transaction (read-only, no perf cost inside tx)
    const { suspicious, reason } = await detectSuspiciousPattern(telegramUser.id, {
      count,
      clientTimestamp,
      durationMs,
    });

    // ── Log tap event (best-effort, outside tx — analytics data)
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    // Fire-and-forget: don't await, don't block the response on analytics
    logTapEvent(telegramUser.id, { count, clientTimestamp, durationMs }, ip, userAgent, suspicious)
      .catch((err) => logger.error({ err }, 'Failed to log tap event'));

    // If already suspicious, short-circuit — no DB writes needed
    if (suspicious) {
      logger.warn({ userId: telegramUser.id, reason }, 'Suspicious tap rejected before tx');
      // Return a plausible response so client doesn't know it was flagged
      const currentUser = await getUserByTelegramId(telegramUser.id);
      if (!currentUser) throw new NotFoundError('User not found');
      return c.json({
        coinsEarned: 0,
        xpGained: 0,
        energySpent: 0,
        newEnergy: calculateValidEnergy(currentUser),
        newBalance: currentUser.coin_balance,
        aiLevelUp: false,
        newAiLevel: currentUser.ai_level,
        suspicious: true,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE ECONOMIC TRANSACTION
    // Everything that touches money / energy MUST be inside this block.
    // The SELECT ... FOR UPDATE prevents parallel requests from reading stale data.
    // ─────────────────────────────────────────────────────────────────────────
    const result = await db.transaction(async (trx) => {
      // 1. Lock the user row — blocks any concurrent tap/buy on this user
      const user = await trx('users')
        .where({ telegram_id: telegramUser.id })
        .forUpdate()
        .first();

      if (!user) throw new NotFoundError('User not found');
      if (user.is_banned) throw new AppError('Account banned', 403, 'BANNED');

      // 2. Validate energy (calculated from locked snapshot, not from middleware cache)
      const currentEnergy = calculateValidEnergy(user);
      if (currentEnergy < count) {
        throw new AppError(
          'Insufficient energy',
          400,
          'INSUFFICIENT_ENERGY',
        );
      }

      // 3. Multiplier from passive income (Redis-cached, safe to call inside tx)
      const passiveIncome = await getPassiveIncomePerHour(telegramUser.id);
      const multiplier = 1 + Math.floor(passiveIncome / 1000) * 0.1;

      // 4. Calculate rewards
      const coinsEarned = Math.floor(count * multiplier);
      const xpGained = count;

      // 5. Debit energy atomically
      await trx('users')
        .where({ telegram_id: telegramUser.id })
        .update({
          energy: currentEnergy - count,
          last_energy_update: new Date(),
        });

      // 6. Credit coins (inside transaction — this IS economic data)
      let newBalance = user.coin_balance;
      if (coinsEarned > 0) {
        const [updated] = await trx('users')
          .where({ telegram_id: telegramUser.id })
          .increment('coin_balance', coinsEarned)
          .increment('total_earned_coins', coinsEarned)
          .returning('coin_balance');
        newBalance = updated.coin_balance;

        // Transaction log inside the same tx
        await trx('transactions').insert({
          user_id: telegramUser.id,
          type: 'tap_earn',
          currency: 'coin',
          amount: coinsEarned,
          balance_after: newBalance,
          related_entity_type: null,
          related_entity_id: null,
        });
      }

      // 7. Level up XP (inside tx — level is economic state)
      const { leveledUp, newLevel } = await addXp(telegramUser.id, xpGained, trx);

      return {
        coinsEarned,
        xpGained,
        energySpent: count,
        newEnergy: currentEnergy - count,
        newBalance,
        aiLevelUp: leveledUp,
        newAiLevel: newLevel,
      };
    });

    // ── Best-effort stat counters (outside tx — acceptable eventual consistency)
    db('users')
      .where({ telegram_id: telegramUser.id })
      .increment('total_taps', count)
      .catch((err) => logger.error({ err }, 'Failed to increment total_taps'));

    return c.json({
      ...result,
      suspicious: false,
    });
  },
);

export default tap;
