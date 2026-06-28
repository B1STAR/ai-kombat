'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Lock, Check, Coins, AlertCircle, TrendingUp } from 'lucide-react';
import { useApi, type AiModule } from '@/lib/api';
import { useGameStore } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { hapticNotification, formatNumber, cn } from '@/lib/utils';

export default function ShopPage() {
  const api = useApi();
  const { user, spendCoins, setUser, modules, setModules } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);

  // Build a quick lookup: code → currentLevel (0 if not owned)
  const moduleLevelByCode = modules.reduce((acc, m) => {
    acc[m.code] = m.currentLevel;
    return acc;
  }, {} as Record<string, number>);

  // Build a quick lookup: code → module object (for dependency chain resolution)
  const moduleByCode: Record<string, AiModule> = modules.reduce((acc, m) => {
    acc[m.code] = m;
    return acc;
  }, {} as Record<string, AiModule>);

  useEffect(() => {
    api.get<{ modules: AiModule[] }>('/api/modules')
      .then((res) => setModules(res.modules))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (module: AiModule) => {
    if (!user) return;

    if (user.ai_level < module.minAiLevel) {
      hapticNotification('error');
      alert(`Ton AI doit être niveau ${module.minAiLevel}`);
      return;
    }

    // Check required module
    if (module.requiredModuleCode && !moduleLevelByCode[module.requiredModuleCode]) {
      hapticNotification('error');
      const req = moduleByCode[module.requiredModuleCode];
      alert(`Prérequis : achète d'abord « ${req?.name ?? module.requiredModuleCode} »`);
      return;
    }

    if (module.nextLevelCost && user.coin_balance < module.nextLevelCost) {
      hapticNotification('error');
      alert('Pas assez de coins');
      return;
    }

    try {
      setBuying(module.id);
      const response = await api.post<{ newBalance: number; aiLevelUp?: boolean; newAiLevel?: number }>(
        '/api/modules/buy',
        { moduleId: module.id }
      );
      spendCoins(module.nextLevelCost || module.baseCost);
      setUser({ ...user, coin_balance: Number(response.newBalance) });
      hapticNotification('success');

      // Si c'est un module Entraînement IA → mise à jour du niveau AI en local
      if (response.aiLevelUp && response.newAiLevel != null) {
        setUser({ ...user, coin_balance: Number(response.newBalance), ai_level: response.newAiLevel });
        alert(`🎉 AI Level Up ! Ton IA est maintenant niveau ${response.newAiLevel}`);
      }

      const refreshed = await api.get<{ modules: AiModule[] }>('/api/modules');
      setModules(refreshed.modules);
    } catch (err: any) {
      hapticNotification('error');
      alert(err.message);
    } finally {
      setBuying(null);
    }
  };

  const groupedModules = modules.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, AiModule[]>);

  const categoryNames: Record<string, { name: string; icon: string; color: string }> = {
    training:  { name: 'Entraînement IA', icon: '🧬', color: 'text-pink-400' },
    compute:   { name: 'Compute',         icon: '⚡', color: 'text-yellow-400' },
    specialty: { name: 'Spécialités',     icon: '🧠', color: 'text-accent-400' },
    dataset:   { name: 'Datasets',        icon: '📚', color: 'text-blue-400' },
    algorithm: { name: 'Algorithmes',     icon: '⚙️', color: 'text-green-400' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <ShoppingBag className="w-12 h-12 text-accent-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">AI Shop</h1>
      <p className="text-dark-300 text-sm mb-6">Améliore ton AI pour gagner plus</p>

      {Object.entries(groupedModules).map(([category, mods]) => {
        const cat = categoryNames[category] || { name: category, icon: '📦', color: 'text-white' };
        return (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">{cat.icon}</span>
              <span className={cat.color}>{cat.name}</span>
            </h2>

            <div className="space-y-3">
              {mods.map((mod) => {
                const canAfford = user && mod.nextLevelCost !== null && user.coin_balance >= mod.nextLevelCost;
                const meetsLevel = user && user.ai_level >= mod.minAiLevel;
                const hasRequiredModule = !mod.requiredModuleCode || (moduleLevelByCode[mod.requiredModuleCode] ?? 0) > 0;
                const canBuy = canAfford && meetsLevel && hasRequiredModule && !mod.isMaxLevel;

                // Prérequis direct non satisfait
                const missingRequiredModule: AiModule | null = (mod.requiredModuleCode && !hasRequiredModule)
                  ? (moduleByCode[mod.requiredModuleCode] ?? null)
                  : null;

                // Build progress label
                const progressLabel = mod.isMaxLevel
                  ? `Max (${mod.maxLevel})`
                  : mod.currentLevel > 0
                  ? `Niv. ${mod.currentLevel} / ${mod.maxLevel}`
                  : `0 / ${mod.maxLevel}`;

                // Gains affichés :
                // - Si le user possède déjà ce module → montrer le total actuel + le prochain gain
                // - Sinon → montrer le gain du 1er niveau
                const currentHourly = (mod as any).currentCoinsPerHour ?? 0;
                const nextHourly = (mod as any).nextLevelCoinsPerHour ?? mod.coinsPerHourBonus;

                return (
                  <div
                    key={mod.id}
                    className={cn(
                      'card transition-all',
                      mod.isMaxLevel ? 'opacity-60' : '',
                      (!meetsLevel || !hasRequiredModule) ? 'opacity-50' : ''
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{mod.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                            {progressLabel}
                          </span>
                        </div>
                        <p className="text-sm text-dark-300 mt-1">{mod.description}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          {/* Gains actuels si module déjà possédé */}
                          {currentHourly > 0 && (
                            <span className="text-green-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {formatNumber(currentHourly)}/h actuel
                            </span>
                          )}
                          {/* Gain du prochain niveau */}
                          {nextHourly > 0 && !mod.isMaxLevel && (
                            <span className="text-yellow-400">
                              +{formatNumber(nextHourly)}/h prochain niv.
                            </span>
                          )}
                          {/* Module entraînement IA : afficher le niveau AI actuel */}
                          {mod.code === 'ai_training' && user && (
                            <span className="text-pink-400 flex items-center gap-1">
                              🧬 AI Niv. actuel : {user.ai_level}
                            </span>
                          )}
                          {!meetsLevel && (
                            <span className="text-orange-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              AI Niv. {mod.minAiLevel} requis
                            </span>
                          )}
                          {missingRequiredModule && (
                            <span className="text-purple-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Prérequis : {missingRequiredModule.name}
                              {missingRequiredModule.requiredModuleCode &&
                                !((moduleLevelByCode[missingRequiredModule.requiredModuleCode] ?? 0) > 0) && (
                                  <span className="text-dark-400 ml-1">
                                    (bloqué par {moduleByCode[missingRequiredModule.requiredModuleCode]?.name ?? missingRequiredModule.requiredModuleCode})
                                  </span>
                                )}
                            </span>
                          )}
                        </div>
                      </div>

                      {mod.isMaxLevel ? (
                        <Check className="w-6 h-6 text-green-400 shrink-0" />
                      ) : (!meetsLevel || !hasRequiredModule) ? (
                        <Lock className="w-5 h-5 text-dark-300 shrink-0" />
                      ) : (
                        <button
                          onClick={() => handleBuy(mod)}
                          disabled={!canBuy || buying === mod.id}
                          className={cn(
                            'px-4 py-2 rounded-xl font-semibold transition-all shrink-0',
                            canBuy
                              ? 'bg-accent-500 hover:bg-accent-600 text-white active:scale-95'
                              : 'bg-dark-700 text-dark-300'
                          )}
                        >
                          {buying === mod.id ? '...' : (
                            <span className="flex items-center gap-1">
                              <Coins className="w-4 h-4" />
                              {formatNumber(mod.nextLevelCost || 0)}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <BottomNav />
    </div>
  );
}
