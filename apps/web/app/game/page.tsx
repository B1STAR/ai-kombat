'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, TrendingUp, Brain } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { useApi } from '@/lib/api';
import { useTelegram } from '@/lib/telegram';
import { hapticImpact, hapticNotification } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { AiAvatar } from '@/components/AiAvatar';
import { ClickEffect } from '@/components/ClickEffect';

interface FloatingCoin { id: number; x: number; y: number; amount: number; }

const fmt = (n: number) => Math.floor(n).toLocaleString('fr-FR').replace(/\u202f/g, '\u00a0');

/** Badge niveau IA — remplace l'avatar Telegram */
function AiBadge({ level, type }: { level: number; type: string }) {
  const tiers = [
    { min: 0,   max: 4,   label: 'Novice', color: '#6366f1', bg: 'rgba(99,102,241,0.18)',  emoji: '\ud83e\udde0' },
    { min: 5,   max: 9,   label: 'Initié', color: '#06b6d4', bg: 'rgba(6,182,212,0.18)',   emoji: '\ud83d\udc1e' },
    { min: 10,  max: 19,  label: 'Expert', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  emoji: '\u26a1' },
    { min: 20,  max: 49,  label: 'Master', color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)',  emoji: '\ud83d\udd2e' },
    { min: 50,  max: 99,  label: 'Legend', color: '#ec4899', bg: 'rgba(236,72,153,0.18)',  emoji: '\ud83d\udc51' },
    { min: 100, max: 999, label: 'GOD',    color: '#ef4444', bg: 'rgba(239,68,68,0.18)',   emoji: '\ud83d\udd25' },
  ];
  const tier = tiers.find(t => level >= t.min && level <= t.max) || tiers[0];
  return (
    <div className="w-11 h-11 rounded-full flex flex-col items-center justify-center border-2 select-none"
      style={{ background: tier.bg, borderColor: tier.color }}
      title={`AI ${tier.label} — Level ${level}`}>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{tier.emoji}</span>
      <span style={{ fontSize: '8px', fontWeight: 700, color: tier.color, lineHeight: 1.2 }}>Lv.{level}</span>
    </div>
  );
}

