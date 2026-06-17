'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, Cpu, Zap } from 'lucide-react';

interface AiAvatarProps {
  level: number;
  type: string;
}

const getAvatarForLevel = (level: number) => {
  if (level < 5) return { icon: Brain, color: 'text-blue-400', size: 'w-20 h-20' };
  if (level < 10) return { icon: Brain, color: 'text-cyan-400', size: 'w-24 h-24' };
  if (level < 20) return { icon: Cpu, color: 'text-accent-400', size: 'w-28 h-28' };
  if (level < 50) return { icon: Sparkles, color: 'text-purple-400', size: 'w-32 h-32' };
  return { icon: Zap, color: 'text-yellow-400', size: 'w-36 h-36' };
};

export function AiAvatar({ level, type }: AiAvatarProps) {
  const { icon: Icon, color, size } = getAvatarForLevel(level);
  
  return (
    <motion.div
      className="relative"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-3xl" />
      
      {/* Avatar */}
      <div className="relative">
        <Icon className={`${size} ${color} drop-shadow-2xl`} strokeWidth={1.5} />
      </div>
      
      {/* Sparkles for high levels */}
      {level >= 20 && (
        <>
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-3 h-3 text-accent-400" />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
