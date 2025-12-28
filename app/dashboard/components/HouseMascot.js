'use client';
import { useState, useEffect } from 'react';

// Animated SVG Mascots - Not GIFs, but code!
const PhoenixMascot = ({ celebrating, color = '#ef4444' }) => {
  const [wingAngle, setWingAngle] = useState(0);
  const [flameIntensity, setFlameIntensity] = useState(1);

  useEffect(() => {
    if (!celebrating) return;
    const wingInterval = setInterval(() => {
      setWingAngle(prev => Math.sin(Date.now() / 100) * 15);
    }, 50);
    const flameInterval = setInterval(() => {
      setFlameIntensity(0.8 + Math.random() * 0.4);
    }, 100);
    return () => { clearInterval(wingInterval); clearInterval(flameInterval); };
  }, [celebrating]);

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${celebrating ? 'animate-bounce' : ''}`}>
      <defs>
        <filter id="flame-turbulence">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
        <linearGradient id="phoenix-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      
      {/* Body */}
      <ellipse cx="50" cy="55" rx="20" ry="25" fill="url(#phoenix-gradient)" />
      
      {/* Left Wing */}
      <path 
        d="M30 50 Q10 40 15 25 Q25 35 30 45" 
        fill={color} 
        style={{ transform: `rotate(${wingAngle}deg)`, transformOrigin: '30px 50px' }}
      />
      
      {/* Right Wing */}
      <path 
        d="M70 50 Q90 40 85 25 Q75 35 70 45" 
        fill={color}
        style={{ transform: `rotate(${-wingAngle}deg)`, transformOrigin: '70px 50px' }}
      />
      
      {/* Head */}
      <circle cx="50" cy="30" r="12" fill="#fbbf24" />
      
      {/* Beak */}
      <path d="M50 35 L47 42 L53 42 Z" fill="#f97316" />
      
      {/* Eyes */}
      <circle cx="46" cy="28" r="2" fill="#000" />
      <circle cx="54" cy="28" r="2" fill="#000" />
      <circle cx="46.5" cy="27.5" r="0.5" fill="#fff" />
      <circle cx="54.5" cy="27.5" r="0.5" fill="#fff" />
      
      {/* Flame Tail */}
      <g style={{ opacity: flameIntensity }} filter={celebrating ? "url(#flame-turbulence)" : undefined}>
        <path d="M50 80 Q45 90 40 95 Q50 85 50 80" fill="#fbbf24" />
        <path d="M50 80 Q55 90 60 95 Q50 85 50 80" fill="#f97316" />
        <path d="M50 80 Q50 92 50 98 Q50 85 50 80" fill={color} />
      </g>
      
      {/* Crown (when celebrating) */}
      {celebrating && (
        <g className="animate-bounce">
          <path d="M38 18 L42 10 L46 16 L50 8 L54 16 L58 10 L62 18 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
};

const WolfMascot = ({ celebrating, color = '#3b82f6' }) => {
  const [earTwitch, setEarTwitch] = useState(0);
  const [tailWag, setTailWag] = useState(0);

  useEffect(() => {
    const earInterval = setInterval(() => {
      if (Math.random() > 0.7) setEarTwitch(prev => (prev === 0 ? 8 : 0));
    }, 2000);
    
    if (celebrating) {
      const tailInterval = setInterval(() => {
        setTailWag(Math.sin(Date.now() / 100) * 20);
      }, 50);
      return () => { clearInterval(earInterval); clearInterval(tailInterval); };
    }
    return () => clearInterval(earInterval);
  }, [celebrating]);

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${celebrating ? 'animate-pulse' : ''}`}>
      {/* Body */}
      <ellipse cx="50" cy="65" rx="25" ry="20" fill={color} />
      
      {/* Head */}
      <circle cx="50" cy="35" r="18" fill={color} />
      
      {/* Snout */}
      <ellipse cx="50" cy="45" rx="8" ry="6" fill="#93c5fd" />
      <ellipse cx="50" cy="42" rx="4" ry="2" fill="#1e3a5f" />
      
      {/* Left Ear */}
      <path 
        d="M32 25 L28 5 L40 20 Z" 
        fill={color}
        style={{ transform: `rotate(${-earTwitch}deg)`, transformOrigin: '35px 20px' }}
      />
      
      {/* Right Ear */}
      <path 
        d="M68 25 L72 5 L60 20 Z" 
        fill={color}
        style={{ transform: `rotate(${earTwitch}deg)`, transformOrigin: '65px 20px' }}
      />
      
      {/* Eyes */}
      <ellipse cx="42" cy="32" rx="4" ry="5" fill="#fff" />
      <ellipse cx="58" cy="32" rx="4" ry="5" fill="#fff" />
      <circle cx="43" cy="33" r="2" fill="#1e3a5f" />
      <circle cx="59" cy="33" r="2" fill="#1e3a5f" />
      
      {/* Tail */}
      <path 
        d="M75 70 Q90 60 95 50 Q85 65 75 70" 
        fill={color}
        style={{ transform: `rotate(${tailWag}deg)`, transformOrigin: '75px 70px' }}
      />
      
      {/* Paws */}
      <ellipse cx="35" cy="85" rx="6" ry="4" fill="#93c5fd" />
      <ellipse cx="65" cy="85" rx="6" ry="4" fill="#93c5fd" />
      
      {celebrating && (
        <text x="50" y="15" textAnchor="middle" fontSize="12" fill="#fbbf24">★</text>
      )}
    </svg>
  );
};

