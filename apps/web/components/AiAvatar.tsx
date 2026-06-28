'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, Cpu, Zap } from 'lucide-react';

interface AiAvatarProps {
  level: number;
  type: string;
  // compact = true quand l'avatar est dans le bouton tap (taille reduite)
  compact?: boolean;
}

const getAvatarConfig = (level: number) => {
  if (level < 5)  return { icon: Brain,    color: 'text-blue-400',   glow: 'rgba(59,130,246,0.4)',   size: 'w-28 h-28' };
  if (level < 10) return { icon: Brain,    color: 'text-cyan-400',   glow: 'rgba(34,211,238,0.4)',   size: 'w-32 h-32' };
  if (level < 20) return { icon: Cpu,      color: 'text-accent-400', glow: 'rgba(139,92,246,0.4)',   size: 'w-36 h-36' };
  if (level < 50) return { icon: Sparkles, color: 'text-purple-400', glow: 'rgba(168,85,247,0.4)',   size: 'w-40 h-40' };
  return              { icon: Zap,      color: 'text-yellow-400', glow: 'rgba(234,179,8,0.4)',    size: 'w-44 h-44' };
};

export function AiAvatar({ level, type }: AiAvatarProps) {
  const { icon: Icon, color, glow, size } = getAvatarConfig(level);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Halo glow dynamique selon le niveau */}
      <div
        className="absolute rounded-full blur-2xl opacity-50"
        style={{ width: '120%', height: '120%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
      />

      {/* Icone principale */}
      <Icon className={`${size} ${color} drop-shadow-2xl`} strokeWidth={1.2} />

      {/* Particules orbitales pour les niveaux avances */}
      {level >= 10 && (
        <motion.div
          className="absolute"
          style={{ top: '-6px', right: '-6px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-5 h-5 text-yellow-300 opacity-80" />
        </motion.div>
      )}
      {level >= 20 && (
        <motion.div
          className="absolute"
          style={{ bottom: '-4px', left: '-6px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-4 h-4 text-accent-300 opacity-70" />
        </motion.div>
      )}
      {level >= 50 && (
        <motion.div
          className="absolute"
          style={{ top: '30%', left: '-12px' }}
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Zap className="w-4 h-4 text-yellow-400 opacity-70" />
        </motion.div>
      )}
    </motion.div>
  );
}
