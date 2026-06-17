/**
 * Ad routes: /api/ads/*
 * POST /api/ads/reward - Credit user for watching a rewarded ad (Phase 2+)
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { db } from '../db/knex';

const ads = new Hono();

const rewardSchema = z.object({
  adId: z.string(),
  adType: z.enum(['adsgram', 'telegram_ads']),
});

ads.post(
  '/reward',
  authMiddleware,
  rateLimit('ad'),
  zValidator('json', rewardSchema),
  async (c) => {
    const user = c.get('telegramUser');
    const { adId, adType } = c.req.valid('json');
    
    // Check we haven't already rewarded this ad recently
    const recent = await db('ad_views')
      .where({ user_id: user.id, ad_id: adId, ad_type: adType })
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '24 hours'"))
      .first();
    
    if (recent) {
      return c.json({ error: 'Ad already viewed in last 24h' }, 400);
    }
    
    // Log the view
    await db('ad_views').insert({
      user_id: user.id,
      ad_id: adId,
      ad_type: adType,
      reward_coins: 100,
      revenue_usd: 0.01, // estimated
    });
    
    // Credit coins
    await db('users')
      .where({ telegram_id: user.id })
      .increment('coin_balance', 100);
    
    await db('transactions').insert({
      user_id: user.id,
      type: 'ad_reward',
      currency: 'coin',
      amount: 100,
    });
    
    return c.json({ success: true, coinsEarned: 100 });
  },
);

export default ads;
