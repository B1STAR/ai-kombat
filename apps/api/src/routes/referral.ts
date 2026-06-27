/**
 * Referral routes: /api/referral/*
 * GET /api/referral/link  - Get user's unique referral link
 * GET /api/referral/list  - Get list of users referred by this user
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { db } from '../db/knex';
import { env } from '../lib/env';

const referral = new Hono();

referral.get('/link', authMiddleware, async (c) => {
  const user = c.get('telegramUser');

  // IMPORTANT: Telegram deep-link format requires the exact bot username
  // (case-insensitive but must exist). Our bot is @ai_kombatbot.
  // The ?start= payload is passed to the bot when the user opens it.
  const link = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=ref_${user.id}`;

  return c.json({
    link,
    code: `ref_${user.id}`,
    shareText: `🤖 Rejoins-moi sur AI Kombat et entraîne ton IA au combat !\n👉 ${link}`,
  });
});

referral.get('/list', authMiddleware, async (c) => {
  const user = c.get('telegramUser');

  const list = await db('referrals')
    .where({ referrer_id: user.id })
    .join('users', 'users.telegram_id', 'referrals.referred_id')
    .select(
      'users.telegram_id',
      'users.first_name',
      'users.username',
      'users.photo_url',
      'referrals.created_at',
      'referrals.bonus_paid',
      'referrals.bonus_paid_at',
    );

  // Count earnings from referral bonuses in transactions table
  const earningsRow = await db('transactions')
    .where({ user_id: user.id, type: 'referral_bonus' })
    .sum('amount as total')
    .first();

  const totalEarned = Number(earningsRow?.total ?? 0);

  return c.json({
    count: list.length,
    totalEarned,
    referrals: list.map((r: any) => ({
      telegramId: r.telegram_id,
      firstName: r.first_name,
      username: r.username,
      photoUrl: r.photo_url,
      joinedAt: r.created_at,
      bonusPaid: r.bonus_paid,
      bonusPaidAt: r.bonus_paid_at,
    })),
  });
});

export default referral;
