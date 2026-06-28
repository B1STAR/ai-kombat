/**
 * Auth routes: /api/auth/init
 *
 * STRATEGIE REFERRAL BULLETPROOF (double source) :
 * Source 1 — start_param dans initData parse (signe par Telegram).
 * Source 2 — pending_referrals enregistre par le bot au /start ref_XXX.
 * On prefere Source 1, sinon Source 2. Consomme a la premiere inscription.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { validate, parse } from '@telegram-apps/init-data-node';
import { env } from '../lib/env';
import { db } from '../db/knex';
import { upsertUser, getUserProgress, getUserByTelegramId } from '../services/user.service';
import { getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const auth = new Hono();

const initSchema = z.object({
  initData: z.string(),
  referralCode: z.string().optional(),
});

function extractReferrerId(code: string | undefined | null): number | null {
  if (!code) return null;
  const match = code.match(/^ref_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

async function processReferral(
  newUserTelegramId: number,
  referrerId: number,
  source: string,
): Promise<void> {
  if (referrerId === newUserTelegramId) return;

  await db.transaction(async (trx) => {
    const referrer = await trx('users').where({ telegram_id: referrerId }).first();
    if (!referrer) {
      logger.warn({ referrerId, source }, 'Parrain introuvable, referral ignore');
      return;
    }

    await trx('users')
      .where({ telegram_id: newUserTelegramId })
      .update({ referred_by: referrerId });

    await trx('users')
      .where({ telegram_id: referrerId })
      .increment('referral_count', 1);

    await trx('referrals').insert({
      referrer_id: referrerId,
      referred_id: newUserTelegramId,
      bonus_paid: false,
    });

    // Bonus bienvenue : +500 coins au filleul
    await trx('users')
      .where({ telegram_id: newUserTelegramId })
      .increment('coin_balance', 500);

    // Lire le solde mis a jour pour le stocker dans balance_after (NOT NULL)
    const updatedUser = await trx('users')
      .where({ telegram_id: newUserTelegramId })
      .first('coin_balance');
    const balanceAfter = Number(updatedUser?.coin_balance ?? 500);

    await trx('transactions').insert({
      user_id: newUserTelegramId,
      type: 'referral_welcome',
      currency: 'coin',
      amount: 500,
      balance_after: balanceAfter,
      related_entity_type: 'referral',
      related_entity_id: referrerId,
    });

    logger.info({ newUserTelegramId, referrerId, balanceAfter, source }, 'Referral attribue avec succes');
  });
}

auth.post('/init', zValidator('json', initSchema), async (c) => {
  const { initData, referralCode: frontendCode } = c.req.valid('json');

  try {
    validate(initData, env.TELEGRAM_BOT_TOKEN, { expiresIn: 0 });
  } catch (err: any) {
    return c.json({ error: err?.message ?? 'Invalid initData' }, 401);
  }

  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(initData);
  } catch (err: any) {
    return c.json({ error: 'Failed to parse initData' }, 400);
  }
  if (!parsed.user) return c.json({ error: 'No user in initData' }, 400);

  const newUserId = parsed.user.id;

  // Source 1 : start_param depuis initData parse
  const startParamRaw =
    (parsed as any).startParam ??
    (parsed as any).start_param ??
    null;

  // Fallback : lecture depuis la chaine brute URLSearchParams
  let startParamFromRaw: string | null = null;
  try {
    startParamFromRaw = new URLSearchParams(initData).get('start_param');
  } catch (_) {}

  const startParam = startParamRaw ?? startParamFromRaw ?? frontendCode ?? null;
  logger.info({ newUserId, startParam }, 'auth/init');

  const user = await upsertUser(parsed);

  if (!user.referred_by) {
    const referrerFromParam = extractReferrerId(startParam);

    // Source 2 : pending_referral enregistre par le bot
    const pending = await db('pending_referrals')
      .where({ telegram_id: newUserId })
      .where('expires_at', '>', new Date())
      .first();

    const referrerId = referrerFromParam ?? (pending ? Number(pending.referrer_id) : null);

    if (referrerId) {
      const source = referrerFromParam ? 'start_param' : 'pending_referral';
      try {
        await processReferral(newUserId, referrerId, source);
      } catch (err) {
        logger.error({ err }, 'processReferral failed');
      }
    } else {
      logger.info({ newUserId }, 'Aucun referral detecte');
    }

    if (pending) {
      await db('pending_referrals').where({ telegram_id: newUserId }).delete();
    }
  }

  const progress = await getUserProgress(user.telegram_id);
  const passiveIncome = await getPassiveIncomePerHour(user.telegram_id);
  const freshUser = await getUserByTelegramId(newUserId);

  return c.json({
    user: {
      ...(freshUser ?? user),
      passiveIncomePerHour: passiveIncome,
    },
    ...progress,
  });
});

export default auth;
