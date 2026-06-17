/**
 * Shared types between front and back.
 */

export type AiType = 
  | 'novice' 
  | 'apprentice' 
  | 'initiate' 
  | 'confirmed' 
  | 'expert' 
  | 'master' 
  | 'legend' 
  | 'transcendent' 
  | 'agi';

export type ModuleCategory = 'compute' | 'specialty' | 'dataset' | 'algorithm' | 'security';

export type ModuleRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type QuestType = 'daily' | 'weekly' | 'one_time' | 'sponsored';

export type TaskType = 
  | 'image_qcm' 
  | 'sentiment' 
  | 'true_false' 
  | 'bounding_box' 
  | 'code_review';

export type TransactionType = 
  | 'tap_earn'
  | 'module_buy'
  | 'quest_reward'
  | 'task_reward'
  | 'ad_reward'
  | 'referral_welcome'
  | 'sponsorship_reward';

export const XP_PER_LEVEL = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level));
};

export const COINS_PER_TAP = 1;

export const MAX_ENERGY = 1500;
export const ENERGY_REGEN_PER_SECOND = 1;

export const REFERRAL_WELCOME_BONUS = 500;
export const REFERRAL_REFERER_BONUS = 2000;
export const REFERRAL_LIFETIME_COMMISSION = 0.10; // 10%

export const DAILY_STREAK_BONUSES = {
  3: 1000,
  7: 5000,
  14: 10000,
  30: 50000,
};
