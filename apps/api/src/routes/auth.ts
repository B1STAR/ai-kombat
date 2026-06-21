/**
 * Auth routes: /api/auth/*
 * POST /api/auth/init - Initialize session, upsert user, return full state
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { validate, parse } from '@telegram-apps/init-data-node';
import { env } from '../lib/env';
import { db } from '../db/knex';
import { upsertUser, getUserProgress } from '../services/user.service';
import { getPassiveIncomePerHour } from '../services/economy.service';

const auth = new Hono();

const initSchema = z.object({
  initData: z.string(),
  // Optional: referral code from URL (e.g., ?start=ref_123456)
  referralCode: z.string().optional(),
});

auth.post('/init', zValidator('json', initSchema), async (c) => {
  const { initData, referralCode } = c.req.valid('json');

  // 1. Validate HMAC signature — returns 401 on invalid/expired data
  try {
    validate(initData, env.TELEGRAM_BOT_TOKEN, { expiresIn: 0 });
  } catch (err: any) {
    return c.json({ error: err?.message ?? 'Invalid initData' }, 401);
  }

  // 2. Parse user data
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(initData);
  } catch (err: any) {
    return c.json({ error: 'Failed to parse initData' }, 400);
  }

  if (!parsed.user) {
    return c.json({ error: 'No user in initData' }, 400);
  }

  // 3. Upsert user
  const user = await upsertUser(parsed);

  // 4. Handle referral (first time only)
  if (referralCode && !user.referred_by) {
    const match = referralCode.match(/^ref_(\d+)$/);
    if (match) {
      const referrerId = parseInt(match[1], 10);
      if (referrerId !== user.telegram_id) {
        try {
          await db.transaction(async (trx) => {
            // Check referrer exists
            const referrer = await trx('users').where({ telegram_id: referrerId }).first();
            if (!referrer) return;

            // Update user's referred_by
            await trx('users')
              .where({ telegram_id: user.telegram_id })
              .update({ referred_by: referrerId });

            // Increment referrer's count
            await trx('users')
              .where({ telegram_id: referrerId })
              .increment('referral_count', 1);

            // Log referral
            await trx('referrals').insert({
              referrer_id: referrerId,
              referred_id: user.telegram_id,
              bonus_paid: false,
            });

            // Credit welcome bonus to new user
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
          });
        } catch (err) {
          // Ignore referral errors (don't fail the init)
          console.warn('Referral processing failed:', err);
        }
      }
    }
  }

  // 5. Get user progress
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
