'use client';

import { useGameStore } from '@/lib/store';
import { formatNumber } from '@/lib/utils';
import { Settings } from 'lucide-react';

export function TopBar() {
  const user = useGameStore((s) => s.user);
  
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
          <span className="text-lg font-bold text-accent-400">
            {user?.first_name?.[0] || '?'}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold">{user?.first_name || 'Player'}</p>
          <p className="text-xs text-dark-300">@{user?.username || 'no_username'}</p>
        </div>
      </div>
      
      <button className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center">
        <Settings className="w-5 h-5 text-dark-300" />
      </button>
    </div>
  );
}
