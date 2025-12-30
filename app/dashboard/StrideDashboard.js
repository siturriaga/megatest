'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { 
  // Navigation & UI
  Menu, LogOut, Moon, Sun, 
  // Icons
  Navigation, Users, AlertTriangle, Award, 
  Tag, Home, MessageSquare, Clock, DollarSign, CheckCircle, 
  FileText, QrCode, Shield, Settings, MapPin,
  Globe, Building, Radio, Activity, Upload
} from 'lucide-react';

// --- IMPORT YOUR ADVANCED COMPONENTS ---
import StudentRosterUpload from './components/StudentRosterUpload';
import IncentivesPanel from './components/IncentivesPanel';
import HallPassQRSetup from './components/HallPassQRSetup';
import StudentHouseAssignment from './components/StudentHouseAssignment';
import SafetyPanel from './components/SafetyPanel';
import InfractionsPanel from './components/InfractionsPanel';
import HallPassPanel from './components/HallPassPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import CommunicationPanel from './components/CommunicationPanel';
import RecordsPanel from './components/RecordsPanel';
import ParentContactLog from './components/ParentContactLog';
import TardyKiosk from './components/TardyKiosk';
import SuperAdminPanel from './components/SuperAdminPanel';
import AdminPanel from './components/AdminPanel';
// Newly wired components
import DigitalID from './components/DigitalID';
import SwipeablePassRow from './components/SwipeablePassRow';
import MTSSDoc from './components/MTSSDoc';
import PassScannerDisplay from './components/PassScannerDisplay';
import HallMonitorView from './components/HallMonitorView';
import ActivePassCard from './components/ActivePassCard';
import DetentionModal from './components/DetentionModal';
import QRScanner from './components/QRScanner';
import SandboxGuideOrbs from './components/SandboxGuideOrbs';

/**
 * STRIDE Unified Dashboard - REFACTORED CONTROLLER
 * Connects directly to advanced logic components.
 */

// =====================
// SECTION DEFINITIONS
// =====================
const SECTIONS = {
  // Teacher
  hallpass: { id: 'hallpass', label: 'Hall Pass', icon: Navigation, tier: 'teacher', group: 'core' },
  roster: { id: 'roster', label: 'Roster', icon: Users, tier: 'teacher', group: 'core' },
  infractions: { id: 'infractions', label: 'Infractions', icon: AlertTriangle, tier: 'teacher', group: 'core' },
  incentives: { id: 'incentives', label: 'Incentives & Battle', icon: Award, tier: 'teacher', group: 'core' },
  records: { id: 'records', label: 'Activity Log', icon: FileText, tier: 'teacher', group: 'core' },
  contacts: { id: 'contacts', label: 'Parent Contacts', icon: MessageSquare, tier: 'teacher', group: 'core' },
  
  // Admin
  analytics: { id: 'analytics', label: 'Analytics', icon: Activity, tier: 'admin', group: 'manage' },
  tardy: { id: 'tardy', label: 'Tardy Kiosk', icon: Clock, tier: 'admin', group: 'manage' },
  destinations: { id: 'destinations', label: 'Destinations', icon: MapPin, tier: 'admin', group: 'config' },
  labels: { id: 'labels', label: 'Labels', icon: Tag, tier: 'admin', group: 'config' },
  houses: { id: 'houses', label: 'House Manager', icon: Home, tier: 'admin', group: 'config' },
  schedule: { id: 'schedule', label: 'Bell Schedule', icon: Clock, tier: 'admin', group: 'config' },
  economy: { id: 'economy', label: 'Economy', icon: DollarSign, tier: 'admin', group: 'config' },
  qrpasses: { id: 'qrpasses', label: 'Classroom QR', icon: QrCode, tier: 'admin', group: 'manage' },
  upload: { id: 'upload', label: 'Smart Upload', icon: Upload, tier: 'admin', group: 'manage' },
  safety: { id: 'safety', label: 'Safety & Lockdown', icon: Shield, tier: 'admin', group: 'manage' },
  communication: { id: 'communication', label: 'Announcements', icon: Radio, tier: 'admin', group: 'manage' },
  settings: { id: 'settings', label: 'Settings', icon: Settings, tier: 'admin', group: 'config' },
  
  // SuperAdmin
  command: { id: 'command', label: 'Command Center', icon: Globe, tier: 'superadmin', group: 'global' },
  schools: { id: 'schools', label: 'Manage Schools', icon: Building, tier: 'superadmin', group: 'global' },
  broadcast: { id: 'broadcast', label: 'Broadcast', icon: Radio, tier: 'superadmin', group: 'global' },
};

