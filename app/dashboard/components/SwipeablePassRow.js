'use client';
import { useState, useRef } from 'react';
import { Clock, MapPin, User, ArrowLeft } from 'lucide-react';

/**
 * SwipeablePassRow - Mobile-friendly pass card with swipe-to-return
 * Swipe left to reveal "Return" action
 */
export default function SwipeablePassRow({ pass, onReturn, theme }) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const rowRef = useRef(null);

  const SWIPE_THRESHOLD = -80; // Pixels to trigger action
  const MAX_SWIPE = -120;

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!pass?.startedAt) return '0:00';
    const start = pass.startedAt.seconds ? pass.startedAt.seconds * 1000 : pass.startedAt;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [elapsedTime, setElapsedTime] = useState(getElapsedTime());

  // Update timer
  useState(() => {
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [pass?.startedAt]);

  // Touch handlers
  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const diff = e.touches[0].clientX - startXRef.current;
    let newX = currentXRef.current + diff;
    
    // Clamp values - only allow left swipe
    newX = Math.max(MAX_SWIPE, Math.min(0, newX));
    setTranslateX(newX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (translateX < SWIPE_THRESHOLD) {
      // Trigger return action
      setTranslateX(MAX_SWIPE);
      // Small delay before action for visual feedback
      setTimeout(() => {
        onReturn?.(pass);
        setTranslateX(0);
      }, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e) => {
    startXRef.current = e.clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startXRef.current;
    let newX = currentXRef.current + diff;
    newX = Math.max(MAX_SWIPE, Math.min(0, newX));
    setTranslateX(newX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleTouchEnd();
    }
  };

  // Check if pass is overtime (> 10 minutes)
  const isOvertime = () => {
    if (!pass?.startedAt) return false;
    const start = pass.startedAt.seconds ? pass.startedAt.seconds * 1000 : pass.startedAt;
    const elapsed = (Date.now() - start) / 1000 / 60;
    return elapsed > 10;
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background action revealed on swipe */}
      <div className="absolute inset-y-0 right-0 w-32 bg-emerald-500 flex items-center justify-end pr-4">
        <div className="text-white font-bold flex items-center gap-2">
          <ArrowLeft size={20} />
          Return
        </div>
      </div>

      {/* Swipeable content */}
      <div
        ref={rowRef}
        className={`relative bg-card border border-border p-4 transition-transform ${
          isDragging ? '' : 'duration-200'
        } ${isOvertime() ? 'border-red-500/50' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
              isOvertime() ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
            }`}>
              {pass.studentName?.charAt(0) || '?'}
            </div>
            <div>
              <div className="font-bold flex items-center gap-2">
                <User size={14} className="text-muted-foreground" />
                {pass.studentName}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin size={12} />
                {pass.destination}
              </div>
            </div>
          </div>

          <div className={`text-right ${isOvertime() ? 'text-red-400' : ''}`}>
            <div className="font-mono font-bold text-lg flex items-center gap-1 justify-end">
              <Clock size={14} />
              {elapsedTime}
            </div>
            {isOvertime() && (
              <div className="text-xs text-red-400 font-bold animate-pulse">
                OVERTIME
              </div>
            )}
          </div>
        </div>

        {/* Swipe hint */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 text-xs">
          ← swipe
        </div>
      </div>
    </div>
  );
}
