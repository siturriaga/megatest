/**
 * Centralized date/time formatting utilities
 * Replaces duplicate formatDate/formatTime functions across components
 */

/**
 * Format a Firestore timestamp to a localized date string
 * @param {Object} ts - Firestore timestamp with seconds property
 * @returns {string} Formatted date string
 */
export function formatDate(ts) {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString();
}

/**
 * Format a Firestore timestamp to a localized date and time string
 * @param {Object} ts - Firestore timestamp with seconds property
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(ts) {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleString();
}

/**
 * Format a Firestore timestamp to a localized time string
 * @param {Object} ts - Firestore timestamp with seconds property
 * @returns {string} Formatted time string
 */
export function formatTime(ts) {
  if (!ts?.seconds) return '';
  return new Date(ts.seconds * 1000).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Format elapsed seconds to MM:SS format
 * @param {number} totalSeconds - Total seconds elapsed
 * @returns {string} Formatted time string (MM:SS)
 */
export function formatElapsedTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format a date for display in relative terms
 * @param {Object} ts - Firestore timestamp with seconds property
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(ts) {
  if (!ts?.seconds) return '';
  
  const now = Date.now();
  const then = ts.seconds * 1000;
  const diff = now - then;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(ts);
}

/**
 * Format a date for formal documents (e.g., "December 28, 2025")
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Formal date string
 */
export function formatFormalDate(date) {
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get current school year string (e.g., "2025-2026")
 * @returns {string} School year string
 */
export function getCurrentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // School year starts in August
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}
