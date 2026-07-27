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
    { min: 0,   max: 4,   label: 'Novice', color: '#6366f1', bg: 'rgba(99,102,241,0.18)',  emoji: '\ud83e\udde0' },
    { min: 5,   max: 9,   label: 'Initi\u00e9', color: '#06b6d4', bg: 'rgba(6,182,212,0.18)',   emoji: '\ud83d\udc1e' },
    { min: 10,  max: 19,  label: 'Expert', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  emoji: '\u26a1' },
    { min: 20,  max: 49,  label: 'Master', color: '#8b5cf6', bg: 'rgba(139,92,246,0.18)',  emoji: '\ud83d\udd2e' },
    { min: 50,  max: 99,  label: 'Legend', color: '#ec4899', bg: 'rgba(236,72,153,0.18)',  emoji: '\ud83d\udc51' },
    { min: 100, max: 999, label: 'GOD',    color: '#ef4444', bg: 'rgba(239,68,68,0.18)',   emoji: '\ud83d\udd25' },
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
  const api            = useApi();
  const { isTelegram, initData, startParam, isReady } = useTelegram();
  const { user, setUser } = useGameStore();

  // Refs stables \u2014 aucune stale closure possible
  const apiRef      = useRef(api);
  const setUserRef  = useRef(setUser);
  const userRef     = useRef(user);
  useEffect(() => { apiRef.current    = api;     }, [api]);
  useEffect(() => { setUserRef.current = setUser; }, [setUser]);
  useEffect(() => { userRef.current   = user;    }, [user]);

  // FIX #4 : maxEnergy dans une ref pour que le timer le lise toujours à jour
  // sans avoir besoin de recréer le setInterval
  const maxEnergyRef = useRef<number>(1000);
  useEffect(() => {
    if (user?.max_energy) maxEnergyRef.current = user.max_energy;
  }, [user?.max_energy]);

  // ----------------------------------------------------------------
  // Compteurs VISUELS locaux \u2014 séparés du store DB
  // \u2022 Tap        \u2192 incrément instantané (UX fluide)
  // \u2022 Réponse API \u2192 remplacement direct par la vraie valeur DB
  // \u2022 Jamais de rollback
  // ----------------------------------------------------------------
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [displayTaps,    setDisplayTaps]    = useState<number>(0);
  const [displayEnergy,  setDisplayEnergy]  = useState<number>(0);
  const displayBalanceRef = useRef<number>(0);
  const displayTapsRef    = useRef<number>(0);
  const displayEnergyRef  = useRef<number>(0);

  // Sync display depuis le store uniquement quand aucun tap n'est en attente
  useEffect(() => {
    if (!user) return;
    if (tapPendingRef.current === 0) {
      displayBalanceRef.current = user.coin_balance;
      displayTapsRef.current    = user.total_taps;
      // FIX #5 : énergie syncée depuis le store seulement si pas de tap en cours
      // pour éviter le conflit avec displayEnergyRef déjà mis à jour par le timer
      displayEnergyRef.current  = user.energy;
      setDisplayBalance(user.coin_balance);
      setDisplayTaps(user.total_taps);
      setDisplayEnergy(user.energy);
    }
  }, [user?.coin_balance, user?.total_taps]);

  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);

  const lastTouchRef     = useRef<number>(0);
  const tapPendingRef    = useRef(0);
  const batchTimerRef    = useRef<NodeJS.Timeout>();
  const batchInFlightRef = useRef<Promise<void> | null>(null);

  // FIX #1 : exhaustedAtRef géré UNIQUEMENT par handleTap et flushBatch
  // Le timer ne le touche PLUS \u2014 évite le reset intempestif entre deux ticks
  const exhaustedAtRef = useRef<number | null>(null);

  // ----------------------------------------------------------------
  // Init
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
        displayEnergyRef.current  = u.energy;
        setDisplayBalance(u.coin_balance);
        setDisplayTaps(u.total_taps);
        setDisplayEnergy(u.energy);
        // Initialiser exhaustedAt si l'énergie est déjà à 0 au chargement
        if (u.energy <= 0) exhaustedAtRef.current = Date.now();
      } catch {
        if (!isTelegram) {
          const devUser = {
            id: 1, telegram_id: 123456, first_name: 'Dev', last_name: null,
            username: 'dev', photo_url: null, coin_balance: 0, gem_balance: 0,
            energy: 1000, max_energy: 1000, ai_name: 'My AI', ai_level: 0,
            ai_xp: 0, ai_type: 'novice', total_taps: 0, total_earned_coins: 0,
            referred_by: null, referral_count: 0, daily_streak: 0, is_banned: false,
            passiveIncomePerHour: 0,
          };
          setUserRef.current(devUser);
          maxEnergyRef.current      = 1000;
          displayBalanceRef.current = 0;
          displayTapsRef.current    = 0;
          displayEnergyRef.current  = 1000;
          setDisplayBalance(0);
          setDisplayTaps(0);
          setDisplayEnergy(1000);
        }
      }
    };
    init();
  }, [isReady, initData]);

  // ----------------------------------------------------------------
  // Timer regen \u2014 créé UNE SEULE FOIS (dép. vide)
  // Lit maxEnergyRef et exhaustedAtRef qui sont toujours à jour
  // FIX #2 : lastTickRef n'est PLUS réinitialisé après la réponse API
  // FIX #4 : maxEnergy lu depuis maxEnergyRef \u2014 pas capturé en closure
  // FIX #1 : exhaustedAtRef modifié seulement ici (lecture) et dans handleTap/flushBatch (\u00e9criture)
  // ----------------------------------------------------------------
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    const tick = () => {
      const now     = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const cur      = displayEnergyRef.current;
      const maxE     = maxEnergyRef.current;

      // Si énergie à 0 : vérifier le délai de 30s avant de regener
      if (cur <= 0) {
        // exhaustedAtRef est set par handleTap ou par l'init
        // Le timer ne le MODIFIE pas, il le LIT seulement
        if (exhaustedAtRef.current === null) return; // pas encore enregistré, on attend
        if (now - exhaustedAtRef.current < REGEN_DELAY_MS) return; // délai non écoulé
        // Délai écoulé : on commence à régénérer depuis 0
      }

      // FIX #3 : si l'énergie vient d'être mise à jour par flushBatch (response.newEnergy),
      // displayEnergyRef est déjà correct \u2014 on continue simplement la regen depuis là
      const newE = Math.min(maxE, cur + elapsed * REGEN_PER_SEC);
      if (newE === cur) return; // rien à changer (max atteint ou epsilon)

      displayEnergyRef.current = newE;
      setDisplayEnergy(newE);

      // Sync store pour les autres pages
      useGameStore.setState((state) => {
        if (!state.user) return {};
        const updated = { ...state.user, energy: newE };
        userRef.current = updated;
        return { user: updated };
      });
    };

    const id = setInterval(tick, 500); // 500ms pour une regen plus fluide visuellement
    return () => clearInterval(id);
  }, []); // FIX #4 : dép. vides \u2014 créé une seule fois, lit les refs

  // ----------------------------------------------------------------
  // flushBatch \u2014 ref stable, zéro stale closure
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

    const doFlush = async () => {
      try {
        const response = await apiRef.current.post<any>('/api/tap', {
          count: batchCount,
          clientTimestamp: new Date().toISOString(),
        });

        // SOURCE DE VÉRITÉ : remplacement direct par les valeurs DB
        displayBalanceRef.current = response.newBalance;
        displayTapsRef.current    = response.newTotalTaps;
        setDisplayBalance(response.newBalance);
        setDisplayTaps(response.newTotalTaps);

        // FIX #2+#3 : on met à jour displayEnergyRef avec la valeur DB
        // Le timer continuera la regen depuis cette valeur au prochain tick
        // lastTickRef N'EST PAS réinitialisé \u2014 préserve la continuité temporelle
        displayEnergyRef.current = response.newEnergy;
        setDisplayEnergy(response.newEnergy);

        // FIX #1 : si l'API dit que l'énergie est revenue > 0, on efface exhaustedAt
        // Si l'énergie est 0, on s'assure qu'exhaustedAt est bien enregistré
        if (response.newEnergy > 0) {
          exhaustedAtRef.current = null;
        } else if (exhaustedAtRef.current === null) {
          exhaustedAtRef.current = Date.now();
        }

        const latest = userRef.current;
        if (latest) {
          const synced = {
            ...latest,
            coin_balance : response.newBalance,
            energy       : response.newEnergy,
            total_taps   : response.newTotalTaps ?? latest.total_taps,
            ai_level     : response.newAiLevel   ?? latest.ai_level,
          };
          setUserRef.current(synced);
          userRef.current = synced;
        }
        if (response.aiLevelUp) hapticNotification('success');
      } catch {
        // Erreur réseau : pas de rollback, la DB est sûre (UPDATE atomique)
        // Au rechargement, le vrai solde sera affiché
      } finally {
        batchInFlightRef.current = null;
      }
    };

    batchInFlightRef.current = doFlush();
    await batchInFlightRef.current;
  };

  // ----------------------------------------------------------------
  // handleTap \u2014 dép. vides, ne change jamais de référence
  // FIX #1 : exhaustedAtRef SET ici (et nulle part ailleurs)
  // FIX #5 : displayEnergyRef mis à jour atomiquement avant setDisplayEnergy
  // ----------------------------------------------------------------
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'click'      && Date.now() - lastTouchRef.current < 500) return;
    if (e.type === 'touchstart') lastTouchRef.current = Date.now();

    // FIX #5 : lecture + écriture de la ref AVANT tout setState
    // \u2014 si un autre tap arrive dans la même frame, il lit la valeur déjà décrémentée
    const energy = displayEnergyRef.current;
    if (energy < 1) { hapticNotification('error'); return; }

    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches[0]) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else if ('clientX' in e)             { clientX = e.clientX;            clientY = e.clientY; }

    hapticImpact('light');

    const newEnergy  = Math.max(0, energy - 1);
    const newBalance = displayBalanceRef.current + 1;
    const newTaps    = displayTapsRef.current + 1;

    // FIX #1 : exhaustedAt SET ici, dans handleTap uniquement
    // Le timer ne peut plus le remettre à null par erreur
    if (newEnergy === 0 && exhaustedAtRef.current === null) {
      exhaustedAtRef.current = Date.now();
    }

    // Mise à jour atomique des refs D'ABORD, setState ensuite
    displayEnergyRef.current  = newEnergy;
    displayBalanceRef.current = newBalance;
    displayTapsRef.current    = newTaps;
    setDisplayEnergy(newEnergy);
    setDisplayBalance(newBalance);
    setDisplayTaps(newTaps);

    const id = Date.now() + Math.random();
    setFloatingCoins(prev => [...prev, { id, x: clientX, y: clientY, amount: 1 }]);
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

  const isExhausted = displayEnergy < 1;
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
          <span className="text-lg">\ud83e\ude99</span>
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
            <span className="text-sm">\u26a1</span>
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
