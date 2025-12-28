export const COLLECTIONS = {
  USERS: 'users',
  SCHOOLS: 'schools',
};

export const SCHOOL_SUBCOLLECTIONS = {
  STUDENTS: 'students',
  LOGS: 'logs',
  ACTIVE_PASSES: 'active_passes',
  HOUSES: 'houses',
  CONFLICT_GROUPS: 'conflictGroups',
  SCHOOL_CONFIGS: 'school_configs',
  BOX_QUEUE: 'box_queue',
  SCAN_LOGS: 'scan_logs',
  WAITLIST: 'waitlist',
};

export const CONFIG_DOCS = {
  LABELS: 'labels',
  BELL_SCHEDULE: 'bell_schedule',
  ECONOMY: 'economy',
  KIOSK: 'kiosk',
  SETTINGS: 'settings',
  HOUSES: 'houses_config',
};

export const studentsPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.STUDENTS}`;
export const logsPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.LOGS}`;
export const activePassesPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.ACTIVE_PASSES}`;
export const housesPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.HOUSES}`;
export const conflictGroupsPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.CONFLICT_GROUPS}`;
export const configPath = (schoolId, configDoc) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.SCHOOL_CONFIGS}/${configDoc}`;
export const boxQueuePath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.BOX_QUEUE}`;
export const waitlistPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/${SCHOOL_SUBCOLLECTIONS.WAITLIST}`;
export const broadcastsPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/broadcasts`;
export const parentContactsPath = (schoolId) => `${COLLECTIONS.SCHOOLS}/${schoolId}/parentContacts`;