const SECTION_GROUPS = {
  core: { label: '📚 Core', description: 'Daily classroom tools' },
  config: { label: '⚙️ Configuration', description: 'School settings' },
  manage: { label: '📋 Management', description: 'Data & approvals' },
  global: { label: '🌐 Global', description: 'Multi-school admin' },
};

export default function StrideDashboard({
  // Props from page.js
  user, isSchoolAdmin, isSuperAdmin, userGreeting, onSignOut,
  currentSchoolId, displaySchoolName, sandboxMode, allSchools,
  onCreateSchool, onSwitchSchool,
  allStudents = [], houses = [], activePasses = [], logs = [],
  labelsConfig = {}, economyConfig = {}, bellSchedule = {}, settingsConfig = {},
  // Actions
  onUpdateConfig, onUpdateHouses, onHandleFileUpload, 
  onIssuePass, onEndPass, onLogInfraction, onAwardPoints, 
  onToggleLockdown, onGlobalBroadcast,
  // State
  lockdown, theme, onThemeChange, showSchoolPrompt, onJoinSchool,
  // New Hook Actions
  onAssignStudent, onBulkAssign, onUpdateHouseName, botRef,
  // Safety Features
  alertLevel, onSetAlertLevel, lockedZones, onToggleZoneLock,
  // Conflict Groups
  conflictGroups = [], onAddConflictGroup, onRemoveConflictGroup,
  // Analytics & Records
  analyticsData = {},
  // Communication
  broadcasts = [], onSendBroadcast, onDeleteBroadcast, onPinBroadcast,
  // Parent Contacts
  parentContacts = [], onSaveParentContact,
  // Tardy
  onLogTardy,
}) {
  const [activeSection, setActiveSection] = useState('hallpass');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modal states for newly wired components
  const [selectedStudentForID, setSelectedStudentForID] = useState(null);
  const [showHallMonitor, setShowHallMonitor] = useState(false);
  const [scannedPass, setScannedPass] = useState(null);
  const [selectedStudentForMTSS, setSelectedStudentForMTSS] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [detentionStudent, setDetentionStudent] = useState(null);

  // --- VISIBILITY LOGIC ---
  const visibleSections = useMemo(() => {
    return Object.values(SECTIONS).filter(section => {
      if (section.tier === 'teacher') return true;
      if (section.tier === 'admin') return isSchoolAdmin || isSuperAdmin;
      if (section.tier === 'superadmin') return isSuperAdmin;
      return false;
    });
  }, [isSchoolAdmin, isSuperAdmin]);

  const groupedSections = useMemo(() => {
    const groups = {};
    visibleSections.forEach(section => {
      if (!groups[section.group]) groups[section.group] = [];
      groups[section.group].push(section);
    });
    return groups;
  }, [visibleSections]);

  // --- RENDER SECTION CONTENT ---
  const renderSectionContent = () => {
    switch (activeSection) {
      
      // 1. INCENTIVES & BATTLES (Replaced with IncentivesPanel)
      case 'incentives':
        return (
          <IncentivesPanel 
            allStudents={allStudents}
            houses={houses}
            theme={theme}
            labelsConfig={labelsConfig}
            economyConfig={economyConfig}
            sandboxMode={sandboxMode}
            onAwardPoints={onAwardPoints}
            botRef={botRef}
          />
        );

      // 2. SMART UPLOAD (Replaced with StudentRosterUpload)
      case 'upload':
        return (
          <StudentRosterUpload 
            schoolId={currentSchoolId}
            houses={houses}
            existingStudents={allStudents}
            // Mapped to the hook's smart upload function
            onUpload={(students, newHouses) => onHandleFileUpload(students, newHouses)} 
          />
        );

      // 3. HOUSE MANAGER (Replaced with StudentHouseAssignment)
      case 'houses':
        return (
          <StudentHouseAssignment 
            students={allStudents}
            houses={houses}
            onAssignStudent={onAssignStudent}
            onBulkAssign={onBulkAssign}
            onUpdateHouseName={onUpdateHouseName}
          />
        );

      // 4. CLASSROOM QR (Replaced with HallPassQRSetup)
      case 'qrpasses':
        return (
          <HallPassQRSetup 
            userData={user}
            employeeId={user?.email?.split('@')[0]}
            schoolId={currentSchoolId}
            isSuperAdmin={isSuperAdmin}
          />
        );

      // --- HALL PASS ---
      case 'hallpass':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Pass Panel */}
            <HallPassPanel
              allStudents={allStudents}
              selectedStudent={null}
              setSelectedStudent={() => {}}
              onIssuePass={onIssuePass}
              onReturn={onEndPass}
              lockdown={lockdown}
              theme={theme}
              labelsConfig={labelsConfig}
              hasActivePass={(id) => activePasses.some(p => p.studentId === id)}
              destinationCounts={() => {}}
              botRef={botRef}
            />
            
            {/* Active Passes with Swipeable Rows */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Clock size={20} className="text-amber-500" /> 
                Active Passes ({activePasses.length})
              </h3>
              {activePasses.length === 0 ? (
                <div className="p-6 bg-accent rounded-xl border border-border text-center text-muted-foreground">
                  No active passes
                </div>
              ) : (
                <div className="space-y-2">
                  {activePasses.map(pass => (
                    <SwipeablePassRow
                      key={pass.id}
                      pass={pass}
                      onReturn={() => onEndPass(pass.id)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}
              
              {/* Hall Monitor Mode Button */}
              {(isSchoolAdmin || isSuperAdmin) && (
                <button
                  onClick={() => setShowHallMonitor(true)}
                  className="w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold hover:bg-emerald-500/20 transition-colors"
                >
                  Enter Hall Monitor Mode
                </button>
              )}
              
              {/* QR Scanner Button */}
              <button
                onClick={() => setShowQRScanner(true)}
                className="w-full p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode size={20} /> Scan Student QR
              </button>
            </div>
            
            {/* QR Scanner Modal */}
            {showQRScanner && (
              <QRScanner
                onClose={() => setShowQRScanner(false)}
                allStudents={allStudents}
                activePasses={activePasses}
                onIssuePass={onIssuePass}
                onReturnStudent={onEndPass}
                labelsConfig={labelsConfig}
              />
            )}
          </div>
        );

      // --- ADMIN CONFIG SECTIONS (Simple forms) ---
      case 'labels':
      case 'economy':
      case 'settings':
      case 'destinations':
        return (
          <div className="p-8 text-center text-muted-foreground">
            <Settings size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">Settings Panel</h3>
            <p>Use the Admin Panel components to configure {activeSection}.</p>
            <div className="mt-4 p-4 bg-accent rounded-xl inline-block text-left text-sm">
              <pre>{JSON.stringify(activeSection === 'economy' ? economyConfig : labelsConfig, null, 2)}</pre>
            </div>
          </div>
        );

      // --- SUPERADMIN ---
      case 'schools':
      case 'command':
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Globe size={24} className="text-indigo-500" /> Command Center
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-accent rounded-xl text-center">
                <div className="text-4xl font-black text-primary">{allSchools.length}</div>
                <div className="text-sm text-muted-foreground">Schools</div>
              </div>
              <div className="p-6 bg-accent rounded-xl text-center">
                <div className="text-4xl font-black text-emerald-500">{allStudents.length}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>
            <button onClick={() => onSwitchSchool('SANDBOX')} className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
              <div className="font-bold text-amber-500">🎓 Enter Training Sandbox</div>
            </button>
          </div>
        );

      // --- SAFETY PANEL ---
      case 'safety':
        return (
          <SafetyPanel
            conflictGroups={conflictGroups}
            allStudents={allStudents}
            activePasses={activePasses}
            onAddConflictGroup={onAddConflictGroup}
            onRemoveConflictGroup={onRemoveConflictGroup}
            lockdown={lockdown}
            onToggleLockdown={onToggleLockdown}
            alertLevel={alertLevel}
            onSetAlertLevel={onSetAlertLevel}
            lockedZones={lockedZones}
            onToggleZoneLock={onToggleZoneLock}
            passDestinations={labelsConfig?.passDestinations || []}
            isSchoolAdmin={isSchoolAdmin}
            isSuperAdmin={isSuperAdmin}
            displaySchoolName={displaySchoolName}
            theme={theme}
          />
        );

      // --- ROSTER (Student List) ---
      case 'roster':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Users size={24} className="text-blue-500" /> Student Roster
              </h3>
              <div className="text-sm text-muted-foreground">{allStudents.length} students</div>
            </div>
            <div className="grid gap-3">
              {allStudents.slice(0, 50).map(student => (
                <div 
                  key={student.id} 
                  className="p-4 bg-accent rounded-xl border border-border flex justify-between items-center hover:border-primary/50 transition-colors"
                >
                  <div>
                    <div className="font-bold">{student.full_name}</div>
                    <div className="text-sm text-muted-foreground">Grade {student.grade_level} • {student.student_id_number}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedStudentForID(student)}
                      className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      View ID
                    </button>
                    <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {student.houseId ? houses.find(h => h.id === student.houseId)?.name || 'Assigned' : 'Unassigned'}
                    </div>
                  </div>
                </div>
              ))}
              {allStudents.length > 50 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Showing 50 of {allStudents.length} students
                </div>
              )}
            </div>
            
            {/* DigitalID Modal */}
            {selectedStudentForID && (
              <DigitalID
                student={selectedStudentForID}
                schoolName={displaySchoolName}
                onClose={() => setSelectedStudentForID(null)}
              />
            )}
          </div>
        );

      // --- INFRACTIONS ---
      case 'infractions':
        return (
          <>
            <InfractionsPanel
              allStudents={allStudents}
              selectedStudent={selectedStudentForMTSS}
              setSelectedStudent={setSelectedStudentForMTSS}
              onLogInfraction={onLogInfraction}
              onSaveParentContact={onSaveParentContact}
              onOpenDetention={(student) => setDetentionStudent(student)}
              theme={theme}
              labelsConfig={labelsConfig}
              logs={logs}
              parentContacts={parentContacts}
            />
            
            {/* Hidden MTSS Document - Only visible when printing */}
            {selectedStudentForMTSS && (
              <div className="hidden print:block">
                <MTSSDoc
                  student={selectedStudentForMTSS}
                  logs={logs}
                  parentContacts={parentContacts}
                  teacherName={user?.displayName || user?.email?.split('@')[0]}
                  schoolName={displaySchoolName}
                />
              </div>
            )}
            
            {/* Detention Modal */}
            {detentionStudent && (
              <DetentionModal
                student={detentionStudent}
                infractions={logs.filter(l => l.studentId === detentionStudent.id && l.type === 'INFRACTION')}
                teacherName={user?.displayName || user?.email?.split('@')[0]}
                employeeId={user?.email?.split('@')[0]}
                schoolName={displaySchoolName}
                onClose={() => setDetentionStudent(null)}
              />
            )}
          </>
        );

      // --- SCHEDULE (Bell Schedule) ---
      case 'schedule':
        return (
          <div className="p-8 text-center text-muted-foreground">
            <Clock size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">Bell Schedule</h3>
            <p>Configure bell schedule in Admin Panel.</p>
            <div className="mt-4 p-4 bg-accent rounded-xl inline-block text-left text-sm">
              <pre>{JSON.stringify(bellSchedule, null, 2)}</pre>
            </div>
          </div>
        );

      // --- BROADCAST (SuperAdmin) ---
      case 'broadcast':
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Radio size={24} className="text-purple-500" /> Broadcast Center
            </h3>
            <div className="p-6 bg-accent rounded-xl border border-border">
              <textarea 
                placeholder="Type your broadcast message..."
                className="w-full p-4 bg-background border border-border rounded-xl mb-4 min-h-[120px]"
              />
              <button 
                onClick={() => onGlobalBroadcast?.('Test broadcast')}
                className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors"
              >
                Send Broadcast to All Schools
              </button>
            </div>
          </div>
        );

      // --- RECORDS (Activity Log) ---
      case 'records':
        return (
          <RecordsPanel
            logs={logs}
            allStudents={allStudents}
            theme={theme}
          />
        );

      // --- ANALYTICS ---
      case 'analytics':
        return (
          <AnalyticsPanel
            analyticsData={analyticsData}
            allStudents={allStudents}
            activePasses={activePasses}
            logs={logs}
            houses={houses}
            theme={theme}
          />
        );

      // --- COMMUNICATION (Announcements) ---
      case 'communication':
        return (
          <CommunicationPanel
            broadcasts={broadcasts}
            onSendBroadcast={onSendBroadcast}
            onDeleteBroadcast={onDeleteBroadcast}
            onPinBroadcast={onPinBroadcast}
            isSchoolAdmin={isSchoolAdmin}
            theme={theme}
          />
        );

      // --- PARENT CONTACTS ---
      case 'contacts':
        return (
          <ParentContactLog
            contacts={parentContacts}
            allStudents={allStudents}
            onSaveContact={onSaveParentContact}
            theme={theme}
          />
        );

      // --- TARDY KIOSK ---
      case 'tardy':
        return (
          <TardyKiosk
            allStudents={allStudents}
            onLogTardy={onLogTardy}
            schoolName={displaySchoolName}
            theme={theme}
          />
        );

      default:
        return (
          <div className="p-10 text-center text-muted-foreground">
            <Settings size={48} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">Unknown Section</h3>
            <p>Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  // =====================
  // SCHOOL JOIN PROMPT
  // =====================
  if (showSchoolPrompt && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join Your School</h2>
          <p className="text-slate-400 mb-6">Enter the School ID provided by your administrator.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const code = e.target.schoolCode.value;
            if (onJoinSchool) onJoinSchool(code);
            else console.warn('[STRIDE] onJoinSchool not connected - school code:', code);
          }}>
            <input 
              name="schoolCode"
              type="text" 
              placeholder="e.g. LINCOLN_HIGH_2024"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
              Join School
            </button>
          </form>
          
          <button onClick={onSignOut} className="mt-6 text-sm text-slate-500 hover:text-white">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // =====================
  // MAIN LAYOUT
  // =====================
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-black text-xl tracking-tight">STRIDE</h1>
              <p className="text-xs text-muted-foreground">{displaySchoolName || 'Dashboard'}</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-accent rounded-lg">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {Object.entries(groupedSections).map(([groupKey, sections]) => (
            <div key={groupKey} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {SECTION_GROUPS[groupKey]?.label || groupKey}
                </div>
              )}
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full p-3 rounded-xl mb-1 flex items-center gap-3 transition-all ${
                      isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                    title={sidebarCollapsed ? section.label : undefined}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span className="font-medium text-sm">{section.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={onSignOut} className="w-full p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 flex items-center justify-center gap-2 transition-colors">
            <LogOut size={16} />
            {!sidebarCollapsed && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg">{SECTIONS[activeSection]?.label}</h2>
            {sandboxMode && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold rounded-full">
                SANDBOX MODE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lockdown && (
              <div className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse shadow-lg shadow-red-500/20">
                🚨 LOCKDOWN ACTIVE
              </div>
            )}
            <button onClick={() => onThemeChange?.(theme === 'obsidian' ? 'light' : 'obsidian')} className="p-2 hover:bg-accent rounded-lg transition-colors">
              {theme === 'obsidian' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {renderSectionContent()}
          </div>
        </div>
      </main>
      
      {/* Hall Monitor View Modal */}
      {showHallMonitor && (
        <HallMonitorView
          onExit={() => setShowHallMonitor(false)}
          activePasses={activePasses}
          allStudents={allStudents}
          onReturn={(pass) => {
            onEndPass(pass.id);
            setScannedPass(null);
          }}
          onIssuePass={onIssuePass}
          onLogInfraction={onLogInfraction}
          labelsConfig={labelsConfig}
          employeeId={user?.email?.split('@')[0]}
        />
      )}
      
      {/* Pass Scanner Display (when QR scanned in Hall Monitor) */}
      {scannedPass && (
        <PassScannerDisplay
          pass={scannedPass}
          student={allStudents.find(s => s.id === scannedPass.studentId)}
          onClose={() => setScannedPass(null)}
          onSendBack={async (pass) => {
            await onEndPass(pass.id);
            setScannedPass(null);
          }}
          onExtendPass={async (pass, minutes) => {
            // Pass extension is handled server-side
            setScannedPass(null);
          }}
        />
      )}
      
      {/* Sandbox Guide Orbs - Tutorial hints in demo mode */}
      {sandboxMode && (
        <SandboxGuideOrbs
          sandboxMode={sandboxMode}
          botRef={botRef}
          activeTab={activeSection}
        />
      )}
    </div>
  );
}
