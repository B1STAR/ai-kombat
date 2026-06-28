/**
 * Tap routes: /api/tap/*
 * POST /api/tap - Validate a batch of taps
 * Energy max desormais 1000 (au lieu de 1500).
 * Cote frontend le drain est x2.5 mais l'API recoit toujours des batches de 1..60 taps.
 * On s'assure que l'energie ne passe pas sous 0.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rateLimit';
import { detectSuspiciousPattern, logTapEvent } from '../middlewares/antiCheat';
import { db } from '../db/knex';
import { addCoins, calculateValidEnergy, getUserByTelegramId, normalizeUser } from '../services/user.service';
import { addXp, getPassiveIncomePerHour } from '../services/economy.service';
import { logger } from '../lib/logger';

const tap = new Hono();

const tapSchema = z.object({
  count: z.number().int().min(1).max(60),
  clientTimestamp: z.string(),
  durationMs: z.number().optional(),
});

tap.post(
  '/',
  authMiddleware,
  rateLimit('tap'),
  zValidator('json', tapSchema),
  async (c) => {
    const user = c.get('telegramUser');
    const rawDbUser = c.get('dbUser');
    const { count, clientTimestamp, durationMs } = c.req.valid('json');

    if (!rawDbUser) return c.json({ error: 'User not found' }, 404);
    const dbUser = normalizeUser(rawDbUser);

    // 1. Valider l'energie (max 1000 desormais)
    const currentEnergy = calculateValidEnergy(dbUser);
    if (currentEnergy < 1) {
      return c.json({
        error: 'Insufficient energy',
        energy: currentEnergy,
        maxEnergy: dbUser.max_energy,
      }, 400);
    }

    // On depense min(count, energie disponible) pour eviter le sous-zero
    const energyToSpend = Math.min(count, Math.floor(currentEnergy));

    // 2. Multiplicateur selon revenu passif
    const passiveIncome = await getPassiveIncomePerHour(user.id);
    const multiplier = 1 + Math.floor(passiveIncome / 1000) * 0.1;

    // 3. Recompenses
    const coinsEarned = Math.floor(energyToSpend * multiplier);
    const xpGained = energyToSpend;

    // 4. Anti-cheat
    const { suspicious, reason } = await detectSuspiciousPattern(user.id, {
      count, clientTimestamp, durationMs,
    });

    // 5. Log
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    await logTapEvent(user.id, { count, clientTimestamp, durationMs }, ip, userAgent, suspicious);

    const finalCoins = suspicious ? 0 : coinsEarned;

    // 6. Mettre a jour l'energie (ne descend jamais sous 0)
    const newEnergy = Math.max(0, currentEnergy - energyToSpend);
    await db('users')
      .where({ telegram_id: user.id })
      .update({ energy: newEnergy, last_energy_update: new Date() })
      .increment('total_taps', energyToSpend);

    if (finalCoins > 0) await addCoins(user.id, finalCoins, 'tap_earn');

    // 7. XP + level up
    const { leveledUp, newLevel } = await addXp(user.id, xpGained);

    // 8. Retour
    const updated = await getUserByTelegramId(user.id);
    if (!updated) return c.json({ error: 'User disappeared' }, 500);

    return c.json({
      coinsEarned: finalCoins,
      xpGained,
      energySpent: energyToSpend,
      newEnergy: updated.energy,
      newBalance: updated.coin_balance,
      aiLevelUp: leveledUp,
      newAiLevel: newLevel,
      suspicious,
    });
  },
);

export default tap;
