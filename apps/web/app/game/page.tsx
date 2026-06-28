'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Settings, TrendingUp } from 'lucide-react';
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

const formatRaw = (n: number): string =>
  Math.floor(n).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0');

// URL du proxy avatar - evite le CORS de t.me
const avatarProxyUrl = (telegramId: number) =>
  `${process.env.NEXT_PUBLIC_API_URL || ''}/api/avatar/${telegramId}`;

export default function GamePage() {
  const api = useApi();
  const { isTelegram, initData, isReady } = useTelegram();
  const { user, setUser, updateEnergy } = useGameStore();
  const [avatarError, setAvatarError] = useState(false);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  // Reset erreur avatar si le user change
  useEffect(() => { setAvatarError(false); }, [user?.telegram_id]);

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
        if (currentUser) setUser({ ...currentUser, coin_balance: response.newBalance, energy: response.newEnergy });
        if (response.aiLevelUp) hapticNotification('success');
      } catch (err) {
        const currentUser = userRef.current;
        if (currentUser) setUser({ ...currentUser, coin_balance: currentUser.coin_balance - optimisticCoins });
      }
    }, 600);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08090f' }}>
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto text-violet-500 animate-pulse mb-4" />
          <p className="text-slate-400 text-sm">Loading your AI...</p>
        </div>
      </div>
    );
  }

  const maxEnergy = user.max_energy || 1000;
  const energyPercent = Math.min(100, (user.energy / maxEnergy) * 100);
  const energyColor =
    energyPercent > 50 ? 'from-blue-600 to-violet-500'
    : energyPercent > 20 ? 'from-yellow-500 to-orange-500'
    : 'from-red-700 to-red-500';

  // Avatar : on tente le proxy, fallback sur l'initiale
  const hasAvatar = !!user.photo_url && !avatarError;

  return (
    <div className="min-h-screen pb-20 flex flex-col" style={{ background: '#08090f' }}>

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {hasAvatar ? (
            <img
              src={avatarProxyUrl(user.telegram_id)}
              alt={user.first_name}
              className="w-11 h-11 rounded-full border-2 object-cover"
              style={{ borderColor: 'rgba(124,58,237,0.6)' }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center border-2"
              style={{ background: 'rgba(109,40,217,0.25)', borderColor: 'rgba(124,58,237,0.5)' }}
            >
              <span className="text-lg font-bold text-violet-300">
                {user.first_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {user.first_name} {user.last_name || ''}
            </p>
            <p className="text-xs text-slate-400 leading-tight capitalize">
              {user.ai_type} &bull; Level {user.ai_level}
            </p>
          </div>
        </div>

        {/* Profit / heure */}
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{ background: '#12141f', border: '1px solid #2a2d40' }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.12)' }}>
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 leading-none">Profit / heure</p>
            <p className="text-sm font-bold text-yellow-300 leading-tight">+{formatRaw(user.passiveIncomePerHour)}</p>
          </div>
        </div>

        <button
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#12141f', border: '1px solid #2a2d40' }}
        >
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* COINS */}
      <div className="flex justify-center items-center gap-3 pt-1 pb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 0 16px rgba(245,158,11,0.35)' }}
        >
          <span className="text-lg">🪙</span>
        </div>
        <span className="text-4xl font-extrabold text-white tracking-tight">
          {formatRaw(user.coin_balance)}
        </span>
      </div>

      {/* SEPARATEUR ARC DORE */}
      <div className="relative w-full h-6 mb-1" aria-hidden>
        <svg viewBox="0 0 390 24" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,24 Q195,0 390,24" fill="none" stroke="rgba(180,130,40,0.18)" strokeWidth="8" />
          <path d="M0,24 Q195,0 390,24" fill="none" stroke="url(#goldArc)" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="goldArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="25%" stopColor="#c9963a" />
              <stop offset="50%" stopColor="#f0c060" />
              <stop offset="75%" stopColor="#c9963a" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* BOUTON TAP */}
      <div className="flex justify-center px-6">
        <motion.button
          onClick={handleTap}
          onTouchStart={handleTap}
          style={{
            width: '272px', height: '272px', borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #1e1b40 0%, #0e0d1e 70%)',
            border: user.energy < 1 ? '3px solid #2a2d40' : '3px solid rgba(124,58,237,0.55)',
            boxShadow: user.energy < 1 ? 'none' : '0 0 32px rgba(109,40,217,0.22), inset 0 0 40px rgba(109,40,217,0.08)',
          }}
          className="relative select-none touch-none"
          whileTap={{ scale: 0.93 }}
          disabled={user.energy < 1}
        >
          {user.energy >= 1 && (
            <motion.div
              className="absolute inset-[-5px] rounded-full"
              style={{ border: '1.5px solid rgba(139,92,246,0.25)' }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '40px' }}>
            <AiAvatar level={user.ai_level} type={user.ai_type} />
          </div>
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
            <p className="text-base font-bold text-white/90">{user.energy < 1 ? 'No energy' : 'Tap to train'}</p>
            {user.energy >= 1 && <p className="text-xs text-slate-400 mt-0.5">+1 coin per tap</p>}
          </div>
        </motion.button>
      </div>

      {/* BARRE ENERGIE */}
      <div className="px-6 mt-5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">⚡</span>
            <span className="text-sm font-semibold text-white">{Math.floor(user.energy)}</span>
            <span className="text-xs text-slate-500">/ {maxEnergy}</span>
          </div>
          <span className="text-xs text-slate-500">{Math.round(energyPercent)}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#12141f', border: '1px solid #1e2030' }}>
          <motion.div
            className={`h-full bg-gradient-to-r ${energyColor} rounded-full`}
            animate={{ width: `${energyPercent}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

      {/* STATS */}
      <div className="flex justify-center gap-3 px-4 mt-4">
        {[
          { label: 'Level IA',   value: String(user.ai_level),        color: 'text-violet-300' },
          { label: 'Total taps', value: formatRaw(user.total_taps),   color: 'text-white' },
          { label: 'Referrals',  value: String(user.referral_count),  color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-1 rounded-2xl px-3 py-2.5 text-center"
            style={{ background: '#12141f', border: '1px solid #1e2030' }}>
            <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
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
