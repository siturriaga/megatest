'use client';
import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Crown } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { MASCOT_POOL, BATTLE_MILESTONES, getMascotById } from '@/constants/defaults';

/**
 * 12 SVG MASCOT COMPONENTS
 * Each with: breathing, blinking, celebration, and idle animations
 * Uses unique IDs to prevent gradient/filter collisions
 */

// Utility to generate unique ID for SVG elements
const useSvgId = (prefix) => {
  const reactId = useId();
  return `${prefix}-${reactId.replace(/:/g, '')}`;
};

// 1. PHOENIX
const PhoenixSVG = ({ color = '#ef4444', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `phoenix-grad-${instanceId || size}`;
  const glowId = `phoenix-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#ff4500" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className={isCelebrating ? 'animate-flame-intense' : 'animate-flame'}>
        <path d="M30 80 Q35 60, 40 70 Q42 50, 50 60 Q55 40, 60 55 Q65 45, 70 65 Q75 55, 70 80" fill={`url(#${gradId})`} opacity="0.7" />
      </g>
      <ellipse cx="50" cy="55" rx="18" ry="22" fill={`url(#${gradId})`} filter={`url(#${glowId})`} className="animate-breathe" />
      <g className={isCelebrating ? 'animate-wing-flap' : ''}>
        <path d="M32 50 Q20 35, 15 55 Q20 50, 32 55" fill={color} />
        <path d="M68 50 Q80 35, 85 55 Q80 50, 68 55" fill={color} />
      </g>
      <ellipse cx="50" cy="32" rx="12" ry="10" fill={`url(#${gradId})`} />
      <path d="M50 36 L54 40 L50 38 L46 40 Z" fill="#ff8c00" />
      <g className="animate-blink">
        <circle cx="45" cy="30" r="3" fill="#fff" />
        <circle cx="55" cy="30" r="3" fill="#fff" />
        <circle cx="45" cy="30" r="1.5" fill="#000" />
        <circle cx="55" cy="30" r="1.5" fill="#000" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M38 18 L42 10 L46 16 L50 8 L54 16 L58 10 L62 18 Z" fill="#ffd700" stroke="#ff8c00" strokeWidth="1" /></g>}
    </svg>
  );
};

// 2. WOLF
const WolfSVG = ({ color = '#3b82f6', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `wolf-grad-${instanceId || size}`;
  const glowId = `wolf-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="60" rx="22" ry="18" fill={`url(#${gradId})`} className="animate-breathe" />
      <rect x="32" y="72" width="8" height="18" rx="3" fill={color} />
      <rect x="60" y="72" width="8" height="18" rx="3" fill={color} />
      <path d="M72 55 Q85 45, 88 60 Q85 55, 75 60" fill={`url(#${gradId})`} className={isCelebrating ? 'animate-wag-fast' : 'animate-wag'} style={{ transformOrigin: '72px 55px' }} />
      <ellipse cx="50" cy="35" rx="16" ry="14" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M35 30 L30 15 L40 25" fill={color} className="animate-ear-twitch" />
      <path d="M65 30 L70 15 L60 25" fill={color} />
      <ellipse cx="50" cy="42" rx="8" ry="5" fill="#4a6fa5" />
      <ellipse cx="50" cy="40" rx="4" ry="2.5" fill="#1a2a3a" />
      <g className="animate-blink">
        <circle cx="43" cy="32" r="4" fill="#00ffff" filter={`url(#${glowId})`} />
        <circle cx="57" cy="32" r="4" fill="#00ffff" filter={`url(#${glowId})`} />
        <circle cx="43" cy="32" r="2" fill="#fff" />
        <circle cx="57" cy="32" r="2" fill="#fff" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M35 12 L40 4 L45 10 L50 2 L55 10 L60 4 L65 12 Z" fill="#ffd700" stroke="#00ffff" strokeWidth="1" /></g>}
    </svg>
  );
};

// 3. HAWK
const HawkSVG = ({ color = '#8b5cf6', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `hawk-grad-${instanceId || size}`;
  const glowId = `hawk-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className={isCelebrating ? 'animate-wing-flap' : 'animate-breathe'}>
        <path d="M50 50 L10 35 L15 55 L25 50 L30 58 L40 52 L45 58 Z" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
        <path d="M50 50 L90 35 L85 55 L75 50 L70 58 L60 52 L55 58 Z" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      </g>
      <ellipse cx="50" cy="55" rx="15" ry="20" fill={`url(#${gradId})`} />
      <path d="M42 75 L38 90 L42 85 L46 92 L50 82 L54 92 L58 85 L62 90 L58 75" fill={color} />
      <ellipse cx="50" cy="32" rx="10" ry="9" fill={`url(#${gradId})`} />
      <path d="M50 35 L55 44 L50 42 L45 44 Z" fill="#ffd700" />
      <g className="animate-blink">
        <path d="M43 28 L48 30 L43 32" fill="#fff" />
        <path d="M57 28 L52 30 L57 32" fill="#fff" />
        <circle cx="45" cy="30" r="1.5" fill="#000" />
        <circle cx="55" cy="30" r="1.5" fill="#000" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M40 20 L44 12 L48 18 L50 10 L52 18 L56 12 L60 20 Z" fill="#ffd700" stroke="#a855f7" strokeWidth="1" /></g>}
    </svg>
  );
};

// 4. PANTHER
const PantherSVG = ({ color = '#ec4899', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `panther-grad-${instanceId || size}`;
  const glowId = `panther-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#1a1a2e" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="55" rx="25" ry="15" fill={`url(#${gradId})`} className="animate-breathe" />
      <rect x="28" y="65" width="7" height="20" rx="3" fill={color} />
      <rect x="38" y="67" width="7" height="18" rx="3" fill={color} />
      <rect x="55" y="67" width="7" height="18" rx="3" fill={color} />
      <rect x="65" y="65" width="7" height="20" rx="3" fill={color} />
      <path d="M75 55 Q90 45, 92 60 Q88 50, 85 65" fill={`url(#${gradId})`} className={isCelebrating ? 'animate-wag-fast' : 'animate-wag'} style={{ transformOrigin: '75px 55px' }} />
      <ellipse cx="50" cy="38" rx="14" ry="12" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M38 32 L32 20 L42 28" fill={color} />
      <path d="M62 32 L68 20 L58 28" fill={color} />
      <path d="M38 32 L35 24 L40 29" fill="#e91e63" />
      <path d="M62 32 L65 24 L60 29" fill="#e91e63" />
      <ellipse cx="50" cy="44" rx="6" ry="4" fill="#2a2a4a" />
      <ellipse cx="50" cy="42" rx="3" ry="2" fill="#e91e63" />
      <g className="animate-blink">
        <ellipse cx="44" cy="36" rx="4" ry="3" fill="#9333ea" filter={`url(#${glowId})`} />
        <ellipse cx="56" cy="36" rx="4" ry="3" fill="#9333ea" filter={`url(#${glowId})`} />
        <ellipse cx="44" cy="36" rx="2" ry="1.5" fill="#fff" />
        <ellipse cx="56" cy="36" rx="2" ry="1.5" fill="#fff" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M38 16 L42 8 L46 14 L50 6 L54 14 L58 8 L62 16 Z" fill="#ffd700" stroke="#9333ea" strokeWidth="1" /></g>}
    </svg>
  );
};

// 5. DRAGON
const DragonSVG = ({ color = '#f59e0b', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `dragon-grad-${instanceId || size}`;
  const glowId = `dragon-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className={isCelebrating ? 'animate-flame-intense' : 'animate-flame'}>
        <path d="M45 75 Q42 85, 50 90 Q58 85, 55 75" fill="#ff6b00" opacity="0.8" />
      </g>
      <ellipse cx="50" cy="55" rx="20" ry="18" fill={`url(#${gradId})`} className="animate-breathe" />
      <g className={isCelebrating ? 'animate-wing-flap' : ''}>
        <path d="M30 45 Q15 30, 10 50 Q15 55, 20 45 Q22 55, 30 50" fill={color} />
        <path d="M70 45 Q85 30, 90 50 Q85 55, 80 45 Q78 55, 70 50" fill={color} />
      </g>
      <ellipse cx="50" cy="32" rx="14" ry="12" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M40 22 L38 12 L44 18" fill={color} />
      <path d="M50 20 L50 10 L52 10 L52 20" fill={color} />
      <path d="M60 22 L62 12 L56 18" fill={color} />
      <path d="M50 38 L54 45 L50 43 L46 45 Z" fill="#ff6b00" />
      <g className="animate-blink">
        <ellipse cx="44" cy="30" rx="4" ry="3" fill="#ff0" />
        <ellipse cx="56" cy="30" rx="4" ry="3" fill="#ff0" />
        <ellipse cx="44" cy="30" rx="2" ry="1.5" fill="#000" />
        <ellipse cx="56" cy="30" rx="2" ry="1.5" fill="#000" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M38 8 L42 0 L46 6 L50 -2 L54 6 L58 0 L62 8 Z" fill="#ffd700" stroke="#f59e0b" strokeWidth="1" /></g>}
    </svg>
  );
};

// 6. LION
const LionSVG = ({ color = '#eab308', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `lion-grad-${instanceId || size}`;
  const glowId = `lion-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className={isCelebrating ? 'animate-breathe-intense' : 'animate-breathe'}>
        <circle cx="50" cy="40" r="28" fill={`url(#${gradId})`} opacity="0.6" />
        <circle cx="50" cy="40" r="22" fill={`url(#${gradId})`} opacity="0.8" />
      </g>
      <ellipse cx="50" cy="55" rx="18" ry="15" fill={`url(#${gradId})`} />
      <rect x="35" y="68" width="8" height="18" rx="3" fill={color} />
      <rect x="57" y="68" width="8" height="18" rx="3" fill={color} />
      <path d="M72 55 Q82 50, 85 62 Q80 58, 76 65" fill={color} className={isCelebrating ? 'animate-wag-fast' : 'animate-wag'} style={{ transformOrigin: '72px 55px' }} />
      <ellipse cx="50" cy="40" rx="16" ry="14" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <ellipse cx="50" cy="48" rx="8" ry="5" fill="#d4a" />
      <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#1a1a2e" />
      <g className="animate-blink">
        <circle cx="43" cy="38" r="4" fill="#fff" />
        <circle cx="57" cy="38" r="4" fill="#fff" />
        <circle cx="43" cy="38" r="2" fill="#000" />
        <circle cx="57" cy="38" r="2" fill="#000" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M38 12 L42 4 L46 10 L50 2 L54 10 L58 4 L62 12 Z" fill="#ffd700" stroke="#eab308" strokeWidth="1" /></g>}
    </svg>
  );
};

// 7. BEAR
const BearSVG = ({ color = '#06b6d4', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `bear-grad-${instanceId || size}`;
  const glowId = `bear-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="60" rx="26" ry="22" fill={`url(#${gradId})`} className="animate-breathe" />
      <rect x="28" y="76" width="10" height="14" rx="4" fill={color} />
      <rect x="62" y="76" width="10" height="14" rx="4" fill={color} />
      <ellipse cx="50" cy="38" rx="20" ry="18" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <circle cx="32" cy="28" r="8" fill={color} />
      <circle cx="68" cy="28" r="8" fill={color} />
      <circle cx="32" cy="28" r="5" fill="#0891b2" />
      <circle cx="68" cy="28" r="5" fill="#0891b2" />
      <ellipse cx="50" cy="48" rx="10" ry="8" fill="#0891b2" />
      <ellipse cx="50" cy="46" rx="5" ry="3" fill="#1a1a2e" />
      <g className="animate-blink">
        <circle cx="42" cy="36" r="4" fill="#fff" />
        <circle cx="58" cy="36" r="4" fill="#fff" />
        <circle cx="42" cy="36" r="2" fill="#000" />
        <circle cx="58" cy="36" r="2" fill="#000" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M38 10 L42 2 L46 8 L50 0 L54 8 L58 2 L62 10 Z" fill="#ffd700" stroke="#06b6d4" strokeWidth="1" /></g>}
    </svg>
  );
};

// 8. TIGER
const TigerSVG = ({ color = '#22c55e', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `tiger-grad-${instanceId || size}`;
  const glowId = `tiger-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="58" rx="24" ry="18" fill={`url(#${gradId})`} className="animate-breathe" />
      <path d="M35 58 L32 58 L34 68 L38 68" stroke="#166534" strokeWidth="3" fill="none" />
      <path d="M45 58 L42 58 L44 70 L48 70" stroke="#166534" strokeWidth="3" fill="none" />
      <path d="M55 58 L58 58 L56 70 L52 70" stroke="#166534" strokeWidth="3" fill="none" />
      <path d="M65 58 L68 58 L66 68 L62 68" stroke="#166534" strokeWidth="3" fill="none" />
      <rect x="30" y="70" width="8" height="16" rx="3" fill={color} />
      <rect x="62" y="70" width="8" height="16" rx="3" fill={color} />
      <path d="M74 55 Q88 48, 90 62 Q85 55, 80 65" fill={`url(#${gradId})`} className={isCelebrating ? 'animate-wag-fast' : 'animate-wag'} style={{ transformOrigin: '74px 55px' }} />
      <ellipse cx="50" cy="36" rx="18" ry="16" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M36 30 L30 18 L42 26" fill={color} className="animate-ear-twitch" />
      <path d="M64 30 L70 18 L58 26" fill={color} />
      <path d="M50 28 L50 22" stroke="#166534" strokeWidth="3" />
      <path d="M44 32 L38 28" stroke="#166534" strokeWidth="2" />
      <path d="M56 32 L62 28" stroke="#166534" strokeWidth="2" />
      <ellipse cx="50" cy="44" rx="7" ry="5" fill="#166534" />
      <ellipse cx="50" cy="42" rx="3" ry="2" fill="#f97316" />
      <g className="animate-blink">
        <ellipse cx="42" cy="34" rx="4" ry="3" fill="#fef08a" />
        <ellipse cx="58" cy="34" rx="4" ry="3" fill="#fef08a" />
        <ellipse cx="42" cy="34" rx="2" ry="1.5" fill="#000" />
        <ellipse cx="58" cy="34" rx="2" ry="1.5" fill="#000" />
      </g>
      {isLeader && <g className="animate-bob"><path d="M38 14 L42 6 L46 12 L50 4 L54 12 L58 6 L62 14 Z" fill="#ffd700" stroke="#22c55e" strokeWidth="1" /></g>}
    </svg>
  );
};

// 9. OWL
const OwlSVG = ({ color = '#6366f1', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `owl-grad-${instanceId || size}`;
  const glowId = `owl-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="58" rx="22" ry="24" fill={`url(#${gradId})`} className="animate-breathe" />
      <ellipse cx="50" cy="68" rx="12" ry="8" fill="#4338ca" />
      <path d="M38 68 L42 70 L38 72 L42 74 L38 76" stroke="#c7d2fe" strokeWidth="2" fill="none" />
      <path d="M62 68 L58 70 L62 72 L58 74 L62 76" stroke="#c7d2fe" strokeWidth="2" fill="none" />
      <g className={isCelebrating ? 'animate-wing-flap' : ''}>
        <path d="M28 50 Q18 45, 15 60 Q22 55, 28 62" fill={color} />
        <path d="M72 50 Q82 45, 85 60 Q78 55, 72 62" fill={color} />
      </g>
      <ellipse cx="50" cy="38" rx="22" ry="20" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M35 28 L28 18 L38 26" fill={color} />
      <path d="M65 28 L72 18 L62 26" fill={color} />
      <g className="animate-blink">
        <circle cx="40" cy="38" r="10" fill="#1e1b4b" />
        <circle cx="60" cy="38" r="10" fill="#1e1b4b" />
        <circle cx="40" cy="38" r="7" fill="#fef08a" filter={`url(#${glowId})`} />
        <circle cx="60" cy="38" r="7" fill="#fef08a" filter={`url(#${glowId})`} />
        <circle cx="40" cy="38" r="3" fill="#000" />
        <circle cx="60" cy="38" r="3" fill="#000" />
      </g>
      <path d="M50 48 L53 54 L50 52 L47 54 Z" fill="#f59e0b" />
      {isLeader && <g className="animate-bob"><path d="M38 14 L42 6 L46 12 L50 4 L54 12 L58 6 L62 14 Z" fill="#ffd700" stroke="#6366f1" strokeWidth="1" /></g>}
    </svg>
  );
};

// 10. SHARK
const SharkSVG = ({ color = '#14b8a6', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `shark-grad-${instanceId || size}`;
  const glowId = `shark-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="55" rx="30" ry="18" fill={`url(#${gradId})`} className="animate-breathe" filter={`url(#${glowId})`} />
      <path d="M50 37 L45 20 L55 20 Z" fill={color} className={isCelebrating ? 'animate-bob' : ''} />
      <path d="M25 50 L10 45 L15 55" fill={color} />
      <path d="M75 50 L90 45 L85 55" fill={color} />
      <path d="M80 55 Q95 55, 95 60 Q90 58, 85 62" fill={`url(#${gradId})`} className={isCelebrating ? 'animate-wag-fast' : 'animate-wag'} style={{ transformOrigin: '80px 55px' }} />
      <ellipse cx="50" cy="65" rx="18" ry="6" fill="#0d9488" />
      <path d="M35 62 L32 65 L35 68 L32 71" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M65 62 L68 65 L65 68 L68 71" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
      <g className="animate-blink">
        <ellipse cx="38" cy="50" rx="5" ry="4" fill="#000" />
        <ellipse cx="62" cy="50" rx="5" ry="4" fill="#000" />
        <ellipse cx="37" cy="49" rx="2" ry="1.5" fill="#fff" />
        <ellipse cx="61" cy="49" rx="2" ry="1.5" fill="#fff" />
      </g>
      <path d="M42 58 L44 62 L46 58 L48 62 L50 58 L52 62 L54 58 L56 62 L58 58" fill="#fff" />
      {isLeader && <g className="animate-bob"><path d="M38 16 L42 8 L46 14 L50 6 L54 14 L58 8 L62 16 Z" fill="#ffd700" stroke="#14b8a6" strokeWidth="1" /></g>}
    </svg>
  );
};

// 11. BULL
const BullSVG = ({ color = '#78716c', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `bull-grad-${instanceId || size}`;
  const glowId = `bull-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#44403c" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <ellipse cx="50" cy="60" rx="28" ry="20" fill={`url(#${gradId})`} className="animate-breathe" />
      <rect x="26" y="74" width="10" height="16" rx="4" fill={color} />
      <rect x="64" y="74" width="10" height="16" rx="4" fill={color} />
      <ellipse cx="50" cy="42" rx="22" ry="18" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M28 35 Q15 25, 12 40 Q18 35, 28 42" fill="#a8a29e" />
      <path d="M72 35 Q85 25, 88 40 Q82 35, 72 42" fill="#a8a29e" />
      <circle cx="32" cy="38" r="6" fill={color} />
      <circle cx="68" cy="38" r="6" fill={color} />
      <ellipse cx="50" cy="52" rx="14" ry="10" fill="#57534e" />
      <circle cx="44" cy="52" r="3" fill="#1c1917" />
      <circle cx="56" cy="52" r="3" fill="#1c1917" />
      <g className="animate-blink">
        <ellipse cx="40" cy="40" rx="5" ry="4" fill="#fff" />
        <ellipse cx="60" cy="40" rx="5" ry="4" fill="#fff" />
        <ellipse cx="40" cy="40" rx="2.5" ry="2" fill="#000" />
        <ellipse cx="60" cy="40" rx="2.5" ry="2" fill="#000" />
      </g>
      {isCelebrating && <g className="animate-flame"><ellipse cx="44" cy="26" rx="3" ry="5" fill="#ef4444" opacity="0.8" /><ellipse cx="56" cy="26" rx="3" ry="5" fill="#ef4444" opacity="0.8" /></g>}
      {isLeader && <g className="animate-bob"><path d="M38 18 L42 10 L46 16 L50 8 L54 16 L58 10 L62 18 Z" fill="#ffd700" stroke="#78716c" strokeWidth="1" /></g>}
    </svg>
  );
};

// 12. FALCON
const FalconSVG = ({ color = '#0ea5e9', size = 48, isLeader = false, isCelebrating = false, instanceId = '' }) => {
  const gradId = `falcon-grad-${instanceId || size}`;
  const glowId = `falcon-glow-${instanceId || size}`;
  
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className={isCelebrating ? 'animate-wing-flap' : 'animate-breathe'}>
        <path d="M50 48 L5 30 L15 50 L25 45 L30 55 L40 48 L45 55 Z" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
        <path d="M50 48 L95 30 L85 50 L75 45 L70 55 L60 48 L55 55 Z" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      </g>
      <ellipse cx="50" cy="55" rx="14" ry="20" fill={`url(#${gradId})`} />
      <path d="M42 75 L40 88 L44 82 L48 90 L50 80 L52 90 L56 82 L60 88 L58 75" fill={color} />
      <ellipse cx="50" cy="32" rx="11" ry="10" fill={`url(#${gradId})`} filter={`url(#${glowId})`} />
      <path d="M50 36 L54 46 L50 43 L46 46 Z" fill="#fbbf24" />
      <g className="animate-blink">
        <circle cx="45" cy="30" r="3" fill="#fff" />
        <circle cx="55" cy="30" r="3" fill="#fff" />
        <circle cx="45" cy="30" r="1.5" fill="#000" />
        <circle cx="55" cy="30" r="1.5" fill="#000" />
      </g>
      <path d="M42 24 Q40 18, 45 20" fill="none" stroke={color} strokeWidth="2" />
      <path d="M58 24 Q60 18, 55 20" fill="none" stroke={color} strokeWidth="2" />
      {isLeader && <g className="animate-bob"><path d="M40 18 L44 10 L48 16 L50 8 L52 16 L56 10 L60 18 Z" fill="#ffd700" stroke="#0ea5e9" strokeWidth="1" /></g>}
    </svg>
  );
};

// Mascot component map
const SVG_MASCOTS = {
  phoenix: PhoenixSVG,
  wolf: WolfSVG,
  hawk: HawkSVG,
  panther: PantherSVG,
  dragon: DragonSVG,
  lion: LionSVG,
  bear: BearSVG,
  tiger: TigerSVG,
  owl: OwlSVG,
  shark: SharkSVG,
  bull: BullSVG,
  falcon: FalconSVG,
};

/**
 * Get SVG component for a mascot ID
 */
export function getMascotSVG(mascotId) {
  return SVG_MASCOTS[mascotId] || PhoenixSVG;
}

/**
 * HouseStandings Component
 */
export default function HouseStandings({ 
  houses = [], 
  theme = 'obsidian',
  sandboxMode = false,
  onTriggerBattle,
  celebratingHouseId = null,
  previousScores = {},
}) {
  const sorted = useMemo(() => 
    [...houses].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [houses]
  );
  const maxScore = sorted[0]?.score || 1;

  const [clickCounts, setClickCounts] = useState({});
  const lastMilestonesRef = useRef({});

  useEffect(() => {
    if (sandboxMode) return;
    
    houses.forEach(house => {
      const currentScore = house.score || 0;
      const previousScore = previousScores[house.id] || 0;
      
      const crossedMilestone = BATTLE_MILESTONES.find(milestone => 
        previousScore < milestone && currentScore >= milestone
      );
      
      if (crossedMilestone && lastMilestonesRef.current[house.id] !== crossedMilestone) {
        lastMilestonesRef.current[house.id] = crossedMilestone;
        onTriggerBattle?.(house.id, crossedMilestone);
      }
    });
  }, [houses, previousScores, sandboxMode, onTriggerBattle]);

  const handleMascotClick = (houseId) => {
    if (!sandboxMode) return;

    const newCount = (clickCounts[houseId] || 0) + 1;
    setClickCounts(prev => ({ ...prev, [houseId]: newCount }));

    if (newCount >= 3) {
      onTriggerBattle?.(houseId, 'SANDBOX_TEST');
      setClickCounts(prev => ({ ...prev, [houseId]: 0 }));
    }

    setTimeout(() => {
      setClickCounts(prev => ({ ...prev, [houseId]: Math.max(0, (prev[houseId] || 0) - 1) }));
    }, 1000);
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {sorted.map((house, index) => (
          <HouseCard
            key={house.id}
            house={house}
            index={index}
            maxScore={maxScore}
            theme={theme}
            sandboxMode={sandboxMode}
            clickCount={clickCounts[house.id] || 0}
            onMascotClick={() => handleMascotClick(house.id)}
            isCelebrating={celebratingHouseId === house.id}
          />
        ))}
      </AnimatePresence>

      {houses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No houses configured
        </div>
      )}
      
      {sandboxMode && houses.length > 0 && (
        <div className="text-center text-xs text-muted-foreground opacity-60 mt-4">
          💡 Triple-click any mascot to trigger battle
        </div>
      )}
    </div>
  );
}

function HouseCard({ 
  house, 
  index, 
  maxScore, 
  theme, 
  sandboxMode,
  clickCount,
  onMascotClick,
  isCelebrating,
}) {
  const isLeading = index === 0 && house.score > 0;
  const percentage = maxScore > 0 ? ((house.score || 0) / maxScore) * 100 : 0;
  const cardRef = useRef(null);
  
  // Generate unique instance ID for this card's SVG
  const instanceId = useId();

  const MascotSVG = getMascotSVG(house.mascotId);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
        isLeading 
          ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/30' 
          : 'bg-card/60 backdrop-blur-xl border-white/10 hover:border-white/20'
      } ${isCelebrating ? 'animate-pulse ring-2 ring-emerald-500' : ''}`}
    >
      {isLeading && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-3 -right-2 z-10"
        >
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Crown size={24} className="text-amber-400 drop-shadow-lg" fill="currentColor" />
          </motion.div>
        </motion.div>
      )}

      <div className="flex items-center gap-3 relative z-10">
        <motion.div 
          onClick={onMascotClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={isLeading ? { y: [0, -4, 0], scale: [1, 1.05, 1] } : {}}
          transition={isLeading ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
          className="relative w-14 h-14 rounded-xl flex items-center justify-center cursor-pointer select-none overflow-hidden"
          style={{ 
            backgroundColor: `${house.color}20`,
            boxShadow: isLeading ? `0 0 20px ${house.color}40` : undefined,
          }}
        >
          <MascotSVG 
            color={house.color} 
            size={48}
            isLeader={isLeading}
            isCelebrating={isCelebrating}
            instanceId={instanceId}
          />
          
          {sandboxMode && clickCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center justify-center"
            >
              {clickCount}
            </motion.div>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold truncate">{house.name}</span>
            {isLeading && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full"
              >
                LEADING
              </motion.span>
            )}
            {house.gradeLevel && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                Gr {house.gradeLevel}
              </span>
            )}
          </div>
          
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full relative overflow-hidden"
              style={{ backgroundColor: house.color }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>
        </div>

        <div className="text-right">
          <motion.div 
            key={house.score}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl font-black" 
            style={{ color: house.color }}
          >
            {house.score?.toLocaleString() || 0}
          </motion.div>
          <div className="text-[10px] text-muted-foreground">points</div>
        </div>
      </div>
    </motion.div>
  );
}

export function PointsAnimation({ house, points, type = 'add', position }) {
  const isPositive = type === 'add';
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: isPositive ? -50 : 50, scale: 1.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`fixed z-50 font-black text-2xl pointer-events-none ${
        isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}
      style={{
        left: position?.x || '50%',
        top: position?.y || '50%',
        textShadow: `0 0 10px ${isPositive ? '#10b981' : '#ef4444'}`,
      }}
    >
      {isPositive ? '+' : ''}{points}
    </motion.div>
  );
}

export { SVG_MASCOTS };
