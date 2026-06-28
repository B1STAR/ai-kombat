/**
 * Economy service: handles coins/gems balance, energy regen, AI leveling.
 */
import { db } from '../db/knex';
import { addCoins, spendCoins, getUserByTelegramId, calculateValidEnergy, normalizeUser, type User } from './user.service';

// ============================================
// LEVEL CURVE
// ============================================
const xpPerLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level));
};

const aiTypeForLevel = (level: number): string => {
  if (level < 5) return 'novice';
  if (level < 10) return 'apprentice';
  if (level < 20) return 'initiate';
  if (level < 30) return 'confirmed';
  if (level < 40) return 'expert';
  if (level < 50) return 'master';
  if (level < 70) return 'legend';
  if (level < 100) return 'transcendent';
  return 'agi';
};

export const addXp = async (userId: number, xpGained: number): Promise<{ leveledUp: boolean; newLevel: number; }> => {
  const user = await getUserByTelegramId(userId);
  if (!user) throw new Error('User not found');
  
  const newXp = Number(user.ai_xp) + xpGained;
  let newLevel = Number(user.ai_level);
  let leveledUp = false;
  
  while (newXp >= xpPerLevel(newLevel + 1) && newLevel < 100) {
    newLevel++;
    leveledUp = true;
  }
  
  await db('users')
    .where({ telegram_id: userId })
    .update({
      ai_xp: newXp,
      ai_level: newLevel,
      ai_type: aiTypeForLevel(newLevel),
    });
  
  return { leveledUp, newLevel };
};

// ============================================
// MODULES
// ============================================
const AI_TRAINING_MODULE_CODE = 'ai_training';

export const buyModule = async (userId: number, moduleId: number): Promise<User & { aiLevelUp?: boolean; newAiLevel?: number }> => {
  return await db.transaction(async (trx) => {
    const moduleData = await trx('ai_modules').where({ id: moduleId }).first();
    if (!moduleData) throw new Error('Module not found');
    if (!moduleData.is_active) throw new Error('Module not available');
    
    const rawUser = await trx('users').where({ telegram_id: userId }).forUpdate().first();
    if (!rawUser) throw new Error('User not found');
    // Cast BIGINT -> Number pour eviter les faux 'Insufficient coins'
    const user = normalizeUser(rawUser);
    
    // Check level requirement
    if (user.ai_level < Number(moduleData.min_ai_level)) {
      throw new Error(`AI level ${moduleData.min_ai_level} required`);
    }
    
    const existing = await trx('user_modules')
      .where({ user_id: userId, module_id: moduleId })
      .first();
    
    let cost: number;
    let newLevel: number;
    
    if (existing) {
      newLevel = Number(existing.level) + 1;
      if (newLevel > Number(moduleData.max_level)) throw new Error('Module max level reached');
      cost = Math.floor(Number(moduleData.base_cost) * Math.pow(Number(moduleData.cost_multiplier), newLevel - 1));
      
      if (user.coin_balance < cost) throw new Error('Insufficient coins');
      
      await trx('user_modules')
        .where({ user_id: userId, module_id: moduleId })
        .update({ level: newLevel });
    } else {
      newLevel = 1;
      cost = Number(moduleData.base_cost);
      
      if (user.coin_balance < cost) throw new Error('Insufficient coins');
      
      if (moduleData.required_module_code) {
        const required = await trx('ai_modules').where({ code: moduleData.required_module_code }).first();
        if (required) {
          const hasRequired = await trx('user_modules').where({ user_id: userId, module_id: required.id }).first();
          if (!hasRequired) throw new Error(`Requires ${moduleData.required_module_code} first`);
        }
      }
      
      await trx('user_modules').insert({ user_id: userId, module_id: moduleId, level: 1 });
    }
    
    await trx('users')
      .where({ telegram_id: userId })
      .decrement('coin_balance', cost);
    
    await trx('transactions').insert({
      user_id: userId,
      type: 'module_buy',
      currency: 'coin',
      amount: -cost,
      balance_after: user.coin_balance - cost,
      related_entity_type: 'module',
      related_entity_id: moduleId,
    });
    
    // MODULE SPECIAL : Entrainement IA -> +1 AI level
    let aiLevelUp = false;
    let newAiLevel = user.ai_level;
    
    if (moduleData.code === AI_TRAINING_MODULE_CODE) {
      newAiLevel = Math.min(user.ai_level + 1, 100);
      await trx('users')
        .where({ telegram_id: userId })
        .update({
          ai_level: newAiLevel,
          ai_type: aiTypeForLevel(newAiLevel),
        });
      aiLevelUp = true;
    }
    
    const updatedRaw = await trx('users').where({ telegram_id: userId }).first();
    const updated = normalizeUser(updatedRaw);
    return { ...updated, aiLevelUp, newAiLevel };
  });
};

export const getPassiveIncomePerHour = async (userId: number): Promise<number> => {
  const result = await db('user_modules')
    .where({ user_id: userId })
    .join('ai_modules', 'ai_modules.id', 'user_modules.module_id')
    .sum(db.raw('ai_modules.coins_per_hour_bonus * user_modules.level') as any)
    .first();
  
  return Number((result as any)?.sum || 0);
};
