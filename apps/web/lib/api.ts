/**
 * API client. Wraps fetch with Telegram auth headers.
 */
import { useTelegram } from './telegram';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  initData: string = '',
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(initData ? { Authorization: `tma ${initData}` } : {}),
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new ApiError(res.status, data.code, data.error);
  }
  
  return res.json();
}

// ============================================
// API HOOK (used in components)
// ============================================
export const useApi = () => {
  const { initData } = useTelegram();
  
  return {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }, initData),
    post: <T>(path: string, body?: any) => request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, initData),
    put: <T>(path: string, body?: any) => request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }, initData),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }, initData),
  };
};

// ============================================
// TYPED API CALLS
// ============================================
export interface User {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  coin_balance: number;
  gem_balance: number;
  energy: number;
  max_energy: number;
  ai_name: string;
  ai_level: number;
  ai_xp: number;
  ai_type: string;
  total_taps: number;
  total_earned_coins: number;
  referred_by: number | null;
  referral_count: number;
  daily_streak: number;
  is_banned: boolean;
  passiveIncomePerHour: number;
}

export interface AiModule {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string | null;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  coinsPerHourBonus: number;
  minAiLevel: number;
  requiredModuleCode: string | null;
  rarity: string;
  currentLevel: number;
  isOwned: boolean;
  nextLevelCost: number | null;
  isMaxLevel: boolean;
}

export interface Task {
  id: number;
  type: string;
  question: string;
  payload: any;
  rewardCoins: number;
  rewardXp: number;
  difficulty: string;
}

export interface Quest {
  user_quest_id: number;
  quest_id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  target_count: number;
  target_action: string;
  reward_coins: number;
  reward_gems: number;
  reward_xp: number;
  progress: number;
}
