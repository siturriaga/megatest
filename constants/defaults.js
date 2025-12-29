/**
 * Default configurations for STRIDE
 * Updated with mascot pool and dynamic house assignment
 */

export const DEFAULT_INFRACTION_LABELS = [
  'Disruption',
  'Defiance',
  'Tech Misuse',
  'Profanity',
  'Tardiness',
  'Dress Code',
  'Horseplay',
  'Other'
];

export const DEFAULT_INCENTIVE_LABELS = [
  'Helping Others',
  'Class Participation',
  'Improvement',
  'Leadership',
  'Kindness',
  'Perfect Attendance',
  'Homework Complete',
  'Other'
];

export const DEFAULT_PASS_DESTINATIONS = [
  'Bathroom',
  'Water',
  'Office',
  'Library',
  'Clinic',
  'Student Services',
  'Main Office',
  'Guidance',
  'Cafeteria',
  'Locker'
];

export const DEFAULT_ECONOMY = {
  studentPointRatio: 0.4,
  teamPointRatio: 0.6,
  housePointRatio: 0.6,
  rewardsEnabled: true,
  rewards: [
    { id: 'r1', name: 'Homework Pass', cost: 50 },
    { id: 'r2', name: 'Front of Lunch Line', cost: 25 },
    { id: 'r3', name: 'Extra Credit', cost: 75 },
    { id: 'r4', name: 'Free Dress Day', cost: 100 }
  ],
  infractionPointDeduction: 30, // Points deducted from house per infraction
};

export const DEFAULT_BELL_SCHEDULE = {
  periods: [
    { id: 'p1', name: 'Period 1', start: '08:00', end: '08:50' },
    { id: 'p2', name: 'Period 2', start: '08:55', end: '09:45' },
    { id: 'p3', name: 'Period 3', start: '09:50', end: '10:40' },
    { id: 'p4', name: 'Period 4', start: '10:45', end: '11:35' },
    { id: 'lunch', name: 'Lunch', start: '11:35', end: '12:15' },
    { id: 'p5', name: 'Period 5', start: '12:20', end: '13:10' },
    { id: 'p6', name: 'Period 6', start: '13:15', end: '14:05' },
    { id: 'p7', name: 'Period 7', start: '14:10', end: '15:00' }
  ],
  passingTime: 5,
  gracePeriodMinutes: 5
};

export const DEFAULT_KIOSK = {
  enabled: true,
  requireId: false,
  autoLogTardy: true,
  tardyThresholdMinutes: 5,
  requirePhoto: false
};

export const DEFAULT_SETTINGS = {
  passOvertimeMinutes: 10,
  maxActivePassesPerTeacher: 3,
  conflictAlertsEnabled: true,
  autoReturnMinutes: 30,
  customBotMessages: [],
  maxCapacityPerDestination: 5,
  tardyStreakThreshold: 4
};

/**
 * Mascot Pool - 8 unique mascots with full configuration
 * Each mascot has unique personality, colors, and animations
 */
export const MASCOT_POOL = [
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    icon: 'dragon',
    color: '#ef4444', // red
    secondaryColor: '#f97316', // orange
    element: 'fire',
    personality: 'fierce',
    idleQuirks: ['smoke from nostrils', 'wing stretch', 'tail flick'],
    attackName: 'Inferno Spiral',
    attackDescription: 'Breathes fire spiral, clears entire screen',
    victoryPose: 'Roars with fire pillar behind',
    defeatAnimation: 'Burns up, crumbles to ash',
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    emoji: '🦅',
    icon: 'phoenix',
    color: '#eab308', // yellow
    secondaryColor: '#f59e0b', // amber
    element: 'light',
    personality: 'wise',
    idleQuirks: ['feathers shimmer', 'flame flicker', 'graceful hover'],
    attackName: 'Solar Rebirth',
    attackDescription: 'Explodes in blinding light, others disintegrate',
    victoryPose: 'Wings spread, golden glow',
    defeatAnimation: 'Feathers scatter, reforms off-screen',
  },
  {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    icon: 'wolf',
    color: '#3b82f6', // blue
    secondaryColor: '#6366f1', // indigo
    element: 'shadow',
    personality: 'cunning',
    idleQuirks: ['ears twitch', 'sniffs air', 'eyes scan'],
    attackName: 'Shadow Pack',
    attackDescription: 'Howls and summons pack to push others out',
    victoryPose: 'Moon howl silhouette',
    defeatAnimation: 'Fades into shadows',
  },
  {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    icon: 'lion',
    color: '#d97706', // amber
    secondaryColor: '#b45309', // amber dark
    element: 'earth',
    personality: 'majestic',
    idleQuirks: ['mane flows', 'occasional yawn', 'proud stance'],
    attackName: 'Earthquake Roar',
    attackDescription: 'Roars shockwave, others blown back',
    victoryPose: 'Stands proud with flowing mane',
    defeatAnimation: 'Stumbles, walks off dignified',
  },
  {
    id: 'bear',
    name: 'Bear',
    emoji: '🐻',
    icon: 'bear',
    color: '#78716c', // stone
    secondaryColor: '#a8a29e', // stone light
    element: 'ice',
    personality: 'patient',
    idleQuirks: ['scratches ear', 'stretches', 'sniffs ground'],
    attackName: 'Glacier Crush',
    attackDescription: 'Ground slam, ice wave freezes and shatters others',
    victoryPose: 'Stands tall with frost aura',
    defeatAnimation: 'Freezes solid, cracks away',
  },
  {
    id: 'shark',
    name: 'Shark',
    emoji: '🦈',
    icon: 'shark',
    color: '#0ea5e9', // sky
    secondaryColor: '#0284c7', // sky dark
    element: 'water',
    personality: 'relentless',
    idleQuirks: ['circles motion', 'eyes dart', 'fin cuts water'],
    attackName: 'Tidal Frenzy',
    attackDescription: 'Swims through screen glass, shatters competition',
    victoryPose: 'Circles in water ring',
    defeatAnimation: 'Splashes out of frame',
  },
  {
    id: 'tiger',
    name: 'Tiger',
    emoji: '🐯',
    icon: 'tiger',
    color: '#f97316', // orange
    secondaryColor: '#000000', // black stripes
    element: 'lightning',
    personality: 'fierce',
    idleQuirks: ['tail flicks', 'crouches', 'claws flex'],
    attackName: 'Thunder Pounce',
    attackDescription: 'Lightning dash, strikes all in sequence',
    victoryPose: 'Electricity crackles around',
    defeatAnimation: 'Electrocuted, zaps away',
  },
  {
    id: 'eagle',
    name: 'Eagle',
    emoji: '🦅',
    icon: 'eagle',
    color: '#f5f5f4', // stone 100
    secondaryColor: '#1e40af', // blue dark
    element: 'wind',
    personality: 'visionary',
    idleQuirks: ['feathers ruffle', 'head turns sharp', 'wings adjust'],
    attackName: 'Storm Dive',
    attackDescription: 'Tornado dive, wind blasts others off',
    victoryPose: 'Soars with wind spiral',
    defeatAnimation: 'Caught in wind, blown away',
  },
];

