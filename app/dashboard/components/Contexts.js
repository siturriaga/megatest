'use client';
import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Theme Context
 * Manages app-wide theme (obsidian/aero)
 */
const ThemeContext = createContext(null);

export function ThemeProvider({ children, defaultTheme = 'obsidian' }) {
  const [theme, setTheme] = useState(defaultTheme);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'obsidian' ? 'aero' : 'obsidian');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'obsidian', setTheme: () => {}, toggleTheme: () => {} };
  }
  return context;
}

/**
 * Config Context
 * Manages school configuration (labels, bell schedule, economy, settings)
 */
const ConfigContext = createContext(null);

export function ConfigProvider({ children, initialConfig = {} }) {
  const [config, setConfig] = useState({
    labels: initialConfig.labels || {
      infractionButtons: ['Disruption', 'Defiance', 'Tech Misuse', 'Profanity'],
      incentiveButtons: ['Helping Others', 'Participation', 'Excellence', 'Leadership', 'Kindness'],
      passDestinations: ['Bathroom', 'Water', 'Office', 'Library', 'Clinic', 'Counselor'],
      maxDisplayedDestinations: 8,
    },
    bellSchedule: initialConfig.bellSchedule || {
      periods: [],
      passingTime: 5,
      gracePeriodMinutes: 3,
    },
    economy: initialConfig.economy || {
      studentPointRatio: 0.4,
      teamPointRatio: 0.6,
    },
    settings: initialConfig.settings || {
      passOvertimeMinutes: 10,
      maxCapacityPerDestination: 5,
      conflictAlertsEnabled: true,
      tardyStreakThreshold: 4,
    },
  });

  const updateConfig = useCallback((section, data) => {
    setConfig(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, updateConfig, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    return { config: {}, updateConfig: () => {}, setConfig: () => {} };
  }
  return context;
}

/**
 * User Context
 * Manages current user state and permissions
 */
const UserContext = createContext(null);

export function UserProvider({ children, user = null }) {
  const [currentUser, setCurrentUser] = useState(user);

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSchoolAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  return (
    <UserContext.Provider value={{
      user: currentUser,
      setUser: setCurrentUser,
      isTeacher,
      isSchoolAdmin,
      isSuperAdmin,
      displayName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
      firstName: currentUser?.displayName?.split(' ')[0] || 'there',
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    return {
      user: null,
      setUser: () => {},
      isTeacher: false,
      isSchoolAdmin: false,
      isSuperAdmin: false,
      displayName: 'User',
      firstName: 'there',
    };
  }
  return context;
}

/**
 * School Context
 * Manages current school data
 */
const SchoolContext = createContext(null);

export function SchoolProvider({ children, school = null }) {
  const [currentSchool, setCurrentSchool] = useState(school);
  const [houses, setHouses] = useState(school?.houses || []);
  const [students, setStudents] = useState([]);

  const updateHouseScore = useCallback((houseId, delta) => {
    setHouses(prev => prev.map(h =>
      h.id === houseId ? { ...h, score: (h.score || 0) + delta } : h
    ));
  }, []);

  return (
    <SchoolContext.Provider value={{
      school: currentSchool,
      setSchool: setCurrentSchool,
      schoolId: currentSchool?.id,
      schoolName: currentSchool?.name || 'School',
      houses,
      setHouses,
      updateHouseScore,
      students,
      setStudents,
    }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    return {
      school: null,
      setSchool: () => {},
      schoolId: null,
      schoolName: 'School',
      houses: [],
      setHouses: () => {},
      updateHouseScore: () => {},
      students: [],
      setStudents: () => {},
    };
  }
  return context;
}

/**
 * Safety Context
 * Manages lockdown and alert states
 */
const SafetyContext = createContext(null);

export function SafetyProvider({ children }) {
  const [lockdown, setLockdown] = useState(false);
  const [alertLevel, setAlertLevel] = useState('normal');
  const [lockedZones, setLockedZones] = useState([]);
  const [conflictGroups, setConflictGroups] = useState([]);

  const toggleLockdown = useCallback(() => {
    setLockdown(prev => !prev);
    if (!lockdown) setAlertLevel('lockdown');
    else setAlertLevel('normal');
  }, [lockdown]);

  const toggleZoneLock = useCallback((zone) => {
    setLockedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  }, []);

  const isZoneLocked = useCallback((zone) => {
    return lockedZones.includes(zone);
  }, [lockedZones]);

  return (
    <SafetyContext.Provider value={{
      lockdown,
      setLockdown,
      toggleLockdown,
      alertLevel,
      setAlertLevel,
      lockedZones,
      setLockedZones,
      toggleZoneLock,
      isZoneLocked,
      conflictGroups,
      setConflictGroups,
    }}>
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    return {
      lockdown: false,
      setLockdown: () => {},
      toggleLockdown: () => {},
      alertLevel: 'normal',
      setAlertLevel: () => {},
      lockedZones: [],
      setLockedZones: () => {},
      toggleZoneLock: () => {},
      isZoneLocked: () => false,
      conflictGroups: [],
      setConflictGroups: () => {},
    };
  }
  return context;
}

/**
 * Combined Provider - Wraps all contexts
 * Use this at the app root to provide all contexts at once
 */
export function StrideProviders({ children, theme, config, user, school }) {
  return (
    <ThemeProvider defaultTheme={theme}>
      <ConfigProvider initialConfig={config}>
        <UserProvider user={user}>
          <SchoolProvider school={school}>
            <SafetyProvider>
              {children}
            </SafetyProvider>
          </SchoolProvider>
        </UserProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
