'use client';
import { useState } from 'react';
import { X, Clock, Send, Check } from 'lucide-react';

export default function TardyKiosk({ onExit, onLogTardy, onIssuePass, allStudents, employeeId, labelsConfig }) {
  const [query, setQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [action, setAction] = useState(null);
  const [success, setSuccess] = useState(false);

  const filtered = query.length >= 2
    ? allStudents.filter(s => s.full_name?.toLowerCase().includes(query.toLowerCase()) || s.student_id_number?.includes(query)).slice(0, 8)
    : [];

  const handleAction = async (type) => {
    if (!selectedStudent) return;
    if (type === 'tardy') {
      await onLogTardy?.(selectedStudent);
    } else if (type === 'pass') {
      setAction('pass');
      return;
    }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setSelectedStudent(null); setQuery(''); }, 2000);
  };

  const handleIssuePass = async (destination) => {
    if (!selectedStudent) return;
    await onIssuePass?.(selectedStudent, destination);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setSelectedStudent(null); setQuery(''); setAction(null); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-3">
          <Clock className="text-primary" size={24} />
          <h1 className="text-xl font-black">Tardy Kiosk</h1>
        </div>
        <button onClick={onExit} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={20} /></button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        {success ? (
          <div className="text-center animate-squish-land">
            <Check size={80} className="text-emerald-400 mx-auto mb-4" />
            <div className="text-3xl font-black text-emerald-400">Success!</div>
          </div>
        ) : action === 'pass' ? (
          <div className="w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-center mb-4">Select Destination for {selectedStudent?.full_name}</h2>
            <div className="grid grid-cols-2 gap-3">
              {(labelsConfig?.passDestinations || ['Bathroom', 'Water', 'Office', 'Library']).slice(0, 8).map(dest => (
                <button key={dest} onClick={() => handleIssuePass(dest)} className="p-4 bg-primary/20 border border-primary/30 rounded-xl text-primary font-bold">
                  {dest}
                </button>
              ))}
            </div>
            <button onClick={() => setAction(null)} className="w-full py-3 bg-accent border border-border rounded-xl">Back</button>
          </div>
        ) : selectedStudent ? (
          <div className="w-full max-w-md space-y-4">
            <div className="p-6 bg-primary/10 border border-primary/30 rounded-2xl text-center">
              <div className="w-20 h-20 bg-primary/30 rounded-full flex items-center justify-center mx-auto text-3xl font-black text-primary mb-4">
                {selectedStudent.full_name?.charAt(0)}
              </div>
              <div className="text-2xl font-black">{selectedStudent.full_name}</div>
              <div className="text-muted-foreground">Grade {selectedStudent.grade_level}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleAction('tardy')} className="p-6 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 font-bold text-lg flex flex-col items-center gap-2">
                <Clock size={32} /> Log Tardy
              </button>
              <button onClick={() => handleAction('pass')} className="p-6 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-lg flex flex-col items-center gap-2">
                <Send size={32} /> Get Pass
              </button>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="w-full py-3 bg-accent border border-border rounded-xl">Back</button>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            <input type="text" placeholder="Enter name or ID..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full px-6 py-4 bg-accent border border-border rounded-2xl text-xl text-center" autoFocus />
            {filtered.length > 0 && (
              <div className="space-y-2">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => setSelectedStudent(s)} className="w-full p-4 bg-accent/50 border border-border rounded-xl text-left hover:bg-accent">
                    <div className="font-bold">{s.full_name}</div>
                    <div className="text-sm text-muted-foreground">{s.student_id_number} • Grade {s.grade_level}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
