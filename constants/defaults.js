/**
 * STRIDE App - Default Constants & Configuration
 * * Contains:
 * - 12 Mascots with colors/abilities
 * - Extensive fuzzy word dictionaries for column matching
 * - All default configurations
 * - Helper functions
 * * PRODUCTION READY - Merged Version
 */

// ==================
// PRIORITY LEVELS
// ==================
export const PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const BROADCAST_PRIORITY = {
  NORMAL: 'normal',
  IMPORTANT: 'important',
  URGENT: 'urgent',
};

// ==================
// 12 MASCOT POOL - SVG-based mascots
// ==================
export const MASCOT_POOL = [
  {
    id: 'phoenix',
    name: 'Blazing Phoenix',
    emoji: '🔥',
    type: 'phoenix',
    element: 'fire',
    color: '#ef4444',
    colorSecondary: '#ff4500',
    gradient: ['#ef4444', '#ff4500'],
    abilities: ['Flame Burst', 'Rising Ashes', 'Solar Flare'],
    description: 'Rises from defeat stronger than before',
    personality: 'Fierce and determined',
  },
  {
    id: 'wolf',
    name: 'Storm Wolf',
    emoji: '🐺',
    type: 'wolf',
    element: 'ice',
    color: '#3b82f6',
    colorSecondary: '#1e3a5f',
    gradient: ['#3b82f6', '#1e3a5f'],
    abilities: ['Pack Howl', 'Thunder Bite', 'Frost Pounce'],
    description: 'The pack is strongest together',
    personality: 'Loyal and strategic',
  },
  {
    id: 'hawk',
    name: 'Thunder Hawk',
    emoji: '🦅',
    type: 'hawk',
    element: 'electric',
    color: '#8b5cf6',
    colorSecondary: '#4c1d95',
    gradient: ['#8b5cf6', '#4c1d95'],
    abilities: ['Sky Dive', 'Lightning Talons', 'Wind Gust'],
    description: 'Strikes with precision from above',
    personality: 'Swift and vigilant',
  },
  {
    id: 'panther',
    name: 'Shadow Panther',
    emoji: '🐆',
    type: 'panther',
    element: 'dark',
    color: '#ec4899',
    colorSecondary: '#1a1a2e',
    gradient: ['#ec4899', '#1a1a2e'],
    abilities: ['Shadow Strike', 'Night Prowl', 'Phantom Dash'],
    description: 'Silent, deadly, unstoppable',
    personality: 'Mysterious and agile',
  },
  {
    id: 'dragon',
    name: 'Ember Dragon',
    emoji: '🐉',
    type: 'dragon',
    element: 'fire',
    color: '#f59e0b',
    colorSecondary: '#b45309',
    gradient: ['#f59e0b', '#b45309'],
    abilities: ['Dragon Fire', 'Wing Blast', 'Ancient Roar'],
    description: 'Ancient power awakened',
    personality: 'Wise and powerful',
  },
  {
    id: 'lion',
    name: 'Golden Lion',
    emoji: '🦁',
    type: 'lion',
    element: 'light',
    color: '#eab308',
    colorSecondary: '#a16207',
    gradient: ['#eab308', '#a16207'],
    abilities: ['Royal Roar', 'Pride Charge', 'Golden Mane'],
    description: 'Born to lead, destined to rule',
    personality: 'Noble and courageous',
  },
  {
    id: 'bear',
    name: 'Frost Bear',
    emoji: '🐻',
    type: 'bear',
    element: 'ice',
    color: '#06b6d4',
    colorSecondary: '#0e7490',
    gradient: ['#06b6d4', '#0e7490'],
    abilities: ['Ice Slam', 'Blizzard Breath', 'Glacier Shield'],
    description: 'Unstoppable force of nature',
    personality: 'Strong and protective',
  },
  {
    id: 'tiger',
    name: 'Jungle Tiger',
    emoji: '🐯',
    type: 'tiger',
    element: 'nature',
    color: '#22c55e',
    colorSecondary: '#15803d',
    gradient: ['#22c55e', '#15803d'],
    abilities: ['Jungle Fury', 'Vine Whip', 'Camouflage'],
    description: 'Master of the wild',
    personality: 'Fierce and independent',
  },
  {
    id: 'owl',
    name: 'Night Owl',
    emoji: '🦉',
    type: 'owl',
    element: 'wisdom',
    color: '#6366f1',
    colorSecondary: '#312e81',
    gradient: ['#6366f1', '#312e81'],
    abilities: ['Wise Vision', 'Silent Flight', 'Mind Maze'],
    description: 'Knowledge is the ultimate power',
    personality: 'Intelligent and observant',
  },
  {
    id: 'shark',
    name: 'Ocean Shark',
    emoji: '🦈',
    type: 'shark',
    element: 'water',
    color: '#14b8a6',
    colorSecondary: '#0f766e',
    gradient: ['#14b8a6', '#0f766e'],
    abilities: ['Tidal Wave', 'Razor Bite', 'Deep Dive'],
    description: 'Ruler of the deep',
    personality: 'Relentless and focused',
  },
  {
    id: 'bull',
    name: 'Iron Bull',
    emoji: '🐂',
    type: 'bull',
    element: 'earth',
    color: '#78716c',
    colorSecondary: '#44403c',
    gradient: ['#78716c', '#44403c'],
    abilities: ['Iron Charge', 'Earthquake', 'Steel Horn'],
    description: 'Unbreakable determination',
    personality: 'Stubborn and powerful',
  },
  {
    id: 'falcon',
    name: 'Swift Falcon',
    emoji: '🦅',
    type: 'falcon',
    element: 'wind',
    color: '#0ea5e9',
    colorSecondary: '#0369a1',
    gradient: ['#0ea5e9', '#0369a1'],
    abilities: ['Sonic Speed', 'Air Slash', 'Wind Rider'],
    description: 'Faster than the eye can see',
    personality: 'Quick and precise',
  },
];

