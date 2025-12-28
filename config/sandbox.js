const now = Date.now();

export const SANDBOX_STUDENTS = [
  { id: 'sandbox-student-1', full_name: 'Marcus Johnson', student_id_number: 'STU001', grade_level: 9, houseId: 'house-0', status: 'IN', current_destination: null, incentive_points_student: 45, incentive_points_team: 30, mtss_score: 2, infraction_count: 1, tardy_count: 2, tardy_streak: 0 },
  { id: 'sandbox-student-2', full_name: 'Sofia Rodriguez', student_id_number: 'STU002', grade_level: 10, houseId: 'house-1', status: 'IN', current_destination: null, incentive_points_student: 120, incentive_points_team: 80, mtss_score: 0, infraction_count: 0, tardy_count: 0, tardy_streak: 0 },
  { id: 'sandbox-student-3', full_name: 'Jaylen Williams', student_id_number: 'STU003', grade_level: 9, houseId: 'house-0', status: 'IN', current_destination: null, incentive_points_student: 15, incentive_points_team: 10, mtss_score: 8, infraction_count: 5, tardy_count: 12, tardy_streak: 3 },
  { id: 'sandbox-student-4', full_name: 'Emma Chen', student_id_number: 'STU004', grade_level: 11, houseId: 'house-2', status: 'IN', current_destination: null, incentive_points_student: 200, incentive_points_team: 130, mtss_score: 0, infraction_count: 0, tardy_count: 1, tardy_streak: 0 },
  { id: 'sandbox-student-5', full_name: 'DeShawn Brown', student_id_number: 'STU005', grade_level: 10, houseId: 'house-1', status: 'IN', current_destination: null, incentive_points_student: 55, incentive_points_team: 35, mtss_score: 4, infraction_count: 2, tardy_count: 5, tardy_streak: 1 },
  { id: 'sandbox-student-6', full_name: 'Aaliyah Davis', student_id_number: 'STU006', grade_level: 12, houseId: 'house-3', status: 'IN', current_destination: null, incentive_points_student: 180, incentive_points_team: 120, mtss_score: 1, infraction_count: 1, tardy_count: 2, tardy_streak: 0 },
  { id: 'sandbox-student-7', full_name: 'Tyler Martinez', student_id_number: 'STU007', grade_level: 9, houseId: 'house-0', status: 'IN', current_destination: null, incentive_points_student: 25, incentive_points_team: 15, mtss_score: 11, infraction_count: 7, tardy_count: 15, tardy_streak: 4 },
  { id: 'sandbox-student-8', full_name: 'Zoe Thompson', student_id_number: 'STU008', grade_level: 11, houseId: 'house-2', status: 'IN', current_destination: null, incentive_points_student: 90, incentive_points_team: 60, mtss_score: 0, infraction_count: 0, tardy_count: 0, tardy_streak: 0 },
  { id: 'sandbox-student-9', full_name: 'Jordan Lee', student_id_number: 'STU009', grade_level: 10, houseId: 'house-1', status: 'IN', current_destination: null, incentive_points_student: 75, incentive_points_team: 50, mtss_score: 3, infraction_count: 2, tardy_count: 4, tardy_streak: 0 },
  { id: 'sandbox-student-10', full_name: 'Mia Anderson', student_id_number: 'STU010', grade_level: 12, houseId: 'house-3', status: 'IN', current_destination: null, incentive_points_student: 150, incentive_points_team: 100, mtss_score: 0, infraction_count: 0, tardy_count: 1, tardy_streak: 0 },
  { id: 'sandbox-student-11', full_name: 'Elijah Garcia', student_id_number: 'STU011', grade_level: 9, houseId: 'house-0', status: 'IN', current_destination: null, incentive_points_student: 40, incentive_points_team: 25, mtss_score: 5, infraction_count: 3, tardy_count: 8, tardy_streak: 2 },
  { id: 'sandbox-student-12', full_name: 'Ava Wilson', student_id_number: 'STU012', grade_level: 11, houseId: 'house-2', status: 'IN', current_destination: null, incentive_points_student: 110, incentive_points_team: 70, mtss_score: 1, infraction_count: 1, tardy_count: 3, tardy_streak: 0 },
];

