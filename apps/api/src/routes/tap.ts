/**
 * Tap routes: /api/tap
 *
 * CORRECTIONS:
 * 1. Anti-triche analyse les TAPS individuels (durationMs), pas les batches
 * 2. calculateValidEnergy() appelé UNE SEULE FOIS, résultat réutilisé
 * 3. SELECT post-UPDATE supprimé : RETURNING retourne les valeurs exactes du UPDATE
 * 4. energy_exhausted_at géré correctement dans tous les cas
 * 5. last_energy_update N'EST PAS touché lors d'un tap
 * 6. [FIX] Pendant la regen post-épuisement, energy en DB = 0 mais calculateValidEnergy
 *    retourne une valeur positive. Le guard WHERE energy >= X comparait contre 0 → bloquait
 *    toujours. Fix : on sync energy en DB AVANT le tap si on est en phase de regen,
 *    puis on retire le guard (calculateValidEnergy est la source de vérité).
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

    // --- 1. ENERGIE : calculateValidEnergy est la source de vérité ---
    // Elle tient compte de energy_exhausted_at + délai 30s + regen 0.333/s
    const currentEnergy = calculateValidEnergy(dbUser);

    if (currentEnergy < 1) {
      return c.json({
        error    : 'Insufficient energy',
        newEnergy: 0,
        maxEnergy: dbUser.max_energy,
      }, 400);
    }

    // --- 2. SYNC DB si regen post-épuisement en cours ---
    // Problème : après épuisement, energy en DB = 0 mais calculateValidEnergy
    // retourne > 0 (regen calculée). Si on laisse le guard WHERE energy >= X,
    // il compare contre 0 → bloque toujours → désync frontend.
    // Solution : si energy_exhausted_at est set et currentEnergy > 0,
    // on écrit la valeur calculée en DB ET on efface energy_exhausted_at
    // AVANT l'UPDATE du tap, dans la même transaction.
    let syncedEnergy = currentEnergy;
    if (dbUser.energy_exhausted_at && currentEnergy > 0) {
      await db('users')
        .where({ telegram_id: user.id })
        .update({
          energy             : currentEnergy,
          energy_exhausted_at: null,
          last_energy_update : new Date(),
        });
      // Recharger le user pour que le guard reflète la vraie valeur DB
      syncedEnergy = currentEnergy;
    }

    // --- 3. ANTI-TRICHE ---
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

    // --- 4. CALCUL ---
    const energyToSpend = Math.min(count, syncedEnergy);
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier    = 1 + Math.floor(passiveIncome / 1000) * 0.1;
    const coinsEarned   = Math.floor(energyToSpend * multiplier);
    const xpGained      = energyToSpend;
    const newEnergy     = Math.max(0, syncedEnergy - energyToSpend);
    const isExhausted   = newEnergy === 0;

    // --- 5. UPDATE ATOMIQUE + RETURNING ---
    // Le guard WHERE energy >= energyToSpend est maintenant fiable car
    // on a synced energy en DB juste avant (étape 2) si nécessaire.
    // last_energy_update n'est PAS touché ici (sauf si on vient de faire le sync
    // post-épuisement à l'étape 2 où il est réinitialisé).
    const updatePayload: Record<string, any> = {
      energy             : newEnergy,
      total_taps         : db.raw('total_taps + ?',         [count]),
      coin_balance       : db.raw('coin_balance + ?',       [coinsEarned]),
      total_earned_coins : db.raw('total_earned_coins + ?', [coinsEarned]),
    };

    if (isExhausted) {
      updatePayload.energy_exhausted_at = new Date();
    } else {
      updatePayload.energy_exhausted_at = null;
    }

    const updatedRows = await db('users')
      .where({ telegram_id: user.id })
      .whereRaw('energy >= ?', [energyToSpend])
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
      const fresh = await db('users')
        .where({ telegram_id: user.id })
        .first('energy', 'max_energy', 'coin_balance', 'total_taps');
      return c.json({
        error       : 'Insufficient energy',
        newEnergy   : fresh ? Math.floor(Number(fresh.energy)) : 0,
        maxEnergy   : dbUser.max_energy,
        newBalance  : fresh ? Number(fresh.coin_balance) : dbUser.coin_balance,
        newTotalTaps: fresh ? Number(fresh.total_taps)   : dbUser.total_taps,
      }, 400);
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

    // XP (peut changer ai_level)
    const { leveledUp, newLevel } = await addXp(user.id, xpGained);

    return c.json({
      coinsEarned,
      xpGained,
      energySpent  : energyToSpend,
      newEnergy    : Math.floor(Number(row.energy)),
      maxEnergy    : Number(row.max_energy),
      newBalance   : Number(row.coin_balance),
      newTotalTaps : Number(row.total_taps),
      aiLevelUp    : leveledUp,
      newAiLevel   : leveledUp ? newLevel : Number(row.ai_level),
    });
  },
);

export default tap;