// ==================
// BATTLE MILESTONES
// ==================
export const BATTLE_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];

// ==================
// FUZZY WORD DICTIONARIES
// Extensive variations for column matching
// ==================
export const FUZZY_COLUMNS = {
  // STUDENT NAME - 50+ variations
  full_name: [
    'full_name', 'fullname', 'full name', 'name', 'student_name', 'studentname',
    'student name', 'student full name', 'pupil_name', 'pupil name', 'pupilname',
    'learner_name', 'learner name', 'learnername', 'child_name', 'child name',
    'childname', 'kid_name', 'kid name', 'kidname', 'student', 'pupil', 'learner',
    'child', 'kid', 'full_student_name', 'complete_name', 'complete name',
    'completename', 'whole_name', 'whole name', 'wholename', 'person_name',
    'person name', 'personname', 'individual_name', 'individual name',
    'student_full_name', 'students_name', 'students name', 'studentsname',
    'name_full', 'name full', 'namefull', 'student_info', 'student info',
    'first_last', 'first last', 'firstlast', 'firstname_lastname',
    'firstname lastname', 'first_name_last_name', 'nombre_completo',
    // Spanish
    'nombre', 'nombre_alumno', 'nombre alumno', 'nombrealumno', 'alumno',
    'estudiante', 'nombre_estudiante', 'nombre estudiante', 'nombreestudiante',
    'nombre_completo', 'nombre completo', 'nombrecompleto',
    // French
    'nom', 'nom_complet', 'nom complet', 'nomcomplet', 'nom_eleve', 'nom eleve',
    'nomeleve', 'eleve', 'prenom_nom', 'prenom nom', 'prenomnom',
    // Portuguese
    'nome', 'nome_completo', 'nome completo', 'nomecompleto', 'nome_aluno',
    'nome aluno', 'nomealuno', 'aluno',
    // German
    'name', 'vollständiger_name', 'schüler_name', 'schülername',
    // Other
    'display_name', 'display name', 'displayname', 'legal_name', 'legal name',
  ],

  // STUDENT ID - 50+ variations
  student_id_number: [
    'student_id_number', 'student_id', 'studentid', 'student id', 'student id number',
    'id', 'id_number', 'idnumber', 'id number', 'student_number', 'studentnumber',
    'student number', 'sid', 'stu_id', 'stuid', 'stu id', 's_id', 's id',
    'student_no', 'studentno', 'student no', 'student_num', 'studentnum',
    'student num', 'pupil_id', 'pupilid', 'pupil id', 'pupil_number', 'pupilnumber',
    'pupil number', 'learner_id', 'learnerid', 'learner id', 'child_id', 'childid',
    'child id', 'badge', 'badge_number', 'badgenumber', 'badge number', 'badge_id',
    'badgeid', 'badge id', 'id_card', 'idcard', 'id card', 'card_number',
    'cardnumber', 'card number', 'enrollment_id', 'enrollmentid', 'enrollment id',
    'enrollment_number', 'enrollmentnumber', 'enrollment number', 'roll_number',
    'rollnumber', 'roll number', 'roll_no', 'rollno', 'roll no', 'registration_number',
    'registrationnumber', 'registration number', 'reg_no', 'regno', 'reg no',
    'admission_number', 'admissionnumber', 'admission number', 'adm_no', 'admno',
    'student_code', 'studentcode', 'student code', 'unique_id', 'uniqueid', 'unique id',
    'identifier', 'student_identifier', 'record_id', 'recordid', 'record id',
    // Spanish
    'matricula', 'numero_matricula', 'numero matricula', 'numeromatricula',
    'codigo', 'codigo_estudiante', 'codigo estudiante', 'codigoestudiante',
    'numero', 'numero_alumno', 'numero alumno', 'numeroalumno', 'id_alumno',
    'idalumno', 'id alumno', 'identificacion', 'cedula',
    // French
    'numero_etudiant', 'numero etudiant', 'numeroetudiant', 'matricule',
    'id_eleve', 'ideleve', 'id eleve', 'numero_eleve', 'numero eleve',
    // Portuguese
    'numero_aluno', 'numero aluno', 'numeroaluno', 'id_aluno', 'idaluno',
    'ra', 'registro_aluno', 'registro aluno', 'registroaluno',
    // Other
    'osis', 'osis_number', 'osis number', 'state_id', 'stateid', 'state id',
    'district_id', 'districtid', 'district id', 'local_id', 'localid', 'local id',
  ],

  // GRADE LEVEL - 40+ variations
  grade_level: [
    'grade_level', 'gradelevel', 'grade level', 'grade', 'gr', 'grd', 'level',
    'lvl', 'lv', 'year', 'yr', 'school_year', 'schoolyear', 'school year',
    'year_level', 'yearlevel', 'year level', 'class', 'class_level', 'classlevel',
    'class level', 'form', 'form_level', 'formlevel', 'form level', 'standard',
    'std', 'grade_lvl', 'gradelvl', 'grade lvl', 'current_grade', 'currentgrade',
    'current grade', 'enrolled_grade', 'enrolledgrade', 'enrolled grade',
    'academic_year', 'academicyear', 'academic year', 'student_grade',
    'studentgrade', 'student grade', 'grade_number', 'gradenumber', 'grade number',
    // Spanish
    'grado', 'nivel', 'nivel_grado', 'nivel grado', 'nivelgrado', 'curso',
    'año', 'ano', 'año_escolar', 'ano_escolar', 'año escolar', 'ano escolar',
    // French
    'annee', 'année', 'niveau', 'classe', 'annee_scolaire', 'année_scolaire',
    // Portuguese
    'serie', 'série', 'ano_letivo', 'ano letivo', 'anoletivo',
    // Other
    'division', 'section', 'homeroom_grade', 'homeroomgrade', 'homeroom grade',
  ],

  // FIRST NAME - 30+ variations
  first_name: [
    'first_name', 'firstname', 'first name', 'first', 'fname', 'f_name',
    'given_name', 'givenname', 'given name', 'forename', 'fore_name', 'fore name',
    'christian_name', 'christianname', 'christian name', 'personal_name',
    'personalname', 'personal name', 'student_first_name', 'studentfirstname',
    'student first name', 'name_first', 'namefirst', 'name first',
    // Spanish
    'nombre', 'primer_nombre', 'primernombre', 'primer nombre', 'nombres',
    // French
    'prenom', 'prénom', 'premier_nom', 'premier nom',
    // Portuguese
    'primeiro_nome', 'primeiro nome', 'primeironome',
  ],

  // LAST NAME - 30+ variations
  last_name: [
    'last_name', 'lastname', 'last name', 'last', 'lname', 'l_name',
    'surname', 'sur_name', 'sur name', 'family_name', 'familyname', 'family name',
    'second_name', 'secondname', 'second name', 'student_last_name',
    'studentlastname', 'student last name', 'name_last', 'namelast', 'name last',
    // Spanish
    'apellido', 'apellidos', 'primer_apellido', 'primerapellido', 'primer apellido',
    'apellido_paterno', 'apellidopaterno', 'apellido paterno',
    // French
    'nom_famille', 'nom famille', 'nomfamille', 'nom_de_famille',
    // Portuguese
    'sobrenome', 'ultimo_nome', 'ultimo nome', 'ultimonome',
  ],

  // EMAIL - 25+ variations
  email: [
    'email', 'e-mail', 'e_mail', 'mail', 'email_address', 'emailaddress',
    'email address', 'e-mail_address', 'e-mail address', 'student_email',
    'studentemail', 'student email', 'school_email', 'schoolemail', 'school email',
    'contact_email', 'contactemail', 'contact email', 'primary_email',
    'primaryemail', 'primary email', 'electronic_mail', 'electronicmail',
    // Spanish
    'correo', 'correo_electronico', 'correo electronico', 'correoelectronico',
    // French
    'courriel', 'adresse_email', 'adresse email',
    // Portuguese
    'email_aluno', 'email aluno', 'emailaluno',
  ],

  // HOUSE/TEAM - 20+ variations
  house_id: [
    'house_id', 'houseid', 'house id', 'house', 'team_id', 'teamid', 'team id',
    'team', 'group_id', 'groupid', 'group id', 'group', 'clan', 'clan_id',
    'clanid', 'clan id', 'faction', 'faction_id', 'factionid', 'faction id',
    'squad', 'squad_id', 'squadid', 'squad id',
    // Spanish
    'casa', 'equipo', 'grupo',
    // French
    'maison', 'equipe', 'groupe',
  ],

  // HOMEROOM/TEACHER - 20+ variations
  homeroom: [
    'homeroom', 'home_room', 'home room', 'homeroom_teacher', 'homeroomteacher',
    'homeroom teacher', 'hr', 'hr_teacher', 'hrteacher', 'hr teacher',
    'advisory', 'advisor', 'adviser', 'form_teacher', 'formteacher', 'form teacher',
    'class_teacher', 'classteacher', 'class teacher', 'tutor', 'tutor_group',
    'tutorgroup', 'tutor group', 'mentor', 'mentor_group', 'mentorgroup',
    // Spanish
    'profesor_guia', 'profesor guia', 'tutor', 'aula',
  ],
};

