'use client';

import { useEffect, useState } from 'react';
import { Users, Copy, Share2, Check, Coins } from 'lucide-react';
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
  bonusPaid: boolean;
}

interface ReferralData {
  count: number;
  totalEarned: number;
  referrals: ReferralListItem[];
}

export default function FriendsPage() {
  const api = useApi();
  const { user } = useTelegram();
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [data, setData] = useState<ReferralData>({ count: 0, totalEarned: 0, referrals: [] });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ReferralInfo>('/api/referral/link'),
      api.get<ReferralData>('/api/referral/list'),
    ]).then(([ref, lst]) => {
      setReferral(ref);
      setData(lst);
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
      tg.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(referral.link)}&text=${encodeURIComponent(referral.shareText)}`
      );
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold">{data.count}</p>
          <p className="text-xs text-dark-300 mt-1">Friends invited</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-accent-400">
            {data.totalEarned.toLocaleString()}
          </p>
          <p className="text-xs text-dark-300 mt-1">Coins earned</p>
        </div>
      </div>

      {/* Share card */}
      <div className="card">
        <p className="text-xs text-dark-400 mb-1 font-medium uppercase tracking-wide">Your referral link</p>

        {/* Link visible — affiche le lien en clair */}
        <div
          onClick={copyLink}
          className="flex items-center gap-2 bg-dark-800 rounded-lg px-3 py-2 mb-4 cursor-pointer hover:bg-dark-700 transition-colors"
        >
          <span className="text-xs text-accent-300 flex-1 truncate font-mono">
            {referral?.link ?? '—'}
          </span>
          {copied
            ? <Check className="w-4 h-4 text-green-400 shrink-0" />
            : <Copy className="w-4 h-4 text-dark-300 shrink-0" />}
        </div>

        <div className="flex gap-2">
          <button onClick={copyLink} className="btn-secondary flex-1">
            {copied
              ? <><Check className="w-4 h-4 inline mr-1" />Copied!</>
              : <><Copy className="w-4 h-4 inline mr-1" />Copy link</>}
          </button>
          <button onClick={shareLink} className="btn-primary flex-1">
            <Share2 className="w-4 h-4 inline mr-1" />Share
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="card mt-4 space-y-2">
        <p className="text-sm font-semibold mb-2">How it works</p>
        <div className="flex items-start gap-2 text-sm text-dark-200">
          <span className="text-accent-400 font-bold">1.</span>
          <span>Share your link with friends</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-dark-200">
          <span className="text-accent-400 font-bold">2.</span>
          <span>They join AI Kombat via your link</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-dark-200">
          <span className="text-accent-400 font-bold">3.</span>
          <span>You earn <strong className="text-accent-300">2,000 coins</strong> instantly + <strong className="text-accent-300">10%</strong> of all their tap earnings</span>
        </div>
      </div>

      {/* Referral list */}
      <h2 className="text-lg font-semibold mt-6 mb-3">Your friends ({data.count})</h2>
      {data.referrals.length === 0 ? (
        <div className="card text-center py-8">
          <Users className="w-8 h-8 text-dark-500 mx-auto mb-2" />
          <p className="text-dark-300">No friends yet — share your link!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.referrals.map((friend) => (
            <div key={friend.telegramId} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center shrink-0">
                <span className="font-bold text-sm">{friend.firstName[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{friend.firstName}</p>
                <p className="text-xs text-dark-300">@{friend.username || 'no_username'}</p>
              </div>
              <div className="text-right shrink-0">
                {friend.bonusPaid ? (
                  <span className="text-xs text-green-400 font-medium">✓ Bonus paid</span>
                ) : (
                  <span className="text-xs text-dark-500">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
