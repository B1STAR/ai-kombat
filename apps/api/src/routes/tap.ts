/**
 * Tap routes: /api/tap
 * POST /api/tap
 * Apres chaque tap gagnant, on credite 10% au parrain (si existe).
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

/** Credite 10% des gains au parrain du filleul, sans bloquer le tap. */
async function creditReferrerCommission(
  filleulId: number,
  coinsEarned: number,
): Promise<void> {
  if (coinsEarned <= 0) return;
  const commission = Math.floor(coinsEarned * 0.1);
  if (commission <= 0) return;

  try {
    const filleul = await db('users').where({ telegram_id: filleulId }).first('referred_by');
    const referrerId = filleul?.referred_by ? Number(filleul.referred_by) : null;
    if (!referrerId) return;

    await db('users')
      .where({ telegram_id: referrerId })
      .increment('coin_balance', commission)
      .increment('total_earned_coins', commission);

    const referrer = await db('users').where({ telegram_id: referrerId }).first('coin_balance');
    await db('transactions').insert({
      user_id: referrerId,
      type: 'referral_commission',
      currency: 'coin',
      amount: commission,
      balance_after: Number(referrer?.coin_balance ?? commission),
      related_entity_type: 'referral',
      related_entity_id: filleulId,
    });
  } catch (err) {
    // Ne jamais bloquer le tap pour une commission
    logger.debug({ err, filleulId }, 'referrer commission tap failed silently');
  }
}

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

    const { suspicious } = await detectSuspiciousPattern(user.id, { count, clientTimestamp, durationMs });

    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, ip, userAgent, suspicious);

    const finalCoins = suspicious ? 0 : coinsEarned;
    const newEnergy = Math.max(0, Math.floor(currentEnergy - energyToSpend));

    await db('users')
      .where({ telegram_id: user.id })
      .update({ energy: newEnergy, last_energy_update: new Date() })
      .increment('total_taps', energyToSpend);

    if (finalCoins > 0) {
      await addCoins(user.id, finalCoins, 'tap_earn');
      // Commission 10% au parrain (async, ne bloque pas la reponse)
      creditReferrerCommission(user.id, finalCoins).catch(() => {});
    }

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
