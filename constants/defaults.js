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
  ]
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

export const DEFAULT_HOUSES = [
  { id: 'house-0', name: 'Phoenix', mascot: '🔥', color: '#ef4444', score: 0 },
  { id: 'house-1', name: 'Storm Wolves', mascot: '🐺', color: '#3b82f6', score: 0 },
  { id: 'house-2', name: 'Thunder Hawks', mascot: '🦅', color: '#eab308', score: 0 },
  { id: 'house-3', name: 'Shadow Panthers', mascot: '🐆', color: '#8b5cf6', score: 0 }
];

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
