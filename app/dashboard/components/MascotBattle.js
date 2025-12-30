'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MASCOT_POOL, getMascotById } from '@/constants/defaults';
import { getMascotSVG } from './HouseStandings';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Battle-sized SVG Mascots (120px)
 * Imports from HouseStandings but renders at larger size with battle animations
 */

/**
 * MascotBattle Component
 * 
 * Epic full-screen battle animation when a house reaches a milestone.
 * Supports all 12 mascots.
 * 
 * Props:
 * - isActive: boolean - Whether battle is playing
 * - winnerHouse: object - The house that triggered the battle
 * - allHouses: array - All houses for rankings display
 * - milestone: number|string - The milestone reached
 * - onComplete: () => void - Called when animation finishes
 */
export default function MascotBattle({ 
  isActive, 
  winnerHouse, 
  allHouses = [], 
  milestone,
  onComplete 
}) {
  const [phase, setPhase] = useState('idle');
  const [defeatedHouses, setDefeatedHouses] = useState([]);

  const WinnerMascotSVG = winnerHouse ? getMascotSVG(winnerHouse.mascotId) : null;
  const losers = allHouses?.filter(h => h.id !== winnerHouse?.id) || [];

  useEffect(() => {
    if (!isActive || !winnerHouse) return;
    
    let cancelled = false;
    
    const run = async () => {
      setPhase('entrance'); 
      await delay(2000);
      if (cancelled) return;
      
      setPhase('challenge'); 
      await delay(2000);
      if (cancelled) return;
      
      setPhase('attack');
      for (let i = 0; i < losers.length; i++) {
        await delay(1200);
        if (cancelled) return;
        setDefeatedHouses(p => [...p, losers[i].id]);
      }
      await delay(800);
      if (cancelled) return;
      
      setPhase('victory'); 
      await delay(4000);
      if (cancelled) return;
      
      setPhase('exit'); 
      await delay(2000);
      if (cancelled) return;
      
      setPhase('idle');
      setDefeatedHouses([]);
      onComplete?.();
    };
    
    run();
    
    return () => {
      cancelled = true;
    };
  }, [isActive, winnerHouse?.id, losers.length, onComplete]);

  if (!isActive || phase === 'idle' || !winnerHouse) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* Dark backdrop */}
      <motion.div className="absolute inset-0 bg-black" animate={{ opacity: 0.95 }} />
      
      {/* Energy particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div 
            key={i} 
            className="absolute w-1 h-20 rounded-full"
            style={{ 
              background: `linear-gradient(to bottom, transparent, ${winnerHouse?.color || '#fff'})`, 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
            animate={{ y: [0, -200], opacity: [0, 1, 0] }} 
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }} 
          />
        ))}
      </div>

      {/* Arena glow */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-48" 
        style={{ background: `radial-gradient(ellipse at center bottom, ${winnerHouse?.color}40 0%, transparent 70%)` }}
        animate={{ opacity: [0.5, 0.9, 0.5] }} 
        transition={{ duration: 2, repeat: Infinity }} 
      />

      {/* Battle arena */}
      <div className="relative z-10 w-full max-w-4xl p-8">
        {/* Challenge text */}
        <AnimatePresence>
          {phase === 'challenge' && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 text-center"
            >
              <motion.h1 
                className="text-6xl sm:text-7xl font-black text-white"
                style={{ textShadow: `0 0 60px ${winnerHouse?.color}, 0 0 120px ${winnerHouse?.color}` }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                CHALLENGE!
              </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arena center */}
        <div className="relative h-96 flex items-center justify-center">
          {/* Winner Mascot */}
          <AnimatePresence>
            {['entrance', 'challenge', 'attack', 'victory'].includes(phase) && WinnerMascotSVG && (
              <motion.div 
                initial={{ scale: 0, y: 100, rotate: -180 }} 
                animate={{ 
                  scale: phase === 'victory' ? 1.4 : 1, 
                  y: 0,
                  rotate: 0,
                }} 
                exit={{ scale: 0, y: -100 }} 
                transition={{ type: 'spring', damping: 15 }}
                className="absolute z-20"
              >
                <motion.div 
                  className="relative"
                  animate={phase === 'attack' ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3, repeat: phase === 'attack' ? Infinity : 0, repeatDelay: 0.7 }}
                >
                  {/* Aura rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      width: 200, 
                      height: 200, 
                      marginLeft: -40, 
                      marginTop: -40,
                      border: `3px solid ${winnerHouse?.color}`,
                    }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      width: 200, 
                      height: 200, 
                      marginLeft: -40, 
                      marginTop: -40,
                      border: `2px solid ${winnerHouse?.color}`,
                    }}
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />

                  {/* Mascot container */}
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center relative"
                    style={{ 
                      backgroundColor: `${winnerHouse?.color}30`, 
                      boxShadow: `0 0 ${phase === 'victory' ? 100 : 50}px ${winnerHouse?.color}80` 
                    }}
                  >
                    <WinnerMascotSVG 
                      color={winnerHouse?.color || '#ef4444'} 
                      size={100} 
                      isLeader={true}
                      isCelebrating={phase === 'victory'}
                    />
                  </div>

                  {/* Victory crown */}
                  {phase === 'victory' && (
                    <motion.div 
                      className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl"
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: [0, -8, 0] }}
                      transition={{ y: { duration: 1, repeat: Infinity } }}
                    >
                      👑
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loser Mascots */}
          {losers.map((house, i) => {
            const angle = (i / losers.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 160;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const defeated = defeatedHouses.includes(house.id);
            const LoserMascotSVG = getMascotSVG(house.mascotId);
            
            return (
              <AnimatePresence key={house.id}>
                {!defeated && !['victory', 'exit'].includes(phase) && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1, x, y: y + 20 }}
                    exit={{ 
                      scale: 0, 
                      x: x * 4, 
                      y: y * 4 - 100, 
                      rotate: 720, 
                      opacity: 0,
                    }} 
                    transition={{ exit: { duration: 0.6 } }}
                    className="absolute"
                  >
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${house?.color}30`, 
                        boxShadow: `0 0 25px ${house?.color}50` 
                      }}
                    >
                      <LoserMascotSVG 
                        color={house?.color || '#888'} 
                        size={56} 
                        isLeader={false}
                        isCelebrating={false}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Attack shockwave */}
        <AnimatePresence>
          {phase === 'attack' && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.7 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
              style={{ 
                background: `radial-gradient(circle, ${winnerHouse?.color}80 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Victory celebration */}
        <AnimatePresence>
          {phase === 'victory' && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center"
            >
              <motion.h2 
                className="text-4xl sm:text-5xl font-black mb-3" 
                style={{ color: winnerHouse?.color }}
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 1, repeat: Infinity }}
              >
                {winnerHouse?.name}
              </motion.h2>
              <motion.p 
                className="text-2xl sm:text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                WINS!
              </motion.p>
              <motion.p 
                className="text-lg text-white/70 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {typeof milestone === 'number' 
                  ? `🎯 ${milestone.toLocaleString()} points milestone!`
                  : milestone === 'SANDBOX_TEST'
                    ? '🧪 Sandbox Battle Test'
                    : `Score: ${winnerHouse?.score?.toLocaleString()} pts`
                }
              </motion.p>
              
              {/* Confetti */}
              {[...Array(60)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="absolute w-3 h-3"
                  style={{ 
                    backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'][i % 6],
                    borderRadius: i % 2 === 0 ? '50%' : '2px',
                    left: `${50 + (Math.random() - 0.5) * 80}%`,
                    top: 0,
                  }}
                  initial={{ y: 0, opacity: 1 }} 
                  animate={{ 
                    y: [0, -150, 400], 
                    x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                    opacity: [1, 1, 0], 
                    rotate: [0, 360, 720],
                  }}
                  transition={{ duration: 2.5 + Math.random(), delay: i * 0.03 }} 
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Rankings */}
        <AnimatePresence>
          {phase === 'exit' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-black text-center mb-6 flex items-center justify-center gap-2">
                  <span>🏆</span> Current Rankings
                </h3>
                <div className="space-y-3">
                  {[...allHouses]
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((house, i) => {
                      const HouseMascotSVG = getMascotSVG(house.mascotId);
                      const isWinner = house.id === winnerHouse?.id;
                      
                      return (
                        <motion.div 
                          key={house.id} 
                          initial={{ x: -50, opacity: 0 }} 
                          animate={{ x: 0, opacity: 1 }} 
                          transition={{ delay: i * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-xl ${
                            isWinner 
                              ? 'bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/50' 
                              : 'bg-white/5'
                          }`}
                        >
                          <span className="text-2xl font-black text-muted-foreground w-10 text-center">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center" 
                            style={{ backgroundColor: `${house.color}20` }}
                          >
                            <HouseMascotSVG color={house.color} size={32} isLeader={false} isCelebrating={false} />
                          </div>
                          <span className="font-bold flex-1 truncate">{house.name}</span>
                          <span className="font-black text-lg" style={{ color: house.color }}>
                            {house.score?.toLocaleString() || 0}
                          </span>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
