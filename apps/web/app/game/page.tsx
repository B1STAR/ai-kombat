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
  const { user, setUser, addCoins, updateEnergy } = useGameStore();
  
  const [floatingCoins, setFloatingCoins] = useState<FloatingCoin[]>([]);
  const [isTapping, setIsTapping] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Init user on mount
  useEffect(() => {
    if (!isReady) return;
    
    const init = async () => {
      try {
        // Parse referral from URL
        const url = new URL(window.location.href);
        const startParam = url.searchParams.get('tgWebAppStartParam') || '';
        const referralCode = startParam.startsWith('ref_') ? startParam : undefined;
        
        const response = await api.post<{ user: any }>('/api/auth/init', {
          initData,
          referralCode,
        });
        setUser(response.user);
      } catch (err: any) {
        console.error('Init failed:', err);
        if (!isTelegram) {
          // Dev mode: create a fake user
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
  }, [isReady]);
  
  // Energy regen (passive)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      updateEnergy(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.max_energy]);
  
  // Handle tap
  const handleTap = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!user || user.energy < 1) {
      hapticNotification('error');
      return;
    }
    
    // Prevent too rapid taps (client-side, server also validates)
    if (isTapping) return;
    setIsTapping(true);
    clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setIsTapping(false), 200);
    
    // Get click position for floating coin
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    hapticImpact('light');
    
    // Optimistic UI update
    updateEnergy(-1);
    addCoins(1);
    
    // Floating coin animation
    const id = Date.now() + Math.random();
    setFloatingCoins((prev) => [...prev, { id, x: clientX, y: clientY, amount: 1 }]);
    setTimeout(() => {
      setFloatingCoins((prev) => prev.filter((c) => c.id !== id));
    }, 1000);
    
    // Send to server (batch every 500ms)
    if (!handleTap.pending) {
      handleTap.pending = true;
      handleTap.pendingCount = 1;
      setTimeout(async () => {
        try {
          const response = await api.post<any>('/api/tap', {
            count: handleTap.pendingCount,
            clientTimestamp: new Date().toISOString(),
          });
          
          // Reconcile with server
          if (response.suspicious) {
            hapticNotification('warning');
          } else {
            // Server may have given bonus, sync state
            const diff = response.coinsEarned - handleTap.pendingCount;
            if (diff !== 0) {
              addCoins(diff);
            }
            if (response.aiLevelUp) {
              hapticNotification('success');
            }
          }
        } catch (err) {
          console.error('Tap failed:', err);
        } finally {
          handleTap.pending = false;
          handleTap.pendingCount = 0;
        }
      }, 500);
    } else {
      handleTap.pendingCount++;
    }
  };
  
  // Type augmentation
  handleTap.pending = false;
  handleTap.pendingCount = 0;
  
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
      
      {/* AI Avatar (the central visual) */}
      <div className="flex justify-center pt-4 pb-2">
        <AiAvatar level={user.ai_level} type={user.ai_type} />
      </div>
      
      {/* AI Name */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">{user.ai_name}</h2>
        <p className="text-sm text-dark-300 capitalize">
          {user.ai_type} • Level {user.ai_level}
        </p>
      </div>
      
      {/* Stats Pills */}
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
      
      {/* Energy bar */}
      <div className="px-4 mb-6">
        <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-accent-500"
            animate={{ width: `${energyPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Tap area */}
      <div className="flex justify-center px-4">
        <motion.button
          onClick={handleTap}
          onTouchStart={handleTap}
          className={cn(
            "relative w-72 h-72 rounded-full",
            "bg-gradient-to-br from-dark-700 to-dark-800",
            "border-4 border-accent-500/30",
            "flex items-center justify-center",
            "active:scale-95 transition-transform",
            "shadow-2xl shadow-accent-500/20",
            "select-none touch-none",
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
      
      {/* Floating coins animation */}
      <AnimatePresence>
        {floatingCoins.map((coin) => (
          <ClickEffect key={coin.id} {...coin} />
        ))}
      </AnimatePresence>
      
      <BottomNav />
    </div>
  );
}