export default function GamePage() {
  const api = useApi();
  const { isTelegram, initData, startParam, isReady } = useTelegram();
  const { user, setUser } = useGameStore();

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const tapPendingCountRef = useRef(0);
  const tapBatchTimeoutRef = useRef<NodeJS.Timeout>();
  const optimisticAddedRef = useRef(0);

  // ------------------------------------------------------------------
  // Init : envoie startParam (referral) depuis le contexte Telegram
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;
    if (isTelegram && !initData) return;
    const init = async () => {
      try {
        // startParam est lu au moment du ready() donc toujours fiable
        const referralCode = startParam.startsWith('ref_') ? startParam : undefined;
        const response = await api.post<{ user: any }>('/api/auth/init', { initData, referralCode });
        setUser(response.user);
      } catch (err: any) {
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

  // ------------------------------------------------------------------
  // Recharge énergie basée sur Date.now() — pas d'accumulation d'intervalles
  // Toutes les secondes on calcule : énergie = min(max, base + Δt * 1/3)
  // Si l'onglet revient d'arrière-plan, on fait UN seul calcul exact.
  // ------------------------------------------------------------------
  const energyTimerRef = useRef<NodeJS.Timeout>();
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;
    const maxEnergy = user.max_energy || 1000;

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000; // secondes réelles — robuste au arriere-plan
      lastTickRef.current = now;

      const regen = elapsed * (1 / 3);

      useGameStore.setState((state) => {
        if (!state.user) return {};
        const newEnergy = Math.min(maxEnergy, Number(state.user.energy) + regen);
        return { user: { ...state.user, energy: newEnergy } };
      });
    };

    energyTimerRef.current = setInterval(tick, 1000);
    return () => clearInterval(energyTimerRef.current);
  }, [user?.max_energy, user?.telegram_id]); // recrée seulement si le user change

  // ------------------------------------------------------------------
  // Tap handler
  // ------------------------------------------------------------------
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!user || user.energy < 1) { hapticNotification('error'); return; }
    if (isTapping) return;
    setIsTapping(true);
    clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setIsTapping(false), 200);

    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches[0]) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else if ('clientX' in e) { clientX = e.clientX; clientY = e.clientY; }

    hapticImpact('light');
    const newEnergy = Math.max(0, user.energy - 2.5);
    setUser({ ...user, coin_balance: user.coin_balance + 1, energy: newEnergy, total_taps: user.total_taps + 1 });
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
        const response = await api.post<any>('/api/tap', { count: batchCount, clientTimestamp: new Date().toISOString() });
        const cu = userRef.current;
        if (cu) {
          setUser({ ...cu, coin_balance: response.newBalance, energy: response.newEnergy, total_taps: response.newTotalTaps ?? cu.total_taps });
          // Resync le timer apres sync API pour eviter la derive
          lastTickRef.current = Date.now();
        }
        if (response.aiLevelUp) hapticNotification('success');
      } catch {
        const cu = userRef.current;
        if (cu) setUser({ ...cu, coin_balance: cu.coin_balance - optimisticCoins, total_taps: cu.total_taps - optimisticCoins });
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

  return (
    <div className="min-h-screen pb-20 flex flex-col" style={{ background: '#08090f' }}>

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <AiBadge level={user.ai_level} type={user.ai_type} />
          <div>
            <p className="text-sm font-bold text-white leading-tight">{user.first_name} {user.last_name || ''}</p>
            <p className="text-xs text-slate-400 leading-tight capitalize">{user.ai_type} &bull; Level {user.ai_level}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2"
          style={{ background: '#12141f', border: '1px solid #2a2d40' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.12)' }}>
            <TrendingUp className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 leading-none">Profit / heure</p>
            <p className="text-sm font-bold text-yellow-300 leading-tight">+{fmt(user.passiveIncomePerHour)}</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#12141f', border: '1px solid #2a2d40' }}>
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* COINS */}
      <div className="flex justify-center items-center gap-3 pt-1 pb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 0 16px rgba(245,158,11,0.35)' }}>
          <span className="text-lg">🪙</span>
        </div>
        <span className="text-4xl font-extrabold text-white tracking-tight">{fmt(user.coin_balance)}</span>
      </div>

      {/* ARC DORE */}
      <div className="relative w-full h-6 mb-3" aria-hidden>
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

      {/* ENERGIE + STATS */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">⚡</span>
            <span className="text-sm font-semibold text-white">{Math.floor(user.energy)}</span>
            <span className="text-xs text-slate-500">/ {maxEnergy}</span>
          </div>
          <span className="text-xs text-slate-500">{Math.round(energyPercent)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden mb-3"
          style={{ background: '#12141f', border: '1px solid #1e2030' }}>
          <motion.div className={`h-full bg-gradient-to-r ${energyColor} rounded-full`}
            animate={{ width: `${energyPercent}%` }} transition={{ duration: 0.3 }} />
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Level IA',   value: String(user.ai_level),       color: 'text-violet-300' },
            { label: 'Total taps', value: fmt(user.total_taps),        color: 'text-white' },
            { label: 'Referrals',  value: String(user.referral_count), color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 rounded-xl px-2 py-2 text-center"
              style={{ background: '#12141f', border: '1px solid #1e2030' }}>
              <p className="text-[9px] text-slate-500 mb-0.5">{label}</p>
              <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOUTON TAP */}
      <div className="flex justify-center px-6">
        <motion.button
          onClick={handleTap}
          onTouchStart={handleTap}
          style={{
            width: '260px', height: '260px', borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #1e1b40 0%, #0e0d1e 70%)',
            border: user.energy < 1 ? '3px solid #2a2d40' : '3px solid rgba(124,58,237,0.55)',
            boxShadow: user.energy < 1 ? 'none' : '0 0 32px rgba(109,40,217,0.22), inset 0 0 40px rgba(109,40,217,0.08)',
          }}
          className="relative select-none touch-none"
          whileTap={{ scale: 0.93 }}
          disabled={user.energy < 1}
        >
          {user.energy >= 1 && (
            <motion.div className="absolute inset-[-5px] rounded-full"
              style={{ border: '1.5px solid rgba(139,92,246,0.25)' }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity }} />
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom: '40px' }}>
            <AiAvatar level={user.ai_level} type={user.ai_type} />
          </div>
          <div className="absolute bottom-7 left-0 right-0 text-center pointer-events-none">
            <p className="text-base font-bold text-white/90">{user.energy < 1 ? 'No energy' : 'Tap to train'}</p>
            {user.energy >= 1 && <p className="text-xs text-slate-400 mt-0.5">+1 coin per tap</p>}
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {floatingCoins.map((coin) => (<ClickEffect key={coin.id} {...coin} />))}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
