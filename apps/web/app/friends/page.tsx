'use client';

import { useEffect, useState } from 'react';
import { Users, Copy, Share2, Check } from 'lucide-react';
import { useApi } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import { useTelegram } from '@/lib/telegram';
import { hapticNotification } from '@/lib/utils';

interface ReferralInfo {
  link: string;
  code: string;
  shareText: string;
}

interface ReferralListItem {
  telegramId: number;
  firstName: string;
  username: string | null;
  joinedAt: string;
}

export default function FriendsPage() {
  const api = useApi();
  const { user } = useTelegram();
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [list, setList] = useState<ReferralListItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      api.get<ReferralInfo>('/api/referral/link'),
      api.get<{ count: number; referrals: ReferralListItem[] }>('/api/referral/list'),
    ]).then(([ref, lst]) => {
      setReferral(ref);
      setList(lst.referrals);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);
  
  const copyLink = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.link);
    setCopied(true);
    hapticNotification('success');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareLink = () => {
    if (!referral) return;
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referral.link)}&text=${encodeURIComponent(referral.shareText)}`);
    } else {
      copyLink();
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Users className="w-12 h-12 text-accent-500 animate-pulse" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold mb-1">Invite Friends</h1>
      <p className="text-dark-300 text-sm mb-6">Earn 2,000 coins per friend + 10% of their gains</p>
      
      {/* Share card */}
      <div className="card text-center">
        <div className="w-20 h-20 rounded-full bg-accent-500/20 mx-auto flex items-center justify-center mb-4">
          <Users className="w-10 h-10 text-accent-400" />
        </div>
        <h2 className="text-xl font-bold">{list.length} friends invited</h2>
        <p className="text-sm text-dark-300 mt-1">Keep inviting to earn more</p>
        
        <div className="mt-6 flex gap-2">
          <button onClick={copyLink} className="btn-secondary flex-1">
            {copied ? <><Check className="w-4 h-4 inline mr-1" />Copied!</> : <><Copy className="w-4 h-4 inline mr-1" />Copy</>}
          </button>
          <button onClick={shareLink} className="btn-primary flex-1">
            <Share2 className="w-4 h-4 inline mr-1" />Share
          </button>
        </div>
      </div>
      
      {/* Referral list */}
      <h2 className="text-lg font-semibold mt-6 mb-3">Your friends</h2>
      {list.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-dark-300">No friends yet. Share your link!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((friend) => (
            <div key={friend.telegramId} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">
                <span className="font-bold">{friend.firstName[0]}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{friend.firstName}</p>
                <p className="text-xs text-dark-300">@{friend.username || 'no_username'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}
