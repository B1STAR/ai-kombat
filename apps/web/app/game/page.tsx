'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

// Délai de regen après épuisement total — doit correspondre à user.service.ts (30s)
const REGEN_DELAY_MS = 30_000;
const REGEN_PER_SEC  = 1 / 3;

function AiBadge({ level, type }: { level: number; type: string }) {
  const tiers = [
    { min: 0,   max: 4,   label: 'Novice', color: '#6366f1', bg: 'rgba(99,102,241,0.18)',  emoji: '🧠' },
    { min: 5,   max: 9,   label: 'Initié', color: '#06b6d4', bg: 'rgba(6,182,212,0.18)',   emoji: '🐞' },
    { min: 10,  max: 19,  label: 'Expert', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  emoji: '⚡' },
    { min: 20,  max: 49,  label: 'Master', color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)',  emoji: '🔮' },
    { min: 50,  max: 99,  label: 'Legend', color: '#ec4899', bg: 'rgba(236,72,153,0.18)',  emoji: '👑' },
    { min: 100, max: 999, label: 'GOD',    color: '#ef4444', bg: 'rgba(239,68,68,0.18)',   emoji: '🔥' },
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

  const lastTouchRef        = useRef<number>(0);
  const tapPendingRef       = useRef(0);
  // FIX coins rollback : on garde un compteur séparé par batch en vol
  const optimisticRef       = useRef(0);   // coins optimistes du batch EN COURS (pas encore envoyé)
  const batchTimerRef       = useRef<NodeJS.Timeout>();
  const isBatchingRef       = useRef(false);
  // FIX regen : timestamp de l'épuisement local pour bloquer la regen 30s
  const exhaustedAtRef      = useRef<number | null>(null);

  // ----------------------------------------------------------------
  // Init
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;
    if (isTelegram && !initData) return;
    const init = async () => {
      try {
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

  // ----------------------------------------------------------------
  // Regen locale — miroir exact de calculateValidEnergy() côté API
  // FIX : on bloque la regen 30s après épuisement total (energy === 0)
  // ----------------------------------------------------------------
  const lastTickRef    = useRef<number>(Date.now());
  const energyTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;
    const maxEnergy = user.max_energy || 1000;
    lastTickRef.current = Date.now();

    const tick = () => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      useGameStore.setState((state) => {
        if (!state.user) return {};
        const currentEnergy = Number(state.user.energy);

        // FIX #1 regen : si énergie à 0, on attend REGEN_DELAY_MS avant de recharger
        if (currentEnergy <= 0) {
          if (exhaustedAtRef.current === null) {
            exhaustedAtRef.current = now;
          }
          const waited = now - exhaustedAtRef.current;
          if (waited < REGEN_DELAY_MS) return {}; // encore en attente
        } else {
          // L'énergie est revenue, on reset le compteur d'épuisement
          exhaustedAtRef.current = null;
        }

        const newEnergy = Math.min(maxEnergy, currentEnergy + elapsed * REGEN_PER_SEC);
        const updated = { ...state.user, energy: newEnergy };
        userRef.current = updated;
        return { user: updated };
      });
    };

    energyTimerRef.current = setInterval(tick, 1000);
    return () => clearInterval(energyTimerRef.current);
  }, [user?.max_energy, user?.telegram_id]);

  // ----------------------------------------------------------------
  // flushBatch — envoi groupé vers l'API
  // FIX coins : snapshot des coins optimistes AU MOMENT du flush
  // pour que le rollback soit toujours précis même si de nouveaux taps arrivent
  // ----------------------------------------------------------------
  const flushBatch = useCallback(async () => {
    if (isBatchingRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = setTimeout(flushBatch, 300);
      return;
    }

    const batchCount    = tapPendingRef.current;
    // FIX : snapshot isolé des coins optimistes pour ce batch précis
    const batchOptimistic = optimisticRef.current;
    if (batchCount === 0) return;

    tapPendingRef.current  = 0;
    optimisticRef.current  = 0;   // reset — les prochains taps accumulent un nouveau compteur
    isBatchingRef.current  = true;

    try {
      const response = await api.post<any>('/api/tap', {
        count: batchCount,
        clientTimestamp: new Date().toISOString(),
      });

      const latest = userRef.current;
      if (latest) {
        // FIX regen : si l'API dit que l'énergie est revenue, on reset l'épuisement local
        if (response.newEnergy > 0) exhaustedAtRef.current = null;

        const synced = {
          ...latest,
          coin_balance : response.newBalance,
          energy       : response.newEnergy,
          total_taps   : response.newTotalTaps ?? latest.total_taps,
        };
        setUser(synced);
        userRef.current    = synced;
        lastTickRef.current = Date.now();
      }
      if (response.aiLevelUp) hapticNotification('success');
    } catch {
      // Rollback uniquement les coins de CE batch (batchOptimistic), pas ceux des taps suivants
      const latest = userRef.current;
      if (latest) {
        const reverted = {
          ...latest,
          coin_balance : Math.max(0, latest.coin_balance - batchOptimistic),
          total_taps   : Math.max(0, latest.total_taps   - batchCount),
        };
        setUser(reverted);
        userRef.current = reverted;
      }
    } finally {
      isBatchingRef.current = false;
    }
  }, [api, setUser]);

  // ----------------------------------------------------------------
  // handleTap
  // ----------------------------------------------------------------
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Anti double-fire touch + click
    if (e.type === 'click'    && Date.now() - lastTouchRef.current < 500) return;
    if (e.type === 'touchstart') lastTouchRef.current = Date.now();

    const cu = userRef.current;
    if (!cu || cu.energy < 1) { hapticNotification('error'); return; }

    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches[0]) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else if ('clientX' in e)             { clientX = e.clientX;            clientY = e.clientY; }

    hapticImpact('light');

    const newEnergy = Math.max(0, cu.energy - 1);
    // FIX regen : si on vient d'atteindre 0, on enregistre le timestamp d'épuisement
    if (newEnergy === 0 && exhaustedAtRef.current === null) {
      exhaustedAtRef.current = Date.now();
    }

    const updated = {
      ...cu,
      coin_balance : cu.coin_balance + 1,
      energy       : newEnergy,
      total_taps   : cu.total_taps + 1,
    };
    setUser(updated);
    userRef.current    = updated;
    optimisticRef.current += 1;

    const id = Date.now() + Math.random();
    setFloatingCoins((prev) => [...prev, { id, x: clientX, y: clientY, amount: 1 }]);
    setTimeout(() => setFloatingCoins((prev) => prev.filter((c) => c.id !== id)), 1000);

    tapPendingRef.current += 1;
    clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(flushBatch, 600);
  }, [flushBatch, setUser]);

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

  const maxEnergy    = user.max_energy || 1000;
  const energyPct    = Math.min(100, (user.energy / maxEnergy) * 100);
  const energyColor  =
    energyPct > 50 ? 'from-blue-600 to-violet-500'
    : energyPct > 20 ? 'from-yellow-500 to-orange-500'
    : 'from-red-700 to-red-500';

  // FIX #3 : label de regen lisible — affiche le délai restant si épuisé
  const isExhausted  = user.energy < 1;
  const regenLabel   = isExhausted ? 'Recharge en cours…' : 'Tap to train';
  const regenSub     = isExhausted ? '' : '+1 coin par tap';

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
            {/* FIX #3 : emoji direct, pas d'escape unicode */}
            <span className="text-sm">⚡</span>
            <span className="text-sm font-semibold text-white">{Math.floor(user.energy)}</span>
            <span className="text-xs text-slate-500">/ {maxEnergy}</span>
          </div>
          <span className="text-xs text-slate-500">{Math.round(energyPct)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden mb-3"
          style={{ background: '#12141f', border: '1px solid #1e2030' }}>
          <motion.div className={`h-full bg-gradient-to-r ${energyColor} rounded-full`}
            animate={{ width: `${energyPct}%` }} transition={{ duration: 0.3 }} />
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
            border    : isExhausted ? '3px solid #2a2d40' : '3px solid rgba(124,58,237,0.55)',
            boxShadow : isExhausted ? 'none' : '0 0 32px rgba(109,40,217,0.22), inset 0 0 40px rgba(109,40,217,0.08)',
          }}
          className="relative select-none touch-none"
          whileTap={{ scale: isExhausted ? 1 : 0.93 }}
          disabled={isExhausted}
        >
          {!isExhausted && (
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
            <p className="text-base font-bold text-white/90">{regenLabel}</p>
            {regenSub && <p className="text-xs text-slate-400 mt-0.5">{regenSub}</p>}
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
