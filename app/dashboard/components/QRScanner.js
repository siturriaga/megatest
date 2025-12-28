'use client';
import { X, Camera, SwitchCamera, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';

export default function QRScanner({ onClose, allStudents, activePasses, onIssuePass, onReturnStudent, labelsConfig }) {
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { type: 'return' | 'found', student, pass? }
  const [facingMode, setFacingMode] = useState('environment');
  const [isScanning, setIsScanning] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

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
    const activePass = activePasses.find(p => p.studentId === student.id);
    
    if (activePass) {
      // Return the student
      setScanResult({ type: 'return', student, pass: activePass });
      onReturnStudent?.(activePass);
    } else {
      // Show student found - can issue pass
      setScanResult({ type: 'found', student });
      setScanned(student);
    }
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

        {/* Scan Result Feedback */}
        {scanResult && (
          <div className={`mt-4 p-4 rounded-xl text-center w-full max-w-md ${
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
              <div className="text-blue-400">
                <CheckCircle size={24} className="mx-auto mb-2" />
                <p className="font-bold">Returned: {scanResult.student.full_name}</p>
                <p className="text-sm opacity-80">From: {scanResult.pass.destination}</p>
              </div>
            ) : (
              <div className="text-emerald-400">
                <CheckCircle size={24} className="mx-auto mb-2" />
                <p className="font-bold">Found: {scanResult.student.full_name}</p>
                <p className="text-sm opacity-80">ID: {scanResult.student.student_id_number}</p>
              </div>
            )}
            
            {scanResult.type !== 'error' && (
              <button 
                onClick={resetScan}
                className="mt-3 px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/20"
              >
                Scan Another
              </button>
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