/**
 * Default houses - legacy support
 * New schools will have houses dynamically generated based on grades
 */
export const DEFAULT_HOUSES = [
  { id: 'house-0', name: 'Phoenix', mascot: '🔥', color: '#ef4444', score: 0 },
  { id: 'house-1', name: 'Storm Wolves', mascot: '🐺', color: '#3b82f6', score: 0 },
  { id: 'house-2', name: 'Thunder Hawks', mascot: '🦅', color: '#eab308', score: 0 },
  { id: 'house-3', name: 'Shadow Panthers', mascot: '🐆', color: '#8b5cf6', score: 0 }
];

/**
 * Generate houses dynamically based on grade levels
 * @param {number[]} grades - Array of grade levels (e.g., [9, 10, 11, 12])
 * @returns {Object[]} Array of house objects
 */
export function generateHousesFromGrades(grades) {
  if (!grades || grades.length === 0) return DEFAULT_HOUSES;
  
  const sortedGrades = [...new Set(grades)].sort((a, b) => a - b);
  
  return sortedGrades.map((grade, index) => {
    const mascot = MASCOT_POOL[index % MASCOT_POOL.length];
    return {
      id: `house-grade-${grade}`,
      name: `${mascot.name} (Grade ${grade})`,
      mascot: mascot.emoji,
      mascotId: mascot.id,
      color: mascot.color,
      secondaryColor: mascot.secondaryColor,
      gradeLevel: grade,
      score: 0,
    };
  });
}

/**
 * Assign a student to a house based on their grade level
 * @param {number} gradeLevel - Student's grade level
 * @param {Object[]} houses - Array of house objects
 * @returns {string|null} House ID or null if no match
 */
export function assignHouseByGrade(gradeLevel, houses) {
  if (!houses || houses.length === 0) return null;
  
  // Look for exact grade match
  const exactMatch = houses.find(h => h.gradeLevel === gradeLevel);
  if (exactMatch) return exactMatch.id;
  
  // Fallback: assign to house with closest grade
  const sorted = [...houses].sort((a, b) => 
    Math.abs((a.gradeLevel || 0) - gradeLevel) - Math.abs((b.gradeLevel || 0) - gradeLevel)
  );
  return sorted[0]?.id || null;
}

export const DESTINATION_DURATIONS = {
  'Bathroom': 5,
  'Water': 3,
  'Office': 10,
  'Library': 15,
  'Clinic': 20,
  'Student Services': 15,
  'Main Office': 10,
  'Guidance': 20,
  'Cafeteria': 10,
  'Locker': 3
};

export const getEstimatedDuration = (destination) => {
  return DESTINATION_DURATIONS[destination] || 10;
};

export const MTSS_TIERS = {
  TIER_1: { min: 0, max: 2, label: 'Universal', color: 'emerald' },
  TIER_2: { min: 3, max: 5, label: 'Targeted', color: 'amber' },
  TIER_3: { min: 6, max: 9, label: 'Intensive', color: 'orange' },
  TIER_4: { min: 10, max: Infinity, label: 'Critical', color: 'red' }
};

export const getMTSSTier = (score) => {
  if (score >= 10) return MTSS_TIERS.TIER_4;
  if (score >= 6) return MTSS_TIERS.TIER_3;
  if (score >= 3) return MTSS_TIERS.TIER_2;
  return MTSS_TIERS.TIER_1;
};

/**
 * Alert levels for safety system
 */
export const ALERT_LEVELS = {
  NORMAL: {
    id: 'normal',
    label: 'Normal',
    color: 'emerald',
    emoji: '🟢',
    passesAllowed: true,
    description: 'All passes allowed, normal operations',
  },
  HOLD: {
    id: 'hold',
    label: 'Hold',
    color: 'amber',
    emoji: '🟡',
    passesAllowed: true,
    description: 'Passes allowed with warning, heightened awareness',
  },
  LOCKDOWN: {
    id: 'lockdown',
    label: 'Lockdown',
    color: 'red',
    emoji: '🔴',
    passesAllowed: false,
    description: 'All passes blocked, return all students',
  },
};

/**
 * Battle milestones - trigger battles when house reaches these points
 */
export const BATTLE_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];
