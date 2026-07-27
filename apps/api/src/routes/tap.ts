/**
 * Tap routes: /api/tap
 *
 * CORRECTIONS:
 * 1. Anti-triche analyse les TAPS individuels (durationMs), pas les batches
 * 2. calculateValidEnergy() appelé UNE SEULE FOIS, résultat réutilisé
 * 3. SELECT post-UPDATE supprimé : RETURNING retourne les valeurs exactes du UPDATE
 * 4. energy_exhausted_at géré correctement dans tous les cas
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
    const user     = c.get('telegramUser');
    const rawDbUser = c.get('dbUser');
    const { count, clientTimestamp, durationMs } = c.req.valid('json');

    if (!rawDbUser) return c.json({ error: 'User not found' }, 404);
    const dbUser = normalizeUser(rawDbUser);

    // --- 1. ENERGIE : calculé une seule fois ici, jamais relue depuis la DB ensuite ---
    const currentEnergy = calculateValidEnergy(dbUser);
    if (currentEnergy < 1) {
      return c.json({
        error    : 'Insufficient energy',
        newEnergy: 0,
        maxEnergy: dbUser.max_energy,
      }, 400);
    }

    // --- 2. ANTI-TRICHE : on passe durationMs (durée réelle du batch côté client) ---
    // Le middleware analyse le rythme des TAPS individuels (count/durationMs)
    // et non la régularité des appels batch qui sont forcément réguliers.
    const rawIp    = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
                  || c.req.header('x-real-ip')?.trim()
                  || null;
    const userAgent = c.req.header('user-agent') || null;

    const { suspicious, reason } = await detectSuspiciousPattern(
      user.id,
      { count, clientTimestamp, durationMs },
    );

    // Log AVANT la décision (pour audit)
    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, rawIp, userAgent, suspicious);

    if (suspicious) {
      logger.warn({ userId: user.id, reason }, 'Tap suspect rejecté sans consommer energie');
      return c.json({ error: 'Suspicious activity detected', reason }, 429);
    }

    // --- 3. CALCUL ---
    const energyToSpend = Math.min(count, currentEnergy);
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier    = 1 + Math.floor(passiveIncome / 1000) * 0.1;
    const coinsEarned   = Math.floor(energyToSpend * multiplier);
    const xpGained      = energyToSpend;
    const newEnergy     = Math.max(0, currentEnergy - energyToSpend);
    const isExhausted   = newEnergy === 0;

    // --- 4. UPDATE ATOMIQUE + RETURNING ---
    // On n’utilise PAS de SELECT après : RETURNING retourne exactement
    // les valeurs écrites par CE UPDATE, pas une lecture post-race.
    const updatePayload: Record<string, any> = {
      energy             : newEnergy,
      last_energy_update : new Date(),
      total_taps         : db.raw('total_taps + ?',         [count]),
      coin_balance       : db.raw('coin_balance + ?',       [coinsEarned]),
      total_earned_coins : db.raw('total_earned_coins + ?', [coinsEarned]),
    };

    if (isExhausted) {
      // Marquer l'heure d'épuisement pour déclencher le délai de regen
      updatePayload.energy_exhausted_at = new Date();
    } else {
      // L'énergie n'est pas à zéro : effacer energy_exhausted_at si présent
      updatePayload.energy_exhausted_at = null;
    }

    const updatedRows = await db('users')
      .where({ telegram_id: user.id })
      // Guard atomique : vérifie que l'énergie en DB est encore suffisante
      // (protection contre race condition si deux batchs arrivent en même temps)
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
      // Guard a bloqué : l'énergie a été consommée entre le calcul et le UPDATE
      // (très rare — double-batch simultané). On relit l'état réel.
      const fresh = await db('users')
        .where({ telegram_id: user.id })
        .first('energy', 'max_energy', 'coin_balance', 'total_taps');
      return c.json({
        error    : 'Insufficient energy',
        newEnergy: fresh ? Math.floor(Number(fresh.energy)) : 0,
        maxEnergy: dbUser.max_energy,
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

    // Réponse : toutes les valeurs viennent du RETURNING, pas d’un SELECT
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
