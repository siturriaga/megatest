'use client';
import { useState, useRef, useEffect } from 'react';
import { LogOut, Zap, Shield, ScanLine, Monitor, ToggleLeft, ToggleRight, Camera, Globe, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStrideState } from '../../hooks/useStrideState';
import StrideBot from './components/StrideBot';
import HallPassPanel from './components/HallPassPanel';
import InfractionsPanel from './components/InfractionsPanel';
import IncentivesPanel from './components/IncentivesPanel';
import SafetyPanel from './components/SafetyPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import RecordsPanel from './components/RecordsPanel';
import AdminPanel from './components/AdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import Toast from './components/Toast';
import TardyKiosk from './components/TardyKiosk';
import HallMonitorView from './components/HallMonitorView';
import ActivePassCard from './components/ActivePassCard';
import SwipeablePassRow from './components/SwipeablePassRow';
import DetentionModal from './components/DetentionModal';
import QRScanner from './components/QRScanner';
import CommunicationPanel from './components/CommunicationPanel';
import SandboxGuideOrbs from './components/SandboxGuideOrbs';
import ThemeToggle from './components/ThemeToggle';
import ConsentFlow from './components/ConsentFlow';

export default function DashboardPage() {
  const router = useRouter();
  const botRef = useRef(null);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [showKiosk, setShowKiosk] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showDetention, setShowDetention] = useState(null);
  const [schoolCodeInput, setSchoolCodeInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for swipe UI
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const state = useStrideState(router, botRef, setToast, user, setUser);
  const {
    userData, isSchoolAdmin, isSuperAdmin, userGreeting, employeeId, allStudents, activeTab, setActiveTab,
    activePasses, selectedStudent, setSelectedStudent, theme, setTheme,
    lockdown, toggleLockdown, generateLockdownReport, houses, housesSorted, issuePass, returnStudent,
    logInfraction, awardPoints, signOutUser, currentSchoolId, displaySchoolName,
    switchSchool, createSchool, handleFileUpload, analyticsData, logs, labelsConfig, economyConfig,
    conflictGroups, addConflictGroup, removeConflictGroup, boxQueue, resolveBoxQueueItem,
    sandboxMode, logTardy, updateConfig, updateHouses, returnAllStudents, isLoading,
    showSchoolPrompt, setShowSchoolPrompt, hasActivePass, isDestinationFull, getWaitlistPosition,
    destinationCounts, getStudentInfractions, allSchools, housesConfig, bellSchedule, kioskConfig, settingsConfig,
    broadcasts, sendBroadcast, deleteBroadcast, pinBroadcast,
    parentContacts, saveParentContact,
    // NEW: Consent flow exports
    showConsentFlow, handleConsentComplete, handleEnterSandbox
  } = state;

  useEffect(() => {
    const handleBotAction = (e) => {
      const action = e.detail;
      if (action.action === 'return' && action.passId) {
        const pass = activePasses.find(p => p.id === action.passId);
        if (pass) returnStudent(pass);
      }
    };
    window.addEventListener('stridebot-action', handleBotAction);
    return () => window.removeEventListener('stridebot-action', handleBotAction);
  }, [activePasses, returnStudent]);

  useEffect(() => { 
    if (toast) { 
      const t = setTimeout(() => setToast(null), 4000); 
      return () => clearTimeout(t); 
    } 
  }, [toast]);

  const getCardStyle = () => 'glass-card';
  const handleSchoolCodeSubmit = () => { if (schoolCodeInput.trim()) switchSchool(schoolCodeInput.trim().toUpperCase()); };
  const handleOpenDetention = (student) => { setShowDetention({ student, infractions: getStudentInfractions(student.id, 3) }); };

  // =====================
  // LOADING STATE
  // =====================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading STRIDE...</p>
        </div>
      </div>
    );
  }

  // =====================
  // CONSENT FLOW (Before anything else for non-SuperAdmins)
  // =====================
  if (showConsentFlow) {
    return (
      <ConsentFlow
        user={user}
        onComplete={handleConsentComplete}
        onSandbox={handleEnterSandbox}
      />
    );
  }

  // =====================
  // SCHOOL CODE PROMPT (After consent, if no school assigned)
  // =====================
  if (showSchoolPrompt && !currentSchoolId && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card w-full max-w-md p-8 text-foreground">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center font-black text-3xl mx-auto mb-4 text-white">S</div>
            <h2 className="text-2xl font-black">Welcome to STRIDE</h2>
            <p className="text-muted-foreground text-sm mt-2">Enter your school code to continue</p>
          </div>
          <input 
            type="text" 
            placeholder="SCHOOL_CODE or SANDBOX" 
            value={schoolCodeInput} 
            onChange={(e) => setSchoolCodeInput(e.target.value.toUpperCase())} 
            onKeyDown={(e) => e.key === 'Enter' && handleSchoolCodeSubmit()} 
            className="w-full bg-accent border border-border rounded-2xl px-5 py-4 text-center font-mono outline-none focus:ring-2 focus:ring-primary/50" 
            autoFocus 
          />
          <p className="text-xs text-muted-foreground text-center mt-3">
            Type <span className="font-mono font-bold text-primary">SANDBOX</span> to practice with demo data
          </p>
          <button 
            onClick={handleSchoolCodeSubmit} 
            disabled={!schoolCodeInput.trim()} 
            className="w-full mt-4 py-4 bg-primary text-primary-foreground font-black rounded-2xl disabled:opacity-30 transition-opacity"
          >
            Enter
          </button>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Signed in as {user?.email}
          </p>
        </div>
      </div>
    );
  }

  // =====================
  // SUPERADMIN COMMAND CENTER
  // =====================
  if (currentSchoolId === 'COMMAND_CENTER' && isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground bg-noise">
        <StrideBot ref={botRef} theme={theme} lockdown={false} userGreeting={userGreeting} sandboxMode={false} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <header className="px-6 py-4 flex justify-between items-center border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <Globe size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black">STRIDE Command Center</h1>
              <p className="text-xs text-muted-foreground">SuperAdmin: {userGreeting.fullName}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => switchSchool('SANDBOX')} className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-sm flex items-center gap-2">
              <Zap size={16} /> Sandbox
            </button>
            <button onClick={() => setShowSuperAdmin(true)} className="p-2.5 bg-amber-500 rounded-xl text-black" title="Super Admin Panel">
              <Building size={18} />
            </button>
            <button onClick={() => setShowAdmin(true)} className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Shield size={18} />
            </button>
            <ThemeToggle current={theme} onChange={setTheme} />
            <button onClick={signOutUser} className="p-2.5 bg-red-600 rounded-xl text-white">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-6">
              <div className="text-4xl font-black text-primary">{allSchools?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Active Schools</div>
            </div>
            <div className="glass-card p-6">
              <div className="text-4xl font-black text-amber-400">{boxQueue?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Pending Requests</div>
            </div>
            <div className="glass-card p-6">
              <div className="text-4xl font-black text-emerald-400">Online</div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
            <div className="glass-card p-6">
              <div className="text-4xl font-black text-purple-400">v2.5</div>
              <div className="text-sm text-muted-foreground">Version</div>
            </div>
          </div>

          {/* Schools List */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Building size={20} /> All Schools
              </h3>
              <button 
                onClick={() => setShowSuperAdmin(true)} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
              >
                + Create School
              </button>
            </div>
            {(allSchools?.length || 0) === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building size={48} className="mx-auto mb-4 opacity-30" />
                <p>No schools created yet</p>
                <p className="text-xs mt-2">Click "Create School" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(allSchools || []).map(school => (
                  <button 
                    key={school.id} 
                    onClick={() => switchSchool(school.id)} 
                    className="p-4 bg-accent hover:bg-accent/80 border border-border rounded-xl text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="font-bold">{school.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{school.id}</div>
                    {school.lockdown && (
                      <span className="text-xs text-red-500 font-bold mt-2 block">🚨 LOCKDOWN ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Modals */}
        {showAdmin && (
          <AdminPanel 
            onClose={() => setShowAdmin(false)} 
            isSuperAdmin={isSuperAdmin} 
            isSchoolAdmin={isSchoolAdmin} 
            lockdown={lockdown} 
            onToggleLockdown={toggleLockdown} 
            onHandleFileUpload={handleFileUpload} 
            labelsConfig={labelsConfig} 
            economyConfig={economyConfig} 
            bellSchedule={bellSchedule} 
            kioskConfig={kioskConfig} 
            settingsConfig={settingsConfig} 
            housesConfig={housesConfig} 
            onUpdateConfig={updateConfig} 
            onUpdateHouses={updateHouses} 
            boxQueue={boxQueue} 
            onResolveQueueItem={resolveBoxQueueItem} 
            currentSchoolId={currentSchoolId} 
            sandboxMode={sandboxMode} 
            logs={logs} 
            houses={houses} 
            allSchools={allSchools} 
            onCreateSchool={createSchool} 
            onSwitchSchool={switchSchool} 
            allStudents={allStudents} 
            displaySchoolName={displaySchoolName} 
            theme={theme} 
          />
        )}
        {showSuperAdmin && (
          <SuperAdminPanel 
            onClose={() => setShowSuperAdmin(false)} 
            allSchools={allSchools} 
            currentSchoolId={currentSchoolId} 
            onCreateSchool={createSchool} 
            onSwitchSchool={switchSchool} 
            allStudents={allStudents} 
            displaySchoolName={displaySchoolName} 
            theme={theme} 
          />
        )}
      </div>
    );
  }

  // =====================
  // SPECIAL VIEWS (Kiosk, Monitor, Scanner)
  // =====================
  if (showScanner) {
    return (
      <QRScanner 
        onClose={() => setShowScanner(false)} 
        allStudents={allStudents} 
        activePasses={activePasses} 
        onIssuePass={issuePass} 
        onReturnStudent={returnStudent} 
        labelsConfig={labelsConfig} 
      />
    );
  }
  
  if (showKiosk) {
    return (
      <TardyKiosk 
        onExit={() => setShowKiosk(false)} 
        onLogTardy={logTardy} 
        onIssuePass={issuePass} 
        allStudents={allStudents} 
        employeeId={employeeId} 
        labelsConfig={labelsConfig} 
      />
    );
  }
  
  if (showMonitor) {
    return (
      <HallMonitorView 
        onExit={() => setShowMonitor(false)} 
        userEmail={user?.email} 
        schoolId={currentSchoolId} 
        activePasses={activePasses} 
        allStudents={allStudents} 
        onReturn={returnStudent} 
        onIssuePass={issuePass} 
        onLogInfraction={logInfraction} 
        labelsConfig={labelsConfig} 
        employeeId={employeeId} 
      />
    );
  }

  // =====================
  // MAIN DASHBOARD
  // =====================
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-500 bg-noise safe-bottom">
      {/* StrideBot */}
      <StrideBot 
        ref={botRef} 
        theme={theme} 
        lockdown={lockdown} 
        userGreeting={userGreeting} 
        sandboxMode={sandboxMode} 
        botConfig={{ customMessages: settingsConfig?.customBotMessages || [] }} 
        activeBroadcast={broadcasts?.[0]} 
      />
      
      {/* Sandbox Guide */}
      <SandboxGuideOrbs sandboxMode={sandboxMode} botRef={botRef} theme={theme} activeTab={activeTab} />
      
      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Detention Modal */}
      {showDetention && (
        <DetentionModal 
          student={showDetention.student} 
          infractions={showDetention.infractions} 
          teacherName={userGreeting.fullName} 
          employeeId={employeeId} 
          schoolName={displaySchoolName} 
          onClose={() => setShowDetention(null)} 
        />
      )}
      
      {/* Lockdown Banner */}
      {lockdown && (
        <div className="bg-red-600 text-white text-center font-black py-3 animate-siren sticky top-0 z-[100]">
          🚨 LOCKDOWN ACTIVE - ALL PASSES SUSPENDED 🚨
        </div>
      )}
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-border sticky top-0 backdrop-blur-xl z-40 bg-background/80 safe-top">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg text-white">
            S
          </div>
          <div>
            <h1 className="text-xl font-black">STRIDE</h1>
            <p className="text-[10px] text-muted-foreground">
              {userGreeting.firstName} ({employeeId}) • {displaySchoolName}
              {sandboxMode && <span className="text-amber-400 ml-1">• SANDBOX</span>}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* SuperAdmin: Command Center Button */}
          {isSuperAdmin && (
            <button 
              onClick={() => switchSchool('COMMAND_CENTER')} 
              className="px-3 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Globe size={14} /> Command
            </button>
          )}
          
          {/* SuperAdmin: Sandbox Toggle */}
          {isSuperAdmin && (
            <button 
              onClick={() => sandboxMode ? switchSchool(userData?.school_id || 'COMMAND_CENTER') : switchSchool('SANDBOX')} 
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                sandboxMode 
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
                  : 'bg-accent border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {sandboxMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              <span className="text-xs font-bold">{sandboxMode ? 'SANDBOX' : 'LIVE'}</span>
            </button>
          )}
          
          {/* Action Buttons */}
          <button 
            onClick={() => setShowScanner(true)} 
            className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            title="QR Scanner"
          >
            <Camera size={18} />
          </button>
          
          <button 
            onClick={() => setShowKiosk(true)} 
            className="p-2.5 rounded-xl bg-accent border border-border hover:bg-accent/80 transition-colors"
            title="Tardy Kiosk"
          >
            <Monitor size={18} />
          </button>
          
          <button 
            onClick={() => setShowMonitor(true)} 
            className="p-2.5 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            title="Hall Monitor"
          >
            <ScanLine size={18} />
          </button>
          
          {/* Admin Panel Button */}
          {isSchoolAdmin && (
            <button 
              onClick={() => setShowAdmin(true)} 
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl relative text-white transition-colors" 
              title="Admin Panel"
            >
              <Shield size={18} />
              {boxQueue?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {boxQueue.length}
                </span>
              )}
            </button>
          )}
          
          {/* SuperAdmin Panel Button */}
          {isSuperAdmin && (
            <button 
              onClick={() => setShowSuperAdmin(true)} 
              className="p-2.5 bg-amber-500 hover:bg-amber-400 rounded-xl text-black transition-colors" 
              title="Super Admin"
            >
              <Building size={18} />
            </button>
          )}
          
          <ThemeToggle current={theme} onChange={setTheme} />
          
          <button 
            onClick={signOutUser} 
            className="p-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="px-6 py-3 flex gap-6 border-b border-border overflow-x-auto bg-background/50 backdrop-blur-sm scrollbar-hidden">
        {['Hall Pass', 'Infractions', 'Incentives', 'Safety', 'Communication', 'Analytics', 'Records'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))} 
            data-tab={tab.toLowerCase().replace(' ', '')}
            className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.toLowerCase().replace(' ', '') 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 pb-32">
        {/* Hall Pass Tab */}
        {activeTab === 'hallpass' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <HallPassPanel 
                allStudents={allStudents} 
                selectedStudent={selectedStudent} 
                setSelectedStudent={setSelectedStudent} 
                onIssuePass={issuePass} 
                onReturn={returnStudent} 
                lockdown={lockdown} 
                theme={theme} 
                labelsConfig={labelsConfig} 
                hasActivePass={hasActivePass} 
                isDestinationFull={isDestinationFull} 
                getWaitlistPosition={getWaitlistPosition} 
                destinationCounts={destinationCounts} 
                botRef={botRef} 
              />
            </div>
            <div className="lg:col-span-8">
              <div className="glass-card p-6" data-guide="active-passes">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black flex items-center gap-2">
                    <ScanLine className="text-green-400" /> Active Passes ({activePasses.length})
                  </h3>
                  {activePasses.length > 0 && (
                    <button 
                      onClick={returnAllStudents} 
                      className="text-xs text-red-400 hover:text-red-300 font-bold"
                    >
                      Return All
                    </button>
                  )}
                </div>
                {activePasses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ScanLine size={48} className="mx-auto mb-4 opacity-30" />
                    <p>All students in class</p>
                    <p className="text-xs mt-2">Select a student to issue a hall pass</p>
                  </div>
                ) : isMobile ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-hidden">
                    {activePasses.map(pass => (
                      <SwipeablePassRow 
                        key={pass.id} 
                        pass={pass} 
                        onReturn={returnStudent} 
                        theme={theme} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-hidden">
                    {activePasses.map(pass => (
                      <ActivePassCard 
                        key={pass.id} 
                        pass={pass} 
                        onReturn={() => returnStudent(pass)} 
                        theme={theme} 
                        employeeId={pass.employeeId} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Other Tabs */}
        {activeTab === 'infractions' && (
          <InfractionsPanel 
            allStudents={allStudents} 
            selectedStudent={selectedStudent} 
            setSelectedStudent={setSelectedStudent} 
            onLogInfraction={logInfraction} 
            onSaveParentContact={saveParentContact} 
            theme={theme} 
            labelsConfig={labelsConfig} 
            onOpenDetention={handleOpenDetention} 
            logs={logs} 
            parentContacts={parentContacts} 
          />
        )}
        
        {activeTab === 'incentives' && (
          <IncentivesPanel 
            allStudents={allStudents} 
            selectedStudent={selectedStudent} 
            setSelectedStudent={setSelectedStudent} 
            onAwardPoints={awardPoints} 
            theme={theme} 
            labelsConfig={labelsConfig} 
            economyConfig={economyConfig} 
            houses={housesSorted} 
            botRef={botRef} 
          />
        )}
        
        {activeTab === 'safety' && (
          <SafetyPanel 
            conflictGroups={conflictGroups} 
            allStudents={allStudents} 
            activePasses={activePasses} 
            onAddConflictGroup={addConflictGroup} 
            onRemoveConflictGroup={removeConflictGroup} 
            lockdown={lockdown} 
            onToggleLockdown={toggleLockdown} 
            isSchoolAdmin={isSchoolAdmin} 
            theme={theme} 
          />
        )}
        
        {activeTab === 'communication' && (
          <CommunicationPanel 
            broadcasts={broadcasts} 
            onSendBroadcast={sendBroadcast} 
            onDeleteBroadcast={deleteBroadcast} 
            onPinBroadcast={pinBroadcast} 
            userGreeting={userGreeting} 
            isSchoolAdmin={isSchoolAdmin} 
            theme={theme} 
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsPanel 
            analyticsData={analyticsData} 
            allStudents={allStudents} 
            activePasses={activePasses} 
            lockdown={lockdown} 
            generateLockdownReport={generateLockdownReport} 
            getCardStyle={() => getCardStyle()} 
            logs={logs} 
          />
        )}
        
        {activeTab === 'records' && (
          <RecordsPanel 
            logs={logs} 
            allStudents={allStudents} 
            selectedStudent={selectedStudent} 
            setSelectedStudent={setSelectedStudent} 
            getCardStyle={() => getCardStyle()} 
          />
        )}
      </main>

      {/* Admin Panel Modal */}
      {showAdmin && (
        <AdminPanel 
          onClose={() => setShowAdmin(false)} 
          isSuperAdmin={isSuperAdmin} 
          isSchoolAdmin={isSchoolAdmin} 
          lockdown={lockdown} 
          onToggleLockdown={toggleLockdown} 
          onHandleFileUpload={handleFileUpload} 
          labelsConfig={labelsConfig} 
          economyConfig={economyConfig} 
          bellSchedule={bellSchedule} 
          kioskConfig={kioskConfig} 
          settingsConfig={settingsConfig} 
          housesConfig={housesConfig} 
          onUpdateConfig={updateConfig} 
          onUpdateHouses={updateHouses} 
          boxQueue={boxQueue} 
          onResolveQueueItem={resolveBoxQueueItem} 
          currentSchoolId={currentSchoolId} 
          sandboxMode={sandboxMode} 
          logs={logs} 
          houses={houses} 
          allSchools={allSchools} 
          onCreateSchool={createSchool} 
          onSwitchSchool={switchSchool} 
          allStudents={allStudents} 
          displaySchoolName={displaySchoolName} 
          theme={theme} 
        />
      )}
      
      {/* SuperAdmin Panel Modal */}
      {showSuperAdmin && (
        <SuperAdminPanel 
          onClose={() => setShowSuperAdmin(false)} 
          allSchools={allSchools} 
          currentSchoolId={currentSchoolId} 
          onCreateSchool={createSchool} 
          onSwitchSchool={switchSchool} 
          allStudents={allStudents} 
          displaySchoolName={displaySchoolName} 
          theme={theme} 
        />
      )}
    </div>
  );
}
