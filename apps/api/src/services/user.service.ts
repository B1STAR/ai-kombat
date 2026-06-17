/**
 * User service: business logic for user creation, balance updates, etc.
 */
import { db } from '../db/knex';
import type { InitDataParsed } from '@telegram-apps/init-data-node';

export interface User {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  language_code: string;
  is_premium: boolean;
  coin_balance: number;
  gem_balance: number;
  energy: number;
  max_energy: number;
  last_energy_update: string;
  ai_name: string;
  ai_level: number;
  ai_xp: number;
  ai_type: string;
  total_taps: number;
  total_earned_coins: number;
  last_active_at: string;
  referred_by: number | null;
  referral_count: number;
  daily_streak: number;
  last_daily_claim: string | null;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
  ban_reason: string | null;
}

export const upsertUser = async (parsed: InitDataParsed): Promise<User> => {
  if (!parsed.user) throw new Error('No user in initData');
  
  const [user] = await db<User>('users')
    .insert({
      telegram_id: parsed.user.id,
      first_name: parsed.user.firstName,
      last_name: parsed.user.lastName || null,
      username: parsed.user.username || null,
      photo_url: parsed.user.photoUrl || null,
      language_code: parsed.user.languageCode || 'en',
      is_premium: parsed.user.isPremium || false,
      last_active_at: db.fn.now(),
    })
    .onConflict('telegram_id')
    .merge(['first_name', 'last_name', 'username', 'photo_url', 'is_premium', 'language_code', 'last_active_at'])
    .returning('*');
  
  return user;
};

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const user = await db<User>('users').where({ telegram_id: telegramId }).first();
  return user || null;
};

export const calculateValidEnergy = (user: User, now: Date = new Date()): number => {
  const lastUpdate = new Date(user.last_energy_update);
  const secondsPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
  const regenPerSecond = 1; // 1 energy / sec (configurable)
  const newEnergy = user.energy + (secondsPassed * regenPerSecond);
  return Math.min(newEnergy, user.max_energy);
};

export const addCoins = async (userId: number, amount: number, type: string, relatedEntity?: { type: string; id: number }): Promise<number> => {
  const [updated] = await db<User>('users')
    .where({ telegram_id: userId })
    .increment('coin_balance', amount)
    .increment('total_earned_coins', amount > 0 ? amount : 0)
    .returning('coin_balance');
  
  await db('transactions').insert({
    user_id: userId,
    type,
    currency: 'coin',
    amount,
    balance_after: updated.coin_balance,
    related_entity_type: relatedEntity?.type || null,
    related_entity_id: relatedEntity?.id || null,
  });
  
  return updated.coin_balance;
};

export const spendCoins = async (userId: number, amount: number, type: string, relatedEntity?: { type: string; id: number }): Promise<number> => {
  const user = await getUserByTelegramId(userId);
  if (!user) throw new Error('User not found');
  if (user.coin_balance < amount) throw new Error('Insufficient coins');
  
  const [updated] = await db<User>('users')
    .where({ telegram_id: userId })
    .decrement('coin_balance', amount)
    .returning('coin_balance');
  
  await db('transactions').insert({
    user_id: userId,
    type,
    currency: 'coin',
    amount: -amount,
    balance_after: updated.coin_balance,
    related_entity_type: relatedEntity?.type || null,
    related_entity_id: relatedEntity?.id || null,
  });
  
  return updated.coin_balance;
};

export const getUserProgress = async (userId: number) => {
  // Get active quests
  const activeQuests = await db('user_quests')
    .where({ user_id: userId, is_completed: false })
    .join('quests', 'quests.id', 'user_quests.quest_id')
    .select('user_quests.*', 'quests.name', 'quests.description', 'quests.reward_coins', 'quests.target_count');
  
  // Get owned modules
  const ownedModules = await db('user_modules')
    .where({ user_id: userId })
    .join('ai_modules', 'ai_modules.id', 'user_modules.module_id')
    .select('user_modules.*', 'ai_modules.code', 'ai_modules.name', 'ai_modules.coins_per_hour_bonus');
  
  // Get achievements
  const achievements = await db('user_achievements')
    .where({ user_id: userId })
    .join('achievements', 'achievements.id', 'user_achievements.achievement_id')
    .select('user_achievements.*', 'achievements.name', 'achievements.icon_url');
  
  return { activeQuests, ownedModules, achievements };
};
