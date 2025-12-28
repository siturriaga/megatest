'use client';
import { useState } from 'react';
import { Send, Lock, AlertTriangle, Users } from 'lucide-react';
import StudentSearch from './StudentSearch';

export default function HallPassPanel({
  allStudents = [],
  selectedStudent,
  setSelectedStudent,
  onIssuePass,
  onReturn,
  lockdown,
  theme,
  labelsConfig,
  hasActivePass,
  isDestinationFull,
  getWaitlistPosition,
  destinationCounts,
  botRef,
}) {
  const [selectedDestination, setSelectedDestination] = useState(null);

  const destinations = labelsConfig?.passDestinations || ['Bathroom', 'Water', 'Office', 'Library', 'Clinic', 'Nurse'];
  const maxDisplayed = labelsConfig?.maxDisplayedDestinations || 8;
  const counts = destinationCounts?.() || {};

  const handleIssuePass = async () => {
    if (!selectedStudent || !selectedDestination) return;
    const success = await onIssuePass(selectedStudent, selectedDestination);
    if (success) {
      setSelectedStudent(null);
      setSelectedDestination(null);
    }
  };

  const studentHasPass = selectedStudent && hasActivePass?.(selectedStudent.id);

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg flex items-center gap-2">
          <Send className="text-primary" size={20} />
          Issue Pass
        </h3>
        {lockdown && (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold flex items-center gap-1">
            <Lock size={12} /> LOCKED
          </span>
        )}
      </div>

      {/* Student Search */}
      <div data-guide="student-search">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
          Select Student
        </label>
        <StudentSearch
          allStudents={allStudents}
          selectedStudent={selectedStudent}
          onSelect={setSelectedStudent}
          placeholder="Search by name or ID..."
        />
      </div>

      {/* Warning if student has active pass */}
      {studentHasPass && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle size={16} />
          <span>{selectedStudent.full_name} already has an active pass</span>
        </div>
      )}

      {/* Destination Grid */}
      <div data-guide="destination-buttons">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
          Select Destination
        </label>
        <div className="grid grid-cols-2 gap-2">
          {destinations.slice(0, maxDisplayed).map(dest => {
            const count = counts[dest] || 0;
            const isFull = isDestinationFull?.(dest);
            const isSelected = selectedDestination === dest;
            
            return (
              <button
                key={dest}
                onClick={() => setSelectedDestination(dest)}
                disabled={lockdown || studentHasPass}
                className={`p-3 rounded-xl text-sm font-semibold transition-all relative ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background' 
                    : isFull 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                      : 'bg-accent border border-border hover:border-primary/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {dest}
                {count > 0 && (
                  <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isFull ? 'bg-red-500 text-white' : 'bg-white/20'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issue Button */}
      <button
        data-guide="issue-pass"
        onClick={handleIssuePass}
        disabled={!selectedStudent || !selectedDestination || lockdown || studentHasPass}
        className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
      >
        <Send size={18} />
        {lockdown ? 'Lockdown Active' : 'Issue Pass'}
      </button>
    </div>
  );
}
