'use client';
import { useState, useMemo } from 'react';
import { Search, User, AlertTriangle } from 'lucide-react';

export default function StudentSearch({ 
  allStudents = [], 
  selectedStudent, 
  onSelect, 
  placeholder = 'Search students...',
  showMTSS = false,
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allStudents
      .filter(s => 
        s.full_name?.toLowerCase().includes(q) || 
        s.student_id_number?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, allStudents]);

  const handleSelect = (student) => {
    onSelect?.(student);
    setQuery('');
    setShowDropdown(false);
  };

  const getMTSSColor = (score) => {
    if (score >= 10) return 'text-red-400';
    if (score >= 6) return 'text-orange-400';
    if (score >= 3) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 bg-accent border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.map(student => (
            <button
              key={student.id}
              onClick={() => handleSelect(student)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left border-b border-border last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {student.full_name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{student.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {student.student_id_number} • Grade {student.grade_level}
                  {student.status === 'OUT' && <span className="ml-2 text-amber-400">• OUT</span>}
                </div>
              </div>
              {showMTSS && student.mtss_score > 0 && (
                <div className={`flex items-center gap-1 text-xs font-bold ${getMTSSColor(student.mtss_score)}`}>
                  <AlertTriangle size={14} />
                  {student.mtss_score}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedStudent && (
        <div className="mt-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold text-lg">
              {selectedStudent.full_name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <div className="font-bold">{selectedStudent.full_name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedStudent.student_id_number} • Grade {selectedStudent.grade_level}
                {selectedStudent.status === 'OUT' && (
                  <span className="ml-2 text-amber-400 font-bold">Currently OUT: {selectedStudent.current_destination}</span>
                )}
              </div>
            </div>
            <button 
              onClick={() => onSelect?.(null)} 
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
