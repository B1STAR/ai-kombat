'use client';

import { useEffect, useState } from 'react';
import { Trophy, Check, Coins, Sparkles } from 'lucide-react';
import { useApi, type Quest } from '@/lib/api';
import { useGameStore } from '@/lib/store';
import { hapticNotification, formatNumber } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';

export default function QuestsPage() {
  const api = useApi();
  const addCoins = useGameStore((s) => s.addCoins);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  
  useEffect(() => {
    fetchQuests();
  }, []);
  
  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ quests: Quest[] }>('/api/quests/active');
      setQuests(response.quests);
    } catch (err) {
      console.error('Fetch quests failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const claimQuest = async (userQuestId: number, rewardCoins: number) => {
    try {
      setClaiming(userQuestId);
      await api.post('/api/quests/claim', { userQuestId });
      addCoins(rewardCoins);
      hapticNotification('success');
      fetchQuests();
    } catch (err) {
      console.error('Claim failed:', err);
      hapticNotification('error');
    } finally {
      setClaiming(null);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Trophy className="w-12 h-12 text-accent-500 animate-pulse" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Quests</h1>
      <p className="text-dark-300 text-sm mb-6">Complete quests to earn rewards</p>
      
      {quests.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-12 h-12 mx-auto text-dark-300" />
          <p className="mt-2 text-dark-300">No active quests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => {
            const progressPercent = Math.min(100, (quest.progress / quest.target_count) * 100);
            const canClaim = quest.progress >= quest.target_count;
            
            return (
              <div key={quest.user_quest_id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{quest.name}</h3>
                    <p className="text-sm text-dark-300 mt-1">{quest.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 ml-2">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">+{formatNumber(quest.reward_coins)}</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-dark-300 mb-1">
                    <span>{quest.progress} / {quest.target_count}</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-500 to-purple-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                
                {/* Claim button */}
                {canClaim && (
                  <button
                    onClick={() => claimQuest(quest.user_quest_id, quest.reward_coins)}
                    disabled={claiming === quest.user_quest_id}
                    className="btn-primary w-full mt-3"
                  >
                    {claiming === quest.user_quest_id ? 'Claiming...' : 'Claim reward'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}
