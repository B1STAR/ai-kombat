/**
 * Auth routes: /api/auth/init
 * Referral bulletproof double source + bonus 500 coins parrain a l'inscription.
 * Reponse filtrée via UserDTO — aucun champ interne expose.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { validate, parse } from '@telegram-apps/init-data-node';
import { env } from '../lib/env';
import { db } from '../db/knex';
import { upsertUser, getUserProgress, getUserByTelegramId, toUserDTO } from '../services/user.service';
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
      bonus_paid: true,
    });

    // BONUS FILLEUL : +500 coins
    await trx('users')
      .where({ telegram_id: newUserTelegramId })
      .increment('coin_balance', 500);

    const filleulUpdated = await trx('users').where({ telegram_id: newUserTelegramId }).first('coin_balance');
    await trx('transactions').insert({
      user_id: newUserTelegramId,
      type: 'referral_welcome',
      currency: 'coin',
      amount: 500,
      balance_after: Number(filleulUpdated?.coin_balance ?? 500),
      related_entity_type: 'referral',
      related_entity_id: referrerId,
    });

    // BONUS PARRAIN : +500 coins
    await trx('users')
      .where({ telegram_id: referrerId })
      .increment('coin_balance', 500);

    const parrainUpdated = await trx('users').where({ telegram_id: referrerId }).first('coin_balance');
    await trx('transactions').insert({
      user_id: referrerId,
      type: 'referral_bonus',
      currency: 'coin',
      amount: 500,
      balance_after: Number(parrainUpdated?.coin_balance ?? 500),
      related_entity_type: 'referral',
      related_entity_id: newUserTelegramId,
    });

    logger.info({ newUserTelegramId, referrerId, source }, 'Referral attribue : +500 filleul +500 parrain');
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

  const startParamRaw = (parsed as any).startParam ?? (parsed as any).start_param ?? null;
  let startParamFromRaw: string | null = null;
  try { startParamFromRaw = new URLSearchParams(initData).get('start_param'); } catch (_) {}
  const startParam = startParamRaw ?? startParamFromRaw ?? frontendCode ?? null;

  logger.info({ newUserId, startParam }, 'auth/init');

  const user = await upsertUser(parsed);

  if (!user.referred_by) {
    const referrerFromParam = extractReferrerId(startParam);
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

  const [progress, passiveIncome, freshUser] = await Promise.all([
    getUserProgress(user.telegram_id),
    getPassiveIncomePerHour(user.telegram_id),
    getUserByTelegramId(newUserId),
  ]);

  const safeUser = toUserDTO(freshUser ?? user);

  return c.json({
    user: { ...safeUser, passiveIncomePerHour: passiveIncome },
    ...progress,
  });
});

export default auth;
