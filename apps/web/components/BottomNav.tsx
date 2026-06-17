'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, Users, Trophy, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/game', icon: Home, label: 'Home' },
  { href: '/tasks', icon: ListChecks, label: 'Tasks' },
  { href: '/quests', icon: Trophy, label: 'Quests' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/shop', icon: ShoppingBag, label: 'Shop' },
];

export function BottomNav() {
  const pathname = usePathname();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-lg border-t border-dark-700 z-40">
      <div className="flex justify-around items-center py-2 max-w-2xl mx-auto">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                isActive 
                  ? "text-accent-400" 
                  : "text-dark-300 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
