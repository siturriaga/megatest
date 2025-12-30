'use client';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', ariaLabel: 'Success' },
  error: { icon: AlertCircle, bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', ariaLabel: 'Error' },
  info: { icon: Info, bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', ariaLabel: 'Information' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', ariaLabel: 'Warning' },
};

/**
 * Toast notification component with accessibility support
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 * @param {('success'|'error'|'info'|'warning')} props.type - Toast type
 * @param {Function} props.onClose - Close handler
 */
export default function Toast({ message, type = 'info', onClose }) {
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  return (
    <div 
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed top-6 right-6 z-[200] ${config.bg} ${config.border} border rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl animate-slideDown max-w-md`}
    >
      <Icon size={20} className={config.text} aria-hidden="true" />
      <span className="text-sm font-semibold text-foreground flex-1">{message}</span>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
