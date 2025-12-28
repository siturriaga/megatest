'use client';
import { Crown } from 'lucide-react';

export default function HouseStandings({ houses = [], theme = 'obsidian' }) {
  const sorted = [...houses].sort((a, b) => (b.score || 0) - (a.score || 0));
  const maxScore = sorted[0]?.score || 1;

  return (
    <div className="space-y-3">
      {sorted.map((house, index) => {
        const isLeading = index === 0 && house.score > 0;
        const percentage = maxScore > 0 ? ((house.score || 0) / maxScore) * 100 : 0;

        return (
          <div
            key={house.id}
            className={`relative p-4 rounded-xl border transition-all ${
              isLeading 
                ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/30' 
                : 'bg-accent/50 border-border'
            }`}
          >
            {isLeading && (
              <Crown size={20} className="absolute -top-2 -right-2 text-amber-400 animate-bounce" fill="currentColor" />
            )}

            <div className="flex items-center gap-3">
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isLeading ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: `${house.color}20` }}
              >
                {house.mascot}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{house.name}</span>
                  {isLeading && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">LEADING</span>
                  )}
                </div>
                
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: house.color }}
                  />
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black" style={{ color: house.color }}>
                  {house.score?.toLocaleString() || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">points</div>
              </div>
            </div>
          </div>
        );
      })}

      {houses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">No houses configured</div>
      )}
    </div>
  );
}