const HawkMascot = ({ celebrating, color = '#22c55e' }) => {
  const [wingSpan, setWingSpan] = useState(0);

  useEffect(() => {
    if (!celebrating) return;
    const wingInterval = setInterval(() => {
      setWingSpan(Math.sin(Date.now() / 150) * 10);
    }, 50);
    return () => clearInterval(wingInterval);
  }, [celebrating]);

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${celebrating ? 'animate-pulse' : ''}`}>
      {/* Body */}
      <ellipse cx="50" cy="60" rx="15" ry="25" fill={color} />
      
      {/* Left Wing */}
      <path 
        d="M35 55 Q5 45 10 30 Q20 50 35 55" 
        fill={color}
        style={{ transform: `translateX(${-wingSpan}px)` }}
      />
      
      {/* Right Wing */}
      <path 
        d="M65 55 Q95 45 90 30 Q80 50 65 55" 
        fill={color}
        style={{ transform: `translateX(${wingSpan}px)` }}
      />
      
      {/* Head */}
      <circle cx="50" cy="30" r="14" fill="#fef3c7" />
      
      {/* Beak */}
      <path d="M50 35 L45 42 L50 48 L55 42 Z" fill="#f59e0b" />
      
      {/* Eyes */}
      <circle cx="44" cy="28" r="4" fill="#fff" />
      <circle cx="56" cy="28" r="4" fill="#fff" />
      <circle cx="44" cy="29" r="2" fill="#000" />
      <circle cx="56" cy="29" r="2" fill="#000" />
      
      {/* Eyebrows (fierce look) */}
      <line x1="40" y1="22" x2="48" y2="24" stroke="#000" strokeWidth="2" />
      <line x1="60" y1="22" x2="52" y2="24" stroke="#000" strokeWidth="2" />
      
      {/* Tail feathers */}
      <path d="M45 85 L42 98 L50 90 L58 98 L55 85" fill={color} />
      
      {celebrating && (
        <g className="animate-bounce">
          <circle cx="20" cy="20" r="3" fill="#fbbf24" />
          <circle cx="80" cy="20" r="3" fill="#fbbf24" />
          <circle cx="50" cy="5" r="3" fill="#fbbf24" />
        </g>
      )}
    </svg>
  );
};

const PantherMascot = ({ celebrating, color = '#a855f7' }) => {
  const [eyeGlow, setEyeGlow] = useState(false);
  const [tailCurl, setTailCurl] = useState(0);

  useEffect(() => {
    const glowInterval = setInterval(() => {
      setEyeGlow(prev => !prev);
    }, 2000);
    
    if (celebrating) {
      const tailInterval = setInterval(() => {
        setTailCurl(Math.sin(Date.now() / 200) * 15);
      }, 50);
      return () => { clearInterval(glowInterval); clearInterval(tailInterval); };
    }
    return () => clearInterval(glowInterval);
  }, [celebrating]);

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${celebrating ? 'animate-pulse' : ''}`}>
      <defs>
        <filter id="eye-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Body */}
      <ellipse cx="50" cy="65" rx="28" ry="18" fill={color} />
      
      {/* Head */}
      <ellipse cx="50" cy="35" rx="16" ry="14" fill={color} />
      
      {/* Ears */}
      <path d="M35 25 L30 10 L40 22" fill={color} />
      <path d="M65 25 L70 10 L60 22" fill={color} />
      <path d="M36 24 L33 14 L40 22" fill="#e9d5ff" />
      <path d="M64 24 L67 14 L60 22" fill="#e9d5ff" />
      
      {/* Eyes */}
      <g filter={eyeGlow ? "url(#eye-glow)" : undefined}>
        <ellipse cx="43" cy="33" rx="5" ry="6" fill={eyeGlow ? "#4ade80" : "#fef08a"} />
        <ellipse cx="57" cy="33" rx="5" ry="6" fill={eyeGlow ? "#4ade80" : "#fef08a"} />
        <ellipse cx="43" cy="33" rx="2" ry="4" fill="#000" />
        <ellipse cx="57" cy="33" rx="2" ry="4" fill="#000" />
      </g>
      
      {/* Nose */}
      <ellipse cx="50" cy="42" rx="3" ry="2" fill="#1f1f1f" />
      
      {/* Whisker spots */}
      <circle cx="40" cy="45" r="1" fill="#c4b5fd" />
      <circle cx="38" cy="43" r="1" fill="#c4b5fd" />
      <circle cx="60" cy="45" r="1" fill="#c4b5fd" />
      <circle cx="62" cy="43" r="1" fill="#c4b5fd" />
      
      {/* Tail */}
      <path 
        d={`M78 65 Q95 ${55 + tailCurl} 90 ${40 + tailCurl}`}
        fill="none" 
        stroke={color} 
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Paws */}
      <ellipse cx="32" cy="82" rx="7" ry="4" fill={color} />
      <ellipse cx="68" cy="82" rx="7" ry="4" fill={color} />
      
      {celebrating && (
        <g>
          <circle cx="50" cy="10" r="4" fill="#fbbf24" className="animate-ping" />
        </g>
      )}
    </svg>
  );
};

