'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, TrendingUp, Brain } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { useApi } from '@/lib/api';
import { useTelegram } from '@/lib/telegram';
import { formatNumber, hapticImpact, hapticNotification, cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { AiAvatar } from '@/components/AiAvatar';
import { TopBar } from '@/components/TopBar';
import { ClickEffect } from '@/components/ClickEffect';

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
  amount: number;
}

export default function GamePage() {
  const api = useApi();
  const { isTelegram, initData, isReady } = useTelegram();
  const { user, setUser, updateEnergy } = useGameStore();

  // Keep a ref to user so the async batch callback always has the latest value
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();

  // Batch tap refs — values survive re-renders and closures
  const tapPendingCountRef = useRef(0);
  const tapBatchTimeoutRef = useRef<NodeJS.Timeout>();
  // Track optimistic coins added so we can revert on error
  const optimisticAddedRef = useRef(0);

  // Init user on mount
  useEffect(() => {
    if (!isReady) return;

    if (isTelegram && !initData) {
      console.warn('Telegram detected but initData is empty — waiting for SDK.');
      return;
    }

    const init = async () => {
      try {
        const tgStartParam =
          typeof window !== 'undefined'
            ? window.Telegram?.WebApp?.initDataUnsafe?.start_param || ''
            : '';
        const referralCode = tgStartParam.startsWith('ref_') ? tgStartParam : undefined;

        const response = await api.post<{ user: any }>('/api/auth/init', {
          initData,
          referralCode,
        });
        setUser(response.user);
      } catch (err: any) {
        console.error('Init failed:', err);
        if (!isTelegram) {
          setUser({
            id: 1,
            telegram_id: 123456,
            first_name: 'Dev',
            last_name: null,
            username: 'dev',
            photo_url: null,
            coin_balance: 0,
            gem_balance: 0,
            energy: 1000,
            max_energy: 1500,
            ai_name: 'My AI',
            ai_level: 0,
            ai_xp: 0,
            ai_type: 'novice',
            total_taps: 0,
            total_earned_coins: 0,
            referred_by: null,
            referral_count: 0,
            daily_streak: 0,
            is_banned: false,
            passiveIncomePerHour: 0,
          });
        }
      }
    };

    init();
  }, [isReady, initData]);

  // Energy regen (passive)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      updateEnergy(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.max_energy]);

  // Handle tap
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!user || user.energy < 1) {
      hapticNotification('error');
      return;
    }

    if (isTapping) return;
    setIsTapping(true);
    clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setIsTapping(false), 200);

    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    hapticImpact('light');

    // Optimistic UI: subtract energy, add +1 coin locally
    updateEnergy(-1);
    setUser({ ...user, coin_balance: user.coin_balance + 1, energy: user.energy - 1 });
    optimisticAddedRef.current += 1;

    const id = Date.now() + Math.random();
    setFloatingCoins((prev) => [...prev, { id, x: clientX, y: clientY, amount: 1 }]);
    setTimeout(() => {
      setFloatingCoins((prev) => prev.filter((c) => c.id !== id));
    }, 1000);

    // Accumulate taps for the current batch
    tapPendingCountRef.current += 1;

    // Reset/extend the debounce timer on every tap
    clearTimeout(tapBatchTimeoutRef.current);
    tapBatchTimeoutRef.current = setTimeout(async () => {
      const batchCount = tapPendingCountRef.current;
      const optimisticCoins = optimisticAddedRef.current;
      tapPendingCountRef.current = 0;
      optimisticAddedRef.current = 0;

      try {
        const response = await api.post<any>('/api/tap', {
          count: batchCount,
          clientTimestamp: new Date().toISOString(),
        });

        // Sync to the authoritative newBalance from the API using the ref
        // to get the latest user without a stale closure.
        const currentUser = userRef.current;
        if (currentUser) {
          setUser({ ...currentUser, coin_balance: response.newBalance, energy: response.newEnergy });
        }

        if (response.suspicious) {
          hapticNotification('warning');
        } else if (response.aiLevelUp) {
          hapticNotification('success');
        }
      } catch (err) {
        console.error('Tap failed:', err);
        // Revert optimistic coins on network error
        const currentUser = userRef.current;
        if (currentUser) {
          setUser({ ...currentUser, coin_balance: currentUser.coin_balance - optimisticCoins });
        }
      }
    }, 600);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto text-accent-500 brain-pulse mb-4" />
          <p className="text-dark-300">Loading your AI...</p>
        </div>
      </div>
    );
  }

  const energyPercent = (user.energy / user.max_energy) * 100;

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950">
      <TopBar />

      <div className="flex justify-center pt-4 pb-2">
        <AiAvatar level={user.ai_level} type={user.ai_type} />
      </div>

      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">{user.ai_name}</h2>
        <p className="text-sm text-dark-300 capitalize">
          {user.ai_type} • Level {user.ai_level}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-4 px-4">
        <div className="stat-pill flex items-center gap-1">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span>{formatNumber(user.coin_balance)}</span>
        </div>
        <div className="stat-pill flex items-center gap-1">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>{user.energy}/{user.max_energy}</span>
        </div>
        <div className="stat-pill flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span>{formatNumber(user.passiveIncomePerHour)}/h</span>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-accent-500"
            animate={{ width: `${energyPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex justify-center px-4">
        <motion.button
          onClick={handleTap}
          onTouchStart={handleTap}
          className={cn(
            'relative w-72 h-72 rounded-full',
            'bg-gradient-to-br from-dark-700 to-dark-800',
            'border-4 border-accent-500/30',
            'flex items-center justify-center',
            'active:scale-95 transition-transform',
            'shadow-2xl shadow-accent-500/20',
            'select-none touch-none',
          )}
          whileTap={{ scale: 0.95 }}
          disabled={user.energy < 1}
        >
          <div className="text-center pointer-events-none">
            <Brain className="w-24 h-24 mx-auto text-accent-400 brain-pulse" />
            <p className="mt-4 text-2xl font-bold">
              {user.energy < 1 ? 'No energy' : 'Tap to train'}
            </p>
            <p className="text-sm text-dark-300 mt-1">
              {user.energy < 1 ? 'Wait for regen' : '+1 coin per tap'}
            </p>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {floatingCoins.map((coin) => (
          <ClickEffect key={coin.id} {...coin} />
        ))}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
