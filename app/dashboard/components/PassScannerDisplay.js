'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  User, MapPin, Clock, ArrowRight, AlertTriangle, 
  Check, X, Plus, Timer, QrCode 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimeElapsed, isPassOvertime, getEstimatedDuration } from '@/constants/defaults';

/**
 * PassScannerDisplay Component
 * 
 * Displays pass details when hall monitor scans a student's QR code:
 * - Student info (name, ID, grade, photo)
 * - Origin (teacher/room)
 * - Destination
 * - Time elapsed (live updating)
 * - Pass status (valid/overtime)
 * - Actions (Send Back, Extend, OK)
 * 
 * Props:
 * - pass: object - The scanned pass data
 * - student: object - The student data
 * - onClose: () => void - Close display
 * - onSendBack: (pass) => Promise - Return student
 * - onExtendPass: (pass, minutes) => Promise - Extend pass time
 * - overtimeMinutes: number - Minutes before overtime warning (default: 10)
 */
export default function PassScannerDisplay({
  pass,
  student,
  onClose,
  onSendBack,
  onExtendPass,
  overtimeMinutes = 10,
}) {
  const [elapsedTime, setElapsedTime] = useState('0:00');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExtendOptions, setShowExtendOptions] = useState(false);

  // Update elapsed time every second
  useEffect(() => {
    if (!pass?.startedAt) return;

    const updateTime = () => {
      const startSeconds = pass.startedAt.seconds || pass.startedAt / 1000;
      const elapsed = Math.floor(Date.now() / 1000 - startSeconds);
      setElapsedSeconds(Math.max(0, elapsed));
      
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setElapsedTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [pass?.startedAt]);

  // Calculate status
  const estimatedDuration = getEstimatedDuration(pass?.destination || 'Other') * 60; // in seconds
  const overtimeThreshold = overtimeMinutes * 60; // in seconds
  
  const isOvertime = elapsedSeconds > overtimeThreshold;
  const isWayOvertime = elapsedSeconds > overtimeThreshold * 2;
  const progressPercent = Math.min(100, (elapsedSeconds / estimatedDuration) * 100);

  // Handle send back
  const handleSendBack = async () => {
    setIsProcessing(true);
    try {
      await onSendBack?.(pass);
      onClose?.();
    } catch (err) {
      console.error('Send back error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle extend pass
  const handleExtend = async (minutes) => {
    setIsProcessing(true);
    try {
      await onExtendPass?.(pass, minutes);
      setShowExtendOptions(false);
    } catch (err) {
      console.error('Extend pass error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pass || !student) {
    return (
      <div className="p-8 text-center">
        <QrCode size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No pass data</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`w-full max-w-md mx-auto rounded-2xl border overflow-hidden ${
        isWayOvertime
          ? 'bg-red-500/10 border-red-500/50'
          : isOvertime
            ? 'bg-amber-500/10 border-amber-500/50'
            : 'bg-card border-white/10'
      }`}
    >
      {/* Status Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isWayOvertime
          ? 'bg-red-500/20'
          : isOvertime
            ? 'bg-amber-500/20'
            : 'bg-emerald-500/20'
      }`}>
        <div className="flex items-center gap-2">
          {isWayOvertime ? (
            <AlertTriangle className="text-red-400" size={20} />
          ) : isOvertime ? (
            <AlertTriangle className="text-amber-400" size={20} />
          ) : (
            <Check className="text-emerald-400" size={20} />
          )}
          <span className={`font-bold ${
            isWayOvertime
              ? 'text-red-400'
              : isOvertime
                ? 'text-amber-400'
                : 'text-emerald-400'
          }`}>
            {isWayOvertime
              ? 'WAY OVERTIME'
              : isOvertime
                ? 'OVERTIME'
                : 'VALID PASS'
            }
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Student Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center text-2xl font-black text-primary">
            {student.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black truncate">{student.full_name}</h3>
            <p className="text-sm text-muted-foreground">
              ID: {student.student_id_number} • Grade {student.grade_level}
            </p>
          </div>
        </div>
      </div>

      {/* Pass Details */}
      <div className="p-4 space-y-3">
        {/* Origin */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <User className="text-blue-400" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">From</div>
            <div className="font-bold truncate">{pass.origin || pass.teacherName || 'Unknown'}</div>
            {pass.originRoom && (
              <div className="text-xs text-muted-foreground">Room: {pass.originRoom}</div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="text-muted-foreground" size={20} />
        </div>

        {/* Destination */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <MapPin className="text-emerald-400" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">To</div>
            <div className="font-bold truncate">{pass.destination || 'Unknown'}</div>
          </div>
        </div>

        {/* Time */}
        <div className="mt-4 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`${
                isWayOvertime
                  ? 'text-red-400'
                  : isOvertime
                    ? 'text-amber-400'
                    : 'text-muted-foreground'
              }`} size={16} />
              <span className="text-sm text-muted-foreground">Time Elapsed</span>
            </div>
            <div className={`text-2xl font-mono font-black ${
              isWayOvertime
                ? 'text-red-400'
                : isOvertime
                  ? 'text-amber-400'
                  : 'text-foreground'
            }`}>
              {elapsedTime}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full rounded-full transition-colors ${
                isWayOvertime
                  ? 'bg-red-500'
                  : isOvertime
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
            />
          </div>
          
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0:00</span>
            <span>~{getEstimatedDuration(pass.destination || 'Other')} min expected</span>
          </div>
        </div>

        {/* Overtime Warning */}
        {isOvertime && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl flex items-center gap-3 ${
              isWayOvertime
                ? 'bg-red-500/20 border border-red-500/50'
                : 'bg-amber-500/20 border border-amber-500/50'
            }`}
          >
            <AlertTriangle className={isWayOvertime ? 'text-red-400' : 'text-amber-400'} size={20} />
            <div className="flex-1">
              <div className={`font-bold text-sm ${
                isWayOvertime ? 'text-red-400' : 'text-amber-400'
              }`}>
                {isWayOvertime 
                  ? `Over ${Math.floor(elapsedSeconds / 60)} minutes!`
                  : `Overtime by ${Math.floor((elapsedSeconds - overtimeThreshold) / 60)} min`
                }
              </div>
              <div className={`text-xs ${
                isWayOvertime ? 'text-red-400/70' : 'text-amber-400/70'
              }`}>
                {isWayOvertime 
                  ? 'Consider sending student back'
                  : 'Student may need to return soon'
                }
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Extend Options */}
        <AnimatePresence>
          {showExtendOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2"
            >
              <div className="text-sm text-muted-foreground mb-2">Extend pass by:</div>
              <div className="flex gap-2">
                {[5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleExtend(mins)}
                    disabled={isProcessing}
                    className="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                  >
                    +{mins} min
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button
            onClick={handleSendBack}
            disabled={isProcessing}
            className="flex-1 py-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl font-bold hover:bg-amber-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight size={18} className="rotate-180" />
            Send Back
          </button>
          <button
            onClick={() => setShowExtendOptions(!showExtendOptions)}
            disabled={isProcessing}
            className="py-3 px-4 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl font-bold hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            OK
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Hook to handle QR code parsing and pass lookup
 */
export function usePassScanner({ activePasses = [], allStudents = [] }) {
  const [scannedPass, setScannedPass] = useState(null);
  const [scanError, setScanError] = useState(null);

  const handleScan = useCallback((qrData) => {
    setScanError(null);
    setScannedPass(null);

    try {
      // Expected QR format: stride://pass/{passId} or JSON object
      let passId = null;
      let passData = null;

      if (typeof qrData === 'string') {
        if (qrData.startsWith('stride://pass/')) {
          passId = qrData.replace('stride://pass/', '');
        } else if (qrData.startsWith('{')) {
          passData = JSON.parse(qrData);
          passId = passData.passId || passData.id;
        } else {
          passId = qrData;
        }
      } else if (typeof qrData === 'object') {
        passData = qrData;
        passId = passData.passId || passData.id;
      }

      if (!passId) {
        throw new Error('Invalid QR code format');
      }

      // Find the pass
      const pass = activePasses.find(p => p.id === passId);
      if (!pass) {
        // Check if it's a student ID QR
        const student = allStudents.find(s => 
          s.id === passId || s.student_id_number === passId
        );
        if (student) {
          // Find active pass for this student
          const studentPass = activePasses.find(p => p.studentId === student.id);
          if (studentPass) {
            setScannedPass({ pass: studentPass, student });
            return;
          }
          throw new Error(`No active pass for ${student.full_name}`);
        }
        throw new Error('Pass not found or expired');
      }

      // Find the student
      const student = allStudents.find(s => s.id === pass.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      setScannedPass({ pass, student });
    } catch (err) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Failed to scan QR code');
    }
  }, [activePasses, allStudents]);

  const clearScan = useCallback(() => {
    setScannedPass(null);
    setScanError(null);
  }, []);

  return {
    scannedPass,
    scanError,
    handleScan,
    clearScan,
  };
}