// Main Component
export default function HouseMascot({ 
  house, 
  size = 'md', 
  celebrating = false,
  showScore = false,
  onClick 
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const getMascotComponent = () => {
    const name = house?.name?.toLowerCase() || '';
    const color = house?.color || '#3b82f6';
    
    if (name.includes('phoenix') || name.includes('fire')) {
      return <PhoenixMascot celebrating={celebrating} color={color} />;
    }
    if (name.includes('wolf') || name.includes('wolves')) {
      return <WolfMascot celebrating={celebrating} color={color} />;
    }
    if (name.includes('hawk') || name.includes('eagle') || name.includes('thunder')) {
      return <HawkMascot celebrating={celebrating} color={color} />;
    }
    if (name.includes('panther') || name.includes('shadow') || name.includes('cat')) {
      return <PantherMascot celebrating={celebrating} color={color} />;
    }
    
    // Default: show emoji
    return (
      <div className={`flex items-center justify-center text-4xl ${celebrating ? 'animate-bounce' : ''}`}>
        {house?.mascot || '🏫'}
      </div>
    );
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} cursor-pointer transition-transform hover:scale-105`}
      onClick={onClick}
    >
      {getMascotComponent()}
      
      {showScore && house?.score !== undefined && (
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: house.color }}
        >
          {house.score.toLocaleString()}
        </div>
      )}
      
      {/* Points floating animation when celebrating */}
      {celebrating && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-400 font-black text-lg animate-bounce">
          +1
        </div>
      )}
    </div>
  );
}