// ==================
// DEFAULT CONFIGURATIONS
// ==================

export const DEFAULT_HOUSES = [
  { id: 'house-phoenix', name: 'Blazing Phoenix', mascotId: 'phoenix', color: '#ef4444', score: 0, gradeLevel: 6 },
  { id: 'house-wolf', name: 'Storm Wolves', mascotId: 'wolf', color: '#3b82f6', score: 0, gradeLevel: 7 },
  { id: 'house-hawk', name: 'Thunder Hawks', mascotId: 'hawk', color: '#8b5cf6', score: 0, gradeLevel: 8 },
];

export const DEFAULT_INFRACTION_LABELS = [
  'Tardy', 'Dress Code', 'Disruption', 'Tech Misuse', 
  'Profanity', 'Defiance', 'Horseplay', 'Out of Area'
];

export const DEFAULT_INCENTIVE_LABELS = [
  'Helping Others', 'Participation', 'Excellence', 'Leadership', 'Kindness',
  'Perfect Attendance', 'Homework Complete'
];

export const DEFAULT_PASS_DESTINATIONS = [
  'Bathroom', 'Water', 'Office', 'Library', 'Clinic', 
  'Guidance', 'Locker', 'Classroom', 'Student Services', 'Cafeteria'
];

export const DEFAULT_LABELS_CONFIG = {
  infractionButtons: DEFAULT_INFRACTION_LABELS,
  incentiveButtons: DEFAULT_INCENTIVE_LABELS,
  passDestinations: DEFAULT_PASS_DESTINATIONS,
  maxDisplayedDestinations: 8,
};

