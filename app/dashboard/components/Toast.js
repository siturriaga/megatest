'use client';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  error: { icon: AlertCircle, bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
  info: { icon: Info, bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
};

export default function Toast({ message, type = 'info', onClose }) {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  return (
    <div className={`fixed top-6 right-6 z-[200] ${config.bg} ${config.border} border rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl animate-slideDown max-w-md`}>
      <Icon size={20} className={config.text} />
      <span className="text-sm font-semibold text-foreground flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
