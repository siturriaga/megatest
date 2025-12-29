'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { 
  // Navigation & UI
  X, Menu, ChevronRight, ChevronDown, Search, Bell, LogOut, Moon, Sun,
  // Core Features
  Navigation, Users, AlertTriangle, Award, Star,
  // Admin Features  
  Tag, Home, MessageSquare, Clock, DollarSign, CheckCircle, XCircle, 
  FileText, QrCode, Shield, Lock, Unlock, Settings, MapPin,
  // SuperAdmin Features
  Globe, Building, Radio, Activity, Zap, UserCog,
  // Actions
  Plus, Trash2, Upload, Download, Copy, Check, Eye, RefreshCw, Loader2,
  // Hall Pass
  Timer, Play, Square, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';

/**
 * STRIDE Unified Dashboard
 * 
 * Single dashboard with role-based section visibility:
 * 
 * 🎓 TEACHER (Base):
 *    - Hall Pass, Roster, Infractions, Incentives
 * 
 * 👮 SCHOOL ADMIN (Teacher + Config):
 *    - Labels, Houses, Bot Messages, Schedule, Economy
 *    - Approvals, Ledger, QR Passes, Safety, Settings
 * 
 * ⚡ SUPERADMIN (Admin + Global):
 *    - Command Center, Schools, Global Upload, Broadcast
 */

// =====================
// SECTION DEFINITIONS
// =====================
const SECTIONS = {
  // Teacher sections (everyone sees)
  hallpass: { id: 'hallpass', label: 'Hall Pass', icon: Navigation, tier: 'teacher', group: 'core' },
  roster: { id: 'roster', label: 'Roster', icon: Users, tier: 'teacher', group: 'core' },
  infractions: { id: 'infractions', label: 'Infractions', icon: AlertTriangle, tier: 'teacher', group: 'core' },
  incentives: { id: 'incentives', label: 'Incentives', icon: Award, tier: 'teacher', group: 'core' },
  
  // School Admin sections
  destinations: { id: 'destinations', label: 'Destinations', icon: MapPin, tier: 'admin', group: 'config' },
  labels: { id: 'labels', label: 'Labels', icon: Tag, tier: 'admin', group: 'config' },
  houses: { id: 'houses', label: 'Houses', icon: Home, tier: 'admin', group: 'config' },
  botmessages: { id: 'botmessages', label: 'Bot Messages', icon: MessageSquare, tier: 'admin', group: 'config' },
  schedule: { id: 'schedule', label: 'Bell Schedule', icon: Clock, tier: 'admin', group: 'config' },
  economy: { id: 'economy', label: 'Economy', icon: DollarSign, tier: 'admin', group: 'config' },
  approvals: { id: 'approvals', label: 'Approvals', icon: CheckCircle, tier: 'admin', group: 'manage' },
  ledger: { id: 'ledger', label: 'Infraction Ledger', icon: FileText, tier: 'admin', group: 'manage' },
  qrpasses: { id: 'qrpasses', label: 'QR Passes', icon: QrCode, tier: 'admin', group: 'manage' },
  upload: { id: 'upload', label: 'Upload Roster', icon: Upload, tier: 'admin', group: 'manage' },
  safety: { id: 'safety', label: 'Safety & Lockdown', icon: Shield, tier: 'admin', group: 'manage' },
  settings: { id: 'settings', label: 'Settings', icon: Settings, tier: 'admin', group: 'config' },
  
  // SuperAdmin sections
  command: { id: 'command', label: 'Command Center', icon: Globe, tier: 'superadmin', group: 'global' },
  schools: { id: 'schools', label: 'Manage Schools', icon: Building, tier: 'superadmin', group: 'global' },
  globalupload: { id: 'globalupload', label: 'Global Upload', icon: Upload, tier: 'superadmin', group: 'global' },
  broadcast: { id: 'broadcast', label: 'Broadcast', icon: Radio, tier: 'superadmin', group: 'global' },
  system: { id: 'system', label: 'System Health', icon: Activity, tier: 'superadmin', group: 'global' },
};

const SECTION_GROUPS = {
  core: { label: '📚 Core', description: 'Daily classroom tools' },
  config: { label: '⚙️ Configuration', description: 'School settings' },
  manage: { label: '📋 Management', description: 'Data & approvals' },
  global: { label: '🌐 Global', description: 'Multi-school admin' },
};