export const DEFAULT_ECONOMY = {
  studentPointRatio: 0.4,
  teamPointRatio: 0.6,
  infractionPointPenalty: 1,
  tardyPointPenalty: 1,
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
    { id: 'p7', name: 'Period 7', start: '14:10', end: '15:00' },
  ],
  gracePeriodMinutes: 5,
  passingTime: 5,
};

export const DEFAULT_KIOSK = {
  enabled: false,
  exitPin: '1234',
  autoLogoutSeconds: 60,
  showStudentPhoto: false,
  requireDestinationSelection: true,
  allowedDestinations: DEFAULT_PASS_DESTINATIONS,
  requireId: false,
  autoLogTardy: true,
  tardyThresholdMinutes: 5,
};

export const DEFAULT_SETTINGS = {
  passOvertimeAlertMinutes: 10,
  maxPerDestination: 5,
  conflictAlertsEnabled: true,
  autoReturnMinutes: 30,
  requireDestinationSelection: true,
  allowStudentSelfCheckout: false,
  tardyCreatesPass: true,
  maxActivePassesPerTeacher: 3,
  tardyStreakThreshold: 4,
  customBotMessages: [],
};

export const PASS_DURATION_ESTIMATES = {
  'Bathroom': 5,
  'Water': 2,
  'Office': 10,
  'Library': 15,
  'Clinic': 15,
  'Guidance': 20,
  'Locker': 3,
  'Classroom': 5,
  'Student Services': 15,
  'Main Office': 10,
  'Cafeteria': 10,
  'Other': 10,
  'default': 10,
};

