'use client';

import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface ClickEffectProps {
  id: number;
  x: number;
  y: number;
  amount: number;
}

export function ClickEffect({ x, y, amount }: ClickEffectProps) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50 flex items-center gap-1 text-yellow-400 font-bold"
      style={{ left: x, top: y - 30 }}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <Coins className="w-4 h-4" />
      <span>+{amount}</span>
    </motion.div>
  );
}