// =====================
// MAIN COMPONENT
// =====================
export default function StrideDashboard({
  // User & Auth
  user,
  userData,
  isSchoolAdmin = false,
  isSuperAdmin = false,
  userGreeting = 'Teacher',
  onSignOut,
  
  // School Context
  currentSchoolId,
  displaySchoolName,
  sandboxMode = false,
  allSchools = [],
  onCreateSchool,
  onSwitchSchool,
  
  // Students & Data
  allStudents = [],
  houses = [],
  activePasses = [],
  boxQueue = [],
  logs = [],
  broadcasts = [],
  conflictGroups = [],
  
  // Config Objects
  labelsConfig = {},
  economyConfig = {},
  bellSchedule = {},
  settingsConfig = {},
  
  // Actions
  onUpdateConfig,
  onUpdateHouses,
  onHandleFileUpload,
  onIssuePass,
  onEndPass,
  onLogInfraction,
  onAwardIncentive,
  onResolveQueueItem,
  onToggleLockdown,
  onSendBroadcast,
  onAddConflictGroup,
  onRemoveConflictGroup,
  onGlobalLockdown,
  onGlobalBroadcast,
  
  // State
  lockdown = false,
  theme = 'obsidian',
  onThemeChange,
}) {
  // =====================
  // STATE
  // =====================
  const [activeSection, setActiveSection] = useState('hallpass');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const fileInputRef = useRef(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  
  // Config editing state
  const [newLabel, setNewLabel] = useState('');
  const [editingHouse, setEditingHouse] = useState(null);
  const [newBotMessage, setNewBotMessage] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [localSchedule, setLocalSchedule] = useState([]);
  
  // SuperAdmin state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState('normal');
  const [uploadSchoolId, setUploadSchoolId] = useState('');
  
  // Ledger & QR state
  const [ledgerTimeRange, setLedgerTimeRange] = useState('today');
  const [selectedStudentsForQR, setSelectedStudentsForQR] = useState([]);
  const [showStudentQR, setShowStudentQR] = useState(null);
  
  // Pass state
  const [passDestination, setPassDestination] = useState('');
  const [passNote, setPassNote] = useState('');
  
  // Infraction/Incentive state
  const [selectedInfractionType, setSelectedInfractionType] = useState('');
  const [selectedIncentiveType, setSelectedIncentiveType] = useState('');
  const [pointsToAward, setPointsToAward] = useState(1);
  
  // Misc
  const [copiedCode, setCopiedCode] = useState(false);

  // =====================
  // COMPUTED
  // =====================
  
  // Get visible sections based on role
  const visibleSections = useMemo(() => {
    return Object.values(SECTIONS).filter(section => {
      if (section.tier === 'teacher') return true;
      if (section.tier === 'admin') return isSchoolAdmin || isSuperAdmin;
      if (section.tier === 'superadmin') return isSuperAdmin;
      return false;
    });
  }, [isSchoolAdmin, isSuperAdmin]);

  // Group sections for sidebar
  const groupedSections = useMemo(() => {
    const groups = {};
    visibleSections.forEach(section => {
      if (!groups[section.group]) groups[section.group] = [];
      groups[section.group].push(section);
    });
    return groups;
  }, [visibleSections]);

  // Pending approvals count
  const pendingQueue = useMemo(() => {
    return (boxQueue || []).filter(q => !q.resolved);
  }, [boxQueue]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const q = searchQuery.toLowerCase();
    return allStudents.filter(s => 
      s.full_name?.toLowerCase().includes(q) ||
      s.student_id_number?.toLowerCase().includes(q)
    );
  }, [allStudents, searchQuery]);

  // Infraction logs with time filter
  const infractionLogs = useMemo(() => {
    if (!logs) return [];
    let filtered = logs.filter(l => l.type === 'INFRACTION');
    const now = Date.now();
    const getTime = (log) => log.ts?.toDate?.() || new Date(log.ts?.seconds * 1000) || new Date(log.ts);
    
    if (ledgerTimeRange === 'today') {
      const today = new Date(); today.setHours(0,0,0,0);
      filtered = filtered.filter(l => getTime(l) >= today);
    } else if (ledgerTimeRange === 'week') {
      filtered = filtered.filter(l => getTime(l).getTime() >= now - 7*24*60*60*1000);
    } else if (ledgerTimeRange === 'month') {
      filtered = filtered.filter(l => getTime(l).getTime() >= now - 30*24*60*60*1000);
    }
    return filtered.sort((a,b) => getTime(b) - getTime(a));
  }, [logs, ledgerTimeRange]);

  // =====================
  // HANDLERS
  // =====================

  // File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const students = jsonData.map((row, i) => ({
        full_name: row.full_name || row.name || row.Name || row['Full Name'] || '',
        student_id_number: String(row.student_id || row.id || row.ID || `STU-${Date.now()}-${i}`),
        grade_level: parseInt(row.grade || row.Grade || 9, 10),
        status: 'IN',
        houseId: null,
      })).filter(s => s.full_name);

      const grades = [...new Set(students.map(s => s.grade_level))].sort((a,b) => a-b);
      setUploadPreview({ students, grades, stats: { total: students.length } });
      setUploadResult({ success: true, message: `Found ${students.length} students` });
    } catch (err) {
      setUploadResult({ success: false, error: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmUpload = async () => {
    if (!uploadPreview) return;
    setIsUploading(true);
    try {
      await onHandleFileUpload?.(uploadPreview.students);
      setUploadResult({ success: true, count: uploadPreview.students.length });
      setUploadPreview(null);
    } catch (err) {
      setUploadResult({ success: false, error: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  // Label management
  const addLabel = (type) => {
    if (!newLabel.trim()) return;
    const current = labelsConfig?.[type] || [];
    if (!current.includes(newLabel.trim())) {
      onUpdateConfig?.('labels', { ...labelsConfig, [type]: [...current, newLabel.trim()] });
    }
    setNewLabel('');
  };

  const removeLabel = (type, label) => {
    const current = labelsConfig?.[type] || [];
    onUpdateConfig?.('labels', { ...labelsConfig, [type]: current.filter(l => l !== label) });
  };

  // House management
  const saveHouse = (house) => {
    const updated = houses.map(h => h.id === house.id ? house : h);
    onUpdateHouses?.(updated);
    setEditingHouse(null);
  };

  const addHouse = () => {
    const newHouse = { id: `house-${Date.now()}`, name: 'New House', mascot: '🏠', color: '#6366f1', score: 0 };
    onUpdateHouses?.([...houses, newHouse]);
  };

  // Bot messages
  const addBotMessage = () => {
    if (!newBotMessage.trim()) return;
    const current = settingsConfig?.customBotMessages || [];
    onUpdateConfig?.('settings', {
      ...settingsConfig,
      customBotMessages: [...current, { id: Date.now(), text: newBotMessage.trim() }]
    });
    setNewBotMessage('');
  };

  // School management
  const createSchool = async () => {
    if (!newSchoolName.trim()) return;
    await onCreateSchool?.(newSchoolName.trim());
    setNewSchoolName('');
  };

  // Pass management
  const issuePass = () => {
    if (!selectedStudent || !passDestination) return;
    onIssuePass?.({
      studentId: selectedStudent.id,
      studentName: selectedStudent.full_name,
      destination: passDestination,
      note: passNote,
    });
    setPassDestination('');
    setPassNote('');
    setSelectedStudent(null);
  };

  // Infractions
  const logInfraction = () => {
    if (!selectedStudent || !selectedInfractionType) return;
    onLogInfraction?.({
      studentId: selectedStudent.id,
      studentName: selectedStudent.full_name,
      type: selectedInfractionType,
    });
    setSelectedInfractionType('');
    setSelectedStudent(null);
  };

  // Incentives
  const awardIncentive = () => {
    if (!selectedStudent || !selectedIncentiveType) return;
    onAwardIncentive?.({
      studentId: selectedStudent.id,
      studentName: selectedStudent.full_name,
      type: selectedIncentiveType,
      points: pointsToAward,
    });
    setSelectedIncentiveType('');
    setPointsToAward(1);
    setSelectedStudent(null);
  };

  // QR utilities
  const copySchoolCode = () => {
    navigator.clipboard.writeText(currentSchoolId || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generateStudentQR = (student) => JSON.stringify({
    type: 'student', id: student.student_id_number,
    name: student.full_name, grade: student.grade_level, schoolId: currentSchoolId
  });

  // =====================
  // RENDER HELPERS
  // =====================

  const renderStudentList = (onSelect, showSearch = true) => (
    <div className="space-y-3">
      {showSearch && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2.5 bg-accent border border-border rounded-xl text-sm"
          />
        </div>
      )}
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {filteredStudents.slice(0, 50).map(student => (
          <button
            key={student.id}
            onClick={() => onSelect(student)}
            className={`w-full p-3 rounded-xl text-left transition-all flex justify-between items-center ${
              selectedStudent?.id === student.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-accent hover:bg-accent/80'
            }`}
          >
            <div>
              <div className="font-bold text-sm">{student.full_name}</div>
              <div className="text-xs opacity-70">Grade {student.grade_level} • {student.student_id_number}</div>
            </div>
            {student.status === 'OUT' && (
              <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded">OUT</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // =====================
  // SECTION CONTENT
  // =====================

  const renderSectionContent = () => {
    switch (activeSection) {
      // ========== TEACHER: HALL PASS ==========
      case 'hallpass':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Pass */}
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Navigation size={18} className="text-primary" /> Issue Hall Pass
              </h3>
              {renderStudentList(setSelectedStudent)}
              
              {selectedStudent && (
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl space-y-3">
                  <div className="font-bold">{selectedStudent.full_name}</div>
                  <select
                    value={passDestination}
                    onChange={(e) => setPassDestination(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl"
                  >
                    <option value="">Select destination...</option>
                    {(labelsConfig?.passDestinations || ['Bathroom', 'Water', 'Office', 'Nurse']).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    value={passNote}
                    onChange={(e) => setPassNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full p-3 bg-background border border-border rounded-xl"
                  />
                  <button
                    onClick={issuePass}
                    disabled={!passDestination}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50"
                  >
                    Issue Pass
                  </button>
                </div>
              )}
            </div>

            {/* Active Passes */}
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Timer size={18} className="text-amber-500" /> Active Passes ({activePasses?.length || 0})
              </h3>
              {lockdown && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 font-bold animate-pulse">
                  🚨 LOCKDOWN ACTIVE - All passes suspended
                </div>
              )}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {(activePasses || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Navigation size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No active passes</p>
                  </div>
                ) : (
                  activePasses.map(pass => (
                    <div key={pass.id} className="p-4 bg-accent rounded-xl border border-border flex justify-between items-center">
                      <div>
                        <div className="font-bold">{pass.studentName}</div>
                        <div className="text-sm text-muted-foreground">{pass.destination}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono font-bold">{pass.elapsed || '0:00'}</div>
                          <div className="text-xs text-muted-foreground">elapsed</div>
                        </div>
                        <button
                          onClick={() => onEndPass?.(pass.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
                        >
                          <Square size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      // ========== TEACHER: ROSTER ==========
      case 'roster':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" /> Student Roster ({allStudents.length})
              </h3>
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 bg-accent border border-border rounded-xl text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStudents.slice(0, 60).map(student => {
                const house = houses.find(h => h.id === student.houseId);
                return (
                  <div 
                    key={student.id} 
                    className="p-4 bg-accent rounded-xl border border-border"
                    style={house ? { borderLeftColor: house.color, borderLeftWidth: 4 } : {}}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{student.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {student.student_id_number} • Grade {student.grade_level}
                        </div>
                        {house && (
                          <div className="text-xs mt-1" style={{ color: house.color }}>
                            {house.mascot} {house.name}
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        student.status === 'OUT' ? 'bg-amber-500 text-black' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {student.status || 'IN'}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="flex-1 text-center p-2 bg-background rounded-lg">
                        <div className="text-lg font-bold text-emerald-500">{student.incentive_points_student || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Points</div>
                      </div>
                      <div className="flex-1 text-center p-2 bg-background rounded-lg">
                        <div className="text-lg font-bold text-red-500">{student.infraction_count || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Infractions</div>
                      </div>
                      <div className="flex-1 text-center p-2 bg-background rounded-lg">
                        <div className="text-lg font-bold text-amber-500">{student.tardy_count || 0}</div>
                        <div className="text-[10px] text-muted-foreground">Tardies</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ========== TEACHER: INFRACTIONS ==========
      case 'infractions':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Log Infraction
              </h3>
              {renderStudentList(setSelectedStudent)}
              
              {selectedStudent && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                  <div className="font-bold">{selectedStudent.full_name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(labelsConfig?.infractionButtons || ['Disruption', 'Defiance', 'Tech Misuse', 'Profanity']).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedInfractionType(type)}
                        className={`p-3 rounded-xl text-sm font-bold transition-all ${
                          selectedInfractionType === type
                            ? 'bg-red-500 text-white'
                            : 'bg-accent hover:bg-red-500/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={logInfraction}
                    disabled={!selectedInfractionType}
                    className="w-full py-3 bg-red-600 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Log Infraction
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold">Recent Infractions</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {infractionLogs.slice(0, 20).map(log => (
                  <div key={log.id} className="p-3 bg-accent rounded-xl border border-border flex justify-between">
                    <div>
                      <span className="font-bold">{log.studentName}</span>
                      <span className="text-red-500 ml-2">{log.detail || log.type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.ts?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ========== TEACHER: INCENTIVES ==========
      case 'incentives':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Award size={18} className="text-emerald-500" /> Award Points
              </h3>
              {renderStudentList(setSelectedStudent)}
              
              {selectedStudent && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="font-bold">{selectedStudent.full_name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(labelsConfig?.incentiveButtons || ['Helping Others', 'Participation', 'Excellence', 'Leadership']).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedIncentiveType(type)}
                        className={`p-3 rounded-xl text-sm font-bold transition-all ${
                          selectedIncentiveType === type
                            ? 'bg-emerald-500 text-white'
                            : 'bg-accent hover:bg-emerald-500/20'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Points:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={pointsToAward}
                      onChange={(e) => setPointsToAward(Number(e.target.value))}
                      className="w-20 p-2 bg-background border border-border rounded-lg text-center"
                    />
                  </div>
                  <button
                    onClick={awardIncentive}
                    disabled={!selectedIncentiveType}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50"
                  >
                    Award {pointsToAward} Point{pointsToAward > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold">House Leaderboard</h3>
              <div className="space-y-3">
                {[...houses].sort((a,b) => (b.score || 0) - (a.score || 0)).map((house, i) => (
                  <div 
                    key={house.id} 
                    className="p-4 rounded-xl border-2 flex items-center gap-4"
                    style={{ background: `${house.color}15`, borderColor: `${house.color}40` }}
                  >
                    <div className="text-3xl font-black text-muted-foreground">#{i + 1}</div>
                    <div className="text-4xl">{house.mascot}</div>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{house.name}</div>
                      <div className="text-2xl font-black" style={{ color: house.color }}>
                        {house.score || 0} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ========== ADMIN: DESTINATIONS ==========
      case 'destinations':
        return (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin size={18} className="text-emerald-500" /> Pass Destinations
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Max shown:</span>
                <select
                  value={labelsConfig?.maxDisplayedDestinations || 6}
                  onChange={(e) => onUpdateConfig?.('labels', { ...labelsConfig, maxDisplayedDestinations: Number(e.target.value) })}
                  className="bg-accent border border-border rounded-lg px-2 py-1"
                >
                  {[4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLabel('passDestinations')}
                placeholder="Add destination..."
                className="flex-1 p-3 bg-accent border border-border rounded-xl"
              />
              <button onClick={() => addLabel('passDestinations')} className="px-4 bg-emerald-600 text-white rounded-xl">
                <Plus size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(labelsConfig?.passDestinations || []).map(label => (
                <div key={label} className="p-3 bg-accent rounded-xl flex justify-between items-center group">
                  <span>{label}</span>
                  <button onClick={() => removeLabel('passDestinations', label)} className="opacity-0 group-hover:opacity-100 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      // ========== ADMIN: LABELS ==========
      case 'labels':
        return (
          <div className="space-y-8 max-w-3xl">
            {/* Infractions */}
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Infraction Labels
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="New infraction type..."
                  className="flex-1 p-3 bg-accent border border-border rounded-xl"
                />
                <button onClick={() => addLabel('infractionButtons')} className="px-4 bg-red-600 text-white rounded-xl">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(labelsConfig?.infractionButtons || []).map(label => (
                  <div key={label} className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 group">
                    <span>{label}</span>
                    <button onClick={() => removeLabel('infractionButtons', label)} className="opacity-0 group-hover:opacity-100 text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Incentives */}
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Award size={18} className="text-emerald-500" /> Incentive Labels
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="New incentive type..."
                  className="flex-1 p-3 bg-accent border border-border rounded-xl"
                />
                <button onClick={() => addLabel('incentiveButtons')} className="px-4 bg-emerald-600 text-white rounded-xl">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(labelsConfig?.incentiveButtons || []).map(label => (
                  <div key={label} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 group">
                    <span>{label}</span>
                    <button onClick={() => removeLabel('incentiveButtons', label)} className="opacity-0 group-hover:opacity-100 text-emerald-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ========== ADMIN: HOUSES ==========
      case 'houses':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Home size={18} /> House Management
              </h3>
              <button onClick={addHouse} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2">
                <Plus size={16} /> Add House
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {houses.map(house => (
                <div 
                  key={house.id} 
                  className="p-4 rounded-xl border-2"
                  style={{ background: `${house.color}15`, borderColor: `${house.color}40` }}
                >
                  {editingHouse?.id === house.id ? (
                    <div className="space-y-2">
                      <input value={editingHouse.name} onChange={(e) => setEditingHouse({...editingHouse, name: e.target.value})} className="w-full p-2 bg-background rounded-lg" />
                      <input value={editingHouse.mascot} onChange={(e) => setEditingHouse({...editingHouse, mascot: e.target.value})} className="w-full p-2 bg-background rounded-lg" placeholder="Emoji" />
                      <input type="color" value={editingHouse.color} onChange={(e) => setEditingHouse({...editingHouse, color: e.target.value})} className="w-full h-10 rounded-lg" />
                      <div className="flex gap-2">
                        <button onClick={() => saveHouse(editingHouse)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Save</button>
                        <button onClick={() => setEditingHouse(null)} className="flex-1 py-2 bg-accent rounded-lg text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-5xl mb-2">{house.mascot}</div>
                        <div className="font-bold">{house.name}</div>
                        <div className="text-3xl font-black mt-2" style={{ color: house.color }}>{house.score || 0}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                      <button onClick={() => setEditingHouse({...house})} className="w-full mt-3 py-2 bg-accent rounded-lg text-sm">
                        <Settings size={14} className="inline mr-1" /> Edit
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // ========== ADMIN: BOT MESSAGES ==========
      case 'botmessages':
        return (
          <div className="space-y-6 max-w-2xl">
            <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <MessageSquare size={18} className="text-cyan-500" /> Custom Bot Messages
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Messages StrideBot displays randomly. Use <code className="bg-accent px-1 rounded">{'{name}'}</code> for teacher's name.
              </p>
              
              <div className="flex gap-2 mb-4">
                <input
                  value={newBotMessage}
                  onChange={(e) => setNewBotMessage(e.target.value)}
                  placeholder="e.g., Great job today, {name}!"
                  className="flex-1 p-3 bg-background border border-border rounded-xl"
                />
                <button onClick={addBotMessage} className="px-4 bg-cyan-600 text-white rounded-xl">
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                {(settingsConfig?.customBotMessages || []).map((msg, i) => (
                  <div key={msg.id || i} className="p-3 bg-accent rounded-xl flex justify-between items-center group">
                    <span className="text-sm">{msg.text}</span>
                    <button 
                      onClick={() => {
                        const current = settingsConfig?.customBotMessages || [];
                        onUpdateConfig?.('settings', { ...settingsConfig, customBotMessages: current.filter((_, idx) => idx !== i) });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ========== ADMIN: SCHEDULE ==========
      case 'schedule':
        return (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Clock size={18} /> Bell Schedule
              </h3>
              {!editingSchedule ? (
                <button onClick={() => { setLocalSchedule(bellSchedule?.periods || []); setEditingSchedule(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold">
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { onUpdateConfig?.('bell_schedule', { periods: localSchedule }); setEditingSchedule(false); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Save</button>
                  <button onClick={() => setEditingSchedule(false)} className="px-4 py-2 bg-accent rounded-xl">Cancel</button>
                </div>
              )}
            </div>
            
            {editingSchedule ? (
              <div className="space-y-2">
                {localSchedule.map((period, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-accent rounded-xl">
                    <input value={period.name} onChange={(e) => { const u = [...localSchedule]; u[i] = {...period, name: e.target.value}; setLocalSchedule(u); }} className="flex-1 p-2 bg-background rounded-lg" />
                    <input type="time" value={period.start} onChange={(e) => { const u = [...localSchedule]; u[i] = {...period, start: e.target.value}; setLocalSchedule(u); }} className="p-2 bg-background rounded-lg" />
                    <span>-</span>
                    <input type="time" value={period.end} onChange={(e) => { const u = [...localSchedule]; u[i] = {...period, end: e.target.value}; setLocalSchedule(u); }} className="p-2 bg-background rounded-lg" />
                    <button onClick={() => setLocalSchedule(localSchedule.filter((_, idx) => idx !== i))} className="p-2 text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setLocalSchedule([...localSchedule, { name: `Period ${localSchedule.length + 1}`, start: '08:00', end: '08:50' }])} className="w-full py-2 bg-accent border border-dashed border-border rounded-xl text-muted-foreground">
                  <Plus size={16} className="inline mr-1" /> Add Period
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(bellSchedule?.periods || []).map((period, i) => (
                  <div key={i} className="p-3 bg-accent rounded-xl flex justify-between">
                    <span className="font-bold">{period.name}</span>
                    <span className="font-mono text-muted-foreground">{period.start} - {period.end}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ========== ADMIN: ECONOMY ==========
      case 'economy':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="p-6 bg-accent rounded-xl border border-border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <DollarSign size={18} /> Point Split
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                When awarding points, they split between student's wallet and their house.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Student</span>
                    <span className="font-bold text-primary">{Math.round((economyConfig?.studentPointRatio || 0.4) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={(economyConfig?.studentPointRatio || 0.4) * 100}
                    onChange={(e) => onUpdateConfig?.('economy', { studentPointRatio: Number(e.target.value)/100, teamPointRatio: 1 - Number(e.target.value)/100 })}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>House</span>
                    <span className="font-bold text-emerald-500">{Math.round((economyConfig?.teamPointRatio || 0.6) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={(economyConfig?.teamPointRatio || 0.6) * 100}
                    onChange={(e) => onUpdateConfig?.('economy', { teamPointRatio: Number(e.target.value)/100, studentPointRatio: 1 - Number(e.target.value)/100 })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-background rounded-lg text-center text-sm">
                Example: 10 pts → Student: <strong className="text-primary">{Math.round((economyConfig?.studentPointRatio || 0.4) * 10)}</strong>, 
                House: <strong className="text-emerald-500">{Math.round((economyConfig?.teamPointRatio || 0.6) * 10)}</strong>
              </div>
            </div>
          </div>
        );

      // ========== ADMIN: APPROVALS ==========
      case 'approvals':
        return (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold flex items-center gap-2">
              <CheckCircle size={18} /> Pending Approvals ({pendingQueue.length})
            </h3>
            {pendingQueue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle size={48} className="mx-auto mb-3 opacity-30" />
                <p>All caught up!</p>
              </div>
            ) : (
              pendingQueue.map(item => (
                <div key={item.id} className="p-4 bg-accent rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold">{item.studentName}</div>
                    <div className="text-sm text-muted-foreground">{item.type}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onResolveQueueItem?.(item.id, true)} className="p-2 bg-emerald-600 text-white rounded-lg"><CheckCircle size={16} /></button>
                    <button onClick={() => onResolveQueueItem?.(item.id, false)} className="p-2 bg-red-600 text-white rounded-lg"><XCircle size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      // ========== ADMIN: LEDGER ==========
      case 'ledger':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <FileText size={18} /> Infraction Ledger
              </h3>
              <select value={ledgerTimeRange} onChange={(e) => setLedgerTimeRange(e.target.value)} className="bg-accent border border-border rounded-lg px-3 py-2">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="bg-accent rounded-xl border border-border max-h-[500px] overflow-y-auto">
              {infractionLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No infractions</div>
              ) : (
                infractionLogs.map(log => {
                  const time = new Date(log.ts?.seconds * 1000);
                  return (
                    <div key={log.id} className="p-3 border-b border-border flex justify-between">
                      <div><span className="font-bold">{log.studentName}</span> <span className="text-red-500">{log.detail}</span></div>
                      <span className="text-xs text-muted-foreground">{time.toLocaleDateString()} {time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      // ========== ADMIN: QR PASSES ==========
      case 'qrpasses':
        return (
          <div className="space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <QrCode size={18} /> Student QR Passes
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {allStudents.slice(0, 20).map(student => (
                <button
                  key={student.id}
                  onClick={() => setShowStudentQR(student)}
                  className="p-4 bg-accent rounded-xl text-center hover:bg-accent/80 transition-colors"
                >
                  <QrCode size={32} className="mx-auto mb-2 text-primary" />
                  <div className="font-bold text-sm truncate">{student.full_name}</div>
                  <div className="text-xs text-muted-foreground">ID: {student.student_id_number}</div>
                </button>
              ))}
            </div>
            
            {/* QR Modal */}
            {showStudentQR && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowStudentQR(null)}>
                <div className="bg-card p-6 rounded-2xl max-w-sm" onClick={e => e.stopPropagation()}>
                  <div className="text-center">
                    <div className="p-4 bg-white rounded-xl inline-block mb-4">
                      <QRCodeSVG value={generateStudentQR(showStudentQR)} size={200} level="H" />
                    </div>
                    <div className="font-bold text-lg">{showStudentQR.full_name}</div>
                    <div className="text-sm text-muted-foreground mb-4">ID: {showStudentQR.student_id_number} • Grade {showStudentQR.grade_level}</div>
                    <button onClick={() => setShowStudentQR(null)} className="w-full py-3 bg-accent rounded-xl font-bold">Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // ========== ADMIN: UPLOAD ==========
      case 'upload':
        return (
          <div className="space-y-6 max-w-xl">
            <div className="p-6 bg-accent rounded-xl border border-border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Upload size={18} /> Upload Roster
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload Excel/CSV with: <strong>full_name</strong> (required), student_id, grade
              </p>
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {isUploading ? <><Loader2 className="animate-spin" /> Processing...</> : <><Upload size={18} /> Select File</>}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.csv" />
              
              {uploadResult && !uploadPreview && (
                <div className={`mt-4 p-3 rounded-xl ${uploadResult.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                  {uploadResult.success ? uploadResult.message : uploadResult.error}
                </div>
              )}
            </div>
            
            {uploadPreview && (
              <div className="p-6 bg-primary/10 border border-primary/30 rounded-xl">
                <h4 className="font-bold mb-4">Preview: {uploadPreview.stats.total} students</h4>
                <div className="flex gap-3">
                  <button onClick={() => setUploadPreview(null)} className="flex-1 py-3 bg-accent rounded-xl font-bold">Cancel</button>
                  <button onClick={confirmUpload} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold">
                    Upload {uploadPreview.stats.total} Students
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      // ========== ADMIN: SAFETY ==========
      case 'safety':
        return (
          <div className="space-y-6 max-w-xl">
            {/* Lockdown */}
            <div className={`p-6 rounded-xl border-2 ${lockdown ? 'bg-red-500/10 border-red-500' : 'bg-accent border-border'}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-xl ${lockdown ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                  {lockdown ? <Lock size={32} className="text-red-500" /> : <Unlock size={32} className="text-amber-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-xl">School Lockdown</h3>
                  <p className="text-sm text-muted-foreground">
                    {lockdown ? '🚨 ALL PASSES SUSPENDED' : 'Normal operations'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onToggleLockdown?.(!lockdown)}
                className={`w-full py-4 rounded-xl font-bold text-lg ${lockdown ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
              >
                {lockdown ? 'LIFT LOCKDOWN' : 'INITIATE LOCKDOWN'}
              </button>
            </div>
            
            {/* School QR */}
            <div className="p-6 bg-accent rounded-xl border border-border">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <QrCode size={18} /> School QR Code
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={JSON.stringify({ type: 'school', schoolId: currentSchoolId, name: displaySchoolName })} size={150} level="H" />
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-lg">{currentSchoolId}</div>
                  <div className="text-sm text-muted-foreground">{displaySchoolName}</div>
                </div>
                <button onClick={copySchoolCode} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2">
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />} {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>
        );

      // ========== ADMIN: SETTINGS ==========
      case 'settings':
        return (
          <div className="space-y-4 max-w-xl">
            <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Settings</h3>
            
            <div className="p-4 bg-accent rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold">Pass Overtime Alert</div>
                <div className="text-xs text-muted-foreground">Minutes before warning</div>
              </div>
              <input type="number" min="1" max="30" value={settingsConfig?.passOvertimeMinutes || 10}
                onChange={(e) => onUpdateConfig?.('settings', { ...settingsConfig, passOvertimeMinutes: Number(e.target.value) })}
                className="w-20 p-2 bg-background border border-border rounded-lg text-center"
              />
            </div>
            
            <div className="p-4 bg-accent rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold">Max Per Destination</div>
                <div className="text-xs text-muted-foreground">Capacity limit</div>
              </div>
              <input type="number" min="1" max="20" value={settingsConfig?.maxCapacityPerDestination || 5}
                onChange={(e) => onUpdateConfig?.('settings', { ...settingsConfig, maxCapacityPerDestination: Number(e.target.value) })}
                className="w-20 p-2 bg-background border border-border rounded-lg text-center"
              />
            </div>
            
            <div className="p-4 bg-accent rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold">Conflict Alerts</div>
                <div className="text-xs text-muted-foreground">Block rival students</div>
              </div>
              <button
                onClick={() => onUpdateConfig?.('settings', { ...settingsConfig, conflictAlertsEnabled: !settingsConfig?.conflictAlertsEnabled })}
                className={`px-4 py-2 rounded-lg font-bold ${settingsConfig?.conflictAlertsEnabled !== false ? 'bg-emerald-600 text-white' : 'bg-background'}`}
              >
                {settingsConfig?.conflictAlertsEnabled !== false ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        );

      // ========== SUPERADMIN: COMMAND ==========
      case 'command':
        return (
          <div className="space-y-6">
            <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Globe size={24} className="text-indigo-500" /> Command Center
              </h3>
              <p className="text-muted-foreground">Global administration for all schools</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-accent rounded-xl text-center">
                <div className="text-4xl font-black text-primary">{allSchools.length}</div>
                <div className="text-sm text-muted-foreground">Schools</div>
              </div>
              <div className="p-6 bg-accent rounded-xl text-center">
                <div className="text-4xl font-black text-emerald-500">{allStudents.length}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div className="p-6 bg-accent rounded-xl text-center">
                <div className="text-4xl font-black text-amber-500">{allSchools.filter(s => s.lockdown).length}</div>
                <div className="text-sm text-muted-foreground">Lockdowns</div>
              </div>
            </div>
            
            <button onClick={() => onSwitchSchool?.('SANDBOX')} className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
              <div className="font-bold text-amber-500">🎓 Training Academy</div>
              <div className="text-sm text-muted-foreground">Test without affecting real data</div>
            </button>
          </div>
        );

      // ========== SUPERADMIN: SCHOOLS ==========
      case 'schools':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-accent rounded-xl">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Building size={18} /> Create School</h3>
              <div className="flex gap-2">
                <input value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="School name..." className="flex-1 p-3 bg-background border border-border rounded-xl" />
                <button onClick={createSchool} className="px-6 bg-emerald-600 text-white rounded-xl font-bold">Create</button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold">All Schools ({allSchools.length})</h4>
              {allSchools.map(school => (
                <button key={school.id} onClick={() => onSwitchSchool?.(school.id)} className="w-full p-4 bg-accent rounded-xl text-left hover:bg-accent/80 flex justify-between items-center">
                  <div>
                    <div className="font-bold">{school.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{school.id}</div>
                  </div>
                  {school.lockdown && <span className="px-2 py-1 bg-red-500 text-white text-xs rounded animate-pulse">LOCKDOWN</span>}
                </button>
              ))}
            </div>
          </div>
        );

      // ========== SUPERADMIN: GLOBAL UPLOAD ==========
      case 'globalupload':
        return (
          <div className="space-y-6 max-w-xl">
            <h3 className="font-bold flex items-center gap-2">
              <Upload size={18} /> Global Upload
            </h3>
            <div className="p-4 bg-accent rounded-xl">
              <label className="block text-sm font-bold mb-2">Target School</label>
              <select value={uploadSchoolId} onChange={(e) => setUploadSchoolId(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl">
                <option value="">Select school...</option>
                {allSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {uploadSchoolId && (
              <div className="p-4 bg-accent rounded-xl">
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold">
                  <Upload size={18} className="inline mr-2" /> Upload to {allSchools.find(s => s.id === uploadSchoolId)?.name}
                </button>
              </div>
            )}
          </div>
        );

      // ========== SUPERADMIN: BROADCAST ==========
      case 'broadcast':
        return (
          <div className="space-y-6 max-w-xl">
            <h3 className="font-bold flex items-center gap-2">
              <Radio size={18} /> Global Broadcast
            </h3>
            <div className="p-6 bg-accent rounded-xl space-y-4">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Message to all schools..."
                className="w-full p-3 bg-background border border-border rounded-xl h-32 resize-none"
              />
              <select value={broadcastPriority} onChange={(e) => setBroadcastPriority(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl">
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
              <button
                onClick={() => { onGlobalBroadcast?.(broadcastMessage, broadcastPriority); setBroadcastMessage(''); }}
                disabled={!broadcastMessage.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
              >
                Send to All Schools
              </button>
            </div>
          </div>
        );

      // ========== SUPERADMIN: SYSTEM ==========
      case 'system':
        return (
          <div className="space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <Activity size={18} /> System Health
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-bold text-emerald-500">ONLINE</span>
                </div>
                <div className="text-sm text-muted-foreground">System Status</div>
              </div>
              <div className="p-6 bg-accent rounded-xl">
                <div className="text-2xl font-black">{allSchools.length}</div>
                <div className="text-sm text-muted-foreground">Active Schools</div>
              </div>
              <div className="p-6 bg-accent rounded-xl">
                <div className="text-2xl font-black">{allStudents.length}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div className="p-6 bg-accent rounded-xl">
                <div className="text-2xl font-black text-red-500">{allSchools.filter(s => s.lockdown).length}</div>
                <div className="text-sm text-muted-foreground">Lockdowns Active</div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-muted-foreground">Section not found</div>;
    }
  };

  // =====================
  // MAIN RENDER
  // =====================
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-black text-xl">STRIDE</h1>
              <p className="text-xs text-muted-foreground">{displaySchoolName || 'Dashboard'}</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-accent rounded-lg">
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {Object.entries(groupedSections).map(([groupKey, sections]) => (
            <div key={groupKey} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">
                  {SECTION_GROUPS[groupKey]?.label || groupKey}
                </div>
              )}
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const hasBadge = section.id === 'approvals' && pendingQueue.length > 0;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full p-3 rounded-xl mb-1 flex items-center gap-3 transition-all relative ${
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                    title={sidebarCollapsed ? section.label : undefined}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span className="font-medium text-sm">{section.label}</span>}
                    {hasBadge && (
                      <span className="absolute right-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {pendingQueue.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <div className="font-bold text-sm truncate">{userGreeting}</div>
              <div className="text-xs text-muted-foreground">
                {isSuperAdmin ? '⚡ SuperAdmin' : isSchoolAdmin ? '👮 Admin' : '👨‍🏫 Teacher'}
              </div>
            </div>
          )}
          <button onClick={onSignOut} className="w-full p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 flex items-center justify-center gap-2">
            <LogOut size={16} />
            {!sidebarCollapsed && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/50">
          <div>
            <h2 className="font-bold text-lg">{SECTIONS[activeSection]?.label || 'Dashboard'}</h2>
            {sandboxMode && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded">SANDBOX</span>}
          </div>
          <div className="flex items-center gap-3">
            {lockdown && (
              <div className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                🚨 LOCKDOWN
              </div>
            )}
            <button onClick={() => onThemeChange?.(theme === 'obsidian' ? 'light' : 'obsidian')} className="p-2 hover:bg-accent rounded-lg">
              {theme === 'obsidian' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderSectionContent()}
        </div>
      </main>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx,.xls,.csv" />
    </div>
  );
}
