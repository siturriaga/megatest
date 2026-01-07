'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '../app/firebase';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, getDocs, orderBy, limit, serverTimestamp, writeBatch, increment, runTransaction } from 'firebase/firestore';
import { COLLECTIONS, SCHOOL_SUBCOLLECTIONS, CONFIG_DOCS, studentsPath, logsPath, activePassesPath, housesPath, conflictGroupsPath, configPath, boxQueuePath, waitlistPath, broadcastsPath, parentContactsPath } from '../constants/collections';
import { ROLES, isAdminOrAbove, isSuperAdmin as checkSuperAdmin } from '../constants/roles';
import { DEFAULT_ECONOMY, DEFAULT_BELL_SCHEDULE, DEFAULT_KIOSK, DEFAULT_SETTINGS, DEFAULT_HOUSES, DEFAULT_INFRACTION_LABELS, DEFAULT_INCENTIVE_LABELS, DEFAULT_PASS_DESTINATIONS, getEstimatedDuration, getMTSSTier } from '../constants/defaults';
import { SANDBOX_STUDENTS, SANDBOX_HOUSES, SANDBOX_LOGS, SANDBOX_CONFIG } from '../config/sandbox';
import { sanitizeText, sanitizeStudentName, isAllowedDomain, rateLimiters } from '../utils/sanitize';
import { validatePass, validateLogEntry, validateBroadcast, validateConflictGroup, validateParentContact, validateSchool, validateConfig } from '../utils/validators';

const ALLOWED_DOMAIN = 'dadeschools.net';
const CONSENT_VERSION = '1.0.0';

/**
 * FIXES APPLIED:
 * - W: Sandbox auto-switch protection (line ~165)
 * - R: globalLockdown sandbox + empty check (line ~1040)
 * - F: globalBroadcast sandbox + empty check (line ~1115)
 * - J: teacherUid added to pass data (line ~735)
 */
