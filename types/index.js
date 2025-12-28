/**
 * STRIDE Application Type Definitions
 * These provide IDE autocomplete and documentation even without full TypeScript
 */

// ============================================
// USER TYPES
// ============================================

/**
 * @typedef {'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'HALL_MONITOR' | 'KIOSK'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} uid - Firebase Auth UID
 * @property {string} email - User email
 * @property {string} displayName - Display name
 * @property {UserRole} role - User role
 * @property {string} employee_id - Employee ID
 * @property {string|null} school_id - Assigned school ID
 * @property {boolean} aup_accepted - AUP acceptance status
 * @property {string|null} aup_version - Accepted AUP version
 * @property {import('firebase/firestore').Timestamp} created_at - Creation timestamp
 */

/**
 * @typedef {Object} UserGreeting
 * @property {string} firstName - First name
 * @property {string} fullName - Full name
 * @property {string} email - Email address
 */

// ============================================
// STUDENT TYPES
// ============================================

/**
 * @typedef {'IN' | 'OUT'} StudentStatus
 */

/**
 * @typedef {Object} Student
 * @property {string} id - Document ID
 * @property {string} full_name - Student's full name
 * @property {string} student_id_number - Student ID number
 * @property {number} grade_level - Grade level (1-12)
 * @property {string|null} houseId - Assigned house ID
 * @property {StudentStatus} status - Current status
 * @property {string|null} current_destination - Current destination if OUT
 * @property {number} incentive_points_student - Personal incentive points
 * @property {number} incentive_points_team - Team contribution points
 * @property {number} mtss_score - MTSS behavior score
 * @property {number} infraction_count - Total infractions
 * @property {number} tardy_count - Total tardies
 * @property {number} tardy_streak - Current tardy streak
 * @property {string} [qr_data] - QR code data
 * @property {import('firebase/firestore').Timestamp} [last_pass_start] - Last pass start time
 */

// ============================================
// PASS TYPES
// ============================================

/**
 * @typedef {'ACTIVE' | 'ENDED'} PassStatus
 */

/**
 * @typedef {Object} ActivePass
 * @property {string} id - Document ID
 * @property {string} studentId - Student document ID
 * @property {string} studentName - Student's name
 * @property {number|null} studentGrade - Student's grade
 * @property {string} destination - Pass destination
 * @property {string} originRoom - Origin room
 * @property {string} teacherEmail - Issuing teacher's email
 * @property {string} teacherName - Issuing teacher's name
 * @property {string} employeeId - Teacher's employee ID
 * @property {import('firebase/firestore').Timestamp} startedAt - Pass start time
 * @property {number} expectedDurationSec - Expected duration in seconds
 * @property {PassStatus} status - Pass status
 * @property {import('firebase/firestore').Timestamp} [endedAt] - Pass end time
 */

// ============================================
// LOG TYPES
// ============================================

/**
 * @typedef {'PASS' | 'RETURN' | 'INFRACTION' | 'INCENTIVE' | 'TARDY'} LogType
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} id - Document ID
 * @property {LogType} type - Log entry type
 * @property {string} studentId - Student document ID
 * @property {string} studentName - Student's name
 * @property {string} detail - Log detail/description
 * @property {string} byEmail - Logger's email
 * @property {string} employeeId - Logger's employee ID
 * @property {number} [points] - Points (for INCENTIVE)
 * @property {number} [teamPoints] - Team points (for INCENTIVE)
 * @property {import('firebase/firestore').Timestamp} ts - Timestamp
 */

// ============================================
// HOUSE TYPES
// ============================================

/**
 * @typedef {Object} House
 * @property {string} id - Document ID
 * @property {string} name - House name
 * @property {string} mascot - Mascot emoji
 * @property {string} color - House color (hex)
 * @property {number} score - Total points
 * @property {string} [motto] - House motto
 */

// ============================================
// SAFETY TYPES
// ============================================

/**
 * @typedef {Object} ConflictGroup
 * @property {string} id - Document ID
 * @property {string} name - Group name
 * @property {string[]} members - Array of student IDs
 * @property {import('firebase/firestore').Timestamp} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} LockdownMeta
 * @property {string} activatedBy - Email of activator
 * @property {import('firebase/firestore').Timestamp} activatedAt - Activation time
 */

// ============================================
// COMMUNICATION TYPES
// ============================================

/**
 * @typedef {'normal' | 'important' | 'urgent'} BroadcastPriority
 */

/**
 * @typedef {'All Staff' | 'Teachers Only' | 'Admins Only'} TargetAudience
 */

/**
 * @typedef {Object} Broadcast
 * @property {string} id - Document ID
 * @property {string} message - Broadcast message
 * @property {BroadcastPriority} priority - Priority level
 * @property {TargetAudience} targetAudience - Target audience
 * @property {string} senderName - Sender's name
 * @property {string} senderEmail - Sender's email
 * @property {import('firebase/firestore').Timestamp} ts - Timestamp
 * @property {boolean} pinned - Pin status
 */

// ============================================
// PARENT CONTACT TYPES
// ============================================

/**
 * @typedef {'phone' | 'email' | 'inPerson' | 'letter' | 'other'} ContactMethod
 */

