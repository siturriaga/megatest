/**
 * Data validation schemas and validators
 * Ensures data integrity before Firestore writes
 */

/**
 * Validates a student object
 * @param {object} student - Student data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateStudent(student) {
  const errors = [];
  const sanitized = {};

  // Required fields
  if (!student.full_name || typeof student.full_name !== 'string') {
    errors.push('Full name is required');
  } else {
    sanitized.full_name = student.full_name.trim().slice(0, 100);
    if (sanitized.full_name.length < 2) {
      errors.push('Full name must be at least 2 characters');
    }
  }

  if (!student.student_id_number || typeof student.student_id_number !== 'string') {
    errors.push('Student ID is required');
  } else {
    sanitized.student_id_number = student.student_id_number.trim().toUpperCase().slice(0, 20);
  }

  // Grade level
  const grade = parseInt(student.grade_level, 10);
  if (isNaN(grade) || grade < 1 || grade > 12) {
    errors.push('Grade level must be between 1 and 12');
  } else {
    sanitized.grade_level = grade;
  }

  // Optional fields with defaults
  sanitized.houseId = student.houseId || null;
  sanitized.status = ['IN', 'OUT'].includes(student.status) ? student.status : 'IN';
  sanitized.current_destination = student.current_destination || null;
  sanitized.incentive_points_student = Math.max(0, parseInt(student.incentive_points_student, 10) || 0);
  sanitized.incentive_points_team = Math.max(0, parseInt(student.incentive_points_team, 10) || 0);
  sanitized.mtss_score = Math.max(0, Math.min(100, parseInt(student.mtss_score, 10) || 0));
  sanitized.infraction_count = Math.max(0, parseInt(student.infraction_count, 10) || 0);
  sanitized.tardy_count = Math.max(0, parseInt(student.tardy_count, 10) || 0);
  sanitized.tardy_streak = Math.max(0, parseInt(student.tardy_streak, 10) || 0);

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates a pass object
 * @param {object} pass - Pass data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validatePass(pass) {
  const errors = [];
  const sanitized = {};

  if (!pass.studentId || typeof pass.studentId !== 'string') {
    errors.push('Student ID is required');
  } else {
    sanitized.studentId = pass.studentId.trim();
  }

  if (!pass.studentName || typeof pass.studentName !== 'string') {
    errors.push('Student name is required');
  } else {
    sanitized.studentName = pass.studentName.trim().slice(0, 100);
  }

  if (!pass.destination || typeof pass.destination !== 'string') {
    errors.push('Destination is required');
  } else {
    sanitized.destination = pass.destination.trim().slice(0, 50);
  }

  // Optional fields
  sanitized.studentGrade = parseInt(pass.studentGrade, 10) || null;
  sanitized.originRoom = (pass.originRoom || '').trim().slice(0, 50);
  sanitized.teacherEmail = (pass.teacherEmail || '').trim().toLowerCase();
  sanitized.teacherName = (pass.teacherName || '').trim().slice(0, 100);
  sanitized.employeeId = (pass.employeeId || '').trim().toUpperCase().slice(0, 20);
  sanitized.expectedDurationSec = Math.max(60, Math.min(3600, parseInt(pass.expectedDurationSec, 10) || 600));
  sanitized.status = ['ACTIVE', 'ENDED'].includes(pass.status) ? pass.status : 'ACTIVE';

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates a log entry
 * @param {object} log - Log data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateLogEntry(log) {
  const errors = [];
  const sanitized = {};

  const validTypes = ['PASS', 'RETURN', 'INFRACTION', 'INCENTIVE', 'TARDY'];
  if (!validTypes.includes(log.type)) {
    errors.push('Invalid log type');
  } else {
    sanitized.type = log.type;
  }

  if (!log.studentId || typeof log.studentId !== 'string') {
    errors.push('Student ID is required');
  } else {
    sanitized.studentId = log.studentId.trim();
  }

  if (!log.studentName || typeof log.studentName !== 'string') {
    errors.push('Student name is required');
  } else {
    sanitized.studentName = log.studentName.trim().slice(0, 100);
  }

  sanitized.detail = (log.detail || '').trim().slice(0, 200);
  sanitized.byEmail = (log.byEmail || '').trim().toLowerCase();
  sanitized.employeeId = (log.employeeId || '').trim().toUpperCase().slice(0, 20);
  sanitized.points = parseInt(log.points, 10) || 0;
  sanitized.teamPoints = parseInt(log.teamPoints, 10) || 0;

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates a broadcast message
 * @param {object} broadcast - Broadcast data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateBroadcast(broadcast) {
  const errors = [];
  const sanitized = {};

  if (!broadcast.message || typeof broadcast.message !== 'string') {
    errors.push('Message is required');
  } else {
    sanitized.message = broadcast.message.trim().slice(0, 500);
    if (sanitized.message.length < 1) {
      errors.push('Message cannot be empty');
    }
  }

  const validPriorities = ['normal', 'important', 'urgent'];
  sanitized.priority = validPriorities.includes(broadcast.priority) ? broadcast.priority : 'normal';

  const validAudiences = ['All Staff', 'Teachers Only', 'Admins Only'];
  sanitized.targetAudience = validAudiences.includes(broadcast.targetAudience) ? broadcast.targetAudience : 'All Staff';

  sanitized.senderName = (broadcast.senderName || '').trim().slice(0, 100);
  sanitized.senderEmail = (broadcast.senderEmail || '').trim().toLowerCase();
  sanitized.pinned = Boolean(broadcast.pinned);

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates a conflict group
 * @param {object} group - Conflict group data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateConflictGroup(group) {
  const errors = [];
  const sanitized = {};

  if (!group.name || typeof group.name !== 'string') {
    errors.push('Group name is required');
  } else {
    sanitized.name = group.name.trim().slice(0, 50);
    if (sanitized.name.length < 2) {
      errors.push('Group name must be at least 2 characters');
    }
  }

  if (!Array.isArray(group.members) || group.members.length < 2) {
    errors.push('At least 2 members are required');
  } else {
    sanitized.members = group.members
      .filter(m => typeof m === 'string' && m.trim())
      .map(m => m.trim())
      .slice(0, 20); // Max 20 members per group
    
    if (sanitized.members.length < 2) {
      errors.push('At least 2 valid members are required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates parent contact log
 * @param {object} contact - Contact data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateParentContact(contact) {
  const errors = [];
  const sanitized = {};

  if (!contact.studentId || typeof contact.studentId !== 'string') {
    errors.push('Student ID is required');
  } else {
    sanitized.studentId = contact.studentId.trim();
  }

  sanitized.studentName = (contact.studentName || '').trim().slice(0, 100);
  
  if (Array.isArray(contact.interventions)) {
    sanitized.interventions = contact.interventions
      .filter(i => typeof i === 'string')
      .map(i => i.trim().slice(0, 100))
      .slice(0, 20);
  } else {
    sanitized.interventions = [];
  }

  sanitized.contactMade = Boolean(contact.contactMade);
  
  const validMethods = ['phone', 'email', 'inPerson', 'letter', 'other'];
  sanitized.contactMethod = validMethods.includes(contact.contactMethod) ? contact.contactMethod : 'phone';
  
  sanitized.contactDate = contact.contactDate || '';
  sanitized.contactTime = contact.contactTime || '';
  sanitized.noContactReason = (contact.noContactReason || '').trim().slice(0, 200);
  sanitized.notes = (contact.notes || '').trim().slice(0, 1000);
  sanitized.teacherEmail = (contact.teacherEmail || '').trim().toLowerCase();

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates school creation data
 * @param {object} school - School data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateSchool(school) {
  const errors = [];
  const sanitized = {};

  if (!school.name || typeof school.name !== 'string') {
    errors.push('School name is required');
  } else {
    sanitized.name = school.name.trim().slice(0, 100);
    if (sanitized.name.length < 2) {
      errors.push('School name must be at least 2 characters');
    }
    // Allow letters (including accented), numbers, spaces, hyphens, apostrophes, periods
    // Unicode letter property \p{L} matches any letter in any language
    if (!/^[\p{L}\p{N}\s\-'.]+$/u.test(sanitized.name)) {
      errors.push('School name contains invalid characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validates configuration updates
 * @param {string} configType - Type of config being updated
 * @param {object} data - Config data to validate
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validateConfig(configType, data) {
  const errors = [];
  let sanitized = {};

  switch (configType) {
    case 'labels':
      sanitized = {
        infractionButtons: Array.isArray(data.infractionButtons) 
          ? data.infractionButtons.filter(b => typeof b === 'string').map(b => b.trim().slice(0, 30)).slice(0, 20)
          : [],
        incentiveButtons: Array.isArray(data.incentiveButtons)
          ? data.incentiveButtons.filter(b => typeof b === 'string').map(b => b.trim().slice(0, 30)).slice(0, 20)
          : [],
        passDestinations: Array.isArray(data.passDestinations)
          ? data.passDestinations.filter(d => typeof d === 'string').map(d => d.trim().slice(0, 30)).slice(0, 20)
          : [],
        maxDisplayedDestinations: Math.max(4, Math.min(12, parseInt(data.maxDisplayedDestinations, 10) || 8))
      };
      break;

    case 'economy':
      const studentRatio = parseFloat(data.studentPointRatio);
      const teamRatio = parseFloat(data.teamPointRatio);
      
      // Allow 0 as a valid value (don't use || fallback which treats 0 as falsy)
      const validStudentRatio = !isNaN(studentRatio) && studentRatio >= 0 && studentRatio <= 1;
      const validTeamRatio = !isNaN(teamRatio) && teamRatio >= 0 && teamRatio <= 1;
      
      if (!validStudentRatio) {
        errors.push('Student point ratio must be between 0 and 1');
      }
      if (!validTeamRatio) {
        errors.push('Team point ratio must be between 0 and 1');
      }
      
      sanitized = {
        studentPointRatio: validStudentRatio ? studentRatio : 0.4,
        teamPointRatio: validTeamRatio ? teamRatio : 0.6
      };
      break;

    case 'settings':
      sanitized = {
        passOvertimeMinutes: Math.max(5, Math.min(60, parseInt(data.passOvertimeMinutes, 10) || 10)),
        maxCapacityPerDestination: Math.max(1, Math.min(50, parseInt(data.maxCapacityPerDestination, 10) || 5)),
        conflictAlertsEnabled: Boolean(data.conflictAlertsEnabled),
        tardyStreakThreshold: Math.max(1, Math.min(20, parseInt(data.tardyStreakThreshold, 10) || 4)),
        customBotMessages: Array.isArray(data.customBotMessages)
          ? data.customBotMessages.filter(m => m && typeof m.text === 'string').slice(0, 10)
          : []
      };
      break;

    default:
      errors.push('Unknown config type');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  };
}
