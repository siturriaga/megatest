'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Search, MapPin, Check, X, ArrowLeft, Loader2, LogOut, User, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fuzzySearchStudents, getEstimatedDuration } from '@/constants/defaults';

/**
 * TardyKiosk Component
 * 
 * Full-screen kiosk interface for:
 * - Student self-check-in when tardy
 * - Logs tardy + creates active pass to destination
 * - Fuzzy student search (typo-tolerant)
 * - Auto-logout timer
 * - PIN-protected exit
 */
export default function TardyKiosk({
  onExit,
  onLogTardy,
  onIssuePass,
  allStudents = [],
  allTeachers = [],
  employeeId,
  labelsConfig,
  kioskConfig,
  schoolName = 'School',
}) {
  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [exitPinError, setExitPinError] = useState(false);
  
  const [idleSeconds, setIdleSeconds] = useState(0);
  const idleTimerRef = useRef(null);
  const autoLogoutSeconds = kioskConfig?.autoLogoutSeconds || 60;
  const requiredPin = kioskConfig?.exitPin || '1234';
  
  const passDestinations = labelsConfig?.passDestinations || [
    'Bathroom', 'Water', 'Office', 'Library', 'Clinic', 'Guidance', 'Locker', 'Classroom'
  ];

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = fuzzySearchStudents(allStudents, searchQuery, 10);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allStudents]);

  useEffect(() => {
    const resetIdle = () => setIdleSeconds(0);
    
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keypress', resetIdle);
    window.addEventListener('touchstart', resetIdle);
    
    idleTimerRef.current = setInterval(() => {
      setIdleSeconds(prev => {
        if (prev >= autoLogoutSeconds) {
          handleReset();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keypress', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [autoLogoutSeconds]);

  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedStudent(null);
    setSelectedDestination(null);
    setSelectedTeacher(null);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setIdleSeconds(0);
  }, []);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setStep(2);
    setIdleSeconds(0);
  };

  const handleSelectDestination = (destination, teacher = null) => {
    setSelectedDestination(destination);
    setSelectedTeacher(teacher);
    setStep(3);
    setIdleSeconds(0);
  };

  const handleConfirm = async () => {
    if (!selectedStudent || !selectedDestination) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await onLogTardy?.(selectedStudent, {
        type: 'KIOSK_CHECKIN',
        employeeId,
        destination: selectedDestination,
        teacherId: selectedTeacher?.id || null,
      });
      
      await onIssuePass?.(selectedStudent, selectedDestination, selectedTeacher?.id || null);
      
      setStep(4);
      
      setTimeout(() => {
        handleReset();
      }, 5000);
      
    } catch (err) {
      console.error('Kiosk check-in error:', err);
      setError(err.message || 'Failed to check in. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExitSubmit = () => {
    if (exitPin === requiredPin) {
      onExit?.();
    } else {
      setExitPinError(true);
      setExitPin('');
      setTimeout(() => setExitPinError(false), 2000);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
            <Clock size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Tardy Check-In</h1>
            <p className="text-sm text-white/60">{schoolName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-white/60">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <button onClick={() => setShowExitModal(true)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <LogOut size={20} className="text-white/60" />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {[
            { num: 1, label: 'Find Your Name' },
            { num: 2, label: 'Select Destination' },
            { num: 3, label: 'Confirm' },
            { num: 4, label: 'Done' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/40'}`}>
                  {step > s.num ? <Check size={20} /> : s.num}
                </div>
                <span className="text-[10px] sm:text-xs text-white/40 mt-1 hidden sm:block">{s.label}</span>
              </div>
              {i < 3 && <div className={`w-8 sm:w-16 h-1 rounded-full transition-all ${step > s.num ? 'bg-primary' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Find Your Name</h2>
                  <p className="text-white/60">Start typing your name or student ID (typos are OK!)</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={24} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type your name..." autoFocus className="w-full pl-16 pr-6 py-6 bg-white/10 border border-white/20 rounded-2xl text-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>

                <p className="text-center text-sm text-white/40">💡 Fuzzy search enabled: "jonathn" finds "Jonathan"</p>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map(student => (
                      <motion.button key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => handleSelectStudent(student)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all text-left flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center text-2xl font-bold text-primary">{student.full_name?.charAt(0)}</div>
                        <div className="flex-1">
                          <div className="text-xl font-bold text-white">{student.full_name}</div>
                          <div className="text-white/60">ID: {student.student_id_number} • Grade {student.grade_level}</div>
                        </div>
                      </motion.button>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-12 text-white/40">
                      <User size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No students found matching "{searchQuery}"</p>
                      <p className="text-sm mt-2">Try a different spelling or ask for help</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/40">
                      <Search size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && selectedStudent && (
              <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <ArrowLeft size={20} /> Back
                </button>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/20 rounded-full mb-4">
                    <div className="w-10 h-10 bg-primary/30 rounded-full flex items-center justify-center text-lg font-bold text-primary">{selectedStudent.full_name?.charAt(0)}</div>
                    <span className="text-xl font-bold text-white">{selectedStudent.full_name}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Where are you going?</h2>
                  <p className="text-white/60">Select your destination</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Locations
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {passDestinations.map(dest => (
                      <button key={dest} onClick={() => handleSelectDestination(dest)} className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/50 transition-all text-center">
                        <div className="text-3xl mb-2">{dest === 'Bathroom' ? '🚻' : dest === 'Water' ? '💧' : dest === 'Office' ? '🏢' : dest === 'Library' ? '📚' : dest === 'Clinic' ? '🏥' : dest === 'Guidance' ? '💬' : dest === 'Locker' ? '🔐' : dest === 'Classroom' ? '📝' : '📍'}</div>
                        <div className="font-bold text-white">{dest}</div>
                        <div className="text-xs text-white/40 mt-1">~{getEstimatedDuration(dest)} min</div>
                      </button>
                    ))}
                  </div>
                </div>

                {allTeachers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Building size={14} /> Teachers
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                      {allTeachers.map(teacher => (
                        <button key={teacher.id} onClick={() => handleSelectDestination(`${teacher.name}'s Room`, teacher)} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/50 transition-all text-left">
                          <div className="font-bold text-white truncate">{teacher.name}</div>
                          {teacher.room && <div className="text-sm text-white/40">Room {teacher.room}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && selectedStudent && selectedDestination && (
              <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <ArrowLeft size={20} /> Back
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Confirm Check-In</h2>
                  <p className="text-white/60">Please verify your information</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-primary/20 rounded-xl flex items-center justify-center text-3xl font-bold text-primary">{selectedStudent.full_name?.charAt(0)}</div>
                    <div>
                      <div className="text-2xl font-bold text-white">{selectedStudent.full_name}</div>
                      <div className="text-white/60">ID: {selectedStudent.student_id_number} • Grade {selectedStudent.grade_level}</div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="text-white/60 text-sm mb-1">Destination</div>
                    <div className="text-xl font-bold text-white flex items-center gap-2">
                      <MapPin size={20} className="text-primary" />
                      {selectedDestination}
                      {selectedTeacher && <span className="text-white/60 font-normal">(Room {selectedTeacher.room || 'N/A'})</span>}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="text-white/60 text-sm mb-1">Time</div>
                    <div className="text-xl font-bold text-white">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>

                {error && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-center">{error}</div>}

                <button onClick={handleConfirm} disabled={isProcessing} className="w-full py-6 bg-primary text-primary-foreground rounded-2xl text-xl font-bold disabled:opacity-50 flex items-center justify-center gap-3">
                  {isProcessing ? (<><Loader2 className="animate-spin" size={24} />Processing...</>) : (<><Check size={24} />Confirm Check-In</>)}
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Check size={64} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-4xl font-black text-white mb-4">You're Checked In!</h2>
                <p className="text-xl text-white/60 mb-8">Your pass to {selectedDestination} is now active</p>
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-xl font-bold text-primary">{selectedStudent?.full_name?.charAt(0)}</div>
                  <div className="text-left">
                    <div className="font-bold text-white">{selectedStudent?.full_name}</div>
                    <div className="text-sm text-white/60">Heading to {selectedDestination}</div>
                  </div>
                </div>
                <p className="text-white/40 mt-12">Screen will reset automatically...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {idleSeconds > autoLogoutSeconds - 15 && step !== 4 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="absolute bottom-20 left-4 right-4 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center">
          <p className="text-amber-400 font-bold">Screen will reset in {autoLogoutSeconds - idleSeconds} seconds due to inactivity</p>
        </motion.div>
      )}

      <div className="p-4 border-t border-white/10 text-center text-white/40 text-sm">
        Need help? Ask a staff member • Auto-logout in {autoLogoutSeconds - idleSeconds}s
      </div>

      <AnimatePresence>
        {showExitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowExitModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-800 border border-white/10 rounded-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white text-center mb-6">Enter PIN to Exit</h3>
              <input type="password" value={exitPin} onChange={(e) => setExitPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" maxLength={4} autoFocus className={`w-full text-center text-3xl tracking-[1em] py-4 bg-white/10 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary ${exitPinError ? 'border-red-500' : 'border-white/20'}`} onKeyDown={(e) => e.key === 'Enter' && handleExitSubmit()} />
              {exitPinError && <p className="text-red-400 text-center mt-2 text-sm">Incorrect PIN</p>}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowExitModal(false); setExitPin(''); }} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold">Cancel</button>
                <button onClick={handleExitSubmit} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold">Exit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
