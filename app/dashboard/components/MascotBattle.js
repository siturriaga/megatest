'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MASCOT_POOL } from '../../../constants/defaults';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export default function MascotBattle({ isActive, winnerHouse, allHouses, onComplete }) {
  const [phase, setPhase] = useState('idle');
  const [defeatedHouses, setDefeatedHouses] = useState([]);

  const getMascot = (house) => MASCOT_POOL.find(m => m.id === house?.mascotId) || MASCOT_POOL[0];
  const winnerMascot = winnerHouse ? getMascot(winnerHouse) : null;
  const losers = allHouses?.filter(h => h.id !== winnerHouse?.id) || [];

  useEffect(() => {
    if (!isActive || !winnerHouse) return;
    const run = async () => {
      setPhase('entrance'); await delay(2000);
      setPhase('challenge'); await delay(2000);
      setPhase('attack');
      for (let i = 0; i < losers.length; i++) {
        await delay(2000);
        setDefeatedHouses(p => [...p, losers[i].id]);
      }
      await delay(1000);
      setPhase('victory'); await delay(4000);
      setPhase('exit'); await delay(2000);
      setPhase('idle');
      setDefeatedHouses([]);
      onComplete?.();
    };
    run();
  }, [isActive, winnerHouse, losers, onComplete]);

  if (!isActive || phase === 'idle') return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0 bg-black" animate={{ opacity: 0.95 }} />
      
      {/* Energy particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-20 rounded-full"
            style={{ background: `linear-gradient(to bottom, transparent, ${winnerHouse?.color || '#fff'})`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -200], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }} />
        ))}
      </div>

      {/* Arena glow */}
      <motion.div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: `radial-gradient(ellipse at center bottom, ${winnerHouse?.color}30 0%, transparent 70%)` }}
        animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />

      <div className="relative z-10 w-full max-w-4xl p-8">
        {/* Challenge text */}
        <AnimatePresence>
          {phase === 'challenge' && (
            <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 text-7xl font-black text-white text-center"
              style={{ textShadow: `0 0 60px ${winnerHouse?.color}` }}>CHALLENGE!</motion.h1>
          )}
        </AnimatePresence>

        {/* Arena */}
        <div className="relative h-96 flex items-center justify-center">
          {/* Winner */}
          <AnimatePresence>
            {['entrance', 'challenge', 'attack', 'victory'].includes(phase) && (
              <motion.div initial={{ scale: 0, y: 100 }} animate={{ scale: phase === 'victory' ? 1.5 : 1, y: 0 }} exit={{ scale: 0 }} className="absolute z-20">
                <div className="w-40 h-40 rounded-full flex items-center justify-center text-7xl relative"
                  style={{ backgroundColor: `${winnerHouse?.color}30`, boxShadow: `0 0 ${phase === 'victory' ? 80 : 40}px ${winnerHouse?.color}60` }}>
                  <motion.div className="absolute inset-0 rounded-full" style={{ border: `3px solid ${winnerHouse?.color}` }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="relative z-10">{winnerHouse?.mascot}</span>
                  {phase === 'victory' && <motion.div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl"
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 1, repeat: Infinity }}>👑</motion.div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Losers */}
          {losers.map((house, i) => {
            const angle = (i / losers.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * 180;
            const y = Math.sin(angle) * 180;
            const defeated = defeatedHouses.includes(house.id);
            return (
              <AnimatePresence key={house.id}>
                {!defeated && !['victory', 'exit'].includes(phase) && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1, x, y: y + 20 }}
                    exit={{ scale: 0, x: x * 3, y: y * 3, rotate: 360 }} className="absolute">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${house?.color}30`, boxShadow: `0 0 30px ${house?.color}40` }}>
                      {house.mascot}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Attack effect */}
        {phase === 'attack' && (
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{ background: `radial-gradient(circle, ${winnerHouse?.color}80 0%, transparent 70%)`, filter: 'blur(20px)' }}
            animate={{ scale: [0, 2, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }} />
        )}

        {/* Victory */}
        <AnimatePresence>
          {phase === 'victory' && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
              <motion.h2 className="text-5xl font-black mb-4" style={{ color: winnerHouse?.color }}
                animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>{winnerHouse?.name} WINS!</motion.h2>
              <p className="text-xl text-white/80">Milestone: {winnerHouse?.score?.toLocaleString()} pts</p>
              {[...Array(50)].map((_, i) => (
                <motion.div key={i} className="absolute w-3 h-3 rounded-sm"
                  style={{ backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'][i % 5], left: `${50 + (Math.random() - 0.5) * 100}%` }}
                  initial={{ y: 0 }} animate={{ y: [0, -200, 400], opacity: [1, 1, 0], rotate: [0, 360, 720] }}
                  transition={{ duration: 3, delay: i * 0.05 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rankings */}
        <AnimatePresence>
          {phase === 'exit' && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full">
                <h3 className="text-2xl font-black text-center mb-6">New Rankings</h3>
                <div className="space-y-3">
                  {[...allHouses].sort((a, b) => (b.score || 0) - (a.score || 0)).map((house, i) => (
                    <motion.div key={house.id} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${house.id === winnerHouse?.id ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-white/5'}`}>
                      <span className="text-2xl font-black text-muted-foreground">#{i + 1}</span>
                      <span className="text-2xl">{house.mascot}</span>
                      <span className="font-bold flex-1">{house.name}</span>
                      <span className="font-black" style={{ color: house.color }}>{house.score?.toLocaleString()}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
