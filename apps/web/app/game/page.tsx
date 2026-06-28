'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Settings, TrendingUp, Users } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { useApi } from '@/lib/api';
import { useTelegram } from '@/lib/telegram';
import { hapticImpact, hapticNotification, cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { AiAvatar } from '@/components/AiAvatar';
import { ClickEffect } from '@/components/ClickEffect';

interface FloatingCoin {
  id: number;
  x: number;
  y: number;
  amount: number;
}

// Formate en chiffres bruts avec espaces : 22 750 065
const formatRaw = (n: number): string => {
  return Math.floor(n).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0');
};

export default function GamePage() {
  const api = useApi();
  const { isTelegram, initData, isReady } = useTelegram();
  const { user, setUser, updateEnergy } = useGameStore();

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const tapPendingCountRef = useRef(0);
  const tapBatchTimeoutRef = useRef<NodeJS.Timeout>();
  const optimisticAddedRef = useRef(0);

  useEffect(() => {
    if (!isReady) return;
    if (isTelegram && !initData) return;

    const init = async () => {
      try {
        const tgStartParam =
          typeof window !== 'undefined'
            ? window.Telegram?.WebApp?.initDataUnsafe?.start_param || ''
            : '';
        const referralCode = tgStartParam.startsWith('ref_') ? tgStartParam : undefined;
        const response = await api.post<{ user: any }>('/api/auth/init', { initData, referralCode });
        setUser(response.user);
      } catch (err: any) {
        console.error('Init failed:', err);
        if (!isTelegram) {
          setUser({
            id: 1, telegram_id: 123456, first_name: 'Dev', last_name: null,
            username: 'dev', photo_url: null, coin_balance: 0, gem_balance: 0,
            energy: 1000, max_energy: 1000, ai_name: 'My AI', ai_level: 0,
            ai_xp: 0, ai_type: 'novice', total_taps: 0, total_earned_coins: 0,
            referred_by: null, referral_count: 0, daily_streak: 0, is_banned: false,
            passiveIncomePerHour: 0,
          });
        }
      }
    };
    init();
  }, [isReady, initData]);

  // Regen energie passif - 1 point / seconde
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { updateEnergy(1); }, 1000);
    return () => clearInterval(interval);
  }, [user?.max_energy]);

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

    // Drain 2.5x : chaque tap consomme 2.5 energy (arrondi au-dessus)
    const energyDrain = 2.5;
    const newEnergy = Math.max(0, user.energy - energyDrain);
    updateEnergy(-energyDrain);
    setUser({ ...user, coin_balance: user.coin_balance + 1, energy: newEnergy });
    optimisticAddedRef.current += 1;

    const id = Date.now() + Math.random();
    setFloatingCoins((prev) => [...prev, { id, x: clientX, y: clientY, amount: 1 }]);
    setTimeout(() => setFloatingCoins((prev) => prev.filter((c) => c.id !== id)), 1000);

    tapPendingCountRef.current += 1;
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
        const currentUser = userRef.current;
        if (currentUser) {
          setUser({ ...currentUser, coin_balance: response.newBalance, energy: response.newEnergy });
        }
        if (response.aiLevelUp) hapticNotification('success');
      } catch (err) {
        console.error('Tap failed:', err);
        const currentUser = userRef.current;
        if (currentUser) {
          setUser({ ...currentUser, coin_balance: currentUser.coin_balance - optimisticCoins });
        }
      }
    }, 600);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto text-accent-500 animate-pulse mb-4" />
          <p className="text-dark-300 text-sm">Loading your AI...</p>
        </div>
      </div>
    );
  }

  const maxEnergy = user.max_energy || 1000;
  const energyPercent = Math.min(100, (user.energy / maxEnergy) * 100);
  const energyColor = energyPercent > 50
    ? 'from-blue-500 to-accent-500'
    : energyPercent > 20
    ? 'from-yellow-500 to-orange-400'
    : 'from-red-600 to-red-400';

  return (
    <div className="min-h-screen pb-20 flex flex-col bg-gradient-to-b from-[#0a0e1a] via-[#0d1225] to-[#0a0e1a]">

      {/* ===== TOP BAR style Hamster Kombat ===== */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* Avatar + Nom */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-accent-500/30 border-2 border-accent-500/50 flex items-center justify-center">
            <span className="text-lg font-bold text-accent-300">
              {user.first_name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {user.first_name} {user.last_name || ''}
            </p>
            <p className="text-xs text-dark-300 leading-tight capitalize">
              {user.ai_type} {user.ai_level} / 100
            </p>
          </div>
        </div>

        {/* Profit per hour — style Hamster */}
        <div className="flex items-center gap-2 bg-dark-800/80 border border-dark-600 rounded-2xl px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-dark-400 leading-none">Profit / heure</p>
            <p className="text-sm font-bold text-yellow-300 leading-tight">
              +{formatRaw(user.passiveIncomePerHour)}
            </p>
          </div>
        </div>

        {/* Settings */}
        <button className="w-10 h-10 rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center">
          <Settings className="w-5 h-5 text-dark-300" />
        </button>
      </div>

      {/* ===== COINS bruts style Hamster ===== */}
      <div className="flex justify-center items-center gap-3 pt-3 pb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <span className="text-lg">🪙</span>
        </div>
        <span className="text-4xl font-extrabold text-white tracking-tight">
          {formatRaw(user.coin_balance)}
        </span>
      </div>

      {/* ===== BOUTON TAP — l'avatar vit A L'INTERIEUR ===== */}
      <div className="flex justify-center px-6 flex-1">
        <motion.button
          onClick={handleTap}
          onTouchStart={handleTap}
          className={cn(
            'relative w-72 h-72 rounded-full select-none touch-none',
            'bg-gradient-to-br from-[#1a1f3c] via-[#141830] to-[#0e1228]',
            'border-[3px]',
            user.energy < 1
              ? 'border-dark-600 opacity-60'
              : 'border-accent-500/60 shadow-[0_0_40px_rgba(139,92,246,0.25)]',
          )}
          whileTap={{ scale: 0.93 }}
          disabled={user.energy < 1}
        >
          {/* Anneau lumineux externe */}
          {user.energy >= 1 && (
            <motion.div
              className="absolute inset-[-4px] rounded-full border-2 border-accent-400/30"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}

          {/* Avatar IA — DANS le bouton tap */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AiAvatar level={user.ai_level} type={user.ai_type} />
          </div>

          {/* Texte en bas du cercle */}
          <div className="absolute bottom-7 left-0 right-0 text-center pointer-events-none">
            <p className="text-base font-bold text-white/90">
              {user.energy < 1 ? 'No energy' : 'Tap to train'}
            </p>
            {user.energy >= 1 && (
              <p className="text-xs text-dark-300 mt-0.5">+1 coin per tap</p>
            )}
          </div>
        </motion.button>
      </div>

      {/* ===== BARRE ENERGIE ===== */}
      <div className="px-6 mt-5 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">⚡</span>
            <span className="text-sm font-semibold text-white">
              {Math.floor(user.energy)}
            </span>
            <span className="text-xs text-dark-400">/ {maxEnergy}</span>
          </div>
          <span className="text-xs text-dark-400">{Math.round(energyPercent)}%</span>
        </div>
        <div className="w-full h-3 bg-dark-700/80 rounded-full overflow-hidden border border-dark-600">
          <motion.div
            className={`h-full bg-gradient-to-r ${energyColor} rounded-full`}
            animate={{ width: `${energyPercent}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

      {/* ===== STATS SECONDAIRES ===== */}
      <div className="flex justify-center gap-3 px-4 mt-4 mb-2">
        <div className="flex-1 bg-dark-800/60 border border-dark-600 rounded-2xl px-3 py-2.5 text-center">
          <p className="text-[10px] text-dark-400 mb-0.5">Level IA</p>
          <p className="text-base font-bold text-accent-300">{user.ai_level}</p>
        </div>
        <div className="flex-1 bg-dark-800/60 border border-dark-600 rounded-2xl px-3 py-2.5 text-center">
          <p className="text-[10px] text-dark-400 mb-0.5">Total taps</p>
          <p className="text-base font-bold text-white">{formatRaw(user.total_taps)}</p>
        </div>
        <div className="flex-1 bg-dark-800/60 border border-dark-600 rounded-2xl px-3 py-2.5 text-center">
          <p className="text-[10px] text-dark-400 mb-0.5">Referrals</p>
          <p className="text-base font-bold text-green-400">{user.referral_count}</p>
        </div>
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