export const MTSS_TIERS = {
  TIER_1: { min: 0, max: 5, label: 'Tier 1', color: '#22c55e', description: 'Universal Support' },
  TIER_2: { min: 6, max: 9, label: 'Tier 2', color: '#f59e0b', description: 'Targeted Intervention' },
  TIER_3: { min: 10, max: Infinity, label: 'Tier 3', color: '#ef4444', description: 'Intensive Support' },
};

export const LOG_TYPES = {
  PASS: 'PASS',
  RETURN: 'RETURN',
  INFRACTION: 'INFRACTION',
  INCENTIVE: 'INCENTIVE',
  TARDY: 'TARDY',
  INTERVENTION: 'INTERVENTION',
  LOCKDOWN: 'LOCKDOWN',
  HOUSE_ASSIGNMENT: 'HOUSE_ASSIGNMENT',
  BULK_HOUSE_ASSIGNMENT: 'BULK_HOUSE_ASSIGNMENT',
  ROSTER_UPLOAD: 'ROSTER_UPLOAD',
};

export const SAFE_LOCATIONS = ['Office', 'Clinic', 'Student Services', 'Guidance', 'Main Office'];

export const QR_TYPES = {
  STUDENT: 'STUDENT',
  TEACHER_ROOM: 'TEACHER_ROOM',
  KIOSK: 'KIOSK',
  PASS: 'PASS',
};

// ==================
// HELPER FUNCTIONS
// ==================

/**
 * Get mascot by ID
 */
export function getMascotById(mascotId) {
  return MASCOT_POOL.find(m => m.id === mascotId) || MASCOT_POOL[0];
}

/**
 * Get random mascot
 */
export function getRandomMascot() {
  return MASCOT_POOL[Math.floor(Math.random() * MASCOT_POOL.length)];
}

/**
 * Get N random unique mascots (for house creation)
 */
