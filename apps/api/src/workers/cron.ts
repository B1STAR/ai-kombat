/**
 * Cron jobs (background workers).
 * Passive income : credite aussi 10% au parrain de chaque filleul actif.
 */
import { db } from '../db/knex';
import { logger } from '../lib/logger';

// ============================================
// ENERGY REGEN: every 10 seconds
// ============================================
const energyRegen = async () => {
  try {
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
// Credite le filleul puis 10% au parrain.
// ============================================
const passiveIncome = async () => {
  try {
    const users = await db('users')
      .where('last_active_at', '>', db.raw("NOW() - INTERVAL '7 days'"))
      .select('telegram_id', 'referred_by');

    for (const user of users) {
      const result = await db('user_modules')
        .where('user_modules.user_id', user.telegram_id)
        .join('ai_modules', 'ai_modules.id', 'user_modules.module_id')
        .select(db.raw('SUM(ai_modules.coins_per_hour_bonus * user_modules.level) as hourly'))
        .first();

      const hourly = Number(result?.hourly || 0);
      if (hourly <= 0) continue;

      const perMinute = Math.floor(hourly / 60);
      if (perMinute <= 0) continue;

      // Crediter le filleul
      await db('users')
        .where({ telegram_id: user.telegram_id })
        .increment('coin_balance', perMinute)
        .increment('total_earned_coins', perMinute);

      // Commission 10% au parrain si existe
      const referrerId = user.referred_by ? Number(user.referred_by) : null;
      if (referrerId) {
        const commission = Math.floor(perMinute * 0.1);
        if (commission > 0) {
          try {
            await db('users')
              .where({ telegram_id: referrerId })
              .increment('coin_balance', commission)
              .increment('total_earned_coins', commission);

            const referrer = await db('users').where({ telegram_id: referrerId }).first('coin_balance');
            await db('transactions').insert({
              user_id: referrerId,
              type: 'referral_commission',
              currency: 'coin',
              amount: commission,
              balance_after: Number(referrer?.coin_balance ?? commission),
              related_entity_type: 'referral',
              related_entity_id: user.telegram_id,
            });
          } catch (err) {
            logger.debug({ err, referrerId }, 'Passive commission failed silently');
          }
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
    await db('user_quests')
      .where('is_completed', true)
      .where('completed_at', '<', db.raw('CURRENT_DATE'))
      .delete();

    await db.raw(`
      UPDATE users SET daily_streak = daily_streak + 1
      WHERE last_active_at > NOW() - INTERVAL '36 hours'
        AND last_active_at < NOW() - INTERVAL '24 hours'
    `);

    await db.raw(`
      UPDATE users SET daily_streak = 0
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
  setInterval(energyRegen, 10_000);
  setInterval(passiveIncome, 60_000);
  setInterval(dailyReset, 24 * 60 * 60 * 1000);

  energyRegen();
  passiveIncome();

  logger.info('\u2705 Cron jobs started');
};
