'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to game
    router.replace('/game');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
        <p className="text-dark-300">Loading AI Kombat...</p>
      </div>
    </div>
  );
}
