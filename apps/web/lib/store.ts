/**
 * Zustand store for global state.
 */
import { create } from 'zustand';
import type { User, AiModule, Quest } from './api';

interface GameState {
  user: User | null;
  modules: AiModule[];
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
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
  
  setUser: (user) => set({ user }),
  setModules: (modules) => set({ modules }),
  setQuests: (quests) => set({ quests }),
  addCoins: (amount) => set((state) => ({
    user: state.user ? { ...state.user, coin_balance: state.user.coin_balance + amount } : null,
  })),
  spendCoins: (amount) => set((state) => ({
    user: state.user ? { ...state.user, coin_balance: Math.max(0, state.user.coin_balance - amount) } : null,
  })),
  updateEnergy: (delta) => set((state) => ({
    user: state.user ? { 
      ...state.user, 
      energy: Math.max(0, Math.min(state.user.max_energy, state.user.energy + delta)) 
    } : null,
  })),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
