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

const REGEN_DELAY_MS = 30_000;
const REGEN_PER_SEC  = 1 / 3;

function AiBadge({ level, type }: { level: number; type: string }) {
  const tiers = [
    { min: 0,   max: 4,   label: 'Novice',  color: '#6366f1', bg: 'rgba(99,102,241,0.18)',  emoji: '\u{1F9E0}' },
    { min: 5,   max: 9,   label: 'Initi\u00e9',  color: '#06b6d4', bg: 'rgba(6,182,212,0.18)',   emoji: '\u{1F41E}' },
    { min: 10,  max: 19,  label: 'Expert',  color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  emoji: '\u26A1' },
    { min: 20,  max: 49,  label: 'Master',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)',  emoji: '\u{1F52E}' },
    { min: 50,  max: 99,  label: 'Legend',  color: '#ec4899', bg: 'rgba(236,72,153,0.18)',  emoji: '\u{1F451}' },
    { min: 100, max: 999, label: 'GOD',     color: '#ef4444', bg: 'rgba(239,68,68,0.18)',   emoji: '\u{1F525}' },
  ];
  const tier = tiers.find(t => level >= t.min && level <= t.max) || tiers[0];
  return (
    <div className="w-11 h-11 rounded-full flex flex-col items-center justify-center border-2 select-none"
      style={{ background: tier.bg, borderColor: tier.color }}
      title={`AI ${tier.label} \u2014 Level ${level}`}>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{tier.emoji}</span>
      <span style={{ fontSize: '8px', fontWeight: 700, color: tier.color, lineHeight: 1.2 }}>Lv.{level}</span>
    </div>
  );
}