export function useStrideState(router, botRef, setToast, user, setUser) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSchoolPrompt, setShowSchoolPrompt] = useState(false);
  const [showConsentFlow, setShowConsentFlow] = useState(false);
  const [currentSchoolId, setCurrentSchoolId] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [allSchools, setAllSchools] = useState([]);
  const [activeTab, setActiveTab] = useState('hallpass');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [theme, setTheme] = useState('obsidian');
  const [allStudents, setAllStudents] = useState([]);
  const [activePasses, setActivePasses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [houses, setHouses] = useState([]);
  const [conflictGroups, setConflictGroups] = useState([]);
  const [boxQueue, setBoxQueue] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [parentContacts, setParentContacts] = useState([]);
  const [labelsConfig, setLabelsConfig] = useState({
    infractionButtons: DEFAULT_INFRACTION_LABELS,
    incentiveButtons: DEFAULT_INCENTIVE_LABELS,
    passDestinations: DEFAULT_PASS_DESTINATIONS,
    maxDisplayedDestinations: 8,
  });
  const [bellSchedule, setBellSchedule] = useState(DEFAULT_BELL_SCHEDULE);
  const [economyConfig, setEconomyConfig] = useState(DEFAULT_ECONOMY);
  const [kioskConfig, setKioskConfig] = useState(DEFAULT_KIOSK);
  const [settingsConfig, setSettingsConfig] = useState(DEFAULT_SETTINGS);
  const [housesConfig, setHousesConfig] = useState({ houses: DEFAULT_HOUSES });
  const [lockdown, setLockdown] = useState(false);
  const [lockdownMeta, setLockdownMeta] = useState(null);
  const [alertLevel, setAlertLevel] = useState('normal');
  const [lockedZones, setLockedZones] = useState([]);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxStudents, setSandboxStudents] = useState([...SANDBOX_STUDENTS]);
  const [sandboxPasses, setSandboxPasses] = useState([]);
  const [sandboxLogs, setSandboxLogs] = useState([...SANDBOX_LOGS]);
  const [sandboxHouses, setSandboxHouses] = useState([...SANDBOX_HOUSES]);
  const unsubscribesRef = useRef([]);

  const isSuperAdmin = userData?.role === ROLES.SUPER_ADMIN || userData?.role === 'super_admin';
  const isSchoolAdmin = userData?.role === ROLES.SCHOOL_ADMIN || isSuperAdmin;
  const employeeId = userData?.employee_id || user?.email?.split('@')[0]?.toUpperCase() || 'UNKNOWN';
  const needsConsent = userData && !isSuperAdmin && (!userData.aup_accepted || userData.aup_version !== CONSENT_VERSION);
  const needsSchoolSelection = userData && !isSuperAdmin && !userData.school_id && userData.aup_accepted;
  const userGreeting = {
    firstName: user?.displayName?.split(' ')[0] || 'Teacher',
    fullName: user?.displayName || 'Teacher',
    email: user?.email || '',
  };
  const displaySchoolName = sandboxMode ? 'Sandbox Training' : (schoolData?.name || currentSchoolId || 'No School');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stride-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('stride-theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (isSuperAdmin && currentSchoolId === 'COMMAND_CENTER') {
      setActiveTab('command');
    }
  }, [isSuperAdmin, currentSchoolId]);

  // AUTH LISTENER - FIX W APPLIED
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const domain = email.split('@')[1];
        setUser(firebaseUser);
        const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          
          // FIX W: Don't override if already in sandbox mode
          if (data.role === ROLES.SUPER_ADMIN || data.role === 'super_admin') {
            if (!sandboxMode) {
              if (data.school_id && data.school_id !== 'COMMAND_CENTER') {
                setCurrentSchoolId(data.school_id);
              } else {
                setCurrentSchoolId('COMMAND_CENTER');
              }
            }
            setIsLoading(false);
            return;
          }
          
          if (!data.aup_accepted || data.aup_version !== CONSENT_VERSION) {
            setShowConsentFlow(true);
            setIsLoading(false);
            return;
          }
          
          if (data.school_id) {
            if (data.school_id === 'SANDBOX') setSandboxMode(true);
            setCurrentSchoolId(data.school_id);
          } else {
            setShowSchoolPrompt(true);
          }
        } else {
          if (domain !== ALLOWED_DOMAIN) {
            await signOut(auth);
            setToast?.({ message: 'Access restricted to @dadeschools.net accounts.', type: 'error' });
            setIsLoading(false);
            return;
          }
          const newUserData = {
            email,
            displayName: firebaseUser.displayName || '',
            role: ROLES.TEACHER,
            employee_id: email.split('@')[0].toUpperCase(),
            school_id: null,
            created_at: serverTimestamp(),
            aup_accepted: false,
            aup_version: null,
            camera_consent: false,
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
          setShowConsentFlow(true);
        }
      } else {
        setUser(null);
        setUserData(null);
        router?.push('/');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router, setUser, setToast, sandboxMode]);

  const handleConsentComplete = async (consentData) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      if (consentData.schoolCode && consentData.schoolCode !== 'SANDBOX') {
        const schoolRef = doc(db, COLLECTIONS.SCHOOLS, consentData.schoolCode);
        const schoolSnap = await getDoc(schoolRef);
        if (!schoolSnap.exists()) {
          setToast?.({ message: 'Invalid school code.', type: 'error' });
          return;
        }
      }
      await updateDoc(userRef, {
        aup_accepted: true,
        aup_version: CONSENT_VERSION,
        aup_accepted_at: serverTimestamp(),
        camera_consent: true,
        school_id: consentData.schoolCode,
        consent_details: consentData.consentDetails || {
          aup: { accepted: true, timestamp: consentData.consentedAt },
          camera: { accepted: true, timestamp: consentData.consentedAt },
          ferpa: { accepted: true, timestamp: consentData.consentedAt },
          liability: { accepted: true, timestamp: consentData.consentedAt },
          data: { accepted: true, timestamp: consentData.consentedAt },
        },
        consent_user_agent: consentData.userAgent || 'unknown',
      });
      try {
        await addDoc(collection(db, 'consent_logs'), {
          uid: user.uid,
          email: user.email,
          action: 'CONSENT_ACCEPTED',
          version: CONSENT_VERSION,
          consents: consentData.consentDetails || consentData.consents,
          school_code: consentData.schoolCode,
          user_agent: consentData.userAgent || 'unknown',
          ip_hint: 'client',
          ts: serverTimestamp(),
        });
      } catch (auditErr) {
        console.warn('Failed to create consent audit log:', auditErr);
      }
      setUserData(prev => ({ ...prev, aup_accepted: true, aup_version: CONSENT_VERSION, camera_consent: true, school_id: consentData.schoolCode, consent_details: consentData.consentDetails }));
      if (consentData.schoolCode === 'SANDBOX') {
        setCurrentSchoolId('SANDBOX');
        setSandboxMode(true);
      } else {
        setCurrentSchoolId(consentData.schoolCode);
      }
      setShowConsentFlow(false);
      setShowSchoolPrompt(false);
      setToast?.({ message: 'Welcome to STRIDE!', type: 'success' });
    } catch (err) {
      console.error('Consent completion error:', err);
      setToast?.({ message: 'Failed to save consent.', type: 'error' });
    }
  };

  const handleEnterSandbox = async () => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const timestamp = new Date().toISOString();
      await updateDoc(userRef, {
        aup_accepted: true,
        aup_version: CONSENT_VERSION,
        aup_accepted_at: serverTimestamp(),
        camera_consent: true,
        school_id: 'SANDBOX',
        consent_details: {
          aup: { accepted: true, timestamp },
          camera: { accepted: true, timestamp },
          ferpa: { accepted: true, timestamp },
          liability: { accepted: true, timestamp },
          data: { accepted: true, timestamp },
        },
      });
      try {
        await addDoc(collection(db, 'consent_logs'), {
          uid: user.uid,
          email: user.email,
          action: 'CONSENT_ACCEPTED_SANDBOX',
          version: CONSENT_VERSION,
          school_code: 'SANDBOX',
          ts: serverTimestamp(),
        });
      } catch (auditErr) {
        console.warn('Failed to create sandbox consent audit log:', auditErr);
      }
      setUserData(prev => ({ ...prev, aup_accepted: true, aup_version: CONSENT_VERSION, camera_consent: true }));
      setCurrentSchoolId('SANDBOX');
      setSandboxMode(true);
      setShowConsentFlow(false);
      setShowSchoolPrompt(false);
      setToast?.({ message: 'Welcome to Sandbox mode!', type: 'success' });
    } catch (err) {
      console.error('Enter sandbox error:', err);
      setToast?.({ message: 'Failed to enter sandbox.', type: 'error' });
    }
  };

  const toggleSandbox = useCallback(async (enable) => {
    try {
      if (enable) {
        setCurrentSchoolId('SANDBOX');
        setSandboxMode(true);
        setToast?.({ message: 'Sandbox mode enabled', type: 'success' });
      } else {
        setCurrentSchoolId('COMMAND_CENTER');
        setSandboxMode(false);
        setToast?.({ message: 'Sandbox mode disabled', type: 'success' });
      }
    } catch (error) {
      console.error('Toggle sandbox error:', error);
      setToast?.({ message: 'Failed to toggle sandbox mode', type: 'error' });
    }
  }, [setToast]);

  const cleanupSubscriptions = useCallback(() => {
    unsubscribesRef.current.forEach(unsub => unsub?.());
    unsubscribesRef.current = [];
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);
    const unsub = onSnapshot(schoolsRef, (snap) => {
      setAllSchools(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!currentSchoolId || currentSchoolId === 'COMMAND_CENTER') {
      cleanupSubscriptions();
      return;
    }
    if (currentSchoolId === 'SANDBOX') {
      cleanupSubscriptions();
      setSandboxMode(true);
      setAllStudents([...SANDBOX_STUDENTS]);
      setSandboxStudents([...SANDBOX_STUDENTS]);
      setActivePasses([]);
      setSandboxPasses([]);
      setLogs([...SANDBOX_LOGS]);
      setSandboxLogs([...SANDBOX_LOGS]);
      setHouses([...SANDBOX_HOUSES]);
      setSandboxHouses([...SANDBOX_HOUSES]);
      setLabelsConfig(SANDBOX_CONFIG.labels);
      setBellSchedule(SANDBOX_CONFIG.bell_schedule);
      setEconomyConfig(SANDBOX_CONFIG.economy);
      setKioskConfig(SANDBOX_CONFIG.kiosk);
      setSettingsConfig(SANDBOX_CONFIG.settings);
      setConflictGroups([{ id: 'conflict-1', name: 'Rival Groups', members: ['sandbox-student-3', 'sandbox-student-7'] }]);
      setLockdown(false);
      return;
    }
    setSandboxMode(false);
    cleanupSubscriptions();

    const studentsUnsub = onSnapshot(collection(db, studentsPath(currentSchoolId)), (snap) => {
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(studentsUnsub);

    const passesUnsub = onSnapshot(query(collection(db, activePassesPath(currentSchoolId)), where('status', '==', 'ACTIVE')), (snap) => {
      setActivePasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(passesUnsub);

    const logsUnsub = onSnapshot(query(collection(db, logsPath(currentSchoolId)), orderBy('ts', 'desc'), limit(200)), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(logsUnsub);

    const housesUnsub = onSnapshot(collection(db, housesPath(currentSchoolId)), (snap) => {
      const h = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHouses(h.length > 0 ? h : DEFAULT_HOUSES);
    });
    unsubscribesRef.current.push(housesUnsub);

    const conflictsUnsub = onSnapshot(collection(db, conflictGroupsPath(currentSchoolId)), (snap) => {
      setConflictGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(conflictsUnsub);

    const queueUnsub = onSnapshot(collection(db, boxQueuePath(currentSchoolId)), (snap) => {
      setBoxQueue(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(queueUnsub);

    const waitlistUnsub = onSnapshot(collection(db, waitlistPath(currentSchoolId)), (snap) => {
      setWaitlist(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(waitlistUnsub);

    const broadcastsUnsub = onSnapshot(query(collection(db, broadcastsPath(currentSchoolId)), orderBy('ts', 'desc'), limit(50)), (snap) => {
      const b = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBroadcasts(b.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    });
    unsubscribesRef.current.push(broadcastsUnsub);

    const contactsUnsub = onSnapshot(query(collection(db, parentContactsPath(currentSchoolId)), orderBy('ts', 'desc'), limit(100)), (snap) => {
      setParentContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(contactsUnsub);

    const schoolUnsub = onSnapshot(doc(db, COLLECTIONS.SCHOOLS, currentSchoolId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSchoolData(data);
        setLockdown(data.lockdown || false);
        setLockdownMeta(data.lockdownMeta || null);
      }
    });
    unsubscribesRef.current.push(schoolUnsub);

    const configDocs = [
      { doc: CONFIG_DOCS.LABELS, setter: setLabelsConfig, default: labelsConfig },
      { doc: CONFIG_DOCS.BELL_SCHEDULE, setter: setBellSchedule, default: DEFAULT_BELL_SCHEDULE },
      { doc: CONFIG_DOCS.ECONOMY, setter: setEconomyConfig, default: DEFAULT_ECONOMY },
      { doc: CONFIG_DOCS.KIOSK, setter: setKioskConfig, default: DEFAULT_KIOSK },
      { doc: CONFIG_DOCS.SETTINGS, setter: setSettingsConfig, default: DEFAULT_SETTINGS },
      { doc: CONFIG_DOCS.HOUSES, setter: setHousesConfig, default: { houses: DEFAULT_HOUSES } },
    ];
    configDocs.forEach(({ doc: docName, setter, default: defaultVal }) => {
      const unsub = onSnapshot(doc(db, configPath(currentSchoolId, docName)), (snap) => {
        setter(snap.exists() ? snap.data() : defaultVal);
      });
      unsubscribesRef.current.push(unsub);
    });

    return () => cleanupSubscriptions();
  }, [currentSchoolId, cleanupSubscriptions]);

  const hasActivePass = useCallback((studentId) => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    return passes.some(p => p.studentId === studentId && p.status === 'ACTIVE');
  }, [sandboxMode, sandboxPasses, activePasses]);

  const isDestinationFull = useCallback((destination) => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    const maxCapacity = settingsConfig?.maxCapacityPerDestination || 5;
    if (['Clinic', 'Office', 'Main Office', 'Student Services'].includes(destination)) return false;
    return passes.filter(p => p.destination === destination && p.status === 'ACTIVE').length >= maxCapacity;
  }, [sandboxMode, sandboxPasses, activePasses, settingsConfig]);

  const destinationCounts = useCallback(() => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    const counts = {};
    passes.forEach(p => { if (p.status === 'ACTIVE') counts[p.destination] = (counts[p.destination] || 0) + 1; });
    return counts;
  }, [sandboxMode, sandboxPasses, activePasses]);

  const getWaitlistPosition = useCallback((studentId, destination) => {
    const filtered = waitlist.filter(w => w.destination === destination);
    const idx = filtered.findIndex(w => w.studentId === studentId);
    return idx >= 0 ? idx + 1 : 0;
  }, [waitlist]);

  const checkConflict = useCallback((studentId) => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    for (const group of conflictGroups) {
      if (group.members?.includes(studentId)) {
        const conflictingMember = group.members.find(m => m !== studentId && passes.some(p => p.studentId === m && p.status === 'ACTIVE'));
        if (conflictingMember) {
          const conflictStudent = allStudents.find(s => s.id === conflictingMember);
          return { hasConflict: true, groupName: group.name, conflictWith: conflictStudent?.full_name || 'Unknown' };
        }
      }
    }
    return { hasConflict: false };
  }, [sandboxMode, sandboxPasses, activePasses, conflictGroups, allStudents]);

  const getStudentInfractions = useCallback((studentId, limit = 10) => {
    const studentLogs = sandboxMode ? sandboxLogs : logs;
    return studentLogs.filter(l => l.studentId === studentId && l.type === 'INFRACTION').slice(0, limit);
  }, [sandboxMode, sandboxLogs, logs]);

  const housesSorted = [...houses].sort((a, b) => (b.score || 0) - (a.score || 0));
  const analyticsData = {
    totalPasses: logs.filter(l => l.type === 'PASS').length,
    totalInfractions: logs.filter(l => l.type === 'INFRACTION').length,
    totalIncentives: logs.filter(l => l.type === 'INCENTIVE').length,
    totalTardies: logs.filter(l => l.type === 'TARDY').length,
    activeNow: activePasses.length,
  };

  const signOutUser = async () => { try { await signOut(auth); router?.push('/'); } catch (err) { console.error('Sign out error:', err); } };

  const switchSchool = async (schoolId) => {
    if (schoolId === 'SANDBOX') { setCurrentSchoolId('SANDBOX'); setSandboxMode(true); return; }
    if (schoolId === 'COMMAND_CENTER') { setCurrentSchoolId('COMMAND_CENTER'); setSandboxMode(false); return; }
    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (!schoolSnap.exists()) { setToast?.({ message: 'School not found', type: 'error' }); return; }
      setCurrentSchoolId(schoolId);
      setSandboxMode(false);
      setShowSchoolPrompt(false);
      if (user?.uid) { await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { school_id: schoolId }); }
    } catch (err) { console.error('Switch school error:', err); setToast?.({ message: 'Failed to switch school', type: 'error' }); }
  };

  const createSchool = async (name) => {
    if (!isSuperAdmin) { setToast?.({ message: 'Only SuperAdmins can create schools', type: 'error' }); return null; }
    try {
      const schoolId = `${name.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      await setDoc(schoolRef, { name, code: schoolId, created_at: serverTimestamp(), created_by: user?.email, lockdown: false });
      const housesRef = collection(db, housesPath(schoolId));
      for (const house of DEFAULT_HOUSES) { await addDoc(housesRef, house); }
      const configsRef = collection(db, `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.SCHOOL_CONFIGS}`);
      await setDoc(doc(configsRef, CONFIG_DOCS.LABELS), { infractionButtons: DEFAULT_INFRACTION_LABELS, incentiveButtons: DEFAULT_INCENTIVE_LABELS, passDestinations: DEFAULT_PASS_DESTINATIONS, maxDisplayedDestinations: 8 });
      await setDoc(doc(configsRef, CONFIG_DOCS.ECONOMY), DEFAULT_ECONOMY);
      await setDoc(doc(configsRef, CONFIG_DOCS.BELL_SCHEDULE), DEFAULT_BELL_SCHEDULE);
      await setDoc(doc(configsRef, CONFIG_DOCS.KIOSK), DEFAULT_KIOSK);
      await setDoc(doc(configsRef, CONFIG_DOCS.SETTINGS), DEFAULT_SETTINGS);
      setToast?.({ message: `School "${name}" created! Code: ${schoolId}`, type: 'success' });
      return schoolId;
    } catch (err) { console.error('Create school error:', err); setToast?.({ message: 'Failed to create school', type: 'error' }); return null; }
  };

  // FIX J: Added teacherUid to pass data
  const issuePass = async (student, destination, originRoom = '') => {
    if (!rateLimiters.issuePass.canProceed()) { setToast?.({ message: 'Too many passes issued.', type: 'error' }); return false; }
    if (lockdown) { setToast?.({ message: 'Lockdown active - passes disabled', type: 'error' }); botRef?.current?.push('siren'); return false; }
    if (hasActivePass(student.id)) { setToast?.({ message: `${sanitizeText(student.full_name)} already has an active pass`, type: 'error' }); return false; }
    const conflict = checkConflict(student.id);
    if (conflict.hasConflict && settingsConfig?.conflictAlertsEnabled) { setToast?.({ message: `Conflict alert: ${sanitizeText(student.full_name)} conflicts with ${sanitizeText(conflict.conflictWith)}`, type: 'error' }); return false; }
    if (isDestinationFull(destination)) { setToast?.({ message: `${sanitizeText(destination)} is at capacity`, type: 'error' }); botRef?.current?.push('waitlist', { student: sanitizeText(student.full_name), destination: sanitizeText(destination) }); return false; }

    const passData = {
      studentId: student.id,
      studentName: sanitizeStudentName(student.full_name),
      studentGrade: student.grade_level,
      destination: sanitizeText(destination),
      originRoom: sanitizeText(originRoom),
      teacherEmail: user?.email,
      teacherName: sanitizeText(userGreeting.fullName),
      teacherUid: user?.uid,  // FIX J
      employeeId,
      startedAt: serverTimestamp(),
      expectedDurationSec: getEstimatedDuration(destination) * 60,
      status: 'ACTIVE',
    };

    const validation = validatePass(passData);
    if (!validation.valid) { setToast?.({ message: validation.errors[0] || 'Invalid pass data', type: 'error' }); return false; }

    if (sandboxMode) {
      const newPass = { id: `sandbox-pass-${Date.now()}`, ...validation.sanitized, startedAt: { seconds: Date.now() / 1000 } };
      setSandboxPasses(prev => [...prev, newPass]);
      setSandboxStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'OUT', current_destination: destination } : s));
      setAllStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'OUT', current_destination: destination } : s));
      setSandboxLogs(prev => [{ id: `log-${Date.now()}`, type: 'PASS', studentId: student.id, studentName: validation.sanitized.studentName, detail: destination, byEmail: user?.email, employeeId, ts: { seconds: Date.now() / 1000 } }, ...prev]);
      setActivePasses(prev => [...prev, newPass]);
      botRef?.current?.push('scan', { student: validation.sanitized.studentName, destination });
      setToast?.({ message: `Pass issued: ${validation.sanitized.studentName} → ${destination}`, type: 'success' });
      return true;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const passRef = doc(collection(db, activePassesPath(currentSchoolId)));
        transaction.set(passRef, validation.sanitized);
        const studentRef = doc(db, studentsPath(currentSchoolId), student.id);
        transaction.update(studentRef, { status: 'OUT', current_destination: destination, last_pass_start: serverTimestamp() });
        const logRef = doc(collection(db, logsPath(currentSchoolId)));
        transaction.set(logRef, { type: 'PASS', studentId: student.id, studentName: validation.sanitized.studentName, detail: destination, byEmail: user?.email, employeeId, ts: serverTimestamp() });
      });
      botRef?.current?.push('scan', { student: validation.sanitized.studentName, destination });
      setToast?.({ message: `Pass issued: ${validation.sanitized.studentName} → ${destination}`, type: 'success' });
      return true;
    } catch (err) { console.error('Issue pass error:', err); setToast?.({ message: 'Failed to issue pass', type: 'error' }); return false; }
  };

  const returnStudent = async (pass) => {
    if (sandboxMode) {
      setSandboxPasses(prev => prev.filter(p => p.id !== pass.id));
      setSandboxStudents(prev => prev.map(s => s.id === pass.studentId ? { ...s, status: 'IN', current_destination: null } : s));
      setAllStudents(prev => prev.map(s => s.id === pass.studentId ? { ...s, status: 'IN', current_destination: null } : s));
      setActivePasses(prev => prev.filter(p => p.id !== pass.id));
      setSandboxLogs(prev => [{ id: `log-${Date.now()}`, type: 'RETURN', studentId: pass.studentId, studentName: pass.studentName, detail: 'Returned', byEmail: user?.email, employeeId, ts: { seconds: Date.now() / 1000 } }, ...prev]);
      botRef?.current?.push('high5', { student: pass.studentName });
      setToast?.({ message: `${pass.studentName} returned`, type: 'success' });
      return true;
    }
    try {
      await updateDoc(doc(db, activePassesPath(currentSchoolId), pass.id), { status: 'ENDED', endedAt: serverTimestamp() });
      await updateDoc(doc(db, studentsPath(currentSchoolId), pass.studentId), { status: 'IN', current_destination: null });
      await addDoc(collection(db, logsPath(currentSchoolId)), { type: 'RETURN', studentId: pass.studentId, studentName: pass.studentName, detail: `Returned from ${pass.destination}`, byEmail: user?.email, employeeId, ts: serverTimestamp() });
      botRef?.current?.push('high5', { student: pass.studentName });
      setToast?.({ message: `${pass.studentName} returned`, type: 'success' });
      return true;
    } catch (err) { console.error('Return student error:', err); setToast?.({ message: 'Failed to return student', type: 'error' }); return false; }
  };

  const returnAllStudents = async () => { const passes = sandboxMode ? sandboxPasses : activePasses; for (const pass of passes) { await returnStudent(pass); } };

  const logInfraction = async (student, label) => {
    if (sandboxMode) {
      setSandboxStudents(prev => prev.map(s => s.id === student.id ? { ...s, mtss_score: (s.mtss_score || 0) + 1, infraction_count: (s.infraction_count || 0) + 1 } : s));
      setAllStudents(prev => prev.map(s => s.id === student.id ? { ...s, mtss_score: (s.mtss_score || 0) + 1, infraction_count: (s.infraction_count || 0) + 1 } : s));
      setSandboxLogs(prev => [{ id: `log-${Date.now()}`, type: 'INFRACTION', studentId: student.id, studentName: student.full_name, detail: label, byEmail: user?.email, employeeId, points: -1, ts: { seconds: Date.now() / 1000 } }, ...prev]);
      botRef?.current?.push('sad', { student: student.full_name });
      setToast?.({ message: `Infraction logged: ${student.full_name} - ${label}`, type: 'info' });
      return true;
    }
    try {
      await updateDoc(doc(db, studentsPath(currentSchoolId), student.id), { mtss_score: increment(1), infraction_count: increment(1), incentive_points_student: increment(-1) });
      await addDoc(collection(db, logsPath(currentSchoolId)), { type: 'INFRACTION', studentId: student.id, studentName: student.full_name, detail: label, byEmail: user?.email, employeeId, points: -1, ts: serverTimestamp() });
      botRef?.current?.push('sad', { student: student.full_name });
      setToast?.({ message: `Infraction logged: ${student.full_name} - ${label}`, type: 'info' });
      return true;
    } catch (err) { console.error('Log infraction error:', err); setToast?.({ message: 'Failed to log infraction', type: 'error' }); return false; }
  };

  const awardPoints = async (student, label, points = 1) => {
    const studentRatio = economyConfig?.studentPointRatio || 0.4;
    const teamRatio = economyConfig?.teamPointRatio || 0.6;
    const studentPoints = Math.round(points * studentRatio);
    const teamPoints = Math.round(points * teamRatio);

    if (sandboxMode) {
      setSandboxStudents(prev => prev.map(s => s.id === student.id ? { ...s, incentive_points_student: (s.incentive_points_student || 0) + studentPoints, incentive_points_team: (s.incentive_points_team || 0) + teamPoints } : s));
      setAllStudents(prev => prev.map(s => s.id === student.id ? { ...s, incentive_points_student: (s.incentive_points_student || 0) + studentPoints, incentive_points_team: (s.incentive_points_team || 0) + teamPoints } : s));
      if (student.houseId) {
        setSandboxHouses(prev => prev.map(h => h.id === student.houseId ? { ...h, score: (h.score || 0) + teamPoints } : h));
        setHouses(prev => prev.map(h => h.id === student.houseId ? { ...h, score: (h.score || 0) + teamPoints } : h));
      }
      setSandboxLogs(prev => [{ id: `log-${Date.now()}`, type: 'INCENTIVE', studentId: student.id, studentName: student.full_name, detail: label, byEmail: user?.email, employeeId, points: studentPoints, teamPoints, ts: { seconds: Date.now() / 1000 } }, ...prev]);
      botRef?.current?.push('party', { student: student.full_name });
      setToast?.({ message: `+${points} points to ${student.full_name}!`, type: 'success' });
      return true;
    }
    try {
      await updateDoc(doc(db, studentsPath(currentSchoolId), student.id), { incentive_points_student: increment(studentPoints), incentive_points_team: increment(teamPoints) });
      if (student.houseId) { await updateDoc(doc(db, housesPath(currentSchoolId), student.houseId), { score: increment(teamPoints) }); }
      await addDoc(collection(db, logsPath(currentSchoolId)), { type: 'INCENTIVE', studentId: student.id, studentName: student.full_name, detail: label, byEmail: user?.email, employeeId, points: studentPoints, teamPoints, ts: serverTimestamp() });
      botRef?.current?.push('party', { student: student.full_name });
      setToast?.({ message: `+${points} points to ${student.full_name}!`, type: 'success' });
      return true;
    } catch (err) { console.error('Award points error:', err); setToast?.({ message: 'Failed to award points', type: 'error' }); return false; }
  };

  const logTardy = async (student) => {
    if (sandboxMode) {
      setSandboxStudents(prev => prev.map(s => s.id === student.id ? { ...s, tardy_count: (s.tardy_count || 0) + 1, tardy_streak: (s.tardy_streak || 0) + 1 } : s));
      setAllStudents(prev => prev.map(s => s.id === student.id ? { ...s, tardy_count: (s.tardy_count || 0) + 1, tardy_streak: (s.tardy_streak || 0) + 1 } : s));
      setSandboxLogs(prev => [{ id: `log-${Date.now()}`, type: 'TARDY', studentId: student.id, studentName: student.full_name, detail: 'Late arrival', byEmail: user?.email, employeeId, ts: { seconds: Date.now() / 1000 } }, ...prev]);
      setToast?.({ message: `Tardy logged: ${student.full_name}`, type: 'info' });
      return true;
    }
    try {
      await updateDoc(doc(db, studentsPath(currentSchoolId), student.id), { tardy_count: increment(1), tardy_streak: increment(1) });
      await addDoc(collection(db, logsPath(currentSchoolId)), { type: 'TARDY', studentId: student.id, studentName: student.full_name, detail: 'Late arrival', byEmail: user?.email, employeeId, ts: serverTimestamp() });
      setToast?.({ message: `Tardy logged: ${student.full_name}`, type: 'info' });
      return true;
    } catch (err) { console.error('Log tardy error:', err); setToast?.({ message: 'Failed to log tardy', type: 'error' }); return false; }
  };

  const toggleLockdown = async () => {
    if (!isSchoolAdmin) { setToast?.({ message: 'Admin access required', type: 'error' }); return; }
    const newState = !lockdown;
    if (sandboxMode) { setLockdown(newState); botRef?.current?.push(newState ? 'siren' : 'happy'); setToast?.({ message: newState ? '🚨 LOCKDOWN ACTIVATED' : 'Lockdown lifted', type: newState ? 'error' : 'success' }); return; }
    try {
      await updateDoc(doc(db, COLLECTIONS.SCHOOLS, currentSchoolId), { lockdown: newState, lockdownMeta: newState ? { activatedBy: user?.email, activatedAt: serverTimestamp() } : null });
      botRef?.current?.push(newState ? 'siren' : 'happy');
      setToast?.({ message: newState ? '🚨 LOCKDOWN ACTIVATED' : 'Lockdown lifted', type: newState ? 'error' : 'success' });
    } catch (err) { console.error('Toggle lockdown error:', err); setToast?.({ message: 'Failed to toggle lockdown', type: 'error' }); }
  };

  const generateLockdownReport = () => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    return { timestamp: new Date().toISOString(), school: displaySchoolName, lockdownActive: lockdown, studentsOut: passes.length, students: passes.map(p => ({ name: p.studentName, destination: p.destination, startedAt: p.startedAt?.seconds ? new Date(p.startedAt.seconds * 1000).toLocaleTimeString() : 'Unknown' })) };
  };

  // FIX R: Global lockdown with sandbox + empty check
  const globalLockdown = async (activate) => {
    if (!isSuperAdmin) { setToast?.({ message: 'SuperAdmin access required', type: 'error' }); return; }
    if (sandboxMode) { setToast?.({ message: activate ? '🚨 SANDBOX: Global lockdown simulated' : '✅ SANDBOX: Lockdown lifted (simulated)', type: activate ? 'error' : 'success' }); return; }
    if (!allSchools || allSchools.length === 0) { setToast?.({ message: 'No schools found to lockdown', type: 'error' }); return; }
    try {
      const batch = writeBatch(db);
      for (const school of allSchools) { batch.update(doc(db, COLLECTIONS.SCHOOLS, school.id), { lockdown: activate, lockdownMeta: activate ? { activatedBy: user?.email, activatedAt: serverTimestamp(), global: true } : null }); }
      await batch.commit();
      await addDoc(collection(db, 'admin_logs'), { action: activate ? 'GLOBAL_LOCKDOWN_ACTIVATED' : 'GLOBAL_LOCKDOWN_LIFTED', performedBy: user?.email, affectedSchools: allSchools.map(s => s.id), timestamp: serverTimestamp() });
      setToast?.({ message: activate ? `🚨 GLOBAL LOCKDOWN: ${allSchools.length} schools locked` : `Lockdown lifted for ${allSchools.length} schools`, type: activate ? 'error' : 'success' });
    } catch (err) { console.error('Global lockdown error:', err); setToast?.({ message: 'Failed to execute global lockdown', type: 'error' }); }
  };

  const schoolLockdown = async (schoolId, activate) => {
    if (!isSuperAdmin) { setToast?.({ message: 'SuperAdmin access required', type: 'error' }); return; }
    try {
      await updateDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId), { lockdown: activate, lockdownMeta: activate ? { activatedBy: user?.email, activatedAt: serverTimestamp() } : null });
      const school = allSchools.find(s => s.id === schoolId);
      setToast?.({ message: activate ? `🚨 ${school?.name || schoolId} locked down` : `${school?.name || schoolId} lockdown lifted`, type: activate ? 'error' : 'success' });
    } catch (err) { console.error('School lockdown error:', err); setToast?.({ message: 'Failed to toggle school lockdown', type: 'error' }); }
  };

  // FIX F: Global broadcast with sandbox + empty check
  const globalBroadcast = async (message, priority = 'normal') => {
    if (!isSuperAdmin) { setToast?.({ message: 'SuperAdmin access required', type: 'error' }); return; }
    if (sandboxMode) { setToast?.({ message: '📢 SANDBOX: Broadcast simulated to all schools', type: 'success' }); return; }
    if (!allSchools || allSchools.length === 0) { setToast?.({ message: 'No schools found to broadcast to', type: 'error' }); return; }
    try {
      const batch = writeBatch(db);
      for (const school of allSchools) { batch.set(doc(collection(db, broadcastsPath(school.id))), { message: sanitizeText(message), priority, sender: user?.email, senderName: userGreeting.fullName, isGlobal: true, createdAt: serverTimestamp(), pinned: priority === 'urgent' }); }
      await batch.commit();
      setToast?.({ message: `Broadcast sent to ${allSchools.length} schools`, type: 'success' });
    } catch (err) { console.error('Global broadcast error:', err); setToast?.({ message: 'Failed to send global broadcast', type: 'error' }); }
  };

  const deleteSchool = async (schoolId) => {
    if (!isSuperAdmin) { setToast?.({ message: 'SuperAdmin access required', type: 'error' }); return false; }
    if (schoolId === currentSchoolId) { setToast?.({ message: 'Cannot delete currently active school', type: 'error' }); return false; }
    try { await deleteDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId)); setToast?.({ message: 'School deleted', type: 'success' }); return true; } catch (err) { console.error('Delete school error:', err); setToast?.({ message: 'Failed to delete school', type: 'error' }); return false; }
  };

  const addConflictGroup = async (name, members) => {
    if (sandboxMode) { setConflictGroups(prev => [...prev, { id: `conflict-${Date.now()}`, name, members, createdAt: { seconds: Date.now() / 1000 } }]); setToast?.({ message: `Conflict group "${name}" created`, type: 'success' }); return; }
    try { await addDoc(collection(db, conflictGroupsPath(currentSchoolId)), { name, members, createdAt: serverTimestamp() }); setToast?.({ message: `Conflict group "${name}" created`, type: 'success' }); } catch (err) { console.error('Add conflict group error:', err); setToast?.({ message: 'Failed to create conflict group', type: 'error' }); }
  };

  const removeConflictGroup = async (groupId) => {
    if (sandboxMode) { setConflictGroups(prev => prev.filter(g => g.id !== groupId)); setToast?.({ message: 'Conflict group removed', type: 'success' }); return; }
    try { await deleteDoc(doc(db, conflictGroupsPath(currentSchoolId), groupId)); setToast?.({ message: 'Conflict group removed', type: 'success' }); } catch (err) { console.error('Remove conflict group error:', err); setToast?.({ message: 'Failed to remove conflict group', type: 'error' }); }
  };

  const updateConfig = async (configType, data) => {
    if (sandboxMode) {
      switch (configType) { case 'labels': setLabelsConfig(data); break; case 'bell_schedule': setBellSchedule(data); break; case 'economy': setEconomyConfig(data); break; case 'kiosk': setKioskConfig(data); break; case 'settings': setSettingsConfig(data); break; }
      setToast?.({ message: 'Config updated (sandbox)', type: 'success' }); return;
    }
    try { await setDoc(doc(db, configPath(currentSchoolId, configType)), data, { merge: true }); setToast?.({ message: 'Configuration updated', type: 'success' }); } catch (err) { console.error('Update config error:', err); setToast?.({ message: 'Failed to update config', type: 'error' }); }
  };

  const updateHouses = async (housesData) => {
    if (sandboxMode) { setSandboxHouses(housesData); setHouses(housesData); setToast?.({ message: 'Houses updated (sandbox)', type: 'success' }); return; }
    try { const batch = writeBatch(db); for (const house of housesData) { batch.set(doc(db, housesPath(currentSchoolId), house.id), house, { merge: true }); } await batch.commit(); setToast?.({ message: 'Houses updated', type: 'success' }); } catch (err) { console.error('Update houses error:', err); setToast?.({ message: 'Failed to update houses', type: 'error' }); }
  };

  const handleFileUpload = async (studentsData) => {
    if (!Array.isArray(studentsData) || studentsData.length === 0) { setToast?.({ message: 'No valid student data', type: 'error' }); return; }
    if (sandboxMode) { const newStudents = studentsData.map((s, i) => ({ ...s, id: `imported-${Date.now()}-${i}` })); setSandboxStudents(prev => [...prev, ...newStudents]); setAllStudents(prev => [...prev, ...newStudents]); setToast?.({ message: `Imported ${newStudents.length} students (sandbox)`, type: 'success' }); return; }
    try {
      setToast?.({ message: 'Uploading students...', type: 'info' });
      const batchSize = 500; let imported = 0;
      for (let i = 0; i < studentsData.length; i += batchSize) {
        const batch = writeBatch(db); const chunk = studentsData.slice(i, i + batchSize);
        for (const student of chunk) {
          const existingSnap = await getDocs(query(collection(db, studentsPath(currentSchoolId)), where('student_id_number', '==', student.student_id_number), limit(1)));
          if (existingSnap.empty) { batch.set(doc(collection(db, studentsPath(currentSchoolId))), { ...student, created_at: serverTimestamp() }); imported++; }
          else { batch.update(existingSnap.docs[0].ref, { full_name: student.full_name, grade_level: student.grade_level, updated_at: serverTimestamp() }); }
        }
        await batch.commit();
      }
      setToast?.({ message: `Imported ${imported} new students, updated ${studentsData.length - imported} existing`, type: 'success' });
    } catch (err) { console.error('File upload error:', err); setToast?.({ message: 'Failed to upload students', type: 'error' }); }
  };

  const resolveBoxQueueItem = async (itemId, approved, itemData = null) => {
    if (sandboxMode) { setBoxQueue(prev => prev.filter(i => i.id !== itemId)); setToast?.({ message: approved ? 'Approved' : 'Rejected', type: 'success' }); return; }
    try {
      if (approved && itemData) {
        switch (itemData.type) {
          case 'ADD_DESTINATION': if (itemData.destination) { const currentLabels = labelsConfig?.passDestinations || []; if (!currentLabels.includes(itemData.destination)) { await updateConfig('labels', { ...labelsConfig, passDestinations: [...currentLabels, itemData.destination] }); } } break;
          case 'REMOVE_DESTINATION': if (itemData.destination) { const currentLabels = labelsConfig?.passDestinations || []; await updateConfig('labels', { ...labelsConfig, passDestinations: currentLabels.filter(d => d !== itemData.destination) }); } break;
          case 'PROMOTE_USER': if (itemData.userId && itemData.newRole) { await updateDoc(doc(db, COLLECTIONS.USERS, itemData.userId), { role: itemData.newRole }); } break;
        }
      }
      await deleteDoc(doc(db, boxQueuePath(currentSchoolId), itemId));
      setToast?.({ message: approved ? 'Approved and applied' : 'Rejected', type: 'success' });
    } catch (err) { console.error('Resolve queue item error:', err); setToast?.({ message: 'Failed to process request', type: 'error' }); }
  };

  const sendBroadcast = async (message, priority = 'normal', targetAudience = 'All Staff') => {
    if (sandboxMode) { const newBroadcast = { id: `broadcast-${Date.now()}`, message, priority, targetAudience, senderName: userGreeting.fullName, senderEmail: user?.email, ts: { seconds: Date.now() / 1000 }, pinned: false }; setBroadcasts(prev => [newBroadcast, ...prev]); botRef?.current?.showBroadcast(newBroadcast); setToast?.({ message: 'Broadcast sent', type: 'success' }); return; }
    try { await addDoc(collection(db, broadcastsPath(currentSchoolId)), { message, priority, targetAudience, senderName: userGreeting.fullName, senderEmail: user?.email, ts: serverTimestamp(), pinned: false }); setToast?.({ message: 'Broadcast sent', type: 'success' }); } catch (err) { console.error('Send broadcast error:', err); setToast?.({ message: 'Failed to send broadcast', type: 'error' }); }
  };

  const deleteBroadcast = async (broadcastId) => { if (sandboxMode) { setBroadcasts(prev => prev.filter(b => b.id !== broadcastId)); return; } try { await deleteDoc(doc(db, broadcastsPath(currentSchoolId), broadcastId)); } catch (err) { console.error('Delete broadcast error:', err); } };
  const pinBroadcast = async (broadcastId, pinned) => { if (sandboxMode) { setBroadcasts(prev => prev.map(b => b.id === broadcastId ? { ...b, pinned } : b).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))); return; } try { await updateDoc(doc(db, broadcastsPath(currentSchoolId), broadcastId), { pinned }); } catch (err) { console.error('Pin broadcast error:', err); } };
  const saveParentContact = async (contactData) => { if (sandboxMode) { setParentContacts(prev => [{ id: `contact-${Date.now()}`, ...contactData, ts: { seconds: Date.now() / 1000 } }, ...prev]); setToast?.({ message: 'Parent contact saved', type: 'success' }); return; } try { await addDoc(collection(db, parentContactsPath(currentSchoolId)), { ...contactData, ts: serverTimestamp() }); setToast?.({ message: 'Parent contact saved', type: 'success' }); } catch (err) { console.error('Save parent contact error:', err); setToast?.({ message: 'Failed to save contact', type: 'error' }); } };

  const assignStudentToHouse = async (studentId, houseId) => {
    if (sandboxMode) { setSandboxStudents(prev => prev.map(s => s.id === studentId ? { ...s, houseId } : s)); setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, houseId } : s)); setToast?.({ message: 'Student assigned to house', type: 'success' }); return true; }
    try { await updateDoc(doc(db, studentsPath(currentSchoolId), studentId), { houseId }); setToast?.({ message: 'Student assigned to house', type: 'success' }); return true; } catch (err) { console.error('Assign student to house error:', err); setToast?.({ message: 'Failed to assign student', type: 'error' }); return false; }
  };

  const bulkAssignStudents = async (assignments) => {
    if (!Array.isArray(assignments) || assignments.length === 0) { setToast?.({ message: 'No assignments provided', type: 'error' }); return false; }
    if (sandboxMode) { const assignmentMap = new Map(assignments.map(a => [a.studentId, a.houseId])); setSandboxStudents(prev => prev.map(s => assignmentMap.has(s.id) ? { ...s, houseId: assignmentMap.get(s.id) } : s)); setAllStudents(prev => prev.map(s => assignmentMap.has(s.id) ? { ...s, houseId: assignmentMap.get(s.id) } : s)); setToast?.({ message: `${assignments.length} students assigned`, type: 'success' }); return true; }
    try { const batch = writeBatch(db); for (const { studentId, houseId } of assignments) { batch.update(doc(db, studentsPath(currentSchoolId), studentId), { houseId }); } await batch.commit(); setToast?.({ message: `${assignments.length} students assigned`, type: 'success' }); return true; } catch (err) { console.error('Bulk assign students error:', err); setToast?.({ message: 'Failed to bulk assign students', type: 'error' }); return false; }
  };

  const updateHouseName = async (houseId, newName) => {
    if (!newName?.trim()) { setToast?.({ message: 'House name cannot be empty', type: 'error' }); return false; }
    const sanitizedName = newName.trim().slice(0, 50);
    if (sandboxMode) { setSandboxHouses(prev => prev.map(h => h.id === houseId ? { ...h, name: sanitizedName } : h)); setHouses(prev => prev.map(h => h.id === houseId ? { ...h, name: sanitizedName } : h)); setToast?.({ message: 'House renamed', type: 'success' }); return true; }
    try { await updateDoc(doc(db, housesPath(currentSchoolId), houseId), { name: sanitizedName }); setToast?.({ message: 'House renamed', type: 'success' }); return true; } catch (err) { console.error('Update house name error:', err); setToast?.({ message: 'Failed to rename house', type: 'error' }); return false; }
  };

  const setAlertLevelAction = async (level) => {
    const validLevels = ['normal', 'hold', 'lockdown'];
    if (!validLevels.includes(level)) { setToast?.({ message: 'Invalid alert level', type: 'error' }); return; }
    if (sandboxMode) { setAlertLevel(level); setLockdown(level === 'lockdown'); botRef?.current?.push(level === 'lockdown' ? 'siren' : level === 'hold' ? 'warning' : 'happy'); setToast?.({ message: `Alert level set to ${level.toUpperCase()}`, type: level === 'normal' ? 'success' : 'warning' }); return; }
    try { await updateDoc(doc(db, COLLECTIONS.SCHOOLS, currentSchoolId), { alertLevel: level, lockdown: level === 'lockdown', lockdownMeta: level === 'lockdown' ? { activatedBy: user?.email, activatedAt: serverTimestamp(), level } : null }); setToast?.({ message: `Alert level set to ${level.toUpperCase()}`, type: level === 'normal' ? 'success' : 'warning' }); } catch (err) { console.error('Set alert level error:', err); setToast?.({ message: 'Failed to set alert level', type: 'error' }); }
  };

  const toggleZoneLock = async (zone) => {
    const isCurrentlyLocked = lockedZones.includes(zone);
    if (sandboxMode) { setLockedZones(prev => isCurrentlyLocked ? prev.filter(z => z !== zone) : [...prev, zone]); setToast?.({ message: `${zone} ${isCurrentlyLocked ? 'unlocked' : 'locked'}`, type: 'info' }); return; }
    try { const newLockedZones = isCurrentlyLocked ? lockedZones.filter(z => z !== zone) : [...lockedZones, zone]; await updateDoc(doc(db, COLLECTIONS.SCHOOLS, currentSchoolId), { lockedZones: newLockedZones }); setToast?.({ message: `${zone} ${isCurrentlyLocked ? 'unlocked' : 'locked'}`, type: 'info' }); } catch (err) { console.error('Toggle zone lock error:', err); setToast?.({ message: 'Failed to toggle zone lock', type: 'error' }); }
  };

  return {
    user, userData, isSchoolAdmin, isSuperAdmin, userGreeting, employeeId, signOutUser,
    showConsentFlow, setShowConsentFlow, handleConsentComplete, handleEnterSandbox, needsConsent, needsSchoolSelection,
    currentSchoolId, displaySchoolName, schoolData, sandboxMode, toggleSandbox, switchSchool, createSchool, allSchools,
    isLoading, showSchoolPrompt, setShowSchoolPrompt, activeTab, setActiveTab, selectedStudent, setSelectedStudent, theme, setTheme,
    allStudents, activePasses, logs, houses, housesSorted, conflictGroups, boxQueue, waitlist, broadcasts, parentContacts,
    labelsConfig, bellSchedule, economyConfig, kioskConfig, settingsConfig, housesConfig,
    lockdown, lockdownMeta, toggleLockdown, generateLockdownReport, alertLevel, setAlertLevel: setAlertLevelAction, lockedZones, toggleZoneLock,
    globalLockdown, schoolLockdown, globalBroadcast, deleteSchool,
    issuePass, returnStudent, returnAllStudents, logInfraction, awardPoints, logTardy,
    assignStudentToHouse, bulkAssignStudents, updateHouseName,
    hasActivePass, isDestinationFull, getWaitlistPosition, destinationCounts, checkConflict, getStudentInfractions, analyticsData,
    updateConfig, updateHouses, handleFileUpload, resolveBoxQueueItem, addConflictGroup, removeConflictGroup,
    sendBroadcast, deleteBroadcast, pinBroadcast, saveParentContact,
  };
}
