'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStrideState } from '@/hooks/useStrideState';
import StrideDashboard from './StrideDashboard'; // Imports the UI from the same folder
import StrideBot from './components/StrideBot';
import { Loader2 } from 'lucide-react';
import Toast from './components/Toast';

export default function DashboardPage() {
  const router = useRouter();
  const botRef = useRef(null);
  
  // 1. Initialize the "Brain" (The Hook)
  const strideState = useStrideState(router, botRef);
  const { isLoading, user } = strideState;

  // 2. Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-bold animate-pulse">Initializing STRIDE...</h2>
      </div>
    );
  }

  // 3. The Dashboard Bridge
  // We pass ALL state and functions from useStrideState down to StrideDashboard
  return (
    <main className="relative">
      <StrideDashboard 
        // Pass everything from the hook state
        {...strideState}
        
        // Explicitly map Actions
        onIssuePass={strideState.issuePass}
        onEndPass={strideState.returnStudent}
        onLogInfraction={strideState.logInfraction}
        onAwardPoints={strideState.awardPoints}
        onUpdateConfig={strideState.updateConfig}
        onUpdateHouses={strideState.updateHouses}
        onHandleFileUpload={strideState.handleFileUpload}
        onToggleLockdown={strideState.toggleLockdown}
        onGlobalBroadcast={strideState.globalBroadcast}
        
        // --- NEW CONNECTIONS (Crucial for Fuzzy Uploads & Mascots) ---
        onAssignStudent={strideState.assignStudentToHouse}
        onBulkAssign={strideState.bulkAssignStudents}
        onUpdateHouseName={strideState.updateHouseName}
        
        // Pass the Bot Reference for animations
        botRef={botRef}
      />

      {/* Global Components */}
      <StrideBot ref={botRef} />
      <Toast />
    </main>
  );
}