export default function GamePage() {
  const api = useApi();
  const { isTelegram, initData, startParam, isReady } = useTelegram();
  const { user, setUser } = useGameStore();

  const apiRef     = useRef(api);
  const setUserRef = useRef(setUser);
  const userRef    = useRef(user);
  useEffect(() => { apiRef.current     = api;     }, [api]);
  useEffect(() => { setUserRef.current = setUser; }, [setUser]);
  useEffect(() => { userRef.current    = user;    }, [user]);

  const maxEnergyRef = useRef<number>(1000);
  useEffect(() => { if (user?.max_energy) maxEnergyRef.current = user.max_energy; }, [user?.max_energy]);

  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [displayTaps,    setDisplayTaps]    = useState<number>(0);
  const [displayEnergy,  setDisplayEnergy]  = useState<number>(0);
  const displayBalanceRef = useRef<number>(0);
  const displayTapsRef    = useRef<number>(0);
  const displayEnergyRef  = useRef<number>(0);

  // Sync balance/taps depuis le store uniquement quand aucun tap n'est en vol.
  // L'\u00e9nergie est g\u00e9r\u00e9e exclusivement par tick() et flushBatch.
  useEffect(() => {
    if (!user) return;
    if (tapPendingRef.current === 0 && batchInFlightRef.current === null) {
      displayBalanceRef.current = user.coin_balance;
      displayTapsRef.current    = user.total_taps;
      setDisplayBalance(user.coin_balance);
      setDisplayTaps(user.total_taps);
    }
  }, [user?.coin_balance, user?.total_taps]);

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);

  const tapPendingRef    = useRef(0);
  const batchTimerRef    = useRef<NodeJS.Timeout>();
  const batchInFlightRef = useRef<Promise<void> | null>(null);
  const exhaustedAtRef   = useRef<number | null>(null);
  const batchStartTimeRef = useRef<number>(0);
  const batchSentAtRef    = useRef<number>(0);

  // ----------------------------------------------------------------
  // Init
  // FIX RACINE : exhaustedAtRef ancr\u00e9 sur energy_exhausted_at DB.
  // Avant : exhaustedAtRef = Date.now() si energy <= 0
  //   \u2192 le d\u00e9lai 30s repartait de z\u00e9ro \u00e0 chaque reconnexion/changement de section.
  // Apr\u00e8s : exhaustedAtRef = timestamp DB r\u00e9el
  //   \u2192 le timer reprend exactement l\u00e0 o\u00f9 il en \u00e9tait.
  // Pareil pour displayEnergyRef : on utilise calculateValidEnergy
  //   c\u00f4t\u00e9 client pour reconstruire l'\u00e9nergie exacte au moment de la reconnexion.
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;
    if (isTelegram && !initData) return;
    const init = async () => {
      try {
        const referralCode = startParam?.startsWith('ref_') ? startParam : undefined;
        const response = await apiRef.current.post<{ user: any }>('/api/auth/init', { initData, referralCode });
        const u = response.user;
        setUserRef.current(u);
        maxEnergyRef.current      = u.max_energy || 1000;
        displayBalanceRef.current = u.coin_balance;
        displayTapsRef.current    = u.total_taps;
        setDisplayBalance(u.coin_balance);
        setDisplayTaps(u.total_taps);

        // --- Reconstruire l'\u00e9tat d'\u00e9nergie depuis les timestamps DB ---
        // Le serveur retourne maintenant energy_exhausted_at dans le DTO.
        // On recalcule l'\u00e9nergie c\u00f4t\u00e9 client exactement comme le serveur le ferait,
        // ce qui garantit la continuit\u00e9 de la regen m\u00eame apr\u00e8s d\u00e9connexion.
        if (u.energy_exhausted_at) {
          // L'\u00e9nergie \u00e9tait \u00e9puis\u00e9e : on ancre exhaustedAtRef sur le vrai timestamp
          exhaustedAtRef.current = new Date(u.energy_exhausted_at).getTime();

          // Recalcul c\u00f4t\u00e9 client : est-ce que la regen a d\u00e9j\u00e0 commenc\u00e9 ?
          const now            = Date.now();
          const exhaustedAt    = exhaustedAtRef.current;
          const regenStartAt   = exhaustedAt + REGEN_DELAY_MS;

          if (now >= regenStartAt) {
            // La regen est en cours : on calcule l'\u00e9nergie exacte
            const secondsPassed = (now - regenStartAt) / 1000;
            const regenedEnergy = Math.min(
              u.max_energy,
              Math.max(0, u.energy) + secondsPassed * REGEN_PER_SEC,
            );
            displayEnergyRef.current = regenedEnergy;
            setDisplayEnergy(regenedEnergy);
            // Si la regen est d\u00e9j\u00e0 compl\u00e8te, on lib\u00e8re exhaustedAtRef
            if (Math.floor(regenedEnergy) >= u.max_energy) {
              exhaustedAtRef.current = null;
            }
          } else {
            // Encore dans le d\u00e9lai de 30s : \u00e9nergie = 0 (ou valeur DB)
            displayEnergyRef.current = Math.max(0, u.energy);
            setDisplayEnergy(Math.max(0, u.energy));
          }
        } else {
          // Cas normal : pas d'\u00e9puisement en cours
          exhaustedAtRef.current   = null;
          displayEnergyRef.current = u.energy;
          setDisplayEnergy(u.energy);
        }
      } catch {
        if (!isTelegram) {
          const devUser = {
            id: 1, telegram_id: 123456, first_name: 'Dev', last_name: null,
            username: 'dev', photo_url: null, coin_balance: 0, gem_balance: 0,
            energy: 1000, max_energy: 1000, ai_name: 'My AI', ai_level: 0,
            ai_xp: 0, ai_type: 'novice', total_taps: 0, total_earned_coins: 0,
            referred_by: null, referral_count: 0, daily_streak: 0, is_banned: false,
            passiveIncomePerHour: 0,
            energy_exhausted_at: null, last_energy_update: new Date().toISOString(),
          };
          setUserRef.current(devUser);
          maxEnergyRef.current      = 1000;
          displayBalanceRef.current = 0;
          displayTapsRef.current    = 0;
          displayEnergyRef.current  = 1000;
          setDisplayBalance(0);
          setDisplayTaps(0);
          setDisplayEnergy(1000);
          exhaustedAtRef.current = null;
        }
      }
    };
    init();
  }, [isReady, initData]);

  // ----------------------------------------------------------------
  // Timer regen \u2014 cr\u00e9\u00e9 une seule fois, lit UNIQUEMENT les refs display.
  // Ne touche PAS le store Zustand (Fix B).
  // ----------------------------------------------------------------
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    const tick = () => {
      const now     = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const cur  = displayEnergyRef.current;
      const maxE = maxEnergyRef.current;

      if (cur <= 0) {
        if (exhaustedAtRef.current === null) return;
        if (now - exhaustedAtRef.current < REGEN_DELAY_MS) return;
      }

      if (cur >= maxE) return;

      const newE = Math.min(maxE, cur + elapsed * REGEN_PER_SEC);
      if (newE === cur) return;

      displayEnergyRef.current = newE;
      setDisplayEnergy(newE);

      if (Math.floor(newE) >= 1 && exhaustedAtRef.current !== null) {
        exhaustedAtRef.current = null;
      }
    };

    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  // ----------------------------------------------------------------
  // flushBatch
  // ----------------------------------------------------------------
  const flushBatchRef = useRef<() => Promise<void>>();

  flushBatchRef.current = async () => {
    if (batchInFlightRef.current) {
      await batchInFlightRef.current;
      if (tapPendingRef.current > 0) {
        batchTimerRef.current = setTimeout(() => flushBatchRef.current?.(), 50);
      }
      return;
    }

    const batchCount = tapPendingRef.current;
    if (batchCount === 0) return;
    tapPendingRef.current = 0;

    const durationMs = batchStartTimeRef.current > 0
      ? Date.now() - batchStartTimeRef.current
      : undefined;
    batchStartTimeRef.current = 0;

    const doFlush = async () => {
      batchSentAtRef.current = Date.now();
      try {
        const response = await apiRef.current.post<any>('/api/tap', {
          count           : batchCount,
          clientTimestamp : new Date().toISOString(),
          durationMs,
        });

        // Pr\u00e9server les taps arriv\u00e9s pendant le vol r\u00e9seau
        const pendingAfter = tapPendingRef.current;
        displayBalanceRef.current = response.newBalance   + pendingAfter;
        displayTapsRef.current    = response.newTotalTaps + pendingAfter;
        setDisplayBalance(response.newBalance   + pendingAfter);
        setDisplayTaps(response.newTotalTaps    + pendingAfter);

        // Energie post-flush ancr\u00e9e sur le temps de vol r\u00e9seau (Fix C)
        if (response.newEnergy <= 0) {
          displayEnergyRef.current = 0;
          setDisplayEnergy(0);
          if (exhaustedAtRef.current === null) {
            exhaustedAtRef.current = Date.now();
          }
        } else {
          const flightMs         = Date.now() - batchSentAtRef.current;
          const regenFlight      = (flightMs / 1000) * REGEN_PER_SEC;
          const dbEnergyAdjusted = Math.min(maxEnergyRef.current, response.newEnergy + regenFlight);
          const localEnergy      = displayEnergyRef.current;
          const maxE             = maxEnergyRef.current;
          const tolerance        = batchCount + 5;

          if (localEnergy > dbEnergyAdjusted + tolerance) {
            displayEnergyRef.current = dbEnergyAdjusted;
            setDisplayEnergy(dbEnergyAdjusted);
          } else if (localEnergy < dbEnergyAdjusted) {
            displayEnergyRef.current = Math.min(dbEnergyAdjusted, maxE);
            setDisplayEnergy(Math.min(dbEnergyAdjusted, maxE));
          }

          if (exhaustedAtRef.current !== null) {
            exhaustedAtRef.current = null;
          }
        }

        const latest = userRef.current;
        if (latest) {
          const synced = {
            ...latest,
            coin_balance: response.newBalance,
            energy      : response.newEnergy,
            total_taps  : response.newTotalTaps ?? latest.total_taps,
            ai_level    : response.newAiLevel   ?? latest.ai_level,
          };
          setUserRef.current(synced);
          userRef.current = synced;
        }
        if (response.aiLevelUp) hapticNotification('success');
      } catch {
        // Pas de rollback : la DB est s\u00fbre (UPDATE atomique)
      } finally {
        batchInFlightRef.current = null;
      }
    };

    batchInFlightRef.current = doFlush();
    await batchInFlightRef.current;
  };

  // ----------------------------------------------------------------
  // handleTap \u2014 onPointerDown (Fix A : pas de doublon mobile)
  // ----------------------------------------------------------------
  const handleTap = useCallback((e: React.PointerEvent) => {
    if (e.isPrimary === false) return;

    const energy = Math.floor(displayEnergyRef.current);
    if (energy < 1) { hapticNotification('error'); return; }

    hapticImpact('light');

    const newEnergy  = Math.max(0, displayEnergyRef.current - 1);
    const newBalance = displayBalanceRef.current + 1;
    const newTaps    = displayTapsRef.current    + 1;

    if (Math.floor(newEnergy) === 0 && exhaustedAtRef.current === null) {
      exhaustedAtRef.current = Date.now();
    }

    if (tapPendingRef.current === 0) {
      batchStartTimeRef.current = Date.now();
    }

    displayEnergyRef.current  = newEnergy;
    displayBalanceRef.current = newBalance;
    displayTapsRef.current    = newTaps;
    setDisplayEnergy(newEnergy);
    setDisplayBalance(newBalance);
    setDisplayTaps(newTaps);

    const id = Date.now() + Math.random();
    setFloatingCoins(prev => [...prev, { id, x: e.clientX, y: e.clientY, amount: 1 }]);
    setTimeout(() => setFloatingCoins(prev => prev.filter(c => c.id !== id)), 1000);

    tapPendingRef.current += 1;
    clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(() => flushBatchRef.current?.(), 800);
  }, []);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
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

  const maxEnergy   = maxEnergyRef.current;
  const energyPct   = Math.min(100, (displayEnergy / maxEnergy) * 100);
  const energyColor =
    energyPct > 50 ? 'from-blue-600 to-violet-500'
    : energyPct > 20 ? 'from-yellow-500 to-orange-500'
    : 'from-red-700 to-red-500';

  const isExhausted = Math.floor(displayEnergy) < 1;
  const regenLabel  = isExhausted ? 'Recharge en cours\u2026' : 'Tap to train';
  const regenSub    = isExhausted ? '' : '+1 coin par tap';

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
          <span className="text-lg">\u{1FA99}</span>
        </div>
        <span className="text-4xl font-extrabold text-white tracking-tight">{fmt(displayBalance)}</span>
      </div>

      {/* ARC DORE */}
      <div className="relative w-full h-6 mb-3" aria-hidden>
        <svg viewBox="0 0 390 24" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,24 Q195,0 390,24" fill="none" stroke="rgba(180,130,40,0.18)" strokeWidth="8" />
          <path d="M0,24 Q195,0 390,24" fill="none" stroke="url(#goldArc)" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="goldArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="25%"  stopColor="#c9963a" />
              <stop offset="50%"  stopColor="#f0c060" />
              <stop offset="75%"  stopColor="#c9963a" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ENERGIE + STATS */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">\u26A1</span>
            <span className="text-sm font-semibold text-white">{Math.floor(displayEnergy)}</span>
            <span className="text-xs text-slate-500">/ {maxEnergy}</span>
          </div>
          <span className="text-xs text-slate-500">{Math.round(energyPct)}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden mb-3"
          style={{ background: '#12141f', border: '1px solid #1e2030' }}>
          <motion.div className={`h-full bg-gradient-to-r ${energyColor} rounded-full`}
            animate={{ width: `${energyPct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Level IA',   value: String(user.ai_level),       color: 'text-violet-300' },
            { label: 'Total taps', value: fmt(displayTaps),            color: 'text-white' },
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
          onPointerDown={handleTap}
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
