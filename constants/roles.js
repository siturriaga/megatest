export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPERADMIN: 'SUPER_ADMIN', // Alias for compatibility
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  HALL_MONITOR: 'HALL_MONITOR',
  KIOSK: 'KIOSK'
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.SCHOOL_ADMIN]: 80,
  [ROLES.TEACHER]: 50,
  [ROLES.HALL_MONITOR]: 30,
  [ROLES.KIOSK]: 10
};

export const isAdminOrAbove = (role) => {
  const level = ROLE_HIERARCHY[role] || 0;
  return level >= ROLE_HIERARCHY[ROLES.SCHOOL_ADMIN];
};

export const isSuperAdmin = (role) => {
  return role === ROLES.SUPER_ADMIN || role === 'SUPER_ADMIN';
};

export const canManageUsers = (role) => {
  return isAdminOrAbove(role);
};

export const canViewAnalytics = (role) => {
  const level = ROLE_HIERARCHY[role] || 0;
  return level >= ROLE_HIERARCHY[ROLES.TEACHER];
};

export const canIssuePasses = (role) => {
  const level = ROLE_HIERARCHY[role] || 0;
  return level >= ROLE_HIERARCHY[ROLES.HALL_MONITOR];
};

export const canToggleLockdown = (role) => {
  return isAdminOrAbove(role);
};
