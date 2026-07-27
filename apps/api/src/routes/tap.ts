/**
 * Tap routes: /api/tap
 *
 * FIX ATOMIQUE : energie + coins mis à jour dans UN SEUL UPDATE
 * pour éliminer toute fenêtre de désynchronisation.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { detectSuspiciousPattern, logTapEvent } from '../middlewares/antiCheat';
import { db } from '../db/knex';
import { calculateValidEnergy, getUserByTelegramId, normalizeUser } from '../services/user.service';
import { addXp, getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const tap = new Hono();

const tapSchema = z.object({
  count: z.number().int().min(1).max(60),
  clientTimestamp: z.string(),
  durationMs: z.number().optional(),
});

/** Crédite 10% des gains au parrain du filleul, sans bloquer le tap. */
async function creditReferrerCommission(filleulId: number, coinsEarned: number): Promise<void> {
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
    logger.error({ err, filleulId }, 'referrer commission tap failed');
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
        energy: 0,
        maxEnergy: dbUser.max_energy,
      }, 400);
    }

    const rawIp = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
               || c.req.header('x-real-ip')?.trim()
               || null;
    const userAgent = c.req.header('user-agent') || null;
    const { suspicious, reason } = await detectSuspiciousPattern(user.id, { count, clientTimestamp, durationMs });

    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, rawIp, userAgent, suspicious);

    if (suspicious) {
      logger.warn({ userId: user.id, reason }, 'Tap suspect rejete sans consommer energie');
      return c.json({ error: 'Suspicious activity detected', reason }, 429);
    }

    const energyToSpend = Math.min(count, currentEnergy);
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier   = 1 + Math.floor(passiveIncome / 1000) * 0.1;
    const coinsEarned  = Math.floor(energyToSpend * multiplier);
    const xpGained     = energyToSpend;

    const newEnergy    = Math.max(0, currentEnergy - energyToSpend);
    const isExhausted  = newEnergy === 0;

    // FIX ATOMIQUE : energie + coins + total_taps + total_earned_coins
    // mis à jour dans UN SEUL UPDATE — plus aucune fenêtre de désync possible
    const updatePayload: Record<string, any> = {
      energy             : newEnergy,
      last_energy_update : new Date(),
      total_taps         : db.raw('total_taps + ?', [count]),
      coin_balance       : db.raw('coin_balance + ?', [coinsEarned]),
      total_earned_coins : db.raw('total_earned_coins + ?', [coinsEarned]),
    };

    if (isExhausted) {
      updatePayload.energy_exhausted_at = new Date();
    } else if (dbUser.energy_exhausted_at) {
      updatePayload.energy_exhausted_at = null;
    }

    // UPDATE ATOMIQUE avec guard energy — race condition impossible
    const updatedRows = await db('users')
      .where({ telegram_id: user.id })
      .whereRaw('energy >= ?', [energyToSpend])
      .update(updatePayload)
      .returning(['energy', 'coin_balance', 'total_taps']);

    if (!updatedRows || updatedRows.length === 0) {
      const fresh = await getUserByTelegramId(user.id);
      return c.json({
        error: 'Insufficient energy',
        energy: fresh ? Math.floor(Number(fresh.energy)) : 0,
        maxEnergy: dbUser.max_energy,
      }, 400);
    }

    // Enregistrement transaction (non-bloquant pour la réponse)
    db('transactions').insert({
      user_id            : user.id,
      type               : 'tap_earn',
      currency           : 'coin',
      amount             : coinsEarned,
      balance_after      : Number(updatedRows[0].coin_balance),
      related_entity_type: null,
      related_entity_id  : null,
    }).catch((err: any) => logger.error({ err, userId: user.id }, 'transaction insert failed'));

    // Commission parrain (async, non-bloquant)
    creditReferrerCommission(user.id, coinsEarned).catch((err: any) =>
      logger.error({ err, userId: user.id }, 'referrer commission async failed')
    );

    const { leveledUp, newLevel } = await addXp(user.id, xpGained);
    const updated = await getUserByTelegramId(user.id);
    if (!updated) return c.json({ error: 'User disappeared' }, 500);

    return c.json({
      coinsEarned,
      xpGained,
      energySpent  : energyToSpend,
      newEnergy    : Math.floor(Number(updated.energy)),
      maxEnergy    : updated.max_energy,
      newBalance   : updated.coin_balance,
      newTotalTaps : updated.total_taps,
      aiLevelUp    : leveledUp,
      newAiLevel   : newLevel,
    });
  },
);

export default tap;
