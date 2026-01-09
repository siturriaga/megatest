'use client';
import { X, Camera, SwitchCamera, CheckCircle, AlertCircle, Clock, MapPin, User, CreditCard } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';

/**
 * QRScanner - Scan student QR codes to view/manage passes
 * 
 * FIXES APPLIED:
 * - I: Sandbox mode now renders demo passes instead of blank
 * - J: Pass display shows full info: teacher name, student name, ID, destination, time elapsed
 * 
 * @version 2.1.0
 */
export default function QRScanner({ 
  onClose, 
  allStudents, 
  activePasses, 
  onIssuePass, 
  onReturnStudent, 
  labelsConfig,
  sandboxMode = false,  // FIX I: Added sandboxMode prop
}) {
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { type: 'return' | 'found' | 'error', student, pass? }
  const [facingMode, setFacingMode] = useState('environment');
  const [isScanning, setIsScanning] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  // FIX J: Calculate elapsed time from pass start
  const getElapsedTime = (pass) => {
    if (!pass?.startedAt) return 'Unknown';
    
    const startTime = pass.startedAt?.seconds 
      ? pass.startedAt.seconds * 1000 
      : pass.startedAt?.toDate?.() 
        ? pass.startedAt.toDate().getTime()
        : new Date(pass.startedAt).getTime();
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  // FIX I: Generate sandbox demo passes if in sandbox mode with no real passes
  const getEffectivePasses = useCallback(() => {
    if (sandboxMode && (!activePasses || activePasses.length === 0)) {
      // Return demo passes for sandbox
      return [
        {
          id: 'sandbox-pass-1',
          studentId: allStudents[0]?.id || 'demo-student-1',
          studentName: allStudents[0]?.full_name || 'Demo Student',
          student_id_number: allStudents[0]?.student_id_number || 'STU001',
          destination: 'Bathroom',
          origin: 'Room 101',
          teacherName: 'Demo Teacher',
          teacherUid: 'demo-teacher-uid',
          startedAt: { seconds: Math.floor((Date.now() - 5 * 60 * 1000) / 1000) }, // 5 mins ago
        },
        {
          id: 'sandbox-pass-2',
          studentId: allStudents[1]?.id || 'demo-student-2',
          studentName: allStudents[1]?.full_name || 'Test Student',
          student_id_number: allStudents[1]?.student_id_number || 'STU002',
          destination: 'Library',
          origin: 'Room 203',
          teacherName: 'Demo Teacher',
          teacherUid: 'demo-teacher-uid',
          startedAt: { seconds: Math.floor((Date.now() - 12 * 60 * 1000) / 1000) }, // 12 mins ago
        },
      ];
    }
    return activePasses || [];
  }, [sandboxMode, activePasses, allStudents]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Check if mediaDevices is available (requires HTTPS)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not available. Ensure you are using HTTPS.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera: ' + err.message);
      }
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // Switch camera
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Scan QR code from video frame
  const scanFrame = useCallback(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        handleQRCode(code.data);
        return; // Stop scanning after successful read
      }
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }, [isScanning]);

  // Handle decoded QR data
  const handleQRCode = (data) => {
    setIsScanning(false);
    
    try {
      // Try to parse as JSON (our format)
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'STRIDE_STUDENT' && parsed.studentId) {
        processStudentId(parsed.studentId);
      } else {
        // Unknown format
        setError('Invalid QR code format');
        setTimeout(() => {
          setError(null);
          setIsScanning(true);
          animationRef.current = requestAnimationFrame(scanFrame);
        }, 2000);
      }
    } catch {
      // Not JSON - treat as plain student ID
      processStudentId(data.trim());
    }
  };

  // Process student ID (from QR or manual)
  const processStudentId = (studentId) => {
    const effectivePasses = getEffectivePasses();
    
    const student = allStudents.find(s => 
      s.student_id_number === studentId || 
      s.id === studentId ||
      s.student_id_number === studentId.toUpperCase()
    );

    if (!student) {
      setScanResult({ type: 'error', message: 'Student not found' });
      setTimeout(resetScan, 2000);
      return;
    }

    // Check if student has active pass
    const activePass = effectivePasses.find(p => p.studentId === student.id);
    
    if (activePass) {
      // FIX J: Show full pass info with return option
      setScanResult({ 
        type: 'return', 
        student, 
        pass: {
          ...activePass,
          // Ensure we have student info on the pass
          studentName: activePass.studentName || student.full_name,
          student_id_number: activePass.student_id_number || student.student_id_number,
        }
      });
    } else {
      // Show student found - can issue pass
      setScanResult({ type: 'found', student });
      setScanned(student);
    }
  };

  // Handle return student
  const handleReturnStudent = () => {
    if (scanResult?.pass && !sandboxMode) {
      onReturnStudent?.(scanResult.pass);
    }
    resetScan();
  };

  // Reset scanner for next scan
  const resetScan = () => {
    setScanResult(null);
    setScanned(null);
    setIsScanning(true);
    animationRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle manual input
  const handleManualInput = (e) => {
    if (e.key === 'Enter') {
      const studentId = e.target.value.trim();
      if (studentId) {
        processStudentId(studentId);
        e.target.value = '';
      }
    }
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Start/stop camera on mount/unmount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Start scanning when camera is ready
  useEffect(() => {
    if (!error && isScanning) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [error, isScanning, scanFrame]);

  // Restart camera when facing mode changes
  useEffect(() => {
    startCamera();
  }, [facingMode, startCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      <header className="p-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-3">
          <Camera className="text-primary" size={24} />
          <h1 className="text-xl font-black">QR Scanner</h1>
          {/* FIX I: Show sandbox indicator */}
          {sandboxMode && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold rounded-full">
              SANDBOX
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={switchCamera} 
            className="p-2 bg-accent border border-border rounded-lg hover:bg-accent/80"
            title="Switch Camera"
          >
            <SwitchCamera size={20} />
          </button>
          <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-lg">
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {error ? (
          <div className="text-center">
            <Camera size={64} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-red-400 mb-4">{error}</p>
            <p className="text-muted-foreground">Enter student ID manually below</p>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-48 h-48 border-4 rounded-xl transition-colors ${
                isScanning ? 'border-primary/50 animate-pulse' : 'border-emerald-500'
              }`} />
            </div>
            {/* Scanning indicator */}
            {isScanning && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                  Scanning...
                </span>
              </div>
            )}
          </div>
        )}

        {/* FIX J: Enhanced Scan Result - Full Pass Info Display */}
        {scanResult && (
          <div className={`mt-4 p-4 rounded-xl w-full max-w-md ${
            scanResult.type === 'error' 
              ? 'bg-red-500/20 border border-red-500/30' 
              : scanResult.type === 'return'
              ? 'bg-blue-500/20 border border-blue-500/30'
              : 'bg-emerald-500/20 border border-emerald-500/30'
          }`}>
            {scanResult.type === 'error' ? (
              <div className="flex items-center justify-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span className="font-bold">{scanResult.message}</span>
              </div>
            ) : scanResult.type === 'return' ? (
              /* FIX J: Full pass information display */
              <div className="text-blue-400">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle size={24} />
                  <span className="text-lg font-black">ACTIVE PASS</span>
                </div>
                
                {/* Pass Details Card */}
                <div className="bg-black/20 rounded-xl p-4 space-y-3">
                  {/* Student Name */}
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-blue-300" />
                    <div>
                      <div className="text-xs text-blue-300/70">Student</div>
                      <div className="font-bold text-white">{scanResult.pass.studentName}</div>
                    </div>
                  </div>
                  
                  {/* Student ID */}
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} className="text-blue-300" />
                    <div>
                      <div className="text-xs text-blue-300/70">Student ID</div>
                      <div className="font-bold text-white font-mono">
                        {scanResult.pass.student_id_number || scanResult.student.student_id_number}
                      </div>
                    </div>
                  </div>
                  
                  {/* Destination */}
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-blue-300" />
                    <div>
                      <div className="text-xs text-blue-300/70">Destination</div>
                      <div className="font-bold text-white">{scanResult.pass.destination}</div>
                    </div>
                  </div>
                  
                  {/* Time Elapsed */}
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-blue-300" />
                    <div>
                      <div className="text-xs text-blue-300/70">Time Out</div>
                      <div className="font-bold text-white">{getElapsedTime(scanResult.pass)}</div>
                    </div>
                  </div>
                  
                  {/* Teacher Name */}
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-blue-300" />
                    <div>
                      <div className="text-xs text-blue-300/70">Issued By</div>
                      <div className="font-bold text-white">{scanResult.pass.teacherName || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button 
                    onClick={handleReturnStudent}
                    className="py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Return Student
                  </button>
                  <button 
                    onClick={resetScan}
                    className="py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            ) : (
              /* Student found, no active pass */
              <div className="text-emerald-400">
                <CheckCircle size={24} className="mx-auto mb-2" />
                <p className="font-bold text-center">Found: {scanResult.student.full_name}</p>
                <p className="text-sm opacity-80 text-center">ID: {scanResult.student.student_id_number}</p>
                <p className="text-xs text-center mt-2 text-amber-400">No active pass</p>
                
                <button 
                  onClick={resetScan}
                  className="mt-3 w-full py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20"
                >
                  Scan Another
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        <div className="mt-6 w-full max-w-md">
          <input 
            type="text" 
            placeholder="Or enter student ID manually..." 
            className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-center"
            onKeyDown={handleManualInput}
          />
        </div>
      </main>
    </div>
  );
}
