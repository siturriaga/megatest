'use client';
import { useState, useCallback, useMemo } from 'react';
import { 
  Building2, Plus, QrCode, Download, Printer, ChevronRight, Check, 
  AlertTriangle, Loader2, Send, Radio, MessageSquare, Globe, Target, 
  Shield, Users, Settings, Trash2, RefreshCw, Power, Eye, EyeOff,
  UserPlus, Crown, School, Activity, Zap, Lock, Unlock, Bell,
  Database, Server, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { generateBulkStudentQRs, generatePrintableIDSheet, downloadBlob } from '../../../utils/qrGenerator';

/**
 * SuperAdminPanel - Command Center
 * 
 * Industry-grade multi-school administration panel.
 * Single entry point for all SuperAdmin operations.
 * 
 * Features:
 * - School Management: Create, view, switch, delete schools
 * - Broadcast System: Global, targeted, and direct messaging
 * - Safety Controls: Global lockdown, system monitoring
 * - QR Generation: Bulk QR codes, printable ID cards
 * - System Controls: Sandbox mode toggle, user promotion
 * 
 * @version 2.5.0
 */

// Tab configuration
const TABS = [
  { id: 'schools', label: 'Schools', icon: Building2, description: 'Manage all schools' },
  { id: 'broadcast', label: 'Broadcast', icon: Radio, description: 'Send announcements' },
  { id: 'safety', label: 'Safety', icon: Shield, description: 'Lockdown controls' },
  { id: 'qrcodes', label: 'QR Codes', icon: QrCode, description: 'Generate & print' },
  { id: 'system', label: 'System', icon: Settings, description: 'Global settings' },
];

// Broadcast types
const BROADCAST_TYPES = [
  { type: 'global', icon: Globe, label: 'Global', color: 'amber', description: 'All schools instantly' },
  { type: 'targeted', icon: Target, label: 'Targeted', color: 'blue', description: 'Select specific schools' },
  { type: 'direct', icon: MessageSquare, label: 'Direct', color: 'purple', description: 'Individual users' },
];

// Priority levels
const PRIORITY_LEVELS = [
  { level: 'normal', color: 'blue', label: 'Normal' },
  { level: 'important', color: 'amber', label: 'Important' },
  { level: 'urgent', color: 'red', label: 'Urgent' },
];

export default function SuperAdminPanel({
  // School data
  allSchools = [],
  currentSchoolId,
  displaySchoolName,
  
  // School actions
  onSwitchSchool,
  onCreateSchool,
  onDeleteSchool,
  
  // Broadcast actions
  onSendGlobalBroadcast,
  onSendTargetedBroadcast,
  onSendDirectMessage,
  
  // Safety actions
  onGlobalLockdown,
  onSchoolLockdown,
  
  // Student data
  allStudents = [],
  
  // User management
  allUsers = [],
  onPromoteUser,
  onDemoteUser,
  
  // Sandbox
  sandboxMode = false,
  onToggleSandbox,
  
  // System
  lockdown = false,
  alertLevel = 'green',
  theme = 'obsidian',
}) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState('schools');
  
  // School creation
  const [newSchoolName, setNewSchoolName] = useState('');
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [schoolActionResult, setSchoolActionResult] = useState(null);
  
  // School deletion
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  
  // QR generation
  const [qrProgress, setQrProgress] = useState(0);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrOperationType, setQrOperationType] = useState(null);
  const [qrError, setQrError] = useState(null);
  
  // Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('global');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [broadcastPriority, setBroadcastPriority] = useState('normal');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  
  // Safety
  const [showGlobalLockdownConfirm, setShowGlobalLockdownConfirm] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');
  const [isExecutingLockdown, setIsExecutingLockdown] = useState(false);
  
  // User management
  const [selectedUserForPromotion, setSelectedUserForPromotion] = useState(null);
  const [isPromotingUser, setIsPromotingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const systemStats = useMemo(() => ({
    totalSchools: allSchools.length,
    totalStudents: allStudents.length,
    activeSchools: allSchools.filter(s => !s.lockdown).length,
    lockedSchools: allSchools.filter(s => s.lockdown).length,
  }), [allSchools, allStudents]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers.slice(0, 20);
    const query = userSearchQuery.toLowerCase();
    return allUsers.filter(user => 
      user.email?.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [allUsers, userSearchQuery]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: SCHOOL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleCreateSchool = useCallback(async () => {
    const trimmedName = newSchoolName.trim();
    if (!trimmedName) {
      setSchoolActionResult({ type: 'error', message: 'School name is required' });
      return;
    }
    
    if (trimmedName.length < 3) {
      setSchoolActionResult({ type: 'error', message: 'School name must be at least 3 characters' });
      return;
    }
    
    if (allSchools.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
      setSchoolActionResult({ type: 'error', message: 'A school with this name already exists' });
      return;
    }
    
    setIsCreatingSchool(true);
    setSchoolActionResult(null);
    
    try {
      await onCreateSchool?.(trimmedName);
      setSchoolActionResult({ type: 'success', message: `"${trimmedName}" created successfully` });
      setNewSchoolName('');
    } catch (error) {
      setSchoolActionResult({ 
        type: 'error', 
        message: error.message || 'Failed to create school. Please try again.' 
      });
    } finally {
      setIsCreatingSchool(false);
    }
  }, [newSchoolName, allSchools, onCreateSchool]);

  const handleDeleteSchool = useCallback(async () => {
    if (!schoolToDelete) return;
    if (deleteConfirmText !== schoolToDelete.name) {
      setSchoolActionResult({ type: 'error', message: 'School name does not match' });
      return;
    }
    
    setIsDeletingSchool(true);
    
    try {
      await onDeleteSchool?.(schoolToDelete.id);
      setSchoolActionResult({ type: 'success', message: `"${schoolToDelete.name}" deleted` });
      setSchoolToDelete(null);
      setDeleteConfirmText('');
    } catch (error) {
      setSchoolActionResult({ 
        type: 'error', 
        message: error.message || 'Failed to delete school' 
      });
    } finally {
      setIsDeletingSchool(false);
    }
  }, [schoolToDelete, deleteConfirmText, onDeleteSchool]);

  const handleSwitchSchool = useCallback((schoolId) => {
    setSchoolActionResult(null);
    onSwitchSchool?.(schoolId);
  }, [onSwitchSchool]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: BROADCAST
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleSendBroadcast = useCallback(async () => {
    const trimmedMessage = broadcastMessage.trim();
    if (!trimmedMessage) {
      setBroadcastResult({ type: 'error', message: 'Message is required' });
      return;
    }
    
    if (broadcastType === 'targeted' && selectedSchools.length === 0) {
      setBroadcastResult({ type: 'error', message: 'Select at least one school' });
      return;
    }
    
    setIsSendingBroadcast(true);
    setBroadcastResult(null);
    
    try {
      const broadcastPayload = {
        message: trimmedMessage,
        priority: broadcastPriority,
        timestamp: new Date().toISOString(),
      };
      
      switch (broadcastType) {
        case 'global':
          await onSendGlobalBroadcast?.(trimmedMessage, broadcastPriority);
          setBroadcastResult({ 
            type: 'success', 
            message: `Global broadcast sent to ${allSchools.length} schools` 
          });
          break;
          
        case 'targeted':
          await onSendTargetedBroadcast?.(trimmedMessage, broadcastPriority, selectedSchools);
          setBroadcastResult({ 
            type: 'success', 
            message: `Broadcast sent to ${selectedSchools.length} school(s)` 
          });
          break;
          
        case 'direct':
          await onSendDirectMessage?.(trimmedMessage, broadcastPriority);
          setBroadcastResult({ type: 'success', message: 'Direct message sent' });
          break;
      }
      
      setBroadcastMessage('');
      setSelectedSchools([]);
    } catch (error) {
      setBroadcastResult({ 
        type: 'error', 
        message: error.message || 'Failed to send broadcast' 
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  }, [broadcastMessage, broadcastType, broadcastPriority, selectedSchools, allSchools, onSendGlobalBroadcast, onSendTargetedBroadcast, onSendDirectMessage]);

  const toggleSchoolSelection = useCallback((schoolId) => {
    setSelectedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId) 
        : [...prev, schoolId]
    );
  }, []);

  const selectAllSchools = useCallback(() => {
    setSelectedSchools(allSchools.map(s => s.id));
  }, [allSchools]);

  const clearSchoolSelection = useCallback(() => {
    setSelectedSchools([]);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: SAFETY
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleGlobalLockdown = useCallback(async () => {
    if (!lockdownReason.trim()) {
      return;
    }
    
    setIsExecutingLockdown(true);
    
    try {
      await onGlobalLockdown?.(lockdownReason);
      setShowGlobalLockdownConfirm(false);
      setLockdownReason('');
    } catch (error) {
      console.error('Global lockdown failed:', error);
    } finally {
      setIsExecutingLockdown(false);
    }
  }, [lockdownReason, onGlobalLockdown]);

  const cancelLockdown = useCallback(() => {
    setShowGlobalLockdownConfirm(false);
    setLockdownReason('');
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: QR GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleDownloadQRZip = useCallback(async () => {
    if (allStudents.length === 0) {
      setQrError('No students available to generate QR codes');
      return;
    }
    
    setIsGeneratingQR(true);
    setQrOperationType('zip');
    setQrProgress(0);
    setQrError(null);
    
    try {
      const blob = await generateBulkStudentQRs(allStudents, currentSchoolId, setQrProgress);
      const filename = `${displaySchoolName?.replace(/\W/g, '_') || 'school'}_QR_Codes_${new Date().toISOString().split('T')[0]}.zip`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('QR generation failed:', error);
      setQrError(error.message || 'Failed to generate QR codes');
    } finally {
      setIsGeneratingQR(false);
      setQrOperationType(null);
    }
  }, [allStudents, currentSchoolId, displaySchoolName]);

  const handlePrintIDCards = useCallback(async () => {
    if (allStudents.length === 0) {
      setQrError('No students available to print ID cards');
      return;
    }
    
    setIsGeneratingQR(true);
    setQrOperationType('print');
    setQrProgress(0);
    setQrError(null);
    
    try {
      const html = await generatePrintableIDSheet(
        allStudents, 
        currentSchoolId, 
        displaySchoolName || 'School', 
        setQrProgress
      );
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        setQrError('Pop-up blocked. Please allow pop-ups for this site.');
      }
    } catch (error) {
      console.error('Print generation failed:', error);
      setQrError(error.message || 'Failed to generate printable ID cards');
    } finally {
      setIsGeneratingQR(false);
      setQrOperationType(null);
    }
  }, [allStudents, currentSchoolId, displaySchoolName]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handlePromoteUser = useCallback(async (user, newRole) => {
    setIsPromotingUser(true);
    
    try {
      await onPromoteUser?.(user.id, newRole);
      setSelectedUserForPromotion(null);
    } catch (error) {
      console.error('User promotion failed:', error);
    } finally {
      setIsPromotingUser(false);
    }
  }, [onPromoteUser]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: SANDBOX
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleToggleSandbox = useCallback(async () => {
    try {
      await onToggleSandbox?.(!sandboxMode);
    } catch (error) {
      console.error('Sandbox toggle failed:', error);
    }
  }, [sandboxMode, onToggleSandbox]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const renderActionResult = (result, onClear) => {
    if (!result) return null;
    
    const isSuccess = result.type === 'success';
    const Icon = isSuccess ? CheckCircle2 : XCircle;
    
    return (
      <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${
        isSuccess 
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
          : 'bg-red-500/10 border border-red-500/30 text-red-400'
      }`}>
        <Icon size={18} />
        <span className="flex-1 text-sm font-medium">{result.message}</span>
        {onClear && (
          <button 
            onClick={onClear}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <XCircle size={14} />
          </button>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Globe size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              Command Center
            </h2>
            <p className="text-sm text-muted-foreground">
              Multi-school administration • {systemStats.totalSchools} schools • {systemStats.totalStudents} students
            </p>
          </div>
        </div>
        
        {/* System Status Indicators */}
        <div className="flex items-center gap-3">
          {sandboxMode && (
            <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-amber-400">SANDBOX</span>
            </div>
          )}
          {lockdown && (
            <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-red-400">LOCKDOWN</span>
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
            alertLevel === 'green' 
              ? 'bg-emerald-500/10 border border-emerald-500/30' 
              : alertLevel === 'yellow'
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <Activity size={14} className={
              alertLevel === 'green' ? 'text-emerald-400' :
              alertLevel === 'yellow' ? 'text-amber-400' : 'text-red-400'
            } />
            <span className={`text-xs font-bold ${
              alertLevel === 'green' ? 'text-emerald-400' :
              alertLevel === 'yellow' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {alertLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB NAVIGATION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-1 p-1 bg-accent/30 rounded-xl overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-bold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: SCHOOLS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          {/* Create School Form */}
          <div className="p-6 bg-gradient-to-br from-accent/50 to-accent/30 border border-border rounded-2xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={20} className="text-amber-400" />
              Create New School
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter school name (e.g., Lincoln High School)"
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSchool()}
                maxLength={100}
                disabled={isCreatingSchool}
              />
              <button
                onClick={handleCreateSchool}
                disabled={!newSchoolName.trim() || isCreatingSchool}
                className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                {isCreatingSchool ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Create
              </button>
            </div>
            {renderActionResult(schoolActionResult, () => setSchoolActionResult(null))}
          </div>

          {/* School List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">All Schools ({allSchools.length})</h3>
              <div className="text-sm text-muted-foreground">
                {systemStats.activeSchools} active • {systemStats.lockedSchools} locked
              </div>
            </div>
            
            {allSchools.length === 0 ? (
              <div className="p-12 text-center bg-accent/20 rounded-2xl border border-border">
                <Building2 size={56} className="mx-auto mb-4 text-muted-foreground/30" />
                <h4 className="font-bold text-lg mb-2">No Schools Yet</h4>
                <p className="text-sm text-muted-foreground">Create your first school above to get started</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {allSchools.map(school => (
                  <div
                    key={school.id}
                    className={`p-4 rounded-xl border transition-all ${
                      school.id === currentSchoolId
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-accent/30 border-border hover:border-primary/30 hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleSwitchSchool(school.id)}
                        className="flex items-center gap-4 flex-1 text-left"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                          school.id === currentSchoolId 
                            ? 'bg-amber-500/20 text-amber-400' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {school.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base truncate">{school.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>ID: {school.id}</span>
                            {school.lockdown && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold">
                                LOCKED
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {school.id === currentSchoolId && (
                          <span className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg">
                            ACTIVE
                          </span>
                        )}
                        <button
                          onClick={() => setSchoolToDelete(school)}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete school"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={18} className="text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {schoolToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-red-400">Delete School</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    This action cannot be undone. All data will be permanently deleted.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-sm text-center">
                      Type <span className="font-bold text-red-400">{schoolToDelete.name}</span> to confirm
                    </p>
                  </div>
                  
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type school name to confirm"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none"
                    autoFocus
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSchoolToDelete(null);
                        setDeleteConfirmText('');
                      }}
                      className="flex-1 px-4 py-3 bg-accent border border-border rounded-xl font-bold hover:bg-accent/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteSchool}
                      disabled={deleteConfirmText !== schoolToDelete.name || isDeletingSchool}
                      className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-400 transition-all flex items-center justify-center gap-2"
                    >
                      {isDeletingSchool ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: BROADCAST */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* Broadcast Type Selection */}
          <div className="grid grid-cols-3 gap-3">
            {BROADCAST_TYPES.map(({ type, icon: Icon, label, color, description }) => (
              <button
                key={type}
                onClick={() => setBroadcastType(type)}
                className={`p-5 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                  broadcastType === type
                    ? `bg-${color}-500/20 border-${color}-500 text-${color}-400 shadow-lg shadow-${color}-500/10`
                    : 'border-border hover:border-primary/30 hover:bg-accent/50'
                }`}
              >
                <Icon size={28} />
                <div className="text-center">
                  <div className="font-bold">{label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Targeted School Selection */}
          {broadcastType === 'targeted' && (
            <div className="p-5 bg-accent/30 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold flex items-center gap-2">
                  <Target size={16} className="text-blue-400" />
                  Select Schools ({selectedSchools.length} selected)
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllSchools}
                    className="px-3 py-1 text-xs font-bold text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSchoolSelection}
                    className="px-3 py-1 text-xs font-bold text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {allSchools.map(school => (
                  <button
                    key={school.id}
                    onClick={() => toggleSchoolSelection(school.id)}
                    className={`p-3 rounded-lg text-sm text-left flex items-center gap-3 transition-all ${
                      selectedSchools.includes(school.id)
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : 'bg-accent/50 hover:bg-accent border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedSchools.includes(school.id) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-border'
                    }`}>
                      {selectedSchools.includes(school.id) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <span className="truncate">{school.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Bell size={16} className="text-muted-foreground" />
              Priority Level
            </h4>
            <div className="flex gap-2">
              {PRIORITY_LEVELS.map(({ level, color, label }) => (
                <button
                  key={level}
                  onClick={() => setBroadcastPriority(level)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    broadcastPriority === level
                      ? `bg-${color}-500/20 border-${color}-500 text-${color}-400`
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold flex items-center gap-2">
                <MessageSquare size={16} className="text-muted-foreground" />
                Message
              </h4>
              <span className={`text-xs ${
                broadcastMessage.length > 450 ? 'text-amber-400' : 'text-muted-foreground'
              }`}>
                {broadcastMessage.length}/500
              </span>
            </div>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value.slice(0, 500))}
              placeholder="Type your broadcast message..."
              className="w-full h-36 p-4 bg-accent/30 border border-border rounded-xl resize-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
              disabled={isSendingBroadcast}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendBroadcast}
            disabled={
              !broadcastMessage.trim() || 
              isSendingBroadcast || 
              (broadcastType === 'targeted' && selectedSchools.length === 0)
            }
            className="w-full py-4 bg-amber-500 text-black font-bold rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
          >
            {isSendingBroadcast ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
            {broadcastType === 'global' 
              ? `Broadcast to All ${allSchools.length} Schools`
              : broadcastType === 'targeted'
              ? `Send to ${selectedSchools.length} School(s)`
              : 'Send Direct Message'
            }
          </button>

          {renderActionResult(broadcastResult, () => setBroadcastResult(null))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: SAFETY */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* Global Lockdown Control */}
          <div className="p-8 bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-2xl text-center">
            <div className="text-7xl mb-6">🚨</div>
            <h3 className="text-3xl font-black text-red-400 mb-3">GLOBAL LOCKDOWN</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Immediately lock ALL {allSchools.length} schools. Hall passes will be disabled system-wide until manually lifted.
            </p>
            
            {!showGlobalLockdownConfirm ? (
              <button
                onClick={() => setShowGlobalLockdownConfirm(true)}
                className="px-10 py-5 bg-red-500 text-white font-black text-lg rounded-2xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/30 flex items-center gap-3 mx-auto"
              >
                <Lock size={24} />
                INITIATE GLOBAL LOCKDOWN
              </button>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-5 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="font-bold text-red-400 text-lg">⚠️ CONFIRM GLOBAL LOCKDOWN</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will lock down {allSchools.length} schools affecting {allStudents.length} students.
                  </p>
                </div>
                
                <input
                  type="text"
                  value={lockdownReason}
                  onChange={(e) => setLockdownReason(e.target.value)}
                  placeholder="Enter reason for lockdown (required)"
                  className="w-full px-4 py-3 bg-background border border-red-500/30 rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none"
                  autoFocus
                />
                
                <div className="flex gap-3">
                  <button
                    onClick={cancelLockdown}
                    className="flex-1 px-6 py-3 bg-accent border border-border rounded-xl font-bold hover:bg-accent/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGlobalLockdown}
                    disabled={!lockdownReason.trim() || isExecutingLockdown}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExecutingLockdown ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Lock size={18} />
                    )}
                    CONFIRM LOCKDOWN
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* System Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-5 bg-accent/50 border border-border rounded-xl text-center">
              <School size={24} className="mx-auto mb-2 text-amber-400" />
              <div className="text-3xl font-black text-amber-400">{systemStats.totalSchools}</div>
              <div className="text-xs text-muted-foreground">Total Schools</div>
            </div>
            <div className="p-5 bg-accent/50 border border-border rounded-xl text-center">
              <Users size={24} className="mx-auto mb-2 text-blue-400" />
              <div className="text-3xl font-black text-blue-400">{systemStats.totalStudents}</div>
              <div className="text-xs text-muted-foreground">Total Students</div>
            </div>
            <div className="p-5 bg-accent/50 border border-border rounded-xl text-center">
              <Unlock size={24} className="mx-auto mb-2 text-emerald-400" />
              <div className="text-3xl font-black text-emerald-400">{systemStats.activeSchools}</div>
              <div className="text-xs text-muted-foreground">Active Schools</div>
            </div>
            <div className="p-5 bg-accent/50 border border-border rounded-xl text-center">
              <Lock size={24} className="mx-auto mb-2 text-red-400" />
              <div className="text-3xl font-black text-red-400">{systemStats.lockedSchools}</div>
              <div className="text-xs text-muted-foreground">Locked Down</div>
            </div>
          </div>

          {/* School Lockdown Status List */}
          <div>
            <h4 className="font-bold mb-4">School Status</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allSchools.map(school => (
                <div
                  key={school.id}
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    school.lockdown
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-accent/30 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      school.lockdown ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    <span className="font-medium">{school.name}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    school.lockdown
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {school.lockdown ? 'LOCKED' : 'ACTIVE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: QR CODES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'qrcodes' && (
        <div className="space-y-6">
          {/* School Context */}
          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School size={20} className="text-amber-400" />
                <div>
                  <span className="text-amber-400 font-bold">Current School:</span>
                  <span className="ml-2">{displaySchoolName || 'Not selected'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users size={20} className="text-amber-400" />
                <div>
                  <span className="text-amber-400 font-bold">Students:</span>
                  <span className="ml-2">{allStudents.length}</span>
                </div>
              </div>
            </div>
          </div>

          {qrError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span>{qrError}</span>
              <button 
                onClick={() => setQrError(null)}
                className="ml-auto p-1 hover:bg-red-500/20 rounded"
              >
                <XCircle size={16} />
              </button>
            </div>
          )}

          {allStudents.length === 0 ? (
            <div className="p-12 text-center bg-accent/20 rounded-2xl border border-border">
              <QrCode size={64} className="mx-auto mb-4 text-muted-foreground/30" />
              <h4 className="font-bold text-lg mb-2">No Students Available</h4>
              <p className="text-sm text-muted-foreground">
                Switch to a school with enrolled students to generate QR codes
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Download ZIP */}
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl">
                <Download size={36} className="text-blue-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Download QR Codes</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Generate a ZIP archive containing individual QR code images for each student in PNG format.
                </p>
                <button
                  onClick={handleDownloadQRZip}
                  disabled={isGeneratingQR}
                  className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                >
                  {isGeneratingQR && qrOperationType === 'zip' ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating... {qrProgress}%
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Download ZIP ({allStudents.length} codes)
                    </>
                  )}
                </button>
              </div>

              {/* Print ID Cards */}
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl">
                <Printer size={36} className="text-purple-400 mb-4" />
                <h3 className="font-bold text-lg mb-2">Print ID Cards</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Generate a printer-friendly page with student ID cards including photos, names, and QR codes.
                </p>
                <button
                  onClick={handlePrintIDCards}
                  disabled={isGeneratingQR}
                  className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20"
                >
                  {isGeneratingQR && qrOperationType === 'print' ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating... {qrProgress}%
                    </>
                  ) : (
                    <>
                      <Printer size={20} />
                      Print ID Cards ({allStudents.length} students)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isGeneratingQR && (
            <div className="p-5 bg-accent/50 border border-border rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-amber-400" />
                  Generating {qrOperationType === 'zip' ? 'QR Codes' : 'ID Cards'}...
                </span>
                <span className="text-amber-400 font-bold">{qrProgress}%</span>
              </div>
              <div className="h-3 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${qrProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Processing {allStudents.length} students...
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: SYSTEM */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Sandbox Mode Toggle */}
          <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  sandboxMode ? 'bg-amber-500/20 text-amber-400' : 'bg-accent text-muted-foreground'
                }`}>
                  <Database size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sandbox Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Practice with demo data without affecting real student records
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleToggleSandbox}
                className={`relative w-16 h-8 rounded-full transition-all ${
                  sandboxMode 
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/30' 
                    : 'bg-accent border border-border'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                  sandboxMode ? 'left-9' : 'left-1'
                }`} />
              </button>
            </div>
            
            {sandboxMode && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <AlertCircle size={16} />
                  Sandbox mode is active. Changes will not affect real data.
                </div>
              </div>
            )}
          </div>

          {/* User Management Section */}
          <div className="p-6 bg-accent/30 border border-border rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">User Management</h3>
                <p className="text-sm text-muted-foreground">Promote teachers to administrators</p>
              </div>
            </div>
            
            {/* User Search */}
            <div className="mb-4">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none"
              />
            </div>
            
            {/* User List */}
            {allUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p>No users available</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-4 bg-accent/50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{user.displayName || user.full_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        user.role === 'super_admin' 
                          ? 'bg-amber-500/20 text-amber-400'
                          : user.role === 'school_admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'super_admin' ? 'SUPER ADMIN' :
                         user.role === 'school_admin' ? 'ADMIN' : 'TEACHER'}
                      </span>
                      
                      {user.role === 'teacher' && (
                        <button
                          onClick={() => handlePromoteUser(user, 'school_admin')}
                          disabled={isPromotingUser}
                          className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/20 transition-all flex items-center gap-1"
                        >
                          <UserPlus size={12} />
                          Promote
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="p-6 bg-accent/30 border border-border rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <Server size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">System Information</h3>
                <p className="text-sm text-muted-foreground">Platform statistics and status</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">Platform Version</div>
                <div className="font-bold">STRIDE v2.5.0</div>
              </div>
              <div className="p-4 bg-background rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">System Status</div>
                <div className="font-bold text-emerald-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  Operational
                </div>
              </div>
              <div className="p-4 bg-background rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">Total Schools</div>
                <div className="font-bold">{systemStats.totalSchools}</div>
              </div>
              <div className="p-4 bg-background rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">Total Students</div>
                <div className="font-bold">{systemStats.totalStudents}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
