/**
 * AI routes: /api/ai/*
 * GET /api/ai - Get AI state
 * POST /api/ai/rename - Rename the AI
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { db } from '../db/knex';

const ai = new Hono();

ai.get('/', authMiddleware, async (c) => {
  const user = c.get('dbUser');
  if (!user) return c.json({ error: 'User not found' }, 404);
  
  // XP to next level
  const xpToNextLevel = Math.floor(100 * Math.pow(1.5, user.ai_level + 1));
  
  return c.json({
    aiName: user.ai_name,
    aiLevel: user.ai_level,
    aiXp: user.ai_xp,
    aiXpToNextLevel: xpToNextLevel,
    aiType: user.ai_type,
    avatarUrl: `/avatars/level-${user.ai_level}.svg`, // Front will handle missing files
  });
});

ai.post('/rename', authMiddleware, zValidator('json', z.object({
  name: z.string().min(1).max(50),
})), async (c) => {
  const user = c.get('telegramUser');
  const { name } = c.req.valid('json');
  
  await db('users')
    .where({ telegram_id: user.id })
    .update({ ai_name: name });
  
  return c.json({ success: true, aiName: name });
});

export default ai;
