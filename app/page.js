'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Hook - THE CONNECTION
import { useStrideState } from '../../hooks/useStrideState';

// Dashboard Component
import StrideDashboard from './StrideDashboard';

// Global Components
import ConsentFlow from './components/ConsentFlow';
import StrideBot from './components/StrideBot';
import Toast from './components/Toast';

/**
 * STRIDE Dashboard Page - Entry Point
 * 
 * This is the Next.js route handler for /dashboard
 * It calls useStrideState() to get all data and passes it to StrideDashboard
 */
export default function DashboardPage() {
  // =====================
  // REFS & ROUTER
  // =====================
  const router = useRouter();
  const botRef = useRef(null);
  
  // =====================
  // LOCAL STATE
  // =====================
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  
  // =====================
  // MAIN STATE HOOK - THE CONNECTION
  // =====================
  const stride = useStrideState(router, botRef, setToast, user, setUser);

  // =====================
  // LOADING STATE
  // =====================
  if (!stride || stride.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading STRIDE...</p>
        </div>
      </div>
    );
  }

  // =====================
  // CONSENT FLOW (First-time users)
  // =====================
  if (stride.showConsentFlow) {
    return (
      <ConsentFlow
        user={stride.user}
        onComplete={stride.handleConsentComplete}
        onEnterSandbox={stride.handleEnterSandbox}
      />
    );
  }

  // =====================
  // MAIN DASHBOARD
  // =====================
  return (
    <>
      {/* Main Dashboard */}
      <StrideDashboard
        // Auth & User
        user={stride.user}
        isSchoolAdmin={stride.isSchoolAdmin}
        isSuperAdmin={stride.isSuperAdmin}
        userGreeting={stride.userGreeting}
        onSignOut={stride.signOutUser}
        employeeId={stride.employeeId}
        
        // School
        currentSchoolId={stride.currentSchoolId}
        displaySchoolName={stride.displaySchoolName}
        sandboxMode={stride.sandboxMode}
        allSchools={stride.allSchools}
        onCreateSchool={stride.createSchool}
        onSwitchSchool={stride.switchSchool}
        
        // Data Collections
        allStudents={stride.allStudents}
        houses={stride.houses}
        activePasses={stride.activePasses}
        logs={stride.logs}
        broadcasts={stride.broadcasts}
        parentContacts={stride.parentContacts}
        conflictGroups={stride.conflictGroups}
        
        // Configs
        labelsConfig={stride.labelsConfig}
        economyConfig={stride.economyConfig}
        bellSchedule={stride.bellSchedule}
        settingsConfig={stride.settingsConfig}
        
        // Pass Actions
        onIssuePass={stride.issuePass}
        onEndPass={stride.returnStudent}
        hasActivePass={stride.hasActivePass}
        isDestinationFull={stride.isDestinationFull}
        getWaitlistPosition={stride.getWaitlistPosition}
        destinationCounts={stride.destinationCounts}
        
        // Student Actions
        onLogInfraction={stride.logInfraction}
        onAwardPoints={stride.awardPoints}
        onLogTardy={stride.logTardy}
        onAssignStudent={stride.assignStudentToHouse}
        onBulkAssign={stride.bulkAssignStudents}
        onUpdateHouseName={stride.updateHouseName}
        
        // Admin Actions
        onUpdateConfig={stride.updateConfig}
        onUpdateHouses={stride.updateHouses}
        onHandleFileUpload={stride.handleFileUpload}
        onToggleLockdown={stride.toggleLockdown}
        lockdown={stride.lockdown}
        
        // Safety
        alertLevel={stride.alertLevel}
        onSetAlertLevel={stride.setAlertLevel}
        lockedZones={stride.lockedZones}
        onToggleZoneLock={stride.toggleZoneLock}
        onAddConflictGroup={stride.addConflictGroup}
        onRemoveConflictGroup={stride.removeConflictGroup}
        
        // Communication
        onSendBroadcast={stride.sendBroadcast}
        onDeleteBroadcast={stride.deleteBroadcast}
        onPinBroadcast={stride.pinBroadcast}
        onGlobalBroadcast={stride.globalBroadcast}
        onSaveParentContact={stride.saveParentContact}
        
        // UI State
        theme={stride.theme}
        onThemeChange={stride.setTheme}
        showSchoolPrompt={stride.showSchoolPrompt}
        onJoinSchool={stride.switchSchool}
        
        // Refs
        botRef={botRef}
        
        // Analytics
        analyticsData={stride.analyticsData}
      />

      {/* StrideBot - Global Assistant */}
      <StrideBot
        ref={botRef}
        theme={stride.theme}
        lockdown={stride.lockdown}
        alertLevel={stride.alertLevel}
        userGreeting={stride.userGreeting}
        sandboxMode={stride.sandboxMode}
        activeBroadcast={stride.broadcasts?.[0] || null}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
