'use client';
import { useState, useEffect } from 'react';
import { Clock, MapPin, CornerDownLeft, AlertTriangle } from 'lucide-react';

export default function ActivePassCard({ pass, onReturn, theme = 'obsidian', employeeId }) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const startTime = pass.startedAt?.seconds ? pass.startedAt.seconds * 1000 : Date.now();
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pass.startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isOvertime = minutes >= 10;
  const isWarning = minutes >= 7 && minutes < 10;

  const formatTime = () => `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className={`glass-card p-4 transition-all ${isOvertime ? 'border-red-500/50 bg-red-500/5' : isWarning ? 'border-amber-500/50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate">{pass.studentName}</span>
            {isOvertime && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Grade {pass.studentGrade} • ID: {pass.employeeId}
          </div>
        </div>
        
        <div className={`text-right ${isOvertime ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-muted-foreground'}`}>
          <div className="flex items-center gap-1 text-sm font-mono font-bold">
            <Clock size={14} />
            {formatTime()}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={14} className="text-primary" />
          <span className="font-medium">{pass.destination}</span>
        </div>
        
        <button
          onClick={onReturn}
          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-all"
        >
          <CornerDownLeft size={12} />
          Return
        </button>
      </div>
    </div>
  );
}