export const SANDBOX_HOUSES = [
  { id: 'house-0', name: 'Phoenix', mascot: '🦅', color: '#ef4444', score: 1250, motto: 'From ashes we rise' },
  { id: 'house-1', name: 'Storm Wolves', mascot: '🐺', color: '#3b82f6', score: 1180, motto: 'United we howl' },
  { id: 'house-2', name: 'Thunder Hawks', mascot: '🦅', color: '#22c55e', score: 1320, motto: 'Strength in wisdom' },
  { id: 'house-3', name: 'Shadow Panthers', mascot: '🐆', color: '#a855f7', score: 1150, motto: 'Silent but mighty' },
];

export const SANDBOX_LOGS = [
  { id: 'log-1', type: 'PASS', studentId: 'sandbox-student-1', studentName: 'Marcus Johnson', detail: 'Bathroom', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', ts: { seconds: (now - 3600000) / 1000 } },
  { id: 'log-2', type: 'RETURN', studentId: 'sandbox-student-1', studentName: 'Marcus Johnson', detail: 'Returned', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', ts: { seconds: (now - 3300000) / 1000 } },
  { id: 'log-3', type: 'INFRACTION', studentId: 'sandbox-student-3', studentName: 'Jaylen Williams', detail: 'Disruption', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: -1, ts: { seconds: (now - 86400000) / 1000 } },
  { id: 'log-4', type: 'INFRACTION', studentId: 'sandbox-student-3', studentName: 'Jaylen Williams', detail: 'Tech Misuse', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: -1, ts: { seconds: (now - 172800000) / 1000 } },
  { id: 'log-5', type: 'INFRACTION', studentId: 'sandbox-student-3', studentName: 'Jaylen Williams', detail: 'Defiance', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: -1, ts: { seconds: (now - 259200000) / 1000 } },
  { id: 'log-6', type: 'INCENTIVE', studentId: 'sandbox-student-2', studentName: 'Sofia Rodriguez', detail: 'Helping Others', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: 5, ts: { seconds: (now - 7200000) / 1000 } },
  { id: 'log-7', type: 'TARDY', studentId: 'sandbox-student-7', studentName: 'Tyler Martinez', detail: 'Late', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', ts: { seconds: (now - 14400000) / 1000 } },
  { id: 'log-8', type: 'PASS', studentId: 'sandbox-student-4', studentName: 'Emma Chen', detail: 'Library', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', ts: { seconds: (now - 1800000) / 1000 } },
  { id: 'log-9', type: 'INFRACTION', studentId: 'sandbox-student-7', studentName: 'Tyler Martinez', detail: 'Profanity', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: -1, ts: { seconds: (now - 345600000) / 1000 } },
  { id: 'log-10', type: 'INFRACTION', studentId: 'sandbox-student-7', studentName: 'Tyler Martinez', detail: 'Disruption', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: -1, ts: { seconds: (now - 432000000) / 1000 } },
  { id: 'log-11', type: 'INFRACTION', studentId: 'sandbox-student-7', studentName: 'Tyler Martinez', detail: 'Defiance', byEmail: 'teacher@dadeschools.net', employeeId: 'TEACHER', points: -1, ts: { seconds: (now - 518400000) / 1000 } },
];

export const SANDBOX_CONFIG = {
  labels: {
    infractionButtons: ['Disruption', 'Defiance', 'Tech Misuse', 'Profanity', 'Tardiness', 'Dress Code', 'Bullying', 'Fighting'],
    incentiveButtons: ['Helping Others', 'Great Participation', 'Academic Excellence', 'Leadership', 'Kindness', 'Improvement'],
    passDestinations: ['Bathroom', 'Water', 'Office', 'Library', 'Clinic', 'Student Services', 'Main Office', 'Cafeteria', 'Guidance'],
    maxDisplayedDestinations: 8,
  },
  bell_schedule: {
    periods: [
      { name: 'Period 1', start: '08:00', end: '08:50' },
      { name: 'Period 2', start: '08:55', end: '09:45' },
      { name: 'Period 3', start: '09:50', end: '10:40' },
      { name: 'Period 4', start: '10:45', end: '11:35' },
      { name: 'Lunch', start: '11:40', end: '12:20' },
      { name: 'Period 5', start: '12:25', end: '13:15' },
      { name: 'Period 6', start: '13:20', end: '14:10' },
      { name: 'Period 7', start: '14:15', end: '15:05' },
    ],
    gracePeriodMinutes: 5,
  },
  economy: { studentPointRatio: 0.4, teamPointRatio: 0.6 },
  kiosk: { enabled: true, requirePhoto: false },
  settings: { passOvertimeMinutes: 10, tardyStreakThreshold: 4, conflictAlertsEnabled: true, maxCapacityPerDestination: 5 },
};
