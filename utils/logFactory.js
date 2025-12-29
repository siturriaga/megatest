/**
 * Centralized log creation factory
 * Replaces duplicate log creation logic for PASS, INFRACTION, TARDY, INCENTIVE
 */

import { addDoc, collection, serverTimestamp, increment, doc, updateDoc } from 'firebase/firestore';
import { db } from '../app/firebase';
import { logsPath, studentsPath } from '../constants/collections';

/**
 * Log types with their configurations
 */
export const LOG_TYPES = {
  PASS: {
    type: 'PASS',
    pointsField: null,
    studentCounterField: null,
  },
  INFRACTION: {
    type: 'INFRACTION',
    pointsField: 'points',
    studentCounterField: 'infraction_count',
    mtssIncrement: 1,
    housePointDeduction: 30,
  },
  TARDY: {
    type: 'TARDY',
    pointsField: null,
    studentCounterField: 'tardy_count',
    mtssIncrement: 0.5,
  },
  INCENTIVE: {
    type: 'INCENTIVE',
    pointsField: 'points',
    studentCounterField: null,
  },
  RETURN: {
    type: 'RETURN',
    pointsField: null,
    studentCounterField: null,
  },
};

/**
 * Create a log entry for sandbox mode
 * @param {string} type - Log type (PASS, INFRACTION, TARDY, INCENTIVE)
 * @param {Object} data - Log data
 * @returns {Object} Log entry object
 */
export function createSandboxLog(type, data) {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    studentId: data.studentId,
    studentName: data.studentName,
    detail: data.detail,
    byEmail: data.byEmail,
    employeeId: data.employeeId,
    points: data.points || 0,
    teamPoints: data.teamPoints || 0,
    ts: { seconds: Date.now() / 1000 },
    destination: data.destination || null,
    duration: data.duration || null,
  };
}

/**
 * Create and save a log entry to Firestore
 * @param {string} schoolId - School ID
 * @param {string} type - Log type
 * @param {Object} data - Log data
 * @returns {Promise<string>} Document ID
 */
export async function createLog(schoolId, type, data) {
  const logConfig = LOG_TYPES[type];
  if (!logConfig) {
    throw new Error(`Invalid log type: ${type}`);
  }

  const logEntry = {
    type: logConfig.type,
    studentId: data.studentId,
    studentName: data.studentName,
    detail: data.detail,
    byEmail: data.byEmail,
    employeeId: data.employeeId,
    ts: serverTimestamp(),
  };

  // Add optional fields
  if (data.points !== undefined) {
    logEntry.points = data.points;
  }
  if (data.teamPoints !== undefined) {
    logEntry.teamPoints = data.teamPoints;
  }
  if (data.destination) {
    logEntry.destination = data.destination;
  }
  if (data.duration !== undefined) {
    logEntry.duration = data.duration;
  }
  if (data.houseId) {
    logEntry.houseId = data.houseId;
  }

  // Save to Firestore
  const logsRef = collection(db, logsPath(schoolId));
  const docRef = await addDoc(logsRef, logEntry);

  // Update student counters if applicable
  if (logConfig.studentCounterField && data.studentId) {
    const studentRef = doc(db, studentsPath(schoolId), data.studentId);
    const updates = {
      [logConfig.studentCounterField]: increment(1),
    };
    
    if (logConfig.mtssIncrement) {
      updates.mtss_score = increment(logConfig.mtssIncrement);
    }
    
    await updateDoc(studentRef, updates);
  }

  return docRef.id;
}

/**
 * Build log data object from student and action info
 * @param {Object} student - Student object
 * @param {string} detail - Action detail/label
 * @param {Object} userInfo - User info (email, employeeId)
 * @param {Object} extras - Additional fields
 * @returns {Object} Log data object
 */
export function buildLogData(student, detail, userInfo, extras = {}) {
  return {
    studentId: student.id,
    studentName: student.full_name,
    detail,
    byEmail: userInfo.email,
    employeeId: userInfo.employeeId,
    ...extras,
  };
}
