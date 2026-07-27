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

  // Total des bonus d'invitation
  const bonusRow = await db('transactions')
    .where({ user_id: user.id, type: 'referral_bonus' })
    .sum('amount as total')
    .first();

  // Total des commissions 10% passives
  const commissionRow = await db('transactions')
    .where({ user_id: user.id, type: 'referral_commission' })
    .sum('amount as total')
    .first();

  // Commissions 10% cumulées par filleul — FIX: db.raw pour JSON PostgreSQL
  const commissionsByReferree = await db('transactions')
    .where({ user_id: user.id, type: 'referral_commission' })
    .select(db.raw("metadata->>'referree_id' as referree_id"))
    .sum('amount as total')
    .groupBy(db.raw("metadata->>'referree_id'"));

  const commissionMap: Record<string, number> = {};
  for (const row of commissionsByReferree) {
    if (row.referree_id) {
      commissionMap[String(row.referree_id)] = Number(row.total ?? 0);
    }
  }

  const totalBonusEarned = Number(bonusRow?.total ?? 0);
  const totalCommissionEarned = Number(commissionRow?.total ?? 0);

  return c.json({
    count: list.length,
    totalBonusEarned,
    totalCommissionEarned,
    totalEarned: totalBonusEarned + totalCommissionEarned,
    referrals: list.map((r: any) => ({
      telegramId: r.telegram_id,
      firstName: r.first_name,
      username: r.username,
      photoUrl: r.photo_url,
      joinedAt: r.created_at,
      bonusPaid: r.bonus_paid,
      bonusPaidAt: r.bonus_paid_at,
      commissionEarned: commissionMap[String(r.telegram_id)] ?? 0,
    })),
  });
});

export default referral;
