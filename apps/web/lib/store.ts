/**
 * Zustand store for global state.
 * NOTE: PostgreSQL NUMERIC columns are serialised as strings by node-postgres.
 * We normalise all numeric fields to Number() in setUser to prevent
 * string concatenation bugs (e.g. "100" + 1 = "1001" instead of 101).
 */
import { create } from 'zustand';
import type { User, AiModule, Quest } from './api';

/** Coerce all numeric fields that Postgres might return as strings */
function normaliseUser(user: User): User {
  return {
    ...user,
    coin_balance: Number(user.coin_balance),
    gem_balance: Number(user.gem_balance),
    energy: Number(user.energy),
    max_energy: Number(user.max_energy),
    ai_level: Number(user.ai_level),
    ai_xp: Number(user.ai_xp),
    total_taps: Number(user.total_taps),
    total_earned_coins: Number(user.total_earned_coins),
    referral_count: Number(user.referral_count),
    daily_streak: Number(user.daily_streak),
    passiveIncomePerHour: Number(user.passiveIncomePerHour),
  };
}

interface GameState {
  user: User | null;
  modules: AiModule[];
  quests: Quest[];
  isLoading: boolean;
  error: string | null;

  /**
   * initDone persiste dans le store Zustand (survit aux démontages React).
   * Quand GamePage est démonté puis remonté (navigation SPA Section→Accueil),
   * initDone reste true → /api/auth/init n'est PAS rappelé → l'énergie locale
   * n'est pas écrasée par la valeur DB figée.
   * Réinitialisé à false seulement si l'utilisateur est null (déconnexion).
   */
  initDone: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setInitDone: (v: boolean) => void;
  setModules: (modules: AiModule[]) => void;
  setQuests: (quests: Quest[]) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  updateEnergy: (delta: number) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  modules: [],
  quests: [],
  isLoading: false,
  error: null,
  initDone: false,

  // Always normalise the user object so numeric fields are real numbers,
  // regardless of whether Postgres serialised them as strings.
  setUser: (user) => set({ user: user ? normaliseUser(user) : null }),
  setInitDone: (v) => set({ initDone: v }),
  setModules: (modules) => set({ modules }),
  setQuests: (quests) => set({ quests }),
  addCoins: (amount) => set((state) => ({
    user: state.user
      ? { ...state.user, coin_balance: Number(state.user.coin_balance) + Number(amount) }
      : null,
  })),
  spendCoins: (amount) => set((state) => ({
    user: state.user
      ? { ...state.user, coin_balance: Math.max(0, Number(state.user.coin_balance) - Number(amount)) }
      : null,
  })),
  updateEnergy: (delta) => set((state) => ({
    user: state.user
      ? {
          ...state.user,
          energy: Math.max(0, Math.min(state.user.max_energy, Number(state.user.energy) + Number(delta))),
        }
      : null,
  })),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
