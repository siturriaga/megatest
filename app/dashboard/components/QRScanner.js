'use client';
import { X, Camera, SwitchCamera } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function QRScanner({ onClose, allStudents, activePasses, onIssuePass, onReturnStudent, labelsConfig }) {
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Camera access denied');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const handleManualInput = (studentId) => {
    const student = allStudents.find(s => s.student_id_number === studentId || s.id === studentId);
    if (student) {
      const activePass = activePasses.find(p => p.studentId === student.id);
      if (activePass) {
        onReturnStudent?.(activePass);
      }
      setScanned(student);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="p-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-3">
          <Camera className="text-primary" size={24} />
          <h1 className="text-xl font-black">QR Scanner</h1>
        </div>
        <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={20} /></button>
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
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-8 border-2 border-primary/50 rounded-xl" />
          </div>
        )}

        <div className="mt-6 w-full max-w-md">
          <input 
            type="text" 
            placeholder="Or enter student ID manually..." 
            className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-center"
            onKeyDown={(e) => e.key === 'Enter' && handleManualInput(e.target.value)}
          />
        </div>

        {scanned && (
          <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center">
            <p className="font-bold text-emerald-400">Found: {scanned.full_name}</p>
          </div>
        )}
      </main>
    </div>
  );
}
