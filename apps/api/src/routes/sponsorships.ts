/**
 * Sponsorship routes: /api/sponsorships/*
 * GET /api/sponsorships/active - Get active sponsored quests
 * POST /api/sponsorships/:id/complete - Complete a sponsored quest
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth';
import { db } from '../db/knex';

const sponsorships = new Hono();

sponsorships.get('/active', authMiddleware, async (c) => {
  const sponsorships = await db('sponsorships')
    .where({ is_active: true })
    .where('starts_at', '<=', new Date())
    .where('ends_at', '>=', new Date())
    .where(function() {
      this.whereNull('max_completions').orWhere('current_completions', '<', db.raw('max_completions'));
    });
  
  return c.json({ sponsorships });
});

sponsorships.post('/:id/complete', authMiddleware, async (c) => {
  const user = c.get('telegramUser');
  const id = parseInt(c.req.param('id'), 10);
  
  const sponsorship = await db('sponsorships').where({ id, is_active: true }).first();
  if (!sponsorship) return c.json({ error: 'Sponsorship not found' }, 404);
  
  // TODO: verify the user actually subscribed to the channel
  // Use Telegram Bot API: bot.getChatMember(channelId, userId)
  // For now, we trust the client (Phase 2 will add real verification)
  
  // Credit coins
  if (sponsorship.reward_coins > 0) {
    await db('users')
      .where({ telegram_id: user.id })
      .increment('coin_balance', sponsorship.reward_coins);
    
    await db('transactions').insert({
      user_id: user.id,
      type: 'sponsorship_reward',
      currency: 'coin',
      amount: sponsorship.reward_coins,
      related_entity_type: 'sponsorship',
      related_entity_id: id,
    });
  }
  
  // Increment completion count
  await db('sponsorships')
    .where({ id })
    .increment('current_completions', 1);
  
  return c.json({ success: true, coinsEarned: sponsorship.reward_coins });
});

export default sponsorships;
