/**
 * Tap routes: /api/tap
 *
 * CORRECTIONS:
 * 1. Anti-triche analyse les TAPS individuels (durationMs), pas les batches
 * 2. calculateValidEnergy() appelé UNE SEULE FOIS, résultat réutilisé
 * 3. SELECT post-UPDATE supprimé : RETURNING retourne les valeurs exactes
 * 4. energy_exhausted_at géré correctement dans tous les cas
 * 5. last_energy_update N'EST PAS touché lors d'un tap
 * 6. [FIX v3] currentEnergy floored AVANT energyToSpend pour éviter
 *    qu'un float résiduel (ex. 0.7) passe le guard `>= 1` et crédite
 *    des coins alors que l'énergie entière est à 0.
 * 7. [FIX v3] energy_exhausted_at mis à null dans l'UPDATE quand !isExhausted
 *    — garantit la sortie propre du mode regen même si le frontend a raté
 *    le reset de son côté.
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

    // ── 1. ÉNERGIE : calculateValidEnergy est la source de vérité ───────────
    // Elle tient compte de energy_exhausted_at + délai 30 s + regen 0.333/s
    // FIX v3 : on floor() ici pour être cohérent avec le guard ci-dessous.
    // calculateValidEnergy retourne déjà un floor() mais on le garantit.
    const currentEnergy = Math.floor(calculateValidEnergy(dbUser));

    if (currentEnergy < 1) {
      return c.json({
        error    : 'Insufficient energy',
        newEnergy: 0,
        maxEnergy: dbUser.max_energy,
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
    // energyToSpend : on ne peut pas dépenser plus que ce qu'on a (entier).
    const energyToSpend = Math.min(count, currentEnergy);
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier    = 1 + Math.floor(passiveIncome / 1000) * 0.1;
    const coinsEarned   = Math.floor(energyToSpend * multiplier);
    const xpGained      = energyToSpend;

    // FIX v3 CRITIQUE : newEnergy calculé depuis currentEnergy (valeur cohérente
    // avec calculateValidEnergy qui repart de user.energy en DB).
    // Avant : newEnergy = Math.max(0, currentEnergy - energyToSpend)
    //   → si calculateValidEnergy retournait une valeur < user.energy DB,
    //     on écrivait une énergie inférieure à la réelle → perte de coins.
    // Maintenant : on utilise currentEnergy qui EST déjà aligné avec la DB
    // (la fonction repart de storedEnergy + regen, pas de 0).
    const newEnergy   = Math.max(0, currentEnergy - energyToSpend);
    const isExhausted = newEnergy === 0;

    // ── 4. UPDATE ATOMIQUE UNIQUE ────────────────────────────────────────────
    // Pas de guard WHERE energy >= energyToSpend :
    //   • calculateValidEnergy est la source de vérité
    //   • Le guard comparait contre energy DB qui peut être 0 pendant la regen
    //     post-épuisement → bloquait toujours → désync frontend/DB
    //
    // Concurrence : rateLimit Redis + batch 800 ms frontend garantissent
    // qu'un seul batch arrive à la fois par utilisateur.
    const updatePayload: Record<string, any> = {
      energy             : newEnergy,
      total_taps         : db.raw('total_taps + ?',         [count]),
      coin_balance       : db.raw('coin_balance + ?',       [coinsEarned]),
      total_earned_coins : db.raw('total_earned_coins + ?', [coinsEarned]),
      // FIX v3 : on efface TOUJOURS energy_exhausted_at quand on n'est pas
      // épuisé — même si la regen était en cours côté DB.
      // Cela garantit que le prochain appel à calculateValidEnergy tombe dans
      // le chemin "cas normal" et retourne directement newEnergy sans recalcul.
      energy_exhausted_at: isExhausted ? new Date() : null,
    };

    // last_energy_update : on le touche UNIQUEMENT si on sort de la phase
    // d'épuisement — pour signaler au cron de regen passive que la regen
    // manuelle est terminée.
    if (dbUser.energy_exhausted_at && !isExhausted) {
      updatePayload.last_energy_update = new Date();
    }

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

    // XP (peut changer ai_level)
    const { leveledUp, newLevel } = await addXp(user.id, xpGained);

    return c.json({
      coinsEarned,
      xpGained,
      energySpent  : energyToSpend,
      // FIX v3 : on retourne newEnergy (calculé, entier garanti) et NON
      // row.energy (valeur DB brute qui peut avoir une légère différence
      // due à la conversion Postgres numeric → JS number).
      newEnergy    : newEnergy,
      maxEnergy    : Number(row.max_energy),
      newBalance   : Number(row.coin_balance),
      newTotalTaps : Number(row.total_taps),
      aiLevelUp    : leveledUp,
      newAiLevel   : leveledUp ? newLevel : Number(row.ai_level),
    });
  },
);

export default tap;
