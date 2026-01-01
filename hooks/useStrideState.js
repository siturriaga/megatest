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

/** @constant {string} Allowed email domain for authentication */
const ALLOWED_DOMAIN = 'dadeschools.net';

/** @constant {string} Current consent flow version for tracking */
const CONSENT_VERSION = '1.0.0';

/**
 * Main STRIDE application state hook.
 */
export function useStrideState(router, botRef, setToast, user, setUser) {
  // Auth & User State
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSchoolPrompt, setShowSchoolPrompt] = useState(false);
  const [showConsentFlow, setShowConsentFlow] = useState(false);

  // School State
  const [currentSchoolId, setCurrentSchoolId] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [allSchools, setAllSchools] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('hallpass');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [theme, setTheme] = useState('obsidian');

  // Data State
  const [allStudents, setAllStudents] = useState([]);
  const [activePasses, setActivePasses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [houses, setHouses] = useState([]);
  const [conflictGroups, setConflictGroups] = useState([]);
  const [boxQueue, setBoxQueue] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [parentContacts, setParentContacts] = useState([]);

  // Config State
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

  // Safety State
  const [lockdown, setLockdown] = useState(false);
  const [lockdownMeta, setLockdownMeta] = useState(null);
  const [alertLevel, setAlertLevel] = useState('normal');
  const [lockedZones, setLockedZones] = useState([]);
  
  // Sandbox State
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxStudents, setSandboxStudents] = useState([...SANDBOX_STUDENTS]);
  const [sandboxPasses, setSandboxPasses] = useState([]);
  const [sandboxLogs, setSandboxLogs] = useState([...SANDBOX_LOGS]);
  const [sandboxHouses, setSandboxHouses] = useState([...SANDBOX_HOUSES]);

  // Unsubscribe refs
  const unsubscribesRef = useRef([]);

  // =====================
  // DERIVED STATE - FIXED FOR SUPERADMIN
  // =====================
  // FIX APPLIED HERE: Checks for 'super_admin' string
  const isSuperAdmin = userData?.role === ROLES.SUPER_ADMIN || userData?.role === 'super_admin';
  const isSchoolAdmin = userData?.role === ROLES.SCHOOL_ADMIN || isSuperAdmin;
  const employeeId = userData?.employee_id || user?.email?.split('@')[0]?.toUpperCase() || 'UNKNOWN';
  
  // Check if user needs consent flow (not SuperAdmin, hasn't consented yet)
  const needsConsent = userData && 
                       !isSuperAdmin && 
                       (!userData.aup_accepted || userData.aup_version !== CONSENT_VERSION);
  
  // Check if user needs school selection (not SuperAdmin, no school assigned)
  const needsSchoolSelection = userData && 
                               !isSuperAdmin && 
                               !userData.school_id && 
                               userData.aup_accepted;

  const userGreeting = {
    firstName: user?.displayName?.split(' ')[0] || 'Teacher',
    fullName: user?.displayName || 'Teacher',
    email: user?.email || '',
  };

  const displaySchoolName = sandboxMode ? 'Sandbox Training' : (schoolData?.name || currentSchoolId || 'No School');

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stride-theme', theme);
  }, [theme]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('stride-theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // =====================
  // UI AUTO-SWITCHER (THE FIX)
  // =====================
  // This forces the dashboard to switch from 'hallpass' to 'command' 
  // when you log in as Super Admin.
  useEffect(() => {
    if (isSuperAdmin && currentSchoolId === 'COMMAND_CENTER') {
      setActiveTab('command');
    }
  }, [isSuperAdmin, currentSchoolId]);

  /* OPTIONAL: Uncomment to force School Admins to Admin Panel on load
  useEffect(() => {
    if (isSchoolAdmin && !isSuperAdmin && activeTab === 'hallpass') {
       setActiveTab('admin'); 
    }
  }, [isSchoolAdmin, isSuperAdmin]);
  */

  // =====================
  // AUTH LISTENER
  // =====================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const domain = email.split('@')[1];
        
        setUser(firebaseUser);
        
        // Fetch existing user document
        const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // =====================
          // EXISTING USER
          // =====================
          const data = userSnap.data();
          setUserData(data);
          
          // SuperAdmin: Skip everything, go to command center
          // FIX APPLIED HERE: Checks for 'super_admin' string
          if (data.role === ROLES.SUPER_ADMIN || data.role === 'super_admin') {
            if (data.school_id && data.school_id !== 'COMMAND_CENTER') {
              setCurrentSchoolId(data.school_id);
            } else {
              setCurrentSchoolId('COMMAND_CENTER');
            }
            setIsLoading(false);
            return;
          }
          
          // Regular user: Check consent
          if (!data.aup_accepted || data.aup_version !== CONSENT_VERSION) {
            setShowConsentFlow(true);
            setIsLoading(false);
            return;
          }
          
          // Regular user: Check school
          if (data.school_id) {
            if (data.school_id === 'SANDBOX') {
              setSandboxMode(true);
            }
            setCurrentSchoolId(data.school_id);
          } else {
            setShowSchoolPrompt(true);
          }
          
        } else {
          // =====================
          // NEW USER - First login
          // =====================
          
          // Domain check for new users (SuperAdmins are already in DB)
          if (domain !== ALLOWED_DOMAIN) {
            await signOut(auth);
            setToast?.({ message: 'Access restricted to @dadeschools.net accounts. Contact your administrator.', type: 'error' });
            setIsLoading(false);
            return;
          }
          
          // Create new user document with teacher role
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
          
          // New users always need consent flow
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
  }, [router, setUser, setToast]);

  // =====================
  // CONSENT COMPLETION HANDLER
  // =====================
  const handleConsentComplete = async (consentData) => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      
      // Validate school code
      if (consentData.schoolCode && consentData.schoolCode !== 'SANDBOX') {
        const schoolRef = doc(db, COLLECTIONS.SCHOOLS, consentData.schoolCode);
        const schoolSnap = await getDoc(schoolRef);
        
        if (!schoolSnap.exists()) {
          setToast?.({ message: 'Invalid school code. Please check with your administrator.', type: 'error' });
          return;
        }
      }
      
      // Update user document with detailed consent records
      await updateDoc(userRef, {
        // Basic consent flags
        aup_accepted: true,
        aup_version: CONSENT_VERSION,
        aup_accepted_at: serverTimestamp(),
        camera_consent: true,
        school_id: consentData.schoolCode,
        
        // Detailed consent record for audit
        consent_details: consentData.consentDetails || {
          aup: { accepted: true, timestamp: consentData.consentedAt },
          camera: { accepted: true, timestamp: consentData.consentedAt },
          ferpa: { accepted: true, timestamp: consentData.consentedAt },
          liability: { accepted: true, timestamp: consentData.consentedAt },
          data: { accepted: true, timestamp: consentData.consentedAt },
        },
        consent_user_agent: consentData.userAgent || 'unknown',
      });
      
      // Create immutable audit log entry in consent_logs collection
      try {
        await addDoc(collection(db, 'consent_logs'), {
          uid: user.uid,
          email: user.email,
          action: 'CONSENT_ACCEPTED',
          version: CONSENT_VERSION,
          consents: consentData.consentDetails || consentData.consents,
          school_code: consentData.schoolCode,
          user_agent: consentData.userAgent || 'unknown',
          ip_hint: 'client', // Actual IP would need server-side
          ts: serverTimestamp(),
        });
      } catch (auditErr) {
        // Don't block user if audit log fails, just log it
        console.warn('Failed to create consent audit log:', auditErr);
      }
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        aup_accepted: true,
        aup_version: CONSENT_VERSION,
        camera_consent: true,
        school_id: consentData.schoolCode,
        consent_details: consentData.consentDetails,
      }));
      
      // Set school
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
      setToast?.({ message: 'Failed to save consent. Please try again.', type: 'error' });
    }
  };

  // =====================
  // SANDBOX MODE HANDLER
  // =====================
  const handleEnterSandbox = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const timestamp = new Date().toISOString();
      
      // Update consent and set school_id to SANDBOX
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
      
      // Create audit log for sandbox entry
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
      
      setUserData(prev => ({
        ...prev,
        aup_accepted: true,
        aup_version: CONSENT_VERSION,
        camera_consent: true,
      }));
      
      setCurrentSchoolId('SANDBOX');
      setSandboxMode(true);
      setShowConsentFlow(false);
      setShowSchoolPrompt(false);
      setToast?.({ message: 'Welcome to Sandbox mode! Practice freely.', type: 'success' });
      
    } catch (err) {
      console.error('Enter sandbox error:', err);
      setToast?.({ message: 'Failed to enter sandbox. Please try again.', type: 'error' });
    }
  };

  // Toggle sandbox mode on/off - for SuperAdmin control panel
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

  // Cleanup subscriptions on unmount or school change
  const cleanupSubscriptions = useCallback(() => {
    unsubscribesRef.current.forEach(unsub => unsub?.());
    unsubscribesRef.current = [];
  }, []);

  // Load all schools for SuperAdmin
  useEffect(() => {
    if (!isSuperAdmin) return;
    
    const schoolsRef = collection(db, COLLECTIONS.SCHOOLS);
    const unsub = onSnapshot(schoolsRef, (snap) => {
      const schools = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSchools(schools);
    });
    
    return () => unsub();
  }, [isSuperAdmin]);

  // Main data subscription effect
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

    // Students listener
    const studentsRef = collection(db, studentsPath(currentSchoolId));
    const studentsUnsub = onSnapshot(studentsRef, (snap) => {
      setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(studentsUnsub);

    // Active passes listener
    const passesRef = collection(db, activePassesPath(currentSchoolId));
    const passesQuery = query(passesRef, where('status', '==', 'ACTIVE'));
    const passesUnsub = onSnapshot(passesQuery, (snap) => {
      setActivePasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(passesUnsub);

    // Logs listener (last 200)
    const logsRef = collection(db, logsPath(currentSchoolId));
    const logsQuery = query(logsRef, orderBy('ts', 'desc'), limit(200));
    const logsUnsub = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(logsUnsub);

    // Houses listener
    const housesRef = collection(db, housesPath(currentSchoolId));
    const housesUnsub = onSnapshot(housesRef, (snap) => {
      const h = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHouses(h.length > 0 ? h : DEFAULT_HOUSES);
    });
    unsubscribesRef.current.push(housesUnsub);

    // Conflict groups listener
    const conflictsRef = collection(db, conflictGroupsPath(currentSchoolId));
    const conflictsUnsub = onSnapshot(conflictsRef, (snap) => {
      setConflictGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(conflictsUnsub);

    // Box queue listener
    const queueRef = collection(db, boxQueuePath(currentSchoolId));
    const queueUnsub = onSnapshot(queueRef, (snap) => {
      setBoxQueue(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(queueUnsub);

    // Waitlist listener
    const waitlistRef = collection(db, waitlistPath(currentSchoolId));
    const waitlistUnsub = onSnapshot(waitlistRef, (snap) => {
      setWaitlist(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(waitlistUnsub);

    // Broadcasts listener
    const broadcastsRef = collection(db, broadcastsPath(currentSchoolId));
    const broadcastsQuery = query(broadcastsRef, orderBy('ts', 'desc'), limit(50));
    const broadcastsUnsub = onSnapshot(broadcastsQuery, (snap) => {
      const b = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBroadcasts(b.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    });
    unsubscribesRef.current.push(broadcastsUnsub);

    // Parent contacts listener
    const contactsRef = collection(db, parentContactsPath(currentSchoolId));
    const contactsQuery = query(contactsRef, orderBy('ts', 'desc'), limit(100));
    const contactsUnsub = onSnapshot(contactsQuery, (snap) => {
      setParentContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    unsubscribesRef.current.push(contactsUnsub);

    // School document listener
    const schoolRef = doc(db, COLLECTIONS.SCHOOLS, currentSchoolId);
    const schoolUnsub = onSnapshot(schoolRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSchoolData(data);
        setLockdown(data.lockdown || false);
        setLockdownMeta(data.lockdownMeta || null);
      }
    });
    unsubscribesRef.current.push(schoolUnsub);

    // Config listeners
    const configDocs = [
      { doc: CONFIG_DOCS.LABELS, setter: setLabelsConfig, default: labelsConfig },
      { doc: CONFIG_DOCS.BELL_SCHEDULE, setter: setBellSchedule, default: DEFAULT_BELL_SCHEDULE },
      { doc: CONFIG_DOCS.ECONOMY, setter: setEconomyConfig, default: DEFAULT_ECONOMY },
      { doc: CONFIG_DOCS.KIOSK, setter: setKioskConfig, default: DEFAULT_KIOSK },
      { doc: CONFIG_DOCS.SETTINGS, setter: setSettingsConfig, default: DEFAULT_SETTINGS },
      { doc: CONFIG_DOCS.HOUSES, setter: setHousesConfig, default: { houses: DEFAULT_HOUSES } },
    ];

    configDocs.forEach(({ doc: docName, setter, default: defaultVal }) => {
      const configRef = doc(db, configPath(currentSchoolId, docName));
      const unsub = onSnapshot(configRef, (snap) => {
        setter(snap.exists() ? snap.data() : defaultVal);
      });
      unsubscribesRef.current.push(unsub);
    });

    return () => cleanupSubscriptions();
  }, [currentSchoolId, cleanupSubscriptions]);

  // =====================
  // HELPER FUNCTIONS
  // =====================

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
    passes.forEach(p => {
      if (p.status === 'ACTIVE') {
        counts[p.destination] = (counts[p.destination] || 0) + 1;
      }
    });
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
        const conflictingMember = group.members.find(
          m => m !== studentId && passes.some(p => p.studentId === m && p.status === 'ACTIVE')
        );
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
    return studentLogs
      .filter(l => l.studentId === studentId && l.type === 'INFRACTION')
      .slice(0, limit);
  }, [sandboxMode, sandboxLogs, logs]);

  const housesSorted = [...houses].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Analytics data
  const analyticsData = {
    totalPasses: logs.filter(l => l.type === 'PASS').length,
    totalInfractions: logs.filter(l => l.type === 'INFRACTION').length,
    totalIncentives: logs.filter(l => l.type === 'INCENTIVE').length,
    totalTardies: logs.filter(l => l.type === 'TARDY').length,
    activeNow: activePasses.length,
  };

  // =====================
  // ACTION FUNCTIONS
  // =====================

  const signOutUser = async () => {
    try {
      await signOut(auth);
      router?.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const switchSchool = async (schoolId) => {
    if (schoolId === 'SANDBOX') {
      setCurrentSchoolId('SANDBOX');
      setSandboxMode(true);
      return;
    }
    
    if (schoolId === 'COMMAND_CENTER') {
      setCurrentSchoolId('COMMAND_CENTER');
      setSandboxMode(false);
      return;
    }

    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      const schoolSnap = await getDoc(schoolRef);
      
      if (!schoolSnap.exists()) {
        setToast?.({ message: 'School not found', type: 'error' });
        return;
      }

      setCurrentSchoolId(schoolId);
      setSandboxMode(false);
      setShowSchoolPrompt(false);

      // Update user's school_id
      if (user?.uid) {
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        await updateDoc(userRef, { school_id: schoolId });
      }
    } catch (err) {
      console.error('Switch school error:', err);
      setToast?.({ message: 'Failed to switch school', type: 'error' });
    }
  };

  const createSchool = async (name) => {
    if (!isSuperAdmin) {
      setToast?.({ message: 'Only SuperAdmins can create schools', type: 'error' });
      return null;
    }

    try {
      const schoolId = `${name.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      
      await setDoc(schoolRef, {
        name,
        code: schoolId,
        created_at: serverTimestamp(),
        created_by: user?.email,
        lockdown: false,
      });

      // Initialize default houses
      const housesRef = collection(db, housesPath(schoolId));
      for (const house of DEFAULT_HOUSES) {
        await addDoc(housesRef, house);
      }

      // Initialize default configs
      const configsRef = collection(db, `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.SCHOOL_CONFIGS}`);
      await setDoc(doc(configsRef, CONFIG_DOCS.LABELS), {
        infractionButtons: DEFAULT_INFRACTION_LABELS,
        incentiveButtons: DEFAULT_INCENTIVE_LABELS,
        passDestinations: DEFAULT_PASS_DESTINATIONS,
        maxDisplayedDestinations: 8,
      });
      await setDoc(doc(configsRef, CONFIG_DOCS.ECONOMY), DEFAULT_ECONOMY);
      await setDoc(doc(configsRef, CONFIG_DOCS.BELL_SCHEDULE), DEFAULT_BELL_SCHEDULE);
      await setDoc(doc(configsRef, CONFIG_DOCS.KIOSK), DEFAULT_KIOSK);
      await setDoc(doc(configsRef, CONFIG_DOCS.SETTINGS), DEFAULT_SETTINGS);

      setToast?.({ message: `School "${name}" created! Code: ${schoolId}`, type: 'success' });
      return schoolId;
    } catch (err) {
      console.error('Create school error:', err);
      setToast?.({ message: 'Failed to create school', type: 'error' });
      return null;
    }
  };

  const issuePass = async (student, destination, originRoom = '') => {
    // Rate limiting check
    if (!rateLimiters.issuePass.canProceed()) {
      setToast?.({ message: 'Too many passes issued. Please wait a moment.', type: 'error' });
      return false;
    }

    if (lockdown) {
      setToast?.({ message: 'Lockdown active - passes disabled', type: 'error' });
      botRef?.current?.push('siren');
      return false;
    }

    if (hasActivePass(student.id)) {
      setToast?.({ message: `${sanitizeText(student.full_name)} already has an active pass`, type: 'error' });
      return false;
    }

    const conflict = checkConflict(student.id);
    if (conflict.hasConflict && settingsConfig?.conflictAlertsEnabled) {
      setToast?.({ message: `Conflict alert: ${sanitizeText(student.full_name)} conflicts with ${sanitizeText(conflict.conflictWith)}`, type: 'error' });
      return false;
    }

    if (isDestinationFull(destination)) {
      setToast?.({ message: `${sanitizeText(destination)} is at capacity`, type: 'error' });
      botRef?.current?.push('waitlist', { student: sanitizeText(student.full_name), destination: sanitizeText(destination) });
      return false;
    }

    // Validate and sanitize pass data
    const passData = {
      studentId: student.id,
      studentName: sanitizeStudentName(student.full_name),
      studentGrade: student.grade_level,
      destination: sanitizeText(destination),
      originRoom: sanitizeText(originRoom),
      teacherEmail: user?.email,
      teacherName: sanitizeText(userGreeting.fullName),
      employeeId,
      startedAt: serverTimestamp(),
      expectedDurationSec: getEstimatedDuration(destination) * 60,
      status: 'ACTIVE',
    };

    const validation = validatePass(passData);
    if (!validation.valid) {
      setToast?.({ message: validation.errors[0] || 'Invalid pass data', type: 'error' });
      return false;
    }

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
      // Use transaction for atomic updates
      await runTransaction(db, async (transaction) => {
        // Create pass document
        const passRef = doc(collection(db, activePassesPath(currentSchoolId)));
        transaction.set(passRef, validation.sanitized);

        // Update student status
        const studentRef = doc(db, studentsPath(currentSchoolId), student.id);
        transaction.update(studentRef, {
          status: 'OUT',
          current_destination: destination,
          last_pass_start: serverTimestamp(),
        });

        // Create log entry
        const logRef = doc(collection(db, logsPath(currentSchoolId)));
        transaction.set(logRef, {
          type: 'PASS',
          studentId: student.id,
          studentName: validation.sanitized.studentName,
          detail: destination,
          byEmail: user?.email,
          employeeId,
          ts: serverTimestamp(),
        });
      });

      botRef?.current?.push('scan', { student: validation.sanitized.studentName, destination });
      setToast?.({ message: `Pass issued: ${validation.sanitized.studentName} → ${destination}`, type: 'success' });
      return true;
    } catch (err) {
      console.error('Issue pass error:', err);
      setToast?.({ message: 'Failed to issue pass', type: 'error' });
      return false;
    }
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
      // Update pass status
      const passRef = doc(db, activePassesPath(currentSchoolId), pass.id);
      await updateDoc(passRef, {
        status: 'ENDED',
        endedAt: serverTimestamp(),
      });

      // Update student status
      const studentRef = doc(db, studentsPath(currentSchoolId), pass.studentId);
      await updateDoc(studentRef, {
        status: 'IN',
        current_destination: null,
      });

      // Create log entry
      await addDoc(collection(db, logsPath(currentSchoolId)), {
        type: 'RETURN',
        studentId: pass.studentId,
        studentName: pass.studentName,
        detail: `Returned from ${pass.destination}`,
        byEmail: user?.email,
        employeeId,
        ts: serverTimestamp(),
      });

      botRef?.current?.push('high5', { student: pass.studentName });
      setToast?.({ message: `${pass.studentName} returned`, type: 'success' });
      return true;
    } catch (err) {
      console.error('Return student error:', err);
      setToast?.({ message: 'Failed to return student', type: 'error' });
      return false;
    }
  };

  const returnAllStudents = async () => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    for (const pass of passes) {
      await returnStudent(pass);
    }
  };

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
      // Update student
      const studentRef = doc(db, studentsPath(currentSchoolId), student.id);
      await updateDoc(studentRef, {
        mtss_score: increment(1),
        infraction_count: increment(1),
        incentive_points_student: increment(-1),
      });

      // Create log
      await addDoc(collection(db, logsPath(currentSchoolId)), {
        type: 'INFRACTION',
        studentId: student.id,
        studentName: student.full_name,
        detail: label,
        byEmail: user?.email,
        employeeId,
        points: -1,
        ts: serverTimestamp(),
      });

      botRef?.current?.push('sad', { student: student.full_name });
      setToast?.({ message: `Infraction logged: ${student.full_name} - ${label}`, type: 'info' });
      return true;
    } catch (err) {
      console.error('Log infraction error:', err);
      setToast?.({ message: 'Failed to log infraction', type: 'error' });
      return false;
    }
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
      // Update student
      const studentRef = doc(db, studentsPath(currentSchoolId), student.id);
      await updateDoc(studentRef, {
        incentive_points_student: increment(studentPoints),
        incentive_points_team: increment(teamPoints),
      });

      // Update house
      if (student.houseId) {
        const houseRef = doc(db, housesPath(currentSchoolId), student.houseId);
        await updateDoc(houseRef, { score: increment(teamPoints) });
      }

      // Create log
      await addDoc(collection(db, logsPath(currentSchoolId)), {
        type: 'INCENTIVE',
        studentId: student.id,
        studentName: student.full_name,
        detail: label,
        byEmail: user?.email,
        employeeId,
        points: studentPoints,
        teamPoints,
        ts: serverTimestamp(),
      });

      botRef?.current?.push('party', { student: student.full_name });
      setToast?.({ message: `+${points} points to ${student.full_name}!`, type: 'success' });
      return true;
    } catch (err) {
      console.error('Award points error:', err);
      setToast?.({ message: 'Failed to award points', type: 'error' });
      return false;
    }
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
      const studentRef = doc(db, studentsPath(currentSchoolId), student.id);
      await updateDoc(studentRef, {
        tardy_count: increment(1),
        tardy_streak: increment(1),
      });

      await addDoc(collection(db, logsPath(currentSchoolId)), {
        type: 'TARDY',
        studentId: student.id,
        studentName: student.full_name,
        detail: 'Late arrival',
        byEmail: user?.email,
        employeeId,
        ts: serverTimestamp(),
      });

      setToast?.({ message: `Tardy logged: ${student.full_name}`, type: 'info' });
      return true;
    } catch (err) {
      console.error('Log tardy error:', err);
      setToast?.({ message: 'Failed to log tardy', type: 'error' });
      return false;
    }
  };

  const toggleLockdown = async () => {
    if (!isSchoolAdmin) {
      setToast?.({ message: 'Admin access required', type: 'error' });
      return;
    }

    const newState = !lockdown;

    if (sandboxMode) {
      setLockdown(newState);
      botRef?.current?.push(newState ? 'siren' : 'happy');
      setToast?.({ message: newState ? '🚨 LOCKDOWN ACTIVATED' : 'Lockdown lifted', type: newState ? 'error' : 'success' });
      return;
    }

    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, currentSchoolId);
      await updateDoc(schoolRef, {
        lockdown: newState,
        lockdownMeta: newState ? { activatedBy: user?.email, activatedAt: serverTimestamp() } : null,
      });

      botRef?.current?.push(newState ? 'siren' : 'happy');
      setToast?.({ message: newState ? '🚨 LOCKDOWN ACTIVATED' : 'Lockdown lifted', type: newState ? 'error' : 'success' });
    } catch (err) {
      console.error('Toggle lockdown error:', err);
      setToast?.({ message: 'Failed to toggle lockdown', type: 'error' });
    }
  };

  const generateLockdownReport = () => {
    const passes = sandboxMode ? sandboxPasses : activePasses;
    const report = {
      timestamp: new Date().toISOString(),
      school: displaySchoolName,
      lockdownActive: lockdown,
      studentsOut: passes.length,
      students: passes.map(p => ({
        name: p.studentName,
        destination: p.destination,
        startedAt: p.startedAt?.seconds ? new Date(p.startedAt.seconds * 1000).toLocaleTimeString() : 'Unknown',
      })),
    };
    return report;
  };

  // =====================
  // SUPERADMIN FUNCTIONS
  // =====================

  // Global lockdown - affects ALL schools
  const globalLockdown = async (activate) => {
    if (!isSuperAdmin) {
      setToast?.({ message: 'SuperAdmin access required', type: 'error' });
      return;
    }

    try {
      const batch = writeBatch(db);
      
      for (const school of allSchools) {
        const schoolRef = doc(db, COLLECTIONS.SCHOOLS, school.id);
        batch.update(schoolRef, {
          lockdown: activate,
          lockdownMeta: activate 
            ? { activatedBy: user?.email, activatedAt: serverTimestamp(), global: true }
            : null,
        });
      }
      
      await batch.commit();
      
      // Log the global lockdown action
      await addDoc(collection(db, 'admin_logs'), {
        action: activate ? 'GLOBAL_LOCKDOWN_ACTIVATED' : 'GLOBAL_LOCKDOWN_LIFTED',
        performedBy: user?.email,
        affectedSchools: allSchools.map(s => s.id),
        timestamp: serverTimestamp(),
      });

      setToast?.({ 
        message: activate 
          ? `🚨 GLOBAL LOCKDOWN: ${allSchools.length} schools locked` 
          : `Lockdown lifted for ${allSchools.length} schools`, 
        type: activate ? 'error' : 'success' 
      });
    } catch (err) {
      console.error('Global lockdown error:', err);
      setToast?.({ message: 'Failed to execute global lockdown', type: 'error' });
    }
  };

  // School-specific lockdown (from Command Center)
  const schoolLockdown = async (schoolId, activate) => {
    if (!isSuperAdmin) {
      setToast?.({ message: 'SuperAdmin access required', type: 'error' });
      return;
    }

    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      await updateDoc(schoolRef, {
        lockdown: activate,
        lockdownMeta: activate 
          ? { activatedBy: user?.email, activatedAt: serverTimestamp() }
          : null,
      });

      const school = allSchools.find(s => s.id === schoolId);
      setToast?.({ 
        message: activate 
          ? `🚨 ${school?.name || schoolId} locked down` 
          : `${school?.name || schoolId} lockdown lifted`, 
        type: activate ? 'error' : 'success' 
      });
    } catch (err) {
      console.error('School lockdown error:', err);
      setToast?.({ message: 'Failed to toggle school lockdown', type: 'error' });
    }
  };

  // Global broadcast - sends to ALL schools
  const globalBroadcast = async (message, priority = 'normal') => {
    if (!isSuperAdmin) {
      setToast?.({ message: 'SuperAdmin access required', type: 'error' });
      return;
    }

    try {
      const batch = writeBatch(db);
      
      for (const school of allSchools) {
        const broadcastRef = doc(collection(db, broadcastsPath(school.id)));
        batch.set(broadcastRef, {
          message: sanitizeText(message),
          priority,
          sender: user?.email,
          senderName: userGreeting.fullName,
          isGlobal: true,
          createdAt: serverTimestamp(),
          pinned: priority === 'urgent',
        });
      }
      
      await batch.commit();

      setToast?.({ 
        message: `Broadcast sent to ${allSchools.length} schools`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Global broadcast error:', err);
      setToast?.({ message: 'Failed to send global broadcast', type: 'error' });
    }
  };

  // Delete a school (SuperAdmin only)
  const deleteSchool = async (schoolId) => {
    if (!isSuperAdmin) {
      setToast?.({ message: 'SuperAdmin access required', type: 'error' });
      return false;
    }

    if (schoolId === currentSchoolId) {
      setToast?.({ message: 'Cannot delete currently active school', type: 'error' });
      return false;
    }

    try {
      // Note: This only deletes the school document, not subcollections
      // In production, use a Cloud Function to recursively delete
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, schoolId);
      await deleteDoc(schoolRef);

      setToast?.({ message: 'School deleted', type: 'success' });
      return true;
    } catch (err) {
      console.error('Delete school error:', err);
      setToast?.({ message: 'Failed to delete school', type: 'error' });
      return false;
    }
  };

  // Conflict Group Management
  const addConflictGroup = async (name, members) => {
    if (sandboxMode) {
      const newGroup = { id: `conflict-${Date.now()}`, name, members, createdAt: { seconds: Date.now() / 1000 } };
      setConflictGroups(prev => [...prev, newGroup]);
      setToast?.({ message: `Conflict group "${name}" created`, type: 'success' });
      return;
    }

    try {
      await addDoc(collection(db, conflictGroupsPath(currentSchoolId)), {
        name,
        members,
        createdAt: serverTimestamp(),
      });
      setToast?.({ message: `Conflict group "${name}" created`, type: 'success' });
    } catch (err) {
      console.error('Add conflict group error:', err);
      setToast?.({ message: 'Failed to create conflict group', type: 'error' });
    }
  };

  const removeConflictGroup = async (groupId) => {
    if (sandboxMode) {
      setConflictGroups(prev => prev.filter(g => g.id !== groupId));
      setToast?.({ message: 'Conflict group removed', type: 'success' });
      return;
    }

    try {
      await deleteDoc(doc(db, conflictGroupsPath(currentSchoolId), groupId));
      setToast?.({ message: 'Conflict group removed', type: 'success' });
    } catch (err) {
      console.error('Remove conflict group error:', err);
      setToast?.({ message: 'Failed to remove conflict group', type: 'error' });
    }
  };

  // Config Management
  const updateConfig = async (configType, data) => {
    if (sandboxMode) {
      switch (configType) {
        case 'labels': setLabelsConfig(data); break;
        case 'bell_schedule': setBellSchedule(data); break;
        case 'economy': setEconomyConfig(data); break;
        case 'kiosk': setKioskConfig(data); break;
        case 'settings': setSettingsConfig(data); break;
      }
      setToast?.({ message: 'Config updated (sandbox)', type: 'success' });
      return;
    }

    try {
      const configRef = doc(db, configPath(currentSchoolId, configType));
      await setDoc(configRef, data, { merge: true });
      setToast?.({ message: 'Configuration updated', type: 'success' });
    } catch (err) {
      console.error('Update config error:', err);
      setToast?.({ message: 'Failed to update config', type: 'error' });
    }
  };

  const updateHouses = async (housesData) => {
    if (sandboxMode) {
      setSandboxHouses(housesData);
      setHouses(housesData);
      setToast?.({ message: 'Houses updated (sandbox)', type: 'success' });
      return;
    }

    try {
      const batch = writeBatch(db);
      for (const house of housesData) {
        const houseRef = doc(db, housesPath(currentSchoolId), house.id);
        batch.set(houseRef, house, { merge: true });
      }
      await batch.commit();
      setToast?.({ message: 'Houses updated', type: 'success' });
    } catch (err) {
      console.error('Update houses error:', err);
      setToast?.({ message: 'Failed to update houses', type: 'error' });
    }
  };

  // Handle file upload - accepts pre-parsed student data from AdminPanel
  const handleFileUpload = async (studentsData) => {
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      setToast?.({ message: 'No valid student data to import', type: 'error' });
      return;
    }

    if (sandboxMode) {
      const newStudents = studentsData.map((s, i) => ({
        ...s,
        id: `imported-${Date.now()}-${i}`,
      }));
      setSandboxStudents(prev => [...prev, ...newStudents]);
      setAllStudents(prev => [...prev, ...newStudents]);
      setToast?.({ message: `Imported ${newStudents.length} students (sandbox)`, type: 'success' });
      return;
    }

    try {
      setToast?.({ message: 'Uploading students...', type: 'info' });
      
      const batchSize = 500;
      let imported = 0;
      
      for (let i = 0; i < studentsData.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = studentsData.slice(i, i + batchSize);
        
        for (const student of chunk) {
          const existingQuery = query(
            collection(db, studentsPath(currentSchoolId)),
            where('student_id_number', '==', student.student_id_number),
            limit(1)
          );
          const existingSnap = await getDocs(existingQuery);
          
          if (existingSnap.empty) {
            const studentRef = doc(collection(db, studentsPath(currentSchoolId)));
            batch.set(studentRef, {
              ...student,
              created_at: serverTimestamp(),
            });
            imported++;
          } else {
            const existingDoc = existingSnap.docs[0];
            batch.update(existingDoc.ref, {
              full_name: student.full_name,
              grade_level: student.grade_level,
              updated_at: serverTimestamp(),
            });
          }
        }
        
        await batch.commit();
      }
      
      setToast?.({ message: `Imported ${imported} new students, updated ${studentsData.length - imported} existing`, type: 'success' });
    } catch (err) {
      console.error('File upload error:', err);
      setToast?.({ message: 'Failed to upload students', type: 'error' });
    }
  };

  // Box Queue Management
  const resolveBoxQueueItem = async (itemId, approved, itemData = null) => {
    if (sandboxMode) {
      setBoxQueue(prev => prev.filter(i => i.id !== itemId));
      setToast?.({ message: approved ? 'Approved' : 'Rejected', type: 'success' });
      return;
    }

    try {
      if (approved && itemData) {
        switch (itemData.type) {
          case 'ADD_DESTINATION':
            if (itemData.destination) {
              const currentLabels = labelsConfig?.passDestinations || [];
              if (!currentLabels.includes(itemData.destination)) {
                await updateConfig('labels', {
                  ...labelsConfig,
                  passDestinations: [...currentLabels, itemData.destination]
                });
              }
            }
            break;
          case 'REMOVE_DESTINATION':
            if (itemData.destination) {
              const currentLabels = labelsConfig?.passDestinations || [];
              await updateConfig('labels', {
                ...labelsConfig,
                passDestinations: currentLabels.filter(d => d !== itemData.destination)
              });
            }
            break;
          case 'PROMOTE_USER':
            if (itemData.userId && itemData.newRole) {
              const userRef = doc(db, COLLECTIONS.USERS, itemData.userId);
              await updateDoc(userRef, { role: itemData.newRole });
            }
            break;
          default:
            break;
        }
      }
      
      await deleteDoc(doc(db, boxQueuePath(currentSchoolId), itemId));
      setToast?.({ message: approved ? 'Approved and applied' : 'Rejected', type: 'success' });
    } catch (err) {
      console.error('Resolve queue item error:', err);
      setToast?.({ message: 'Failed to process request', type: 'error' });
    }
  };

  // Broadcast Management
  const sendBroadcast = async (message, priority = 'normal', targetAudience = 'All Staff') => {
    if (sandboxMode) {
      const newBroadcast = {
        id: `broadcast-${Date.now()}`,
        message,
        priority,
        targetAudience,
        senderName: userGreeting.fullName,
        senderEmail: user?.email,
        ts: { seconds: Date.now() / 1000 },
        pinned: false,
      };
      setBroadcasts(prev => [newBroadcast, ...prev]);
      botRef?.current?.showBroadcast(newBroadcast);
      setToast?.({ message: 'Broadcast sent', type: 'success' });
      return;
    }

    try {
      await addDoc(collection(db, broadcastsPath(currentSchoolId)), {
        message,
        priority,
        targetAudience,
        senderName: userGreeting.fullName,
        senderEmail: user?.email,
        ts: serverTimestamp(),
        pinned: false,
      });
      setToast?.({ message: 'Broadcast sent', type: 'success' });
    } catch (err) {
      console.error('Send broadcast error:', err);
      setToast?.({ message: 'Failed to send broadcast', type: 'error' });
    }
  };

  const deleteBroadcast = async (broadcastId) => {
    if (sandboxMode) {
      setBroadcasts(prev => prev.filter(b => b.id !== broadcastId));
      return;
    }
    try {
      await deleteDoc(doc(db, broadcastsPath(currentSchoolId), broadcastId));
    } catch (err) {
      console.error('Delete broadcast error:', err);
    }
  };

  const pinBroadcast = async (broadcastId, pinned) => {
    if (sandboxMode) {
      setBroadcasts(prev => prev.map(b => b.id === broadcastId ? { ...b, pinned } : b).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
      return;
    }
    try {
      await updateDoc(doc(db, broadcastsPath(currentSchoolId), broadcastId), { pinned });
    } catch (err) {
      console.error('Pin broadcast error:', err);
    }
  };

  // Parent Contact Management
  const saveParentContact = async (contactData) => {
    if (sandboxMode) {
      const newContact = { id: `contact-${Date.now()}`, ...contactData, ts: { seconds: Date.now() / 1000 } };
      setParentContacts(prev => [newContact, ...prev]);
      setToast?.({ message: 'Parent contact saved', type: 'success' });
      return;
    }

    try {
      await addDoc(collection(db, parentContactsPath(currentSchoolId)), {
        ...contactData,
        ts: serverTimestamp(),
      });
      setToast?.({ message: 'Parent contact saved', type: 'success' });
    } catch (err) {
      console.error('Save parent contact error:', err);
      setToast?.({ message: 'Failed to save contact', type: 'error' });
    }
  };

  // =====================
  // HOUSE ASSIGNMENT FUNCTIONS
  // =====================

  /**
   * Assign a single student to a house
   */
  const assignStudentToHouse = async (studentId, houseId) => {
    if (sandboxMode) {
      setSandboxStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, houseId } : s
      ));
      setAllStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, houseId } : s
      ));
      setToast?.({ message: 'Student assigned to house', type: 'success' });
      return true;
    }

    try {
      const studentRef = doc(db, studentsPath(currentSchoolId), studentId);
      await updateDoc(studentRef, { houseId });
      setToast?.({ message: 'Student assigned to house', type: 'success' });
      return true;
    } catch (err) {
      console.error('Assign student to house error:', err);
      setToast?.({ message: 'Failed to assign student', type: 'error' });
      return false;
    }
  };

  /**
   * Bulk assign multiple students to houses
   */
  const bulkAssignStudents = async (assignments) => {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      setToast?.({ message: 'No assignments provided', type: 'error' });
      return false;
    }

    if (sandboxMode) {
      setSandboxStudents(prev => {
        const assignmentMap = new Map(assignments.map(a => [a.studentId, a.houseId]));
        return prev.map(s => assignmentMap.has(s.id) 
          ? { ...s, houseId: assignmentMap.get(s.id) } 
          : s
        );
      });
      setAllStudents(prev => {
        const assignmentMap = new Map(assignments.map(a => [a.studentId, a.houseId]));
        return prev.map(s => assignmentMap.has(s.id) 
          ? { ...s, houseId: assignmentMap.get(s.id) } 
          : s
        );
      });
      setToast?.({ message: `${assignments.length} students assigned`, type: 'success' });
      return true;
    }

    try {
      const batch = writeBatch(db);
      
      for (const { studentId, houseId } of assignments) {
        const studentRef = doc(db, studentsPath(currentSchoolId), studentId);
        batch.update(studentRef, { houseId });
      }
      
      await batch.commit();
      setToast?.({ message: `${assignments.length} students assigned`, type: 'success' });
      return true;
    } catch (err) {
      console.error('Bulk assign students error:', err);
      setToast?.({ message: 'Failed to bulk assign students', type: 'error' });
      return false;
    }
  };

  /**
   * Update a house's display name
   */
  const updateHouseName = async (houseId, newName) => {
    if (!newName?.trim()) {
      setToast?.({ message: 'House name cannot be empty', type: 'error' });
      return false;
    }

    const sanitizedName = newName.trim().slice(0, 50);

    if (sandboxMode) {
      setSandboxHouses(prev => prev.map(h => 
        h.id === houseId ? { ...h, name: sanitizedName } : h
      ));
      setHouses(prev => prev.map(h => 
        h.id === houseId ? { ...h, name: sanitizedName } : h
      ));
      setToast?.({ message: 'House renamed', type: 'success' });
      return true;
    }

    try {
      const houseRef = doc(db, housesPath(currentSchoolId), houseId);
      await updateDoc(houseRef, { name: sanitizedName });
      setToast?.({ message: 'House renamed', type: 'success' });
      return true;
    } catch (err) {
      console.error('Update house name error:', err);
      setToast?.({ message: 'Failed to rename house', type: 'error' });
      return false;
    }
  };

  // =====================
  // ALERT LEVEL FUNCTIONS
  // =====================

  /**
   * Set the school-wide alert level
   */
  const setAlertLevelAction = async (level) => {
    const validLevels = ['normal', 'hold', 'lockdown'];
    if (!validLevels.includes(level)) {
      setToast?.({ message: 'Invalid alert level', type: 'error' });
      return;
    }

    if (sandboxMode) {
      setAlertLevel(level);
      if (level === 'lockdown') {
        setLockdown(true);
      } else {
        setLockdown(false);
      }
      botRef?.current?.push(level === 'lockdown' ? 'siren' : level === 'hold' ? 'warning' : 'happy');
      setToast?.({ message: `Alert level set to ${level.toUpperCase()}`, type: level === 'normal' ? 'success' : 'warning' });
      return;
    }

    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, currentSchoolId);
      await updateDoc(schoolRef, {
        alertLevel: level,
        lockdown: level === 'lockdown',
        lockdownMeta: level === 'lockdown' 
          ? { activatedBy: user?.email, activatedAt: serverTimestamp(), level }
          : null,
      });
      setToast?.({ message: `Alert level set to ${level.toUpperCase()}`, type: level === 'normal' ? 'success' : 'warning' });
    } catch (err) {
      console.error('Set alert level error:', err);
      setToast?.({ message: 'Failed to set alert level', type: 'error' });
    }
  };

  /**
   * Toggle a zone's locked status
   */
  const toggleZoneLock = async (zone) => {
    const isCurrentlyLocked = lockedZones.includes(zone);
    
    if (sandboxMode) {
      setLockedZones(prev => 
        isCurrentlyLocked 
          ? prev.filter(z => z !== zone)
          : [...prev, zone]
      );
      setToast?.({ message: `${zone} ${isCurrentlyLocked ? 'unlocked' : 'locked'}`, type: 'info' });
      return;
    }

    try {
      const schoolRef = doc(db, COLLECTIONS.SCHOOLS, currentSchoolId);
      const newLockedZones = isCurrentlyLocked
        ? lockedZones.filter(z => z !== zone)
        : [...lockedZones, zone];
      
      await updateDoc(schoolRef, { lockedZones: newLockedZones });
      setToast?.({ message: `${zone} ${isCurrentlyLocked ? 'unlocked' : 'locked'}`, type: 'info' });
    } catch (err) {
      console.error('Toggle zone lock error:', err);
      setToast?.({ message: 'Failed to toggle zone lock', type: 'error' });
    }
  };

  // =====================
  // RETURN STATE & ACTIONS
  // =====================

  return {
    // Auth
    user,
    userData,
    isSchoolAdmin,
    isSuperAdmin,
    userGreeting,
    employeeId,
    signOutUser,

    // Consent Flow
    showConsentFlow,
    setShowConsentFlow,
    handleConsentComplete,
    handleEnterSandbox,
    needsConsent,
    needsSchoolSelection,

    // School
    currentSchoolId,
    displaySchoolName,
    schoolData,
    sandboxMode,
    toggleSandbox,
    switchSchool,
    createSchool,
    allSchools,

    // UI
    isLoading,
    showSchoolPrompt,
    setShowSchoolPrompt,
    activeTab,
    setActiveTab,
    selectedStudent,
    setSelectedStudent,
    theme,
    setTheme,

    // Data
    allStudents,
    activePasses,
    logs,
    houses,
    housesSorted,
    conflictGroups,
    boxQueue,
    waitlist,
    broadcasts,
    parentContacts,

    // Configs
    labelsConfig,
    bellSchedule,
    economyConfig,
    kioskConfig,
    settingsConfig,
    housesConfig,

    // Safety
    lockdown,
    lockdownMeta,
    toggleLockdown,
    generateLockdownReport,
    alertLevel,
    setAlertLevel: setAlertLevelAction,
    lockedZones,
    toggleZoneLock,

    // SuperAdmin Functions
    globalLockdown,
    schoolLockdown,
    globalBroadcast,
    deleteSchool,

    // Actions
    issuePass,
    returnStudent,
    returnAllStudents,
    logInfraction,
    awardPoints,
    logTardy,

    // House Assignment
    assignStudentToHouse,
    bulkAssignStudents,
    updateHouseName,

    // Helpers
    hasActivePass,
    isDestinationFull,
    getWaitlistPosition,
    destinationCounts,
    checkConflict,
    getStudentInfractions,
    analyticsData,

    // Admin
    updateConfig,
    updateHouses,
    handleFileUpload,
    resolveBoxQueueItem,
    addConflictGroup,
    removeConflictGroup,

    // Communication
    sendBroadcast,
    deleteBroadcast,
    pinBroadcast,
    saveParentContact,
  };
}