export function getRandomMascots(count, excludeIds = []) {
  const available = MASCOT_POOL.filter(m => !excludeIds.includes(m.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get estimated pass duration
 */
export function getEstimatedDuration(destination) {
  return PASS_DURATION_ESTIMATES[destination] || PASS_DURATION_ESTIMATES['default'];
}

/**
 * Get MTSS tier for a score
 */
export function getMTSSTier(score) {
  if (score <= MTSS_TIERS.TIER_1.max) return MTSS_TIERS.TIER_1;
  if (score <= MTSS_TIERS.TIER_2.max) return MTSS_TIERS.TIER_2;
  return MTSS_TIERS.TIER_3;
}

/**
 * Format duration as MM:SS
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get elapsed time from timestamp
 */
export function getTimeElapsed(startTimestamp) {
  if (!startTimestamp) return '0:00';
  const startSeconds = startTimestamp.seconds || startTimestamp / 1000;
  const elapsed = Math.floor(Date.now() / 1000 - startSeconds);
  return formatDuration(Math.max(0, elapsed));
}

/**
 * Check if pass is overtime
 */
export function isPassOvertime(pass, alertMinutes = 10) {
  if (!pass?.startedAt) return false;
  const startSeconds = pass.startedAt.seconds || pass.startedAt / 1000;
  const elapsedMinutes = (Date.now() / 1000 - startSeconds) / 60;
  return elapsedMinutes > alertMinutes;
}

// ==================
// FUZZY MATCHING UTILITIES
// ==================

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity score (0-1, higher = more similar)
 */
export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

/**
 * Normalize string for comparison (remove accents, special chars)
 */
export function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Check if two names are likely the same person
 */
export function areNamesSimilar(name1, name2, threshold = 0.8) {
  if (!name1 || !name2) return false;
  
  const n1 = normalizeString(name1);
  const n2 = normalizeString(name2);
  if (n1 === n2) return true;
  
  const similarity = stringSimilarity(name1, name2);
  if (similarity >= threshold) return true;
  
  const parts1 = name1.toLowerCase().split(/\s+/).filter(Boolean);
  const parts2 = name2.toLowerCase().split(/\s+/).filter(Boolean);
  
  if (parts1.length >= 2 && parts2.length >= 2) {
    const reversed1 = [...parts1].reverse().join(' ');
    if (stringSimilarity(reversed1, name2.toLowerCase()) >= threshold) return true;
  }
  
  return false;
}

/**
 * Find best matching column from fuzzy dictionary
 */
export function findBestColumnMatch(header, fieldName) {
  if (!header || !fieldName) return { match: false, confidence: 0 };
  
  const dictionary = FUZZY_COLUMNS[fieldName];
  if (!dictionary) return { match: false, confidence: 0 };
  
  const normalizedHeader = normalizeString(header);
  
  for (const alias of dictionary) {
    const normalizedAlias = normalizeString(alias);
    if (normalizedHeader === normalizedAlias) {
      return { match: true, confidence: 1.0, method: 'exact' };
    }
  }
  
  let bestSimilarity = 0;
  for (const alias of dictionary) {
    const similarity = stringSimilarity(header, alias);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
    }
  }
  
  if (bestSimilarity >= 0.8) {
    return { match: true, confidence: bestSimilarity, method: 'fuzzy' };
  }
  
  for (const alias of dictionary) {
    const normalizedAlias = normalizeString(alias);
    if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
      if (normalizedHeader.length >= 2 && normalizedAlias.length >= 2) {
        return { match: true, confidence: 0.7, method: 'partial' };
      }
    }
  }
  
  return { match: false, confidence: bestSimilarity, method: null };
}

/**
 * Fuzzy search students by name
 */
export function fuzzySearchStudents(students, query, limit = 10) {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = normalizeString(query);
  const results = [];
  
  for (const student of students) {
    const normalizedName = normalizeString(student.full_name || '');
    const normalizedId = normalizeString(student.student_id_number || '');
    
    if (normalizedName.includes(normalizedQuery) || normalizedId.includes(normalizedQuery)) {
      results.push({ student, score: 1.0, method: 'contains' });
      continue;
    }
    
    const nameSimilarity = stringSimilarity(query, student.full_name || '');
    if (nameSimilarity >= 0.6) {
      results.push({ student, score: nameSimilarity, method: 'fuzzy' });
      continue;
    }
    
    const nameParts = (student.full_name || '').toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (stringSimilarity(query.toLowerCase(), part) >= 0.7) {
        results.push({ student, score: 0.7, method: 'partial' });
        break;
      }
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(r => r.student);
}

// ==================
// DEFAULT EXPORT
// ==================
export default {
  PRIORITY,
  BROADCAST_PRIORITY,
  MASCOT_POOL,
  BATTLE_MILESTONES,
  FUZZY_COLUMNS,
  DEFAULT_HOUSES,
  DEFAULT_LABELS_CONFIG,
  DEFAULT_INFRACTION_LABELS,
  DEFAULT_INCENTIVE_LABELS,
  DEFAULT_PASS_DESTINATIONS,
  DEFAULT_ECONOMY,
  DEFAULT_BELL_SCHEDULE,
  DEFAULT_KIOSK,
  DEFAULT_SETTINGS,
  PASS_DURATION_ESTIMATES,
  MTSS_TIERS,
  LOG_TYPES,
  SAFE_LOCATIONS,
  QR_TYPES,
  getMTSSTier,
  getMascotById,
  getRandomMascot,
  getRandomMascots,
  getEstimatedDuration,
  formatDuration,
  getTimeElapsed,
  isPassOvertime,
  levenshteinDistance,
  stringSimilarity,
  normalizeString,
  areNamesSimilar,
  findBestColumnMatch,
  fuzzySearchStudents,
};