/**
 * @typedef {Object} ParentContact
 * @property {string} id - Document ID
 * @property {string} studentId - Student document ID
 * @property {string} studentName - Student's name
 * @property {string[]} interventions - List of interventions tried
 * @property {boolean} contactMade - Whether contact was made
 * @property {ContactMethod} contactMethod - Contact method used
 * @property {string} contactDate - Date of contact
 * @property {string} contactTime - Time of contact
 * @property {string} [noContactReason] - Reason if no contact made
 * @property {string} notes - Additional notes
 * @property {string} teacherEmail - Teacher's email
 * @property {import('firebase/firestore').Timestamp} ts - Timestamp
 */

// ============================================
// CONFIG TYPES
// ============================================

/**
 * @typedef {Object} LabelsConfig
 * @property {string[]} infractionButtons - Infraction button labels
 * @property {string[]} incentiveButtons - Incentive button labels
 * @property {string[]} passDestinations - Pass destination options
 * @property {number} maxDisplayedDestinations - Max destinations to show
 */

/**
 * @typedef {Object} Period
 * @property {string} id - Period ID
 * @property {string} name - Period name
 * @property {string} start - Start time (HH:MM)
 * @property {string} end - End time (HH:MM)
 */

/**
 * @typedef {Object} BellSchedule
 * @property {Period[]} periods - Array of periods
 * @property {number} passingTime - Passing time in minutes
 * @property {number} gracePeriodMinutes - Grace period in minutes
 */

/**
 * @typedef {Object} EconomyConfig
 * @property {number} studentPointRatio - Student point ratio (0-1)
 * @property {number} teamPointRatio - Team point ratio (0-1)
 * @property {boolean} [rewardsEnabled] - Whether rewards are enabled
 * @property {Array<{id: string, name: string, cost: number}>} [rewards] - Available rewards
 */

/**
 * @typedef {Object} KioskConfig
 * @property {boolean} enabled - Kiosk mode enabled
 * @property {boolean} requireId - Require ID for check-in
 * @property {boolean} autoLogTardy - Auto-log tardies
 * @property {number} tardyThresholdMinutes - Tardy threshold
 * @property {boolean} requirePhoto - Require photo verification
 */

/**
 * @typedef {Object} SettingsConfig
 * @property {number} passOvertimeMinutes - Pass overtime threshold
 * @property {number} maxActivePassesPerTeacher - Max passes per teacher
 * @property {boolean} conflictAlertsEnabled - Enable conflict alerts
 * @property {number} autoReturnMinutes - Auto-return threshold
 * @property {Array<{text: string}>} customBotMessages - Custom StrideBot messages
 * @property {number} maxCapacityPerDestination - Max capacity per destination
 * @property {number} tardyStreakThreshold - Tardy streak threshold
 */

// ============================================
// SCHOOL TYPES
// ============================================

/**
 * @typedef {Object} School
 * @property {string} id - Document ID (also the school code)
 * @property {string} name - School name
 * @property {string} code - School code
 * @property {boolean} lockdown - Lockdown status
 * @property {LockdownMeta|null} lockdownMeta - Lockdown metadata
 * @property {import('firebase/firestore').Timestamp} created_at - Creation timestamp
 * @property {string} created_by - Creator email
 */

// ============================================
// MTSS TYPES
// ============================================

/**
 * @typedef {'Universal' | 'Targeted' | 'Intensive' | 'Critical'} MTSSTierLabel
 */

/**
 * @typedef {Object} MTSSTier
 * @property {number} min - Minimum score
 * @property {number} max - Maximum score
 * @property {MTSSTierLabel} label - Tier label
 * @property {string} color - Tier color name
 */

// ============================================
// STRIDEBOT TYPES
// ============================================

/**
 * @typedef {'happy' | 'party' | 'high5' | 'scan' | 'wellness' | 'warn' | 'sad' | 'siren' | 'alert' | 'guide' | 'waitlist'} StrideBotMood
 */

/**
 * @typedef {Object} StrideBotAction
 * @property {string} action - Action type
 * @property {string} label - Action label
 * @property {string} [passId] - Pass ID for return actions
 */

/**
 * @typedef {Object} StrideBotPushContext
 * @property {string} [name] - User name
 * @property {string} [student] - Student name
 * @property {string} [destination] - Destination
 * @property {number} [minutes] - Minutes elapsed
 * @property {string} [sender] - Message sender
 * @property {string} [message] - Message content
 * @property {number} [position] - Waitlist position
 * @property {StrideBotAction[]} [actions] - Available actions
 */

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * @typedef {Object} AnalyticsData
 * @property {number} totalPasses - Total passes issued
 * @property {number} totalInfractions - Total infractions
 * @property {number} totalIncentives - Total incentives
 * @property {number} totalTardies - Total tardies
 * @property {number} activeNow - Currently active passes
 */

/**
 * @typedef {Object} LockdownReport
 * @property {string} timestamp - Report timestamp
 * @property {string} school - School name
 * @property {boolean} lockdownActive - Lockdown status
 * @property {number} studentsOut - Number of students out
 * @property {Array<{name: string, destination: string, startedAt: string}>} students - Students currently out
 */

// ============================================
// THEME TYPES
// ============================================

/**
 * @typedef {'aero' | 'obsidian' | 'eclipse'} Theme
 */

// Export for IDE support
module.exports = {};
