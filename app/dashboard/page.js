'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStrideState } from '@/hooks/useStrideState';
import StrideDashboard from './StrideDashboard';
import StrideBot from './components/StrideBot';
import ConsentFlow from './components/ConsentFlow';
import { Loader2 } from 'lucide-react';
import Toast from './components/Toast';

export default function DashboardPage() {
  const router = useRouter();
  const botRef = useRef(null);
  
  // State for user and toast (required by useStrideState)
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Toast helper with auto-dismiss
  const showToast = useCallback((toastData) => {
    setToast(toastData);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Initialize the "Brain" (The Hook) with all 5 required parameters
  const strideState = useStrideState(router, botRef, showToast, user, setUser);
  
  const { 
    isLoading, 
    showConsentFlow, 
    handleConsentComplete, 
    handleEnterSandbox,
    needsConsent,
    currentSchoolId,
  } = strideState;

  // Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-bold animate-pulse">Initializing STRIDE...</h2>
      </div>
    );
  }

  // Render ConsentFlow when needed
  if (showConsentFlow || needsConsent) {
    return (
      <ConsentFlow
        user={user}
        onComplete={handleConsentComplete}
        onSandbox={handleEnterSandbox}
        existingSchoolId={currentSchoolId}
      />
    );
  }

  // Main Dashboard
  return (
    <main className="relative">
      <StrideDashboard 
        // Pass everything from the hook state
        {...strideState}
        
        // Explicitly map Actions
        onSignOut={strideState.signOutUser}
        onIssuePass={strideState.issuePass}
        onEndPass={strideState.returnStudent}
        onLogInfraction={strideState.logInfraction}
        onAwardPoints={strideState.awardPoints}
        onUpdateConfig={strideState.updateConfig}
        onUpdateHouses={strideState.updateHouses}
        onHandleFileUpload={strideState.handleFileUpload}
        onToggleLockdown={strideState.toggleLockdown}
        onGlobalBroadcast={strideState.globalBroadcast}
        onSwitchSchool={strideState.switchSchool}
        onCreateSchool={strideState.createSchool}
        onJoinSchool={strideState.switchSchool}
        
        // House Assignment Functions
        onAssignStudent={strideState.assignStudentToHouse}
        onBulkAssign={strideState.bulkAssignStudents}
        onUpdateHouseName={strideState.updateHouseName}
        
        // Alert Level Functions
        onSetAlertLevel={strideState.setAlertLevel}
        alertLevel={strideState.alertLevel}
        lockedZones={strideState.lockedZones}
        onToggleZoneLock={strideState.toggleZoneLock}
        
        // Conflict Groups
        conflictGroups={strideState.conflictGroups}
        onAddConflictGroup={strideState.addConflictGroup}
        onRemoveConflictGroup={strideState.removeConflictGroup}
        
        // Communication
        onSendBroadcast={strideState.sendBroadcast}
        onDeleteBroadcast={strideState.deleteBroadcast}
        onPinBroadcast={strideState.pinBroadcast}
        
        // Parent Contacts
        onSaveParentContact={strideState.saveParentContact}
        
        // Tardy
        onLogTardy={strideState.logTardy}
        
        // Theme
        onThemeChange={strideState.setTheme}
        
        // Bot Reference for animations
        botRef={botRef}
      />

      {/* Global Components */}
      <StrideBot ref={botRef} />
      
      {/* Toast with props connected */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </main>
  );
}
