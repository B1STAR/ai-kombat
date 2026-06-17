/**
 * Tap routes: /api/tap/*
 * POST /api/tap - Validate a batch of taps
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { detectSuspiciousPattern, logTapEvent } from '../middlewares/antiCheat';
import { db } from '../db/knex';
import { addCoins, calculateValidEnergy, getUserByTelegramId } from '../services/user.service';
import { addXp } from '../services/economy.service';
import { getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const tap = new Hono();

const tapSchema = z.object({
  count: z.number().int().min(1).max(60),
  clientTimestamp: z.string(), // ISO 8601
  durationMs: z.number().optional(),
});

tap.post(
  '/',
  authMiddleware,
  rateLimit('tap'),
  zValidator('json', tapSchema),
  async (c) => {
    const user = c.get('telegramUser');
    const dbUser = c.get('dbUser');
    const { count, clientTimestamp, durationMs } = c.req.valid('json');
    
    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 1. Validate energy
    const currentEnergy = calculateValidEnergy(dbUser);
    if (currentEnergy < count) {
      return c.json({ 
        error: 'Insufficient energy',
        energy: currentEnergy,
        maxEnergy: dbUser.max_energy,
      }, 400);
    }
    
    // 2. Calculate multiplier from modules
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier = 1 + Math.floor(passiveIncome / 1000) * 0.1; // +10% per 1000/h
    
    // 3. Calculate rewards
    const baseCoins = count * 1; // 1 coin per tap
    const coinsEarned = Math.floor(baseCoins * multiplier);
    const xpGained = count; // 1 XP per tap
    
    // 4. Anti-cheat: detect suspicious patterns
    const { suspicious, reason } = await detectSuspiciousPattern(user.id, {
      count, clientTimestamp, durationMs,
    });
    
    // 5. Log the tap event
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, ip, userAgent, suspicious);
    
    // 6. If suspicious, don't credit coins (or credit partial)
    const finalCoins = suspicious ? 0 : coinsEarned;
    
    // 7. Update user state
    await db('users')
      .where({ telegram_id: user.id })
      .update({
        energy: dbUser.energy - count,
        last_energy_update: new Date(),
      })
      .increment('total_taps', count);
    
    if (finalCoins > 0) {
      await addCoins(user.id, finalCoins, 'tap_earn');
    }
    
    // 8. Add XP and check level up
    const { leveledUp, newLevel } = await addXp(user.id, xpGained);
    
    // 9. Re-fetch user for response
    const updated = await getUserByTelegramId(user.id);
    if (!updated) {
      return c.json({ error: 'User disappeared' }, 500);
    }
    
    return c.json({
      coinsEarned: finalCoins,
      xpGained,
      energySpent: count,
      newEnergy: updated.energy,
      newBalance: updated.coin_balance,
      aiLevelUp: leveledUp,
      newAiLevel: newLevel,
      suspicious,
    });
  },
);

export default tap;
