/**
 * @jest-environment node
 */
import {
  escapeHtml,
  sanitizeText,
  sanitizeStudentName,
  sanitizeStudentId,
  isAllowedDomain,
  rateLimiters,
} from '../../utils/sanitize';

describe('sanitize.js', () => {
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    test('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('should handle non-string input', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    test('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    test('should escape HTML', () => {
      expect(sanitizeText('<div>test</div>')).toContain('&lt;');
    });

    test('should truncate long strings', () => {
      const longText = 'a'.repeat(1000);
      const result = sanitizeText(longText);
      expect(result.length).toBeLessThanOrEqual(500);
    });
  });

  describe('sanitizeStudentName', () => {
    test('should capitalize names properly', () => {
      expect(sanitizeStudentName('john smith')).toBe('John Smith');
    });

    test('should handle hyphenated names', () => {
      const result = sanitizeStudentName('mary-jane watson');
      expect(result).toContain('Mary');
    });

    test('should remove extra whitespace', () => {
      expect(sanitizeStudentName('  john   smith  ')).toBe('John Smith');
    });

    test('should limit name length', () => {
      const longName = 'a'.repeat(200);
      const result = sanitizeStudentName(longName);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('sanitizeStudentId', () => {
    test('should allow alphanumeric IDs', () => {
      expect(sanitizeStudentId('ABC123')).toBe('ABC123');
    });

    test('should remove special characters', () => {
      expect(sanitizeStudentId('ABC-123_test!')).toBe('ABC123TEST');
    });

    test('should uppercase the result', () => {
      expect(sanitizeStudentId('abc123')).toBe('ABC123');
    });

    test('should limit ID length', () => {
      const longId = 'A'.repeat(100);
      const result = sanitizeStudentId(longId);
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });

  describe('isAllowedDomain', () => {
    test('should allow dadeschools.net', () => {
      expect(isAllowedDomain('teacher@dadeschools.net')).toBe(true);
    });

    test('should reject other domains', () => {
      expect(isAllowedDomain('user@gmail.com')).toBe(false);
      expect(isAllowedDomain('user@yahoo.com')).toBe(false);
    });

    test('should handle invalid emails', () => {
      expect(isAllowedDomain('notanemail')).toBe(false);
      expect(isAllowedDomain('')).toBe(false);
    });
  });

  describe('rateLimiters', () => {
    test('should have issuePass rate limiter', () => {
      expect(rateLimiters.issuePass).toBeDefined();
      expect(typeof rateLimiters.issuePass.canProceed).toBe('function');
    });

    test('issuePass should allow initial requests', () => {
      // Reset by creating new limiter state
      const limiter = rateLimiters.issuePass;
      // First request should succeed
      expect(limiter.canProceed()).toBe(true);
    });
  });
});
