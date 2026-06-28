/**
 * Tap routes: /api/tap
 * POST /api/tap
 * Fix: energy stockee en INTEGER dans Postgres -> Math.floor() obligatoire avant update.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { detectSuspiciousPattern, logTapEvent } from '../middlewares/antiCheat';
import { db } from '../db/knex';
import { addCoins, calculateValidEnergy, getUserByTelegramId, normalizeUser } from '../services/user.service';
import { addXp, getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const tap = new Hono();

const tapSchema = z.object({
  count: z.number().int().min(1).max(60),
  clientTimestamp: z.string(),
  durationMs: z.number().optional(),
});

tap.post(
  '/',
  authMiddleware,
  rateLimit('tap'),
  zValidator('json', tapSchema),
  async (c) => {
    const user = c.get('telegramUser');
    const rawDbUser = c.get('dbUser');
    const { count, clientTimestamp, durationMs } = c.req.valid('json');

    if (!rawDbUser) return c.json({ error: 'User not found' }, 404);
    const dbUser = normalizeUser(rawDbUser);

    const currentEnergy = calculateValidEnergy(dbUser);
    if (currentEnergy < 1) {
      return c.json({
        error: 'Insufficient energy',
        energy: Math.floor(currentEnergy),
        maxEnergy: dbUser.max_energy,
      }, 400);
    }

    const energyToSpend = Math.min(count, Math.floor(currentEnergy));
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier = 1 + Math.floor(passiveIncome / 1000) * 0.1;
    const coinsEarned = Math.floor(energyToSpend * multiplier);
    const xpGained = energyToSpend;

    const { suspicious, reason } = await detectSuspiciousPattern(user.id, { count, clientTimestamp, durationMs });

    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, ip, userAgent, suspicious);

    const finalCoins = suspicious ? 0 : coinsEarned;
    // CRITICAL: Postgres energy est INTEGER — on floor() avant d'ecrire
    const newEnergy = Math.max(0, Math.floor(currentEnergy - energyToSpend));

    await db('users')
      .where({ telegram_id: user.id })
      .update({ energy: newEnergy, last_energy_update: new Date() })
      .increment('total_taps', energyToSpend);

    if (finalCoins > 0) await addCoins(user.id, finalCoins, 'tap_earn');

    const { leveledUp, newLevel } = await addXp(user.id, xpGained);

    const updated = await getUserByTelegramId(user.id);
    if (!updated) return c.json({ error: 'User disappeared' }, 500);

    return c.json({
      coinsEarned: finalCoins,
      xpGained,
      energySpent: energyToSpend,
      newEnergy: Math.floor(Number(updated.energy)),
      newBalance: updated.coin_balance,
      newTotalTaps: updated.total_taps,
      aiLevelUp: leveledUp,
      newAiLevel: newLevel,
      suspicious,
    });
  },
);

export default tap;
