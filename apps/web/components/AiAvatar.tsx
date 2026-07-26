'use client';

import { motion } from 'framer-motion';
import { Sparkles, Cpu, Zap } from 'lucide-react';
import Image from 'next/image';

interface AiAvatarProps {
  level: number;
  type: string;
  compact?: boolean;
}

/** Niveau 0-4 : robot PNG photo-réaliste */
function RobotLevel1() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Halo violet doux derrière le robot */}
      <div
        className="absolute rounded-full blur-2xl opacity-40"
        style={{
          width: '130%',
          height: '130%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
        }}
      />
      <Image
        src="/10971-removebg-preview.png"
        alt="AI Robot — Level 1"
        width={180}
        height={180}
        priority
        draggable={false}
        style={{ objectFit: 'contain', userSelect: 'none' }}
      />
    </motion.div>
  );
}

const getAvatarConfig = (level: number) => {
  if (level < 10) return { color: 'text-cyan-400',   glow: 'rgba(34,211,238,0.4)',   size: 'w-32 h-32' };
  if (level < 20) return { color: 'text-accent-400', glow: 'rgba(139,92,246,0.4)',   size: 'w-36 h-36' };
  if (level < 50) return { color: 'text-purple-400', glow: 'rgba(168,85,247,0.4)',   size: 'w-40 h-40' };
  return              { color: 'text-yellow-400', glow: 'rgba(234,179,8,0.4)',    size: 'w-44 h-44' };
};

export function AiAvatar({ level, type }: AiAvatarProps) {
  // Niveau 0-4 → robot photo-réaliste PNG
  if (level < 5) return <RobotLevel1 />;

  // Niveau 5+ → avatars évolutifs (à personnaliser)
  const { color, glow, size } = getAvatarConfig(level);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="absolute rounded-full blur-2xl opacity-50"
        style={{ width: '120%', height: '120%', background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
      />

      {/* Placeholder SVG robot simplifié pour les niveaux 5+ en attendant les prochains assets */}
      <svg viewBox="0 0 100 120" className={size} style={{ filter: `drop-shadow(0 0 12px ${glow})` }}>
        {/* Tête */}
        <ellipse cx="50" cy="32" rx="26" ry="26" fill="#1e1b4b" stroke={color.replace('text-','').replace('-400','')} strokeWidth="1.5"/>
        {/* Yeux */}
        <circle cx="40" cy="30" r="5" fill="#06b6d4" opacity="0.9"/>
        <circle cx="60" cy="30" r="5" fill="#06b6d4" opacity="0.9"/>
        <circle cx="41" cy="29" r="2" fill="white" opacity="0.6"/>
        <circle cx="61" cy="29" r="2" fill="white" opacity="0.6"/>
        {/* Corps */}
        <rect x="24" y="60" width="52" height="46" rx="14" fill="#1e1b4b" stroke={color.replace('text-','').replace('-400','')} strokeWidth="1.5"/>
        {/* Cou */}
        <rect x="43" y="55" width="14" height="10" rx="4" fill="#1e1b4b"/>
        {/* Badge AI */}
        <circle cx="50" cy="82" r="9" fill="#312e81" stroke="#7c3aed" strokeWidth="1.5"/>
        <text x="50" y="86" textAnchor="middle" fontSize="7" fill="#a78bfa" fontWeight="bold">AI</text>
        {/* Bras */}
        <rect x="10" y="63" width="13" height="24" rx="6" fill="#1e1b4b" stroke={color.replace('text-','').replace('-400','')} strokeWidth="1.5"/>
        <rect x="77" y="63" width="13" height="24" rx="6" fill="#1e1b4b" stroke={color.replace('text-','').replace('-400','')} strokeWidth="1.5"/>
      </svg>

      {level >= 10 && (
        <motion.div className="absolute" style={{ top: '-6px', right: '-6px' }}
          animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-5 h-5 text-yellow-300 opacity-80" />
        </motion.div>
      )}
      {level >= 20 && (
        <motion.div className="absolute" style={{ bottom: '-4px', left: '-6px' }}
          animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-4 h-4 text-accent-300 opacity-70" />
        </motion.div>
      )}
      {level >= 50 && (
        <motion.div className="absolute" style={{ top: '30%', left: '-12px' }}
          animate={{ y: [-4, 4, -4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <Zap className="w-4 h-4 text-yellow-400 opacity-70" />
        </motion.div>
      )}
    </motion.div>
  );
}
