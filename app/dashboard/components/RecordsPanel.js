'use client';
import { useState, useMemo } from 'react';
import { Search, FileText, Filter } from 'lucide-react';

const TYPE_COLORS = {
  PASS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RETURN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  INFRACTION: 'bg-red-500/20 text-red-400 border-red-500/30',
  INCENTIVE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  TARDY: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function RecordsPanel({
  logs = [],
  allStudents = [],
  selectedStudent,
  setSelectedStudent,
  getCardStyle,
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    let filtered = [...logs];
    
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(log => 
        log.studentName?.toLowerCase().includes(q) ||
        log.detail?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(log => log.type === typeFilter);
    }

    return filtered.slice(0, 100);
  }, [logs, query, typeFilter]);

  const formatTime = (ts) => {
    if (!ts?.seconds) return '';
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-lg flex items-center gap-2">
          <FileText className="text-primary" size={20} />
          Activity Records
        </h3>
        <span className="text-xs text-muted-foreground">{filteredLogs.length} records</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-accent border border-border rounded-xl text-sm"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-accent border border-border rounded-xl text-sm"
        >
          <option value="ALL">All Types</option>
          <option value="PASS">Passes</option>
          <option value="RETURN">Returns</option>
          <option value="INFRACTION">Infractions</option>
          <option value="INCENTIVE">Incentives</option>
          <option value="TARDY">Tardies</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground uppercase">
              <th className="pb-3 font-bold">Type</th>
              <th className="pb-3 font-bold">Student</th>
              <th className="pb-3 font-bold">Detail</th>
              <th className="pb-3 font-bold">By</th>
              <th className="pb-3 font-bold">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-accent/50 transition-colors">
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${TYPE_COLORS[log.type] || 'bg-accent'}`}>
                    {log.type}
                  </span>
                </td>
                <td className="py-3 font-medium">{log.studentName}</td>
                <td className="py-3 text-muted-foreground">{log.detail}</td>
                <td className="py-3 text-muted-foreground font-mono text-xs">{log.employeeId}</td>
                <td className="py-3 text-muted-foreground text-xs">{formatTime(log.ts)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>No records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
