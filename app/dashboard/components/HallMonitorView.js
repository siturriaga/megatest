'use client';
import { X, Search, ScanLine } from 'lucide-react';
import { useState } from 'react';

export default function HallMonitorView({ onExit, activePasses, allStudents, onReturn, onIssuePass, onLogInfraction, labelsConfig, employeeId }) {
  const [query, setQuery] = useState('');
  
  const filtered = query.length >= 2
    ? allStudents.filter(s => s.full_name?.toLowerCase().includes(query.toLowerCase()) || s.student_id_number?.includes(query)).slice(0, 5)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-3">
          <ScanLine className="text-emerald-400" size={24} />
          <h1 className="text-xl font-black">Hall Monitor</h1>
        </div>
        <button onClick={onExit} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={20} /></button>
      </header>
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input type="text" placeholder="Search student..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-accent border border-border rounded-2xl text-lg" autoFocus />
          </div>

          <h3 className="font-bold mt-6">Active Passes ({activePasses.length})</h3>
          <div className="space-y-2">
            {activePasses.map(pass => (
              <div key={pass.id} className="p-4 bg-accent/50 border border-border rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold">{pass.studentName}</div>
                  <div className="text-sm text-muted-foreground">{pass.destination}</div>
                </div>
                <button onClick={() => onReturn?.(pass)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold">Return</button>
              </div>
            ))}
            {activePasses.length === 0 && <p className="text-muted-foreground text-center py-4">No active passes</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
