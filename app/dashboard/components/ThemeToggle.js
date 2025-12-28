'use client';
import { Sun, Moon, Eclipse } from 'lucide-react';

const themes = [
  { id: 'aero', label: 'Aero', icon: Sun, color: 'text-blue-400' },
  { id: 'obsidian', label: 'Obsidian', icon: Moon, color: 'text-emerald-400' },
  { id: 'eclipse', label: 'Eclipse', icon: Eclipse, color: 'text-yellow-400' },
];

export default function ThemeToggle({ current = 'obsidian', onChange }) {
  const currentIndex = themes.findIndex(t => t.id === current);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  const CurrentIcon = themes[currentIndex]?.icon || Moon;

  return (
    <button
      onClick={() => onChange?.(nextTheme.id)}
      className={`p-2.5 rounded-xl bg-accent border border-border hover:bg-accent/80 transition-all ${themes[currentIndex]?.color || 'text-emerald-400'}`}
      title={`Switch to ${nextTheme.label} theme`}
    >
      <CurrentIcon size={18} />
    </button>
  );
}
