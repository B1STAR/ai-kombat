/**
 * Cron jobs (background workers).
 * Runs in the same process as the API (Phase 1-2).
 * For Phase 3+, can be moved to a separate worker process.
 */
import { db } from '../db/knex';
import { logger } from '../lib/logger';

// ============================================
// ENERGY REGEN: every 10 seconds
// ============================================
const energyRegen = async () => {
  try {
    // Get all users who need energy regen
    const result = await db.raw(`
      UPDATE users
      SET 
        energy = LEAST(
          energy + (EXTRACT(EPOCH FROM (NOW() - last_energy_update)) * 1)::INTEGER,
          max_energy
        ),
        last_energy_update = NOW()
      WHERE 
        energy < max_energy
        AND last_active_at > NOW() - INTERVAL '7 days'
    `);
    
    if (result.rowCount > 0) {
      logger.debug({ count: result.rowCount }, 'Energy regen');
    }
  } catch (err) {
    logger.error({ err }, 'Energy regen failed');
  }
};

// ============================================
// PASSIVE INCOME: every minute
// ============================================
const passiveIncome = async () => {
  try {
    // Calculate passive income per user
    const users = await db('users')
      .where('last_active_at', '>', db.raw("NOW() - INTERVAL '7 days'"))
      .select('telegram_id');
    
    for (const user of users) {
      // Use db.raw for the arithmetic expression to avoid Knex misinterpreting
      // 'ai_modules.coins_per_hour_bonus * user_modules.level' as a table identifier
      const result = await db('user_modules')
        .where('user_modules.user_id', user.telegram_id)
        .join('ai_modules', 'ai_modules.id', 'user_modules.module_id')
        .select(db.raw('SUM(ai_modules.coins_per_hour_bonus * user_modules.level) as hourly'))
        .first();
      
      const hourly = Number(result?.hourly || 0);
      if (hourly > 0) {
        const perMinute = Math.floor(hourly / 60);
        if (perMinute > 0) {
          await db('users')
            .where({ telegram_id: user.telegram_id })
            .increment('coin_balance', perMinute)
            .increment('total_earned_coins', perMinute);
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Passive income failed');
  }
};

// ============================================
// DAILY RESET: every day at 00:00 UTC
// ============================================
const dailyReset = async () => {
  try {
    // Reset daily quests
    await db('user_quests')
      .where('is_completed', true)
      .where('completed_at', '<', db.raw("CURRENT_DATE"))
      .delete();
    
    // Update streaks
    await db.raw(`
      UPDATE users
      SET daily_streak = daily_streak + 1
      WHERE last_active_at > NOW() - INTERVAL '36 hours'
        AND last_active_at < NOW() - INTERVAL '24 hours'
    `);
    
    await db.raw(`
      UPDATE users
      SET daily_streak = 0
      WHERE last_active_at < NOW() - INTERVAL '48 hours'
    `);
    
    logger.info('Daily reset completed');
  } catch (err) {
    logger.error({ err }, 'Daily reset failed');
  }
};

// ============================================
// START ALL CRONS
// ============================================
export const startCrons = () => {
  // Energy regen every 10s
  setInterval(energyRegen, 10_000);
  
  // Passive income every 60s
  setInterval(passiveIncome, 60_000);
  
  // Daily reset every 24h
  setInterval(dailyReset, 24 * 60 * 60 * 1000);
  
  // Run once on startup
  energyRegen();
  passiveIncome();
  
  logger.info('✅ Cron jobs started');
};
