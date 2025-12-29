'use client';
import { useState, useRef, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { MASCOT_POOL } from '../../../constants/defaults';

export default function HouseStandings({ 
  houses = [], 
  theme = 'obsidian',
  sandboxMode = false,
  onTriggerBattle,
}) {
  const sorted = [...houses].sort((a, b) => (b.score || 0) - (a.score || 0));
  const maxScore = sorted[0]?.score || 1;

  // Track click counts for sandbox battle trigger
  const [clickCounts, setClickCounts] = useState({});

  const handleMascotClick = (houseId) => {
    if (!sandboxMode) return;

    const newCount = (clickCounts[houseId] || 0) + 1;
    setClickCounts(prev => ({ ...prev, [houseId]: newCount }));

    // Triple-click triggers battle
    if (newCount >= 3) {
      onTriggerBattle?.(houseId);
      setClickCounts(prev => ({ ...prev, [houseId]: 0 }));
    }

    // Reset after 1 second
    setTimeout(() => {
      setClickCounts(prev => ({ ...prev, [houseId]: 0 }));
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
          />
        ))}
      </AnimatePresence>

      {houses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">No houses configured</div>
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
}) {
  const isLeading = index === 0 && house.score > 0;
  const percentage = maxScore > 0 ? ((house.score || 0) / maxScore) * 100 : 0;
  const cardRef = useRef(null);

  // Mouse tracking for holographic tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });
  
  // Spotlight gradient position
  const spotlightX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const spotlightY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

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

  // Get mascot config if available
  const mascotConfig = MASCOT_POOL.find(m => m.id === house.mascotId);

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
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
        isLeading 
          ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/30' 
          : 'bg-card/60 backdrop-blur-xl border-white/10 hover:border-white/20'
      }`}
    >
      {/* Holographic spotlight overlay */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
        style={{
          background: useTransform(
            [spotlightX, spotlightY],
            ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`
          ),
        }}
      />

      {/* Leading crown */}
      {isLeading && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-3 -right-2 z-10"
        >
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          >
            <Crown size={24} className="text-amber-400 drop-shadow-lg" fill="currentColor" />
          </motion.div>
        </motion.div>
      )}

      <div className="flex items-center gap-3 relative z-10">
        {/* Mascot */}
        <motion.div 
          onClick={onMascotClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={isLeading ? {
            y: [0, -4, 0],
            scale: [1, 1.05, 1],
          } : {}}
          transition={isLeading ? {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
          className={`relative w-14 h-14 rounded-xl flex items-center justify-center text-3xl cursor-pointer select-none ${
            isLeading ? 'shadow-lg' : ''
          }`}
          style={{ 
            backgroundColor: `${house.color}20`,
            boxShadow: isLeading ? `0 0 20px ${house.color}40` : undefined,
          }}
        >
          {house.mascot}
          
          {/* Click indicator for sandbox */}
          {sandboxMode && clickCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center justify-center"
            >
              {clickCount}
            </motion.div>
          )}

          {/* Aura glow */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: house.color }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
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
          
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: house.color }}
            />
          </div>
        </div>

        {/* Score */}
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

      {/* Sandbox hint */}
      {sandboxMode && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground opacity-50">
          Triple-click mascot to battle
        </div>
      )}
    </motion.div>
  );
}

/**
 * Points animation component - shows floating points when awarded
 */
export function PointsAnimation({ house, points, type = 'add' }) {
  const isPositive = type === 'add';
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ 
        opacity: 0, 
        y: isPositive ? -50 : 50, 
        scale: 1.5 
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`fixed z-50 font-black text-2xl pointer-events-none ${
        isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}
      style={{
        textShadow: `0 0 10px ${isPositive ? '#10b981' : '#ef4444'}`,
      }}
    >
      {isPositive ? '+' : ''}{points}
    </motion.div>
  );
}

/**
 * Damage animation for infractions
 */
export function DamageAnimation({ house, points }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.8],
        y: [0, -30, -50, -70],
      }}
      transition={{ duration: 1, times: [0, 0.2, 0.5, 1] }}
      className="fixed z-50 pointer-events-none"
    >
      <div className="relative">
        {/* Hit effect */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 2, 0] }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full"
          style={{ 
            backgroundColor: '#ef4444',
            filter: 'blur(20px)',
          }}
        />
        
        {/* Points text */}
        <span 
          className="relative z-10 font-black text-3xl text-red-400"
          style={{ textShadow: '0 0 20px #ef4444' }}
        >
          -{points}
        </span>
      </div>
    </motion.div>
  );
}
