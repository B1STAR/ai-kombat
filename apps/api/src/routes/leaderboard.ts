/**
 * Leaderboard routes: /api/leaderboard/*
 * GET /api/leaderboard/global - Top players worldwide
 * GET /api/leaderboard/friends - Top friends (TODO: needs friend system)
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { db } from '../db/knex';

const leaderboard = new Hono();

leaderboard.get('/global', authMiddleware, async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '100'), 1000);
  
  const top = await db('users')
    .where({ is_banned: false })
    .orderBy('coin_balance', 'desc')
    .limit(limit)
    .select('telegram_id', 'first_name', 'username', 'photo_url', 'coin_balance', 'ai_level');
  
  // Get the current user's rank
  const user = c.get('telegramUser');
  const myRankRow = await db('users')
    .where('coin_balance', '>', db('users').where({ telegram_id: user.id }).select('coin_balance'))
    .count('* as rank')
    .first();
  
  const myRank = Number(myRankRow?.rank || 0) + 1;
  
  return c.json({
    users: top.map((u: any, idx: number) => ({
      rank: idx + 1,
      telegramId: u.telegram_id,
      firstName: u.first_name,
      username: u.username,
      photoUrl: u.photo_url,
      coinBalance: u.coin_balance,
      aiLevel: u.ai_level,
    })),
    myRank,
  });
});

export default leaderboard;
