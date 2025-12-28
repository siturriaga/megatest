'use client';
import { useState } from 'react';
import { MessageSquare, Send, Pin, Trash2, AlertTriangle } from 'lucide-react';

export default function CommunicationPanel({
  broadcasts = [],
  onSendBroadcast,
  onDeleteBroadcast,
  onPinBroadcast,
  userGreeting,
  isSchoolAdmin,
  theme,
}) {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targetAudience, setTargetAudience] = useState('All Staff');

  const handleSend = async () => {
    if (!message.trim()) return;
    await onSendBroadcast(message, priority, targetAudience);
    setMessage('');
    setPriority('normal');
  };

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'urgent': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'important': return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
      default: return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    }
  };

  const formatTime = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Compose */}
      {isSchoolAdmin && (
        <div className="glass-card p-6 lg:col-span-1">
          <h3 className="font-black text-lg flex items-center gap-2 mb-4">
            <MessageSquare className="text-primary" size={20} />
            Send Broadcast
          </h3>

          <div className="space-y-4">
            <textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              className="w-full h-32 bg-accent border border-border rounded-xl p-3 text-sm resize-none"
            />
            <div className="text-xs text-right text-muted-foreground">{message.length}/500</div>

            <div className="flex gap-2">
              {['normal', 'important', 'urgent'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border capitalize transition-all ${
                    priority === p ? getPriorityStyle(p) : 'bg-accent border-border'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-3 py-2 bg-accent border border-border rounded-lg text-sm"
            >
              <option>All Staff</option>
              <option>Teachers Only</option>
              <option>Admins Only</option>
            </select>

            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={16} /> Send Broadcast
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className={`glass-card p-6 ${isSchoolAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        <h3 className="font-black text-lg mb-4">Announcements</h3>

        {broadcasts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p>No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {broadcasts.map(broadcast => (
              <div
                key={broadcast.id}
                className={`p-4 rounded-xl border ${getPriorityStyle(broadcast.priority)} ${broadcast.pinned ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {broadcast.priority === 'urgent' && <AlertTriangle size={14} />}
                      {broadcast.pinned && <Pin size={14} className="text-primary" />}
                      <span className="text-xs font-bold uppercase">{broadcast.priority}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{broadcast.message}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {broadcast.senderName} • {formatTime(broadcast.ts)}
                    </div>
                  </div>

                  {isSchoolAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onPinBroadcast(broadcast.id, !broadcast.pinned)}
                        className={`p-1.5 rounded-lg transition-colors ${broadcast.pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        <Pin size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteBroadcast(broadcast.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
