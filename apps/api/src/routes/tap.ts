/**
 * Tap routes: /api/tap
 *
 * ARCHITECTURE :
 * Le serveur est la SOURCE DE VÉRITÉ unique pour energy_exhausted_at.
 * La réponse JSON inclut toujours energyExhaustedAt (ISO string ou null).
 * Le client n'a jamais à deviner ni maintenir cet état localement.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { detectSuspiciousPattern, logTapEvent } from '../middlewares/antiCheat';
import { db } from '../db/knex';
import { calculateValidEnergy, normalizeUser } from '../services/user.service';
import { addXp, getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const tap = new Hono();

const tapSchema = z.object({
  count          : z.number().int().min(1).max(60),
  clientTimestamp: z.string(),
  durationMs     : z.number().optional(),
});

/** Crédite 10% des gains au parrain du filleul, sans bloquer le tap. */
async function creditReferrerCommission(filleulId: number, coinsEarned: number): Promise<void> {
  if (coinsEarned <= 0) return;
  const commission = Math.floor(coinsEarned * 0.1);
  if (commission <= 0) return;
  try {
    const filleul    = await db('users').where({ telegram_id: filleulId }).first('referred_by');
    const referrerId = filleul?.referred_by ? Number(filleul.referred_by) : null;
    if (!referrerId) return;
    await db('users')
      .where({ telegram_id: referrerId })
      .increment('coin_balance', commission)
      .increment('total_earned_coins', commission);
    const referrer = await db('users').where({ telegram_id: referrerId }).first('coin_balance');
    await db('transactions').insert({
      user_id            : referrerId,
      type               : 'referral_commission',
      currency           : 'coin',
      amount             : commission,
      balance_after      : Number(referrer?.coin_balance ?? commission),
      related_entity_type: 'referral',
      related_entity_id  : filleulId,
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
    const user      = c.get('telegramUser');
    const rawDbUser = c.get('dbUser');
    const { count, clientTimestamp, durationMs } = c.req.valid('json');

    if (!rawDbUser) return c.json({ error: 'User not found' }, 404);
    const dbUser = normalizeUser(rawDbUser);

    // ── 1. ÉNERGIE ───────────────────────────────────────────────────────────
    const currentEnergy = Math.floor(calculateValidEnergy(dbUser));

    if (currentEnergy < 1) {
      return c.json({
        error              : 'Insufficient energy',
        newEnergy          : 0,
        maxEnergy          : dbUser.max_energy,
        energyExhaustedAt  : dbUser.energy_exhausted_at ?? null,
      }, 400);
    }

    // ── 2. ANTI-TRICHE ───────────────────────────────────────────────────────
    const rawIp    = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
                  || c.req.header('x-real-ip')?.trim()
                  || null;
    const userAgent = c.req.header('user-agent') || null;

    const { suspicious, reason } = await detectSuspiciousPattern(
      user.id,
      { count, clientTimestamp, durationMs },
    );

    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, rawIp, userAgent, suspicious);

    if (suspicious) {
      logger.warn({ userId: user.id, reason }, 'Tap suspect rejecté sans consommer energie');
      return c.json({ error: 'Suspicious activity detected', reason }, 429);
    }

    // ── 3. CALCUL ────────────────────────────────────────────────────────────
    const energyToSpend = Math.min(count, currentEnergy);
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier    = 1 + Math.floor(passiveIncome / 1000) * 0.1;
    const coinsEarned   = Math.floor(energyToSpend * multiplier);
    const xpGained      = energyToSpend;

    const newEnergy   = Math.max(0, currentEnergy - energyToSpend);
    const isExhausted = newEnergy === 0;

    // ── 4. UPDATE ATOMIQUE ───────────────────────────────────────────────────
    const updatePayload: Record<string, any> = {
      energy       : newEnergy,
      total_taps   : db.raw('total_taps + ?',         [count]),
      coin_balance  : db.raw('coin_balance + ?',       [coinsEarned]),
      total_earned_coins: db.raw('total_earned_coins + ?', [coinsEarned]),
    };

    // Fix #2 : energy_exhausted_at n'est modifié QUE dans 2 cas :
    //   a) On vient d'épuiser l'énergie → on pose le timestamp
    //   b) On sort d'un épuisement (était non-null, maintenant newEnergy > 0) → on remet à null
    // En dehors de ces 2 cas (tap normal, energy_exhausted_at déjà null) on ne touche PAS
    // energy_exhausted_at pour éviter d'écraser un timestamp posé par un batch concurrent.
    if (isExhausted) {
      updatePayload.energy_exhausted_at = new Date();
    } else if (dbUser.energy_exhausted_at) {
      // Sortie d'épuisement : on efface le timestamp et on note le moment de sortie
      updatePayload.energy_exhausted_at = null;
      updatePayload.last_energy_update  = new Date();
    }
    // Cas normal (pas épuisé, pas en sortie d'épuisement) : on ne touche pas energy_exhausted_at

    const updatedRows = await db('users')
      .where({ telegram_id: user.id })
      .update(updatePayload)
      .returning([
        'energy',
        'coin_balance',
        'total_taps',
        'max_energy',
        'ai_level',
        'energy_exhausted_at',
      ]);

    if (!updatedRows || updatedRows.length === 0) {
      return c.json({ error: 'User not found during update' }, 500);
    }

    const row = updatedRows[0];

    // Transaction (async, non-bloquant)
    db('transactions').insert({
      user_id            : user.id,
      type               : 'tap_earn',
      currency           : 'coin',
      amount             : coinsEarned,
      balance_after      : Number(row.coin_balance),
      related_entity_type: null,
      related_entity_id  : null,
    }).catch((err: any) => logger.error({ err, userId: user.id }, 'transaction insert failed'));

    // Commission parrain (async, non-bloquant)
    creditReferrerCommission(user.id, coinsEarned).catch((err: any) =>
      logger.error({ err, userId: user.id }, 'referrer commission async failed'),
    );

    // XP
    const { leveledUp, newLevel } = await addXp(user.id, xpGained);

    // ── 5. RÉPONSE : inclut toujours energyExhaustedAt ───────────────────────
    return c.json({
      coinsEarned,
      xpGained,
      energySpent      : energyToSpend,
      newEnergy        : newEnergy,
      maxEnergy        : Number(row.max_energy),
      newBalance       : Number(row.coin_balance),
      newTotalTaps     : Number(row.total_taps),
      aiLevelUp        : leveledUp,
      newAiLevel       : leveledUp ? newLevel : Number(row.ai_level),
      energyExhaustedAt: row.energy_exhausted_at ? new Date(row.energy_exhausted_at).toISOString() : null,
    });
  },
);

export default tap;
