/**
 * Quest routes: /api/quests/*
 * GET /api/quests/active - Get user's active quests
 * POST /api/quests/claim - Claim a quest reward
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { db } from '../db/knex';
import { addCoins } from '../services/user.service';
import { addXp } from '../services/economy.service';
import { logger } from '../lib/logger';

const quests = new Hono();

quests.get('/active', authMiddleware, async (c) => {
  const user = c.get('telegramUser');
  
  const active = await db('user_quests')
    .where({ user_id: user.id, is_completed: false })
    .join('quests', 'quests.id', 'user_quests.quest_id')
    .select(
      'user_quests.id as user_quest_id',
      'user_quests.progress',
      'quests.id as quest_id',
      'quests.code',
      'quests.name',
      'quests.description',
      'quests.type',
      'quests.target_count',
      'quests.target_action',
      'quests.reward_coins',
      'quests.reward_gems',
      'quests.reward_xp',
    );
  
  return c.json({ quests: active });
});

quests.post(
  '/claim',
  authMiddleware,
  rateLimit('quest'),
  zValidator('json', z.object({ userQuestId: z.number().int().positive() })),
  async (c) => {
    const user = c.get('telegramUser');
    const { userQuestId } = c.req.valid('json');
    
    return await db.transaction(async (trx) => {
      const userQuest = await trx('user_quests')
        .where({ id: userQuestId, user_id: user.id })
        .forUpdate()
        .first();
      
      if (!userQuest) throw new Error('Quest not found');
      if (userQuest.is_completed) throw new Error('Quest already claimed');
      if (userQuest.progress < 0) throw new Error('Quest not yet completed');
      
      const quest = await trx('quests').where({ id: userQuest.quest_id }).first();
      if (!quest) throw new Error('Quest config missing');
      
      // Mark as completed
      await trx('user_quests')
        .where({ id: userQuestId })
        .update({ is_completed: true, completed_at: new Date() });
      
      // Credit rewards
      if (quest.reward_coins > 0) {
        await trx('users')
          .where({ telegram_id: user.id })
          .increment('coin_balance', quest.reward_coins);
        await trx('transactions').insert({
          user_id: user.id,
          type: 'quest_reward',
          currency: 'coin',
          amount: quest.reward_coins,
          related_entity_type: 'quest',
          related_entity_id: quest.id,
        });
      }
      
      if (quest.reward_gems > 0) {
        await trx('users')
          .where({ telegram_id: user.id })
          .increment('gem_balance', quest.reward_gems);
      }
      
      if (quest.reward_xp > 0) {
        // Note: this happens in a trx, but addXp uses its own connection
        // For simplicity, do it inline here
        const u = await trx('users').where({ telegram_id: user.id }).first();
        if (u) {
          const newXp = u.ai_xp + quest.reward_xp;
          let newLevel = u.ai_level;
          while (newXp >= Math.floor(100 * Math.pow(1.5, newLevel + 1)) && newLevel < 100) {
            newLevel++;
          }
          await trx('users').where({ telegram_id: user.id }).update({
            ai_xp: newXp,
            ai_level: newLevel,
          });
        }
      }
      
      return c.json({
        success: true,
        rewards: {
          coins: quest.reward_coins,
          gems: quest.reward_gems,
          xp: quest.reward_xp,
        },
      });
    });
  },
);

export default quests;
