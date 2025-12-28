'use client';
import { BarChart3, TrendingUp, AlertTriangle, Download } from 'lucide-react';

export default function AnalyticsPanel({
  analyticsData = {},
  allStudents = [],
  activePasses = [],
  lockdown,
  generateLockdownReport,
  getCardStyle,
  logs = [],
}) {
  const { totalPasses = 0, totalInfractions = 0, totalIncentives = 0, totalTardies = 0, activeNow = 0 } = analyticsData;

  const mtssStudents = allStudents
    .filter(s => (s.mtss_score || 0) >= 3)
    .sort((a, b) => (b.mtss_score || 0) - (a.mtss_score || 0));

  const tier1 = mtssStudents.filter(s => s.mtss_score >= 3 && s.mtss_score < 6).length;
  const tier2 = mtssStudents.filter(s => s.mtss_score >= 6 && s.mtss_score < 10).length;
  const tier3 = mtssStudents.filter(s => s.mtss_score >= 10).length;

  const handleExportMTSS = () => {
    const lines = ['MTSS Report', `Generated: ${new Date().toLocaleString()}`, '', 'Students Requiring Intervention:', ''];
    mtssStudents.forEach(s => {
      const tier = s.mtss_score >= 10 ? 'Tier 3' : s.mtss_score >= 6 ? 'Tier 2' : 'Tier 1';
      lines.push(`${s.full_name} - Score: ${s.mtss_score} - ${tier}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mtss_report_${Date.now()}.txt`;
    a.click();
  };

  const handleLockdownReport = () => {
    const report = generateLockdownReport?.();
    if (!report) return;
    const lines = [
      'LOCKDOWN REPORT',
      `Time: ${report.timestamp}`,
      `School: ${report.school}`,
      `Status: ${report.lockdownActive ? 'ACTIVE' : 'Inactive'}`,
      `Students Out: ${report.studentsOut}`,
      '',
      'Student Locations:',
      ...report.students.map(s => `  ${s.name} - ${s.destination} (since ${s.startedAt})`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lockdown_report_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active Now', value: activeNow, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
          { label: 'Total Passes', value: totalPasses, color: 'text-blue-400', bg: 'bg-blue-500/20' },
          { label: 'Infractions', value: totalInfractions, color: 'text-red-400', bg: 'bg-red-500/20' },
          { label: 'Incentives', value: totalIncentives, color: 'text-amber-400', bg: 'bg-amber-500/20' },
          { label: 'Tardies', value: totalTardies, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`glass-card p-4 ${stat.bg}`}>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MTSS Overview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={20} />
              MTSS Overview
            </h3>
            <button
              onClick={handleExportMTSS}
              className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Download size={12} /> Export
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-center">
              <div className="text-2xl font-black text-amber-400">{tier1}</div>
              <div className="text-xs text-muted-foreground">Tier 1</div>
            </div>
            <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl text-center">
              <div className="text-2xl font-black text-orange-400">{tier2}</div>
              <div className="text-xs text-muted-foreground">Tier 2</div>
            </div>
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
              <div className="text-2xl font-black text-red-400">{tier3}</div>
              <div className="text-xs text-muted-foreground">Tier 3</div>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {mtssStudents.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                <span className="text-sm font-medium">{s.full_name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s.mtss_score >= 10 ? 'bg-red-500/20 text-red-400' :
                  s.mtss_score >= 6 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {s.mtss_score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lockdown Report */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black flex items-center gap-2">
              <BarChart3 className="text-primary" size={20} />
              Lockdown Report
            </h3>
            <button
              onClick={handleLockdownReport}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Download size={12} /> Generate
            </button>
          </div>

          <div className={`p-4 rounded-xl ${lockdown ? 'bg-red-500/20 border border-red-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
            <div className={`text-2xl font-black ${lockdown ? 'text-red-400' : 'text-emerald-400'}`}>
              {lockdown ? '🚨 LOCKDOWN ACTIVE' : '✅ All Clear'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {activePasses.length} students currently out
            </div>
          </div>

          {activePasses.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {activePasses.map(pass => (
                <div key={pass.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                  <span className="text-sm">{pass.studentName}</span>
                  <span className="text-xs text-primary">{pass.destination}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
