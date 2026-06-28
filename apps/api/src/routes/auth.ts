/**
 * Auth routes: /api/auth/*
 * POST /api/auth/init
 *
 * Strategie referral robuste :
 * 1. On extrait start_param depuis initData PARSE cote serveur (signe par Telegram, inalterable).
 * 2. Si absent dans initData (cas rare), on utilise referralCode envoye par le frontend.
 * Ainsi meme si le frontend loupe le start_param, le serveur le recupere directement.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { validate, parse } from '@telegram-apps/init-data-node';
import { env } from '../lib/env';
import { db } from '../db/knex';
import { upsertUser, getUserProgress } from '../services/user.service';
import { getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const auth = new Hono();

const initSchema = z.object({
  initData: z.string(),
  referralCode: z.string().optional(), // fallback envoye par le frontend
});

/** Extrait ref_XXXXXX depuis une chaine, retourne le telegram_id numerique ou null */
function extractReferrerId(code: string | undefined): number | null {
  if (!code) return null;
  const match = code.match(/^ref_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

auth.post('/init', zValidator('json', initSchema), async (c) => {
  const { initData, referralCode: frontendReferralCode } = c.req.valid('json');

  // 1. Valider signature HMAC
  try {
    validate(initData, env.TELEGRAM_BOT_TOKEN, { expiresIn: 0 });
  } catch (err: any) {
    return c.json({ error: err?.message ?? 'Invalid initData' }, 401);
  }

  // 2. Parser initData — start_param est ici, signe par Telegram
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(initData);
  } catch (err: any) {
    return c.json({ error: 'Failed to parse initData' }, 400);
  }

  if (!parsed.user) {
    return c.json({ error: 'No user in initData' }, 400);
  }

  // 3. Recuperer start_param depuis initData parse (source de verite)
  //    Fallback : referralCode envoye par le frontend
  const startParam = (parsed as any).startParam
    ?? (parsed as any).start_param
    ?? frontendReferralCode
    ?? '';

  logger.info({ startParam, userId: parsed.user.id }, 'auth/init start_param');

  // 4. Upsert user
  const user = await upsertUser(parsed);

  // 5. Traitement referral (premiere inscription uniquement)
  if (startParam && !user.referred_by) {
    const referrerId = extractReferrerId(startParam);
    if (referrerId && referrerId !== user.telegram_id) {
      try {
        await db.transaction(async (trx) => {
          const referrer = await trx('users').where({ telegram_id: referrerId }).first();
          if (!referrer) {
            logger.warn({ referrerId }, 'Referrer not found in DB');
            return;
          }

          await trx('users')
            .where({ telegram_id: user.telegram_id })
            .update({ referred_by: referrerId });

          await trx('users')
            .where({ telegram_id: referrerId })
            .increment('referral_count', 1);

          await trx('referrals').insert({
            referrer_id: referrerId,
            referred_id: user.telegram_id,
            bonus_paid: false,
          });

          // Bonus bienvenue pour le filleul
          await trx('users')
            .where({ telegram_id: user.telegram_id })
            .increment('coin_balance', 500);

          await trx('transactions').insert({
            user_id: user.telegram_id,
            type: 'referral_welcome',
            currency: 'coin',
            amount: 500,
            related_entity_type: 'referral',
            related_entity_id: referrerId,
          });

          logger.info({ referrerId, newUser: user.telegram_id }, 'Referral processed OK');
        });
      } catch (err) {
        logger.error({ err }, 'Referral transaction failed');
      }
    }
  }

  // 6. Retourner l'etat complet
  const progress = await getUserProgress(user.telegram_id);
  const passiveIncome = await getPassiveIncomePerHour(user.telegram_id);

  return c.json({
    user: {
      ...user,
      passiveIncomePerHour: passiveIncome,
    },
    ...progress,
  });
});

export default auth;
