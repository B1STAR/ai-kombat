/**
 * Module routes: /api/modules/*
 * GET /api/modules - List all available modules + ownership status
 * POST /api/modules/buy - Buy or upgrade a module
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { db } from '../db/knex';
import { buyModule } from '../services/economy.service';

const modules = new Hono();

modules.get('/', authMiddleware, async (c) => {
  const user = c.get('telegramUser');
  const dbUser = c.get('dbUser');
  if (!dbUser) return c.json({ error: 'User not found' }, 404);
  
  // Get all active modules
  const allModules = await db('ai_modules')
    .where({ is_active: true })
    .orderBy('display_order', 'asc');
  
  // Get user's owned modules
  const owned = await db('user_modules')
    .where({ user_id: user.id })
    .select('module_id', 'level');
  
  const ownedMap = new Map(owned.map((m: any) => [m.module_id, m.level]));
  
  const result = allModules.map((m: any) => {
    const userLevel = ownedMap.get(m.id) || 0;
    const nextLevelCost = userLevel > 0
      ? Math.floor(m.base_cost * Math.pow(m.cost_multiplier, userLevel))
      : m.base_cost;
    
    return {
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description,
      category: m.category,
      iconUrl: m.icon_url,
      baseCost: m.base_cost,
      costMultiplier: m.cost_multiplier,
      maxLevel: m.max_level,
      coinsPerHourBonus: m.coins_per_hour_bonus,
      minAiLevel: m.min_ai_level,
      requiredModuleCode: m.required_module_code,
      rarity: m.rarity,
      currentLevel: userLevel,
      isOwned: userLevel > 0,
      nextLevelCost: userLevel < m.max_level ? nextLevelCost : null,
      isMaxLevel: userLevel >= m.max_level,
    };
  });
  
  return c.json({ modules: result });
});

modules.post(
  '/buy',
  authMiddleware,
  zValidator('json', z.object({ moduleId: z.number().int().positive() })),
  async (c) => {
    const user = c.get('telegramUser');
    const { moduleId } = c.req.valid('json');
    
    try {
      const updated = await buyModule(user.id, moduleId);
      return c.json({
        success: true,
        newBalance: updated.coin_balance,
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 400);
    }
  },
);

export default modules;
