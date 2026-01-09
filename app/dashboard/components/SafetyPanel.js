'use client';
import { useState, useEffect } from 'react';
import { Shield, Lock, Users, AlertTriangle, Plus, X, FileText, Printer, Radio, MapPin, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALERT_LEVELS } from '../../../constants/defaults';
import { formatDateTime, formatFormalDate } from '../../../utils/formatters';

/**
 * SafetyPanel - Safety & Lockdown Controls
 * 
 * FIXES APPLIED:
 * - E: Lockdown now requires confirmation modal with reason (no accidental clicks)
 * - L: Active lockdown shows dim overlay + calming message + countdown timer
 * - O: Zone locks have pulse animation when toggled
 * 
 * @version 2.1.0
 */
export default function SafetyPanel({
  conflictGroups = [],
  allStudents = [],
  activePasses = [],
  onAddConflictGroup,
  onRemoveConflictGroup,
  lockdown,
  onToggleLockdown,
  alertLevel = 'normal',
  onSetAlertLevel,
  lockedZones = [],
  onToggleZoneLock,
  passDestinations = [],
  isSchoolAdmin,
  isSuperAdmin,
  displaySchoolName,
  theme,
  botRef,  // FIX L: For calming messages
}) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showReport, setShowReport] = useState(false);
  
  // FIX E: Lockdown confirmation state
  const [showLockdownConfirm, setShowLockdownConfirm] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  
  // FIX L: Lockdown timer state
  const [lockdownStartTime, setLockdownStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // FIX O: Zone animation state
  const [recentlyToggledZone, setRecentlyToggledZone] = useState(null);

  // FIX L: Track lockdown duration
  useEffect(() => {
    if (lockdown && !lockdownStartTime) {
      setLockdownStartTime(Date.now());
    } else if (!lockdown) {
      setLockdownStartTime(null);
      setElapsedTime(0);
    }
  }, [lockdown]);

  // FIX L: Update elapsed time every second during lockdown
  useEffect(() => {
    let interval;
    if (lockdown && lockdownStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - lockdownStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockdown, lockdownStartTime]);

  // FIX L: Format elapsed time as MM:SS
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddGroup = async () => {
    if (newGroupName.trim() && selectedMembers.length >= 2) {
      await onAddConflictGroup(newGroupName, selectedMembers);
      setNewGroupName('');
      setSelectedMembers([]);
      setShowAddGroup(false);
    }
  };

  // FIX E: Handle lockdown with confirmation
  const handleLockdownClick = () => {
    if (lockdown) {
      // Lifting lockdown - can do directly
      onToggleLockdown?.();
    } else {
      // Activating lockdown - show confirmation
      setShowLockdownConfirm(true);
    }
  };

  // FIX E: Confirm lockdown activation
  const confirmLockdown = async () => {
    setIsActivating(true);
    try {
      await onToggleLockdown?.(lockdownReason);
      setShowLockdownConfirm(false);
      setLockdownReason('');
    } finally {
      setIsActivating(false);
    }
  };

  // FIX O: Handle zone lock with animation
  const handleZoneLock = (zone) => {
    setRecentlyToggledZone(zone);
    onToggleZoneLock?.(zone);
    // Clear animation state after animation completes
    setTimeout(() => setRecentlyToggledZone(null), 600);
  };

  const currentAlertConfig = ALERT_LEVELS[alertLevel?.toUpperCase()] || ALERT_LEVELS.NORMAL;

  // Generate lockdown report
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      school: displaySchoolName,
      alertLevel: currentAlertConfig.label,
      lockdownActive: lockdown,
      lockedZones: lockedZones,
      studentsOut: activePasses.length,
      students: activePasses.map(p => ({
        name: p.studentName,
        destination: p.destination,
        startedAt: p.startedAt?.seconds 
          ? new Date(p.startedAt.seconds * 1000).toLocaleTimeString() 
          : 'Unknown',
        duration: p.duration || 'Active',
      })),
    };
    return report;
  };

  const printReport = () => {
    const report = generateReport();
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Safety Report - ${report.school}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .alert-badge { padding: 8px 16px; border-radius: 20px; font-weight: bold; }
            .alert-normal { background: #dcfce7; color: #166534; }
            .alert-hold { background: #fef3c7; color: #92400e; }
            .alert-lockdown { background: #fee2e2; color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f3f4f6; font-weight: bold; }
            .timestamp { color: #6b7280; font-size: 14px; }
            .count { font-size: 48px; font-weight: bold; color: #dc2626; text-align: center; padding: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
            .signature-line { margin-top: 60px; border-top: 1px solid #000; width: 300px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>🚨 SAFETY REPORT</h1>
              <p><strong>${report.school}</strong></p>
            </div>
            <div class="alert-badge alert-${alertLevel}">${currentAlertConfig.emoji} ${currentAlertConfig.label}</div>
          </div>
          
          <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
          
          <div class="count">
            ${report.studentsOut} Students Currently Out
          </div>
          
          ${lockedZones.length > 0 ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>⚠️ Locked Zones:</strong> ${lockedZones.join(', ')}
            </div>
          ` : ''}
          
          ${report.studentsOut > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Location</th>
                  <th>Left At</th>
                </tr>
              </thead>
              <tbody>
                ${report.students.map(s => `
                  <tr>
                    <td>${s.name}</td>
                    <td>${s.destination}</td>
                    <td>${s.startedAt}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="text-align: center; color: #10b981; font-weight: bold;">✅ All students accounted for</p>'}
          
          <div class="footer">
            <p><strong>Report pulled by:</strong> ___________________________</p>
            <p><strong>Time pulled:</strong> ${new Date().toLocaleTimeString()}</p>
            <div class="signature-line"></div>
            <p style="font-size: 12px; color: #6b7280;">Administrator Signature</p>
          </div>
          
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // FIX L: Calming messages for lockdown
  const calmingMessages = [
    "Stay calm. Help is coordinated.",
    "You're doing great. Stay in place.",
    "Authorities are aware. Stay safe.",
    "This will pass. Breathe slowly.",
    "Everyone is working to keep you safe.",
  ];
  const [calmingIndex, setCalmingIndex] = useState(0);
  
  useEffect(() => {
    if (lockdown) {
      const interval = setInterval(() => {
        setCalmingIndex(prev => (prev + 1) % calmingMessages.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [lockdown]);

  return (
    <>
      {/* FIX L: Lockdown Overlay - Dim screen + calming message + timer */}
      <AnimatePresence>
        {lockdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.div 
                className="text-8xl mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔒
              </motion.div>
              <h1 className="text-4xl font-black text-red-400 mb-2">LOCKDOWN ACTIVE</h1>
              <div className="text-6xl font-mono text-white mb-6">
                {formatElapsedTime(elapsedTime)}
              </div>
              <motion.p 
                key={calmingIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xl text-red-200 max-w-md"
              >
                {calmingMessages[calmingIndex]}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIX E: Lockdown Confirmation Modal */}
      <AnimatePresence>
        {showLockdownConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border-2 border-red-500 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-500/20"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🚨</div>
                <h2 className="text-2xl font-black text-red-400">Activate Lockdown?</h2>
                <p className="text-muted-foreground mt-2">
                  This will alert all staff and lock all hall passes. This action is logged.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-2">Reason (optional but recommended)</label>
                <textarea
                  value={lockdownReason}
                  onChange={(e) => setLockdownReason(e.target.value)}
                  placeholder="e.g., Drill, External threat, Medical emergency..."
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowLockdownConfirm(false);
                    setLockdownReason('');
                  }}
                  className="py-3 bg-accent border border-border rounded-xl font-bold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmLockdown}
                  disabled={isActivating}
                  className="py-3 bg-red-500 text-white rounded-xl font-black disabled:opacity-50"
                >
                  {isActivating ? 'Activating...' : 'ACTIVATE LOCKDOWN'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Level & Lockdown Control */}
        <div className="glass-card p-6">
          <h3 className="font-black text-lg flex items-center gap-2 mb-4">
            <Shield className="text-red-400" size={20} />
            Safety Control
          </h3>

          {/* Alert Level Selector */}
          {(isSchoolAdmin || isSuperAdmin) && (
            <div className="mb-6">
              <label className="text-sm font-bold text-muted-foreground mb-2 block">Alert Level</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ALERT_LEVELS).map(([key, config]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSetAlertLevel?.(config.id)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      alertLevel === config.id
                        ? `bg-${config.color}-500/20 border-${config.color}-500 text-${config.color}-400`
                        : 'border-border hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor: alertLevel === config.id ? `var(--${config.color}-bg)` : undefined,
                      borderColor: alertLevel === config.id ? `var(--${config.color}-border)` : undefined,
                    }}
                  >
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="text-xs font-bold">{config.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Main Lockdown Toggle - FIX E: Now opens confirmation modal */}
          <motion.div 
            layout
            data-guide="lockdown-toggle" 
            className={`p-6 rounded-2xl text-center transition-all ${
              lockdown 
                ? 'bg-red-500/20 border-2 border-red-500' 
                : alertLevel === 'hold'
                  ? 'bg-amber-500/20 border-2 border-amber-500/50'
                  : 'bg-accent border border-border'
            }`}
          >
            <motion.div 
              className={`text-6xl mb-4 ${lockdown ? 'animate-pulse' : ''}`}
              animate={lockdown ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: lockdown ? Infinity : 0 }}
            >
              {currentAlertConfig.emoji}
            </motion.div>
            <div className={`text-2xl font-black mb-2 ${
              lockdown ? 'text-red-400' : 
              alertLevel === 'hold' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {lockdown ? 'LOCKDOWN ACTIVE' : currentAlertConfig.label.toUpperCase()}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {currentAlertConfig.description}
            </p>

            {/* FIX E: Button now triggers confirmation modal for activation */}
            {(isSchoolAdmin || isSuperAdmin) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLockdownClick}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                  lockdown 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {lockdown ? (
                  <>
                    <Unlock size={20} />
                    LIFT LOCKDOWN
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    ACTIVATE LOCKDOWN
                  </>
                )}
              </motion.button>
            )}
          </motion.div>

          {/* Partial Lockdown - Zone Control - FIX O: Added animations */}
          {(isSchoolAdmin || isSuperAdmin) && passDestinations.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <MapPin size={14} />
                  Zone Locks (Partial Lockdown)
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {passDestinations.map(zone => {
                  const isLocked = lockedZones.includes(zone);
                  const isRecentlyToggled = recentlyToggledZone === zone;
                  return (
                    <motion.button
                      key={zone}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      // FIX O: Pulse animation on toggle
                      animate={isRecentlyToggled ? {
                        scale: [1, 1.05, 1],
                        boxShadow: isLocked 
                          ? ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 8px rgba(239,68,68,0.3)', '0 0 0 0 rgba(239,68,68,0)']
                          : ['0 0 0 0 rgba(34,197,94,0)', '0 0 0 8px rgba(34,197,94,0.3)', '0 0 0 0 rgba(34,197,94,0)']
                      } : {}}
                      transition={{ duration: 0.5 }}
                      onClick={() => handleZoneLock(zone)}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between ${
                        isLocked
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-accent/50 border-border hover:border-white/20'
                      }`}
                    >
                      <span className="truncate">{zone}</span>
                      {isLocked ? (
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                          <Lock size={12} />
                        </motion.div>
                      ) : (
                        <span className="text-emerald-400">✓</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Students Currently Out + Report */}
          <div className="mt-4 p-4 bg-accent/50 border border-border rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">Students Currently Out</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${activePasses.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {activePasses.length}
                </span>
                {(isSchoolAdmin || isSuperAdmin) && activePasses.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={printReport}
                    className="p-2 bg-primary/20 text-primary rounded-lg"
                    title="Print Safety Report"
                  >
                    <Printer size={16} />
                  </motion.button>
                )}
              </div>
            </div>
            
            <AnimatePresence>
              {activePasses.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 max-h-32 overflow-y-auto"
                >
                  {activePasses.slice(0, 5).map(pass => (
                    <motion.div 
                      key={pass.id} 
                      layout
                      className="text-xs text-muted-foreground flex justify-between"
                    >
                      <span>{pass.studentName}</span>
                      <span className={`${
                        lockedZones.includes(pass.destination) ? 'text-red-400' : 'text-primary'
                      }`}>
                        {pass.destination}
                        {lockedZones.includes(pass.destination) && ' 🔒'}
                      </span>
                    </motion.div>
                  ))}
                  {activePasses.length > 5 && (
                    <div className="text-xs text-muted-foreground">+{activePasses.length - 5} more</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Conflict Groups */}
        <div className="glass-card p-6" data-guide="conflict-groups">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Users className="text-amber-400" size={20} />
              Conflict Groups
            </h3>
            {isSchoolAdmin && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddGroup(!showAddGroup)}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                data-guide="add-conflict"
              >
                <Plus size={18} />
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {showAddGroup && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-4 bg-accent/50 border border-border rounded-xl space-y-3 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
                <select
                  multiple
                  value={selectedMembers}
                  onChange={(e) => setSelectedMembers(Array.from(e.target.selectedOptions, o => o.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm h-32"
                >
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddGroup}
                    disabled={!newGroupName.trim() || selectedMembers.length < 2}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    Create Group
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddGroup(false)}
                    className="px-4 py-2 bg-accent border border-border rounded-lg text-sm"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {conflictGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conflict groups defined
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {conflictGroups.map(group => {
                  const members = group.members?.map(id => allStudents.find(s => s.id === id)?.full_name || id) || [];
                  return (
                    <motion.div 
                      key={group.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400">{group.name}</span>
                        {isSchoolAdmin && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRemoveConflictGroup(group.id)}
                            className="text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </motion.button>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {members.join(' • ')}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
