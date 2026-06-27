'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Lock, Check, Coins, AlertCircle } from 'lucide-react';
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
  const moduleByCode = modules.reduce((acc, m) => {
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
      const response = await api.post<{ newBalance: number }>('/api/modules/buy', { moduleId: module.id });
      spendCoins(module.nextLevelCost || module.baseCost);
      setUser({ ...user, coin_balance: Number(response.newBalance) });
      hapticNotification('success');

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
    compute:   { name: 'Compute',      icon: '⚡', color: 'text-yellow-400' },
    specialty: { name: 'Spécialités',  icon: '🧠', color: 'text-accent-400' },
    dataset:   { name: 'Datasets',     icon: '📚', color: 'text-blue-400' },
    algorithm: { name: 'Algorithmes',  icon: '⚙️', color: 'text-green-400' },
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

                // Résoudre la chaîne complète des prérequis pour affichage
                // Ex: si A requires B requires C, on affiche la chaîne
                const getFullRequirementChain = (code: string | null): string[] => {
                  if (!code) return [];
                  const chain: string[] = [];
                  let current: string | null = code;
                  const visited = new Set<string>();
                  while (current && !visited.has(current)) {
                    visited.add(current);
                    const m = moduleByCode[current];
                    if (m) chain.push(m.name);
                    else chain.push(current); // fallback si inconnu
                    current = m?.requiredModuleCode ?? null;
                  }
                  return chain;
                };

                // Prérequis direct non satisfait
                const missingRequiredModule = mod.requiredModuleCode && !hasRequiredModule
                  ? moduleByCode[mod.requiredModuleCode]
                  : null;

                // Build progress label: Lvl 3 / 20
                const progressLabel = mod.isMaxLevel
                  ? `Max (${mod.maxLevel})`
                  : mod.currentLevel > 0
                  ? `Niv. ${mod.currentLevel} / ${mod.maxLevel}`
                  : `0 / ${mod.maxLevel}`;

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
                          {mod.coinsPerHourBonus > 0 && (
                            <span className="text-green-400">
                              +{formatNumber(mod.coinsPerHourBonus)}/h par niveau
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
                                  (lui-même bloqué par {moduleByCode[missingRequiredModule.requiredModuleCode]?.name ?? missingRequiredModule.requiredModuleCode})
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
