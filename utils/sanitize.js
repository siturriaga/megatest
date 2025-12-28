/**
 * Sanitization utilities for XSS prevention
 * Since we can't use DOMPurify in all contexts, we implement safe alternatives
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string safe for HTML insertion
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char]);
}

/**
 * Sanitizes a string for safe display (removes potential script injections)
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  
  // Remove any script tags and event handlers
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, 'data-blocked:')
    .trim();
}

/**
 * Validates and sanitizes a student name
 * @param {string} name - The name to validate
 * @returns {string} - Sanitized name or empty string
 */
export function sanitizeStudentName(name) {
  if (typeof name !== 'string') return '';
  
  // Allow only letters, spaces, hyphens, apostrophes, and periods
  const sanitized = name
    .replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '')
    .trim()
    .slice(0, 100); // Max 100 characters
  
  return sanitized;
}

/**
 * Validates and sanitizes a student ID
 * @param {string} id - The ID to validate
 * @returns {string} - Sanitized ID or empty string
 */
export function sanitizeStudentId(id) {
  if (typeof id !== 'string') return '';
  
  // Allow only alphanumeric characters
  return id
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 20);
}

/**
 * Validates and sanitizes a broadcast message
 * @param {string} message - The message to validate
 * @returns {string} - Sanitized message
 */
export function sanitizeBroadcastMessage(message) {
  if (typeof message !== 'string') return '';
  
  return sanitizeText(message)
    .slice(0, 500) // Max 500 characters
    .trim();
}

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether email is valid
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validates allowed domain
 * @param {string} email - The email to check
 * @param {string} allowedDomain - The allowed domain
 * @returns {boolean} - Whether email is from allowed domain
 */
export function isAllowedDomain(email, allowedDomain) {
  if (!isValidEmail(email)) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === allowedDomain.toLowerCase();
}

/**
 * Sanitizes an object's string values recursively
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeText(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

/**
 * Validates grade level
 * @param {number|string} grade - The grade to validate
 * @returns {number|null} - Valid grade number or null
 */
export function validateGradeLevel(grade) {
  const num = parseInt(grade, 10);
  if (isNaN(num) || num < 1 || num > 12) return null;
  return num;
}

/**
 * Validates MTSS score
 * @param {number} score - The score to validate
 * @returns {number} - Valid score (clamped to 0-100)
 */
export function validateMTSSScore(score) {
  const num = parseInt(score, 10);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

/**
 * Rate limiter for client-side actions
 */
export class RateLimiter {
  constructor(maxActions, windowMs) {
    this.maxActions = maxActions;
    this.windowMs = windowMs;
    this.actions = [];
  }
  
  canProceed() {
    const now = Date.now();
    // Remove old actions outside the window
    this.actions = this.actions.filter(time => now - time < this.windowMs);
    
    if (this.actions.length >= this.maxActions) {
      return false;
    }
    
    this.actions.push(now);
    return true;
  }
  
  getRemainingTime() {
    if (this.actions.length === 0) return 0;
    const oldestAction = Math.min(...this.actions);
    return Math.max(0, this.windowMs - (Date.now() - oldestAction));
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  issuePass: new RateLimiter(10, 60000),      // 10 passes per minute
  logInfraction: new RateLimiter(20, 60000),  // 20 infractions per minute
  awardPoints: new RateLimiter(30, 60000),    // 30 point awards per minute
  sendBroadcast: new RateLimiter(5, 60000),   // 5 broadcasts per minute
  createSchool: new RateLimiter(3, 300000),   // 3 schools per 5 minutes
};
